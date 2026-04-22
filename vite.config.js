import { defineConfig } from 'vite'
import { copyFileSync, readdirSync } from 'fs'
import { resolve } from 'path'

function syncJsPlugin() {
  return {
    name: 'sync-js',
    buildStart() {
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