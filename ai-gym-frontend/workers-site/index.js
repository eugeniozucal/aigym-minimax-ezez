import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    try {
      // First try to get the asset directly
      const page = await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
          mapRequestToAsset: mapRequestToAsset,
          cacheControl: {
            browserTTL: null,
            edgeTTL: 2 * 60 * 60 * 24, // 2 days
            bypassCache: false,
          },
        }
      );

      return new Response(page.body, page);
    } catch (e) {
      // Asset not found, try to serve index.html for SPA routing
      console.log('Asset not found:', url.pathname, 'Error:', e.message);
      
      // For SPA routes (not assets), serve index.html
      if (!url.pathname.includes('.') || url.pathname === '/') {
        try {
          const indexPage = await getAssetFromKV(
            {
              request: new Request(`${url.origin}/index.html`, request),
              waitUntil: ctx.waitUntil.bind(ctx),
            },
            {
              ASSET_NAMESPACE: env.__STATIC_CONTENT,
              ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
              mapRequestToAsset: mapRequestToAsset,
            }
          );
          
          return new Response(indexPage.body, {
            ...indexPage,
            status: 200,
            headers: {
              ...indexPage.headers,
              'Content-Type': 'text/html; charset=utf-8',
            },
          });
        } catch (indexError) {
          console.log('Index.html not found either:', indexError.message);
          return new Response('Application not found', { status: 404 });
        }
      }

      // For other assets that are really not found
      return new Response('Asset not found: ' + url.pathname, { status: 404 });
    }
  },
};
