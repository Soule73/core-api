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
        include: ['test/**/*.e2e-spec.ts'],
        testTimeout: 30000,
        hookTimeout: 30000,
        teardownTimeout: 10000,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'test/',
                'dist/',
                '**/*.spec.ts',
            ],
        },
    },
});
