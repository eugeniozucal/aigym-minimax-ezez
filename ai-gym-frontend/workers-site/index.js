import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

export default {
  async fetch(request, env, ctx) {
    try {
      const page = await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
          cacheControl: {
            browserTTL: 60 * 60 * 24 * 30, // 30 days
            edgeTTL: 60 * 60 * 24 * 30, // 30 days
            bypassCache: false,
          },
        }
      );

      // Handle SPA routing
      const url = new URL(request.url);
      if (url.pathname !== '/' && !url.pathname.includes('.') && !url.pathname.startsWith('/assets/')) {
        // This is likely a route, serve index.html
        const indexPage = await getAssetFromKV(
          {
            request: new Request(`${url.origin}/index.html`, request),
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
          }
        );
        return new Response(indexPage.body, indexPage);
      }

      return new Response(page.body, page);
    } catch (e) {
      // If asset not found or other error, try to serve index.html for SPA
      try {
        const notFoundResponse = await getAssetFromKV(
          {
            request: new Request(`${new URL(request.url).origin}/index.html`, request),
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
          }
        );
        return new Response(notFoundResponse.body, {
          ...notFoundResponse,
          status: 200,
        });
      } catch (e2) {
        // Really not found
        return new Response('Not Found', { status: 404 });
      }
    }
  },
};
