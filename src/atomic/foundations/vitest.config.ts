import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/** Test the pure foundations without loading application/Figma/Vite plugins. */
export default defineConfig({
  root: fileURLToPath(new URL('../../../', import.meta.url)),
  test: {
    environment: 'node',
    include: ['src/atomic/foundations/**/*.test.ts'],
  },
})
