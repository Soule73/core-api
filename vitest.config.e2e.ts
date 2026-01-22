/* eslint-disable prettier/prettier */
import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [
        tsconfigPaths(),
        swc.vite({
            module: { type: 'es6' },
        }),
    ],
    test: {
        globals: true,
        environment: 'node',
        root: './',
        include: ['e2e/**/*.e2e-spec.ts'],
        setupFiles: ['./e2e/setup.ts'],
        testTimeout: 30000,
        hookTimeout: 60000,
        teardownTimeout: 15000,
        fileParallelism: false,
        sequence: {
            shuffle: false,
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'e2e/',
                'dist/',
                '**/*.spec.ts',
            ],
        },
    },
});
