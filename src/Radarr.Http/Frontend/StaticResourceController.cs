using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Net.Http.Headers;
using NLog;
using Radarr.Http.Frontend.Mappers;

namespace Radarr.Http.Frontend
{
    [Authorize(Policy="UI")]
    [ApiController]
    public class StaticResourceController : Controller
    {
        private readonly IEnumerable<IMapHttpRequestsToDisk> _requestMappers;
        private readonly Logger _logger;
        private static readonly Regex InvalidPathRegex = new(@"([\/\\]|%2f|%5c)\.\.|\.\.([\/\\]|%2f|%5c)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly FileExtensionContentTypeProvider MimeTypeProvider = new();

        public StaticResourceController(IEnumerable<IMapHttpRequestsToDisk> requestMappers,
            Logger logger)
        {
            _requestMappers = requestMappers;
            _logger = logger;
        }

        [AllowAnonymous]
        [HttpGet("login")]
        public async Task<IActionResult> LoginPage()
        {
            return await MapResource("login");
        }

        [EnableCors("AllowGet")]
        [AllowAnonymous]
        [HttpGet("/content/{**path:regex(^(?!api/).*)}")]
        public async Task<IActionResult> IndexContent([FromRoute] string path)
        {
            return await MapResource("Content/" + path);
        }

        [HttpGet("")]
        [HttpGet("/{**path:regex(^(?!(api|feed)/).*)}")]
        public async Task<IActionResult> Index([FromRoute] string path)
        {
            return await MapResource(path);
        }

        private async Task<IActionResult> MapResource(string path)
        {
            path = "/" + (path ?? "");

            if (InvalidPathRegex.IsMatch(path))
            {
                return NotFound();
            }

            var mapper = _requestMappers.SingleOrDefault(m => m.CanHandle(path));

            if (mapper != null)
            {
                var precompressed = GetPrecompressedResponse(mapper, path);

                if (precompressed != null)
                {
                    return precompressed;
                }

                var result = await mapper.GetResponse(path);

                if (result != null)
                {
                    if ((result as FileResult)?.ContentType == "text/html")
                    {
                        // A short freshness window instead of no-store: return visits within
                        // a minute skip the document round trip, while upgrades still show up
                        // at most a minute late.
                        Response.Headers.Remove("Last-Modified");
                        Response.Headers["Cache-Control"] = "private, max-age=60";
                        Response.Headers.Remove("Expires");
                        Response.Headers.Remove("Pragma");
                    }

                    return result;
                }

                return NotFound();
            }

            _logger.Warn("Couldn't find handler for {0}", path);

            return NotFound();
        }

        // Serves a Brotli sibling (<file>.br) generated at build time, so static text
        // assets ship at maximum compression without per-request CPU cost.
        private IActionResult GetPrecompressedResponse(IMapHttpRequestsToDisk mapper, string path)
        {
            var lowerPath = path.ToLowerInvariant();

            if (!lowerPath.EndsWith(".js") && !lowerPath.EndsWith(".css"))
            {
                return null;
            }

            var acceptEncoding = Request.Headers[HeaderNames.AcceptEncoding].ToString();

            if (!acceptEncoding.Contains("br"))
            {
                return null;
            }

            var filePath = mapper.Map(path);

            if (filePath == null)
            {
                return null;
            }

            var compressedPath = filePath + ".br";

            if (!System.IO.File.Exists(compressedPath))
            {
                return null;
            }

            if (!MimeTypeProvider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            Response.Headers[HeaderNames.ContentEncoding] = "br";
            Response.Headers[HeaderNames.Vary] = HeaderNames.AcceptEncoding;

            return new FileStreamResult(System.IO.File.OpenRead(compressedPath), contentType);
        }
    }
}
