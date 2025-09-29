import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, and
 * 2. we will return an error message on exception in your Response rather than the default 404.html page
 */
const DEBUG = false;

export default {
  async fetch(request, env, ctx) {
    try {
      // Add logic to decide whether to serve an asset or run your original Worker code
      const url = new URL(request.url);

      // You can add custom logic here, for example, authentication or rate limiting
      // For SPA routing, we want to serve index.html for all routes that don't match assets
      const page = await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: ASSET_MANIFEST,
          cacheControl: {
            browserTTL: DEBUG ? 0 : 60 * 60 * 24 * 30, // 30 days
            edgeTTL: DEBUG ? 0 : 60 * 60 * 24 * 30, // 30 days
            bypassCache: DEBUG,
          },
        }
      );

      // Allow headers to be altered
      const response = new Response(page.body, page);

      // Add headers for SPA routing
      if (url.pathname.startsWith('/assets/') === false &&
          url.pathname !== '/' &&
          !url.pathname.includes('.')) {
        // This is likely a route, serve index.html with 200 status
        const notFoundResponse = await getAssetFromKV(
          {
            request: new Request(`${url.origin}/index.html`, request),
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: ASSET_MANIFEST,
          }
        );

        return new Response(notFoundResponse.body, {
          ...notFoundResponse,
          status: 200,
          headers: {
            ...notFoundResponse.headers,
            'Content-Type': 'text/html',
          },
        });
      }

      return response;
    } catch (e) {
      // If an error is thrown, return a 500 error with the error message
      return new Response(DEBUG ? e.message : 'Internal Server Error', {
        status: 500,
      });
    }
  },
};
