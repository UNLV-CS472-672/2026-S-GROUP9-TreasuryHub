//Configuration file for Vitest

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        exclude: [
            'node_modules/**',
            'e2e_tests/**',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            //What needs to be included
            //Vitest only implicitly "includes" checks for files that have tests directly written for them

            //We want to test our source files for code
            //Assess all TypeScript files (.ts and .tsx) within app, components, and lib folders
            //Search through all folders and subfolders within these directories.
            include: [
                'src/app/**/*.{ts,tsx}',
                'src/components/**/*.{ts,tsx}',
                'src/lib/**/*.{ts,tsx}',
            ],
            //What we're explicitly excluding from test coverage
            exclude: [
                'node_modules/**',
                '.next/**',
                '**/*.config.*',
                '**/types/**',
                'e2e_tests/**',
            ],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})