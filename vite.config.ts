import { existsSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { configDefaults, defineConfig } from 'vitest/config';
import { loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * In `npm run dev`, serves the Vercel functions in api/ (YouTube search and
 * video details, the keep-alive) the way Vercel does in production, so the
 * app works locally. Their server-only settings, such as YOUTUBE_API_KEY, come
 * from .env.local.
 */
function vercelFunctionsInDev(): Plugin {
  return {
    name: 'vercel-functions-in-dev',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      // Server-only variables (no VITE_ prefix), for the functions; never bundled.
      for (const [name, value] of Object.entries(loadEnv(server.config.mode, process.cwd(), ''))) {
        process.env[name] ??= value;
      }
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const name = /^\/api\/([a-z-]+)$/.exec(url.pathname)?.[1];
        // Underscore files are helpers, not routes, as on Vercel.
        if (!name || !existsSync(`api/${name}.ts`)) return next();
        try {
          const route = (await server.ssrLoadModule(`/api/${name}.ts`)) as { GET?: (request: Request) => Promise<Response> };
          if (req.method !== 'GET' || !route.GET) {
            res.statusCode = 405;
            return res.end();
          }
          const response = await route.GET(new Request(url, { headers: req.headers as Record<string, string> }));
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          server.config.logger.error(`api/${name}: ${String(error)}`);
          res.statusCode = 500;
          res.end();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), vercelFunctionsInDev()],
  server: {
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    // e2e/ holds Playwright tests, which run in a real browser instead.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // Placeholder values so modules that read configuration can load in tests.
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
});
