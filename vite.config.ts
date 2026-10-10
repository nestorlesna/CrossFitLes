import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// Sólo en `npm run dev`: permite que "Publicar contenido" (Configuración) escriba
// manifest.json y content/content.json en el clon local del repo CrossFitLes-content.
// Ruta configurable con CONTENT_REPO_DIR (por defecto, carpeta hermana del proyecto).
function contentPublishPlugin(repoDir: string): Plugin {
  const insideRepo = (rel: string) => {
    const full = path.resolve(repoDir, rel)
    if (!full.startsWith(path.resolve(repoDir) + path.sep)) throw new Error(`Ruta inválida: ${rel}`)
    return full
  }
  return {
    name: 'content-publish',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__content', (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        // El dev server escucha en la red local (host: true): sólo se acepta desde esta PC
        const ip = req.socket.remoteAddress ?? ''
        if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip)) {
          return send(403, { error: 'Sólo disponible desde localhost' })
        }
        try {
          if (!fs.existsSync(repoDir)) {
            return send(500, { error: `No existe el repo de contenido: ${repoDir}` })
          }
          if (req.method === 'GET' && req.url?.startsWith('/manifest')) {
            const file = insideRepo('manifest.json')
            if (!fs.existsSync(file)) return send(404, { manifest: null })
            return send(200, { manifest: JSON.parse(fs.readFileSync(file, 'utf8')) })
          }
          // Sirve los archivos del clon local para probar "Actualizar contenido" antes del push
          // (con VITE_CONTENT_BASE_URL=/__content/raw)
          if (req.method === 'GET' && req.url?.startsWith('/raw/')) {
            const file = insideRepo(decodeURIComponent(req.url.slice(5).split('?')[0]))
            if (!fs.existsSync(file)) return send(404, { error: 'No existe' })
            res.setHeader('Content-Type', 'application/json')
            return res.end(fs.readFileSync(file))
          }
          if (req.method === 'POST' && req.url?.startsWith('/publish')) {
            const chunks: Buffer[] = []
            req.on('data', (c: Buffer) => chunks.push(c))
            req.on('end', () => {
              try {
                const { files } = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
                  files: { path: string; content: string }[]
                }
                for (const f of files) {
                  const full = insideRepo(f.path)
                  fs.mkdirSync(path.dirname(full), { recursive: true })
                  fs.writeFileSync(full, f.content, 'utf8')
                }
                send(200, { dir: repoDir })
              } catch (e) {
                send(500, { error: String(e) })
              }
            })
            return
          }
          send(404, { error: 'Ruta no encontrada' })
        } catch (e) {
          send(500, { error: String(e) })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const contentRepoDir = path.resolve(env.CONTENT_REPO_DIR || path.join(process.cwd(), '..', 'CrossFitLes-content'))

  return {
    plugins: [react(), contentPublishPlugin(contentRepoDir)],
    // Configuración optimizada para mobile con Capacitor
    server: {
      port: 5173,
      host: true,
    },
    build: {
      outDir: 'dist',
      // Optimizar chunks para mobile
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
          },
        },
      },
    },
    optimizeDeps: {
      exclude: ['@capacitor-community/sqlite'],
    },
  }
})
