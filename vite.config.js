import { defineConfig } from 'vite'
import { copyFileSync, readdirSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'

function syncJsPlugin() {
  return {
    name: 'sync-js',
    buildStart() {
      // Sync js/ → public/js/
      const jsDir = resolve(__dirname, 'js')
      const publicJsDir = resolve(__dirname, 'public/js')
      readdirSync(jsDir).forEach(file => {
        if (file.endsWith('.js')) {
          copyFileSync(
            resolve(jsDir, file),
            resolve(publicJsDir, file)
          )
          console.log(`Synced: js/${file} → public/js/${file}`)
        }
      })

      // Sync data/ → public/data/
      const dataDir = resolve(__dirname, 'data')
      const publicDataDir = resolve(__dirname, 'public/data')
      if (!existsSync(publicDataDir)) mkdirSync(publicDataDir, { recursive: true })
      readdirSync(dataDir).forEach(file => {
        if (file.endsWith('.json')) {
          copyFileSync(
            resolve(dataDir, file),
            resolve(publicDataDir, file)
          )
          console.log(`Synced: data/${file} → public/data/${file}`)
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [syncJsPlugin()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        signin: 'signin.html'
      },
      output: {
        entryFileNames: `assets/[name]-[hash]-v2.js`,
        chunkFileNames: `assets/[name]-[hash]-v2.js`,
        assetFileNames: `assets/[name]-[hash]-v2.[ext]`
      }
    }
  },
  server: {
    port: 3000
  }
})