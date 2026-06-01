import federation from '@originjs/vite-plugin-federation'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import path from 'node:path'
import { defineConfig } from 'vite'

import pkg from '../package.json'

dotenv.config({ path: '../../../env/.env.local' })

const isDocker = process.env.DOCKER_BUILD === 'true'

const apiHost = isDocker ? '/api' : process.env.VITE_API_HOST

if (!apiHost) {
  throw new Error('VITE_API_HOST is not defined')
}

const outDir = isDocker ? 'dist-docker' : 'dist'

const moduleName = pkg.name.replace('@lifeforge/', '')

export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  const alias = [
    ...(isDev
      ? [
          {
            find: /^@lifeforge\/shared$/,
            replacement: path.resolve(__dirname, '../../../shared/src/index.ts')
          },
          {
            find: /^@lifeforge\/ui$/,
            replacement: path.resolve(
              __dirname,
              '../../../packages/ui/src/index.ts'
            )
          }
        ]
      : []),
    { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, './src/$1') },
    { find: /^@$/, replacement: path.resolve(__dirname, './src/index') }
  ]

  return {
    base: `${apiHost}/modules/${moduleName}/`,
    define: {
      'import.meta.env.VITE_API_HOST': JSON.stringify(apiHost)
    },
    plugins: [
      react(),
      vanillaExtractPlugin(),
      federation({
        name: moduleName,
        filename: 'remoteEntry.js',
        exposes: {
          './Manifest': './manifest.ts'
        },
        shared: {
          react: {
            generate: false
          },
          'react-dom': {
            generate: false
          },
          '@lifeforge/shared': {
            generate: false
          },
          '@lifeforge/ui': {
            generate: false
          },
          'react-i18next': {
            generate: false
          },
          i18next: {
            generate: false
          },
          '@tanstack/react-query': {
            generate: false
          }
        }
      })
    ],
    resolve: {
      alias
    },
    build: {
      outDir,
      target: 'esnext',
      minify: true,
      modulePreload: false
    }
  }
})
