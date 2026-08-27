const fs = require('fs');
const zlib = require('zlib');

// Emits a max-quality Brotli sibling (<asset>.br) next to every JS/CSS asset so
// the server can serve bytes compressed once at build time instead of
// re-compressing every response at a fast-but-weak level.
class CompressAssetsPlugin {
  apply(compiler) {
    compiler.hooks.assetEmitted.tapPromise(
      'CompressAssetsPlugin',
      (file, { content, targetPath }) => {
        if (!/\.(js|css)$/i.test(file)) {
          return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
          zlib.brotliCompress(
            content,
            {
              params: {
                [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
                [zlib.constants.BROTLI_PARAM_SIZE_HINT]: content.length
              }
            },
            (error, compressed) => {
              if (error) {
                reject(error);
                return;
              }

              fs.writeFile(`${targetPath}.br`, compressed, (writeError) => {
                if (writeError) {
                  reject(writeError);
                } else {
                  resolve();
                }
              });
            }
          );
        });
      }
    );
  }
}

module.exports = CompressAssetsPlugin;
