export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      // Check if we have KV storage available (production)
      if (env.__STATIC_CONTENT) {
        // Production environment - serve from KV
        let asset = await env.__STATIC_CONTENT.get(url.pathname);

        if (!asset) {
          // For SPA routing - serve index.html for non-asset routes
          if (!url.pathname.startsWith('/assets/') &&
              url.pathname !== '/' &&
              !url.pathname.includes('.')) {
            asset = await env.__STATIC_CONTENT.get('/index.html');
          }
        }

        if (asset && asset.body) {
          const contentType = getContentType(url.pathname);
          const isLargeFile = asset.body.length > 1024;

          return new Response(asset.body, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': isLargeFile
                ? 'public, max-age=31536000, immutable'
                : 'public, max-age=0, must-revalidate',
            },
          });
        }

        return new Response('Not Found', { status: 404 });
      } else {
        // Development environment - simple response
        return new Response('Worker is running in development mode', {
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    } catch (e) {
      console.error('Worker error:', e);
      return new Response('Internal Server Error: ' + e.message, { status: 500 });
    }
  },
};

function getContentType(pathname) {
  const ext = pathname.split('.').pop()?.toLowerCase();
  const types = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
  };
  return types[ext] || 'text/plain';
}
