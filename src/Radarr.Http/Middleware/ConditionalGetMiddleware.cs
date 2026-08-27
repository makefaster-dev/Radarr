using System;
using System.IO;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;

namespace Radarr.Http.Middleware
{
    // Gives API GET responses a validator so return visits can revalidate with a
    // conditional request and skip the payload transfer when nothing changed.
    public class ConditionalGetMiddleware
    {
        private readonly RequestDelegate _next;

        public ConditionalGetMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (!HttpMethods.IsGet(context.Request.Method) ||
                !context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            var originalBody = context.Response.Body;

            using var buffer = new MemoryStream();
            context.Response.Body = buffer;

            try
            {
                await _next(context);

                if (context.Response.StatusCode == StatusCodes.Status200OK && buffer.Length > 0)
                {
                    var etag = ComputeEtag(buffer);

                    context.Response.Headers[HeaderNames.ETag] = etag;

                    // no-store forbids the client from keeping anything to revalidate;
                    // no-cache still forces a round trip but lets a 304 skip the body.
                    if (context.Response.Headers[HeaderNames.CacheControl].ToString().Contains("no-store"))
                    {
                        context.Response.Headers[HeaderNames.CacheControl] = "private, no-cache";
                        context.Response.Headers.Remove(HeaderNames.Pragma);
                        context.Response.Headers.Remove(HeaderNames.Expires);
                    }

                    if (context.Request.Headers[HeaderNames.IfNoneMatch].ToString() == etag)
                    {
                        context.Response.StatusCode = StatusCodes.Status304NotModified;
                        context.Response.Headers.Remove(HeaderNames.ContentLength);
                        return;
                    }
                }

                buffer.Position = 0;
                await buffer.CopyToAsync(originalBody);
            }
            finally
            {
                context.Response.Body = originalBody;
            }
        }

        private static string ComputeEtag(MemoryStream buffer)
        {
            buffer.Position = 0;

            using var md5 = MD5.Create();

            return $"W/\"{Convert.ToHexString(md5.ComputeHash(buffer))}\"";
        }
    }
}
