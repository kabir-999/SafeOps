import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                warehouse: resolve(__dirname, 'warehouse.html'),
            },
        },
    },
    server: {
        port: 5173,
        open: true,
    },
})
