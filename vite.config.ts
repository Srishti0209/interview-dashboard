import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { existsSync } from 'node:fs'

/**
 * Serves the Vercel functions in api/ from the dev server (there's no Vercel
 * CLI here). Each file exports web-standard handlers named after the HTTP
 * method. AI calls return canned fixtures unless AI_FIXTURE=0 is set, so
 * local development never spends API credits by accident.
 */
function apiDevServer(): Plugin {
  return {
    name: 'api-dev-server',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      for (const [k, v] of Object.entries(env)) process.env[k] ??= v
      process.env.AI_FIXTURE ??= '1'

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        const url = new URL(req.url, 'http://localhost')
        const file = path.resolve(__dirname, `.${url.pathname}.ts`)
        if (url.pathname.includes('/_') || !existsSync(file)) {
          res.statusCode = 404
          return res.end()
        }
        try {
          const mod = await server.ssrLoadModule(file)
          const handler = mod[req.method ?? 'GET'] as
            | ((r: Request) => Promise<Response>)
            | undefined
          if (!handler) {
            res.statusCode = 405
            return res.end()
          }
          const chunks: Buffer[] = []
          for await (const c of req) chunks.push(c as Buffer)
          const headers = new Headers()
          for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === 'string') headers.set(k, v)
          }
          const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
          const response = await handler(
            new Request(url.href, {
              method: req.method,
              headers,
              body: hasBody ? Buffer.concat(chunks) : undefined,
            }),
          )
          res.statusCode = response.status
          response.headers.forEach((v, k) => res.setHeader(k, v))
          if (response.body) {
            const reader = response.body.getReader()
            for (;;) {
              const { done, value } = await reader.read()
              if (done) break
              res.write(value)
            }
          }
          res.end()
        } catch (e) {
          server.ssrFixStacktrace(e as Error)
          console.error(e)
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'server_error', message: String(e) }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    apiDevServer(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'Interview Prep',
        short_name: 'Interview Prep',
        description:
          'Local-first interview prep for senior frontend engineers.',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        navigateFallback: 'index.html',
        // API routes are served by Vercel functions, never the SPA shell.
        navigateFallbackDenylist: [/^\/api\//],
        // cache the seed json + google fonts for full offline use
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/seed/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'seed-data' },
          },
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://fonts.googleapis.com' ||
              url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
