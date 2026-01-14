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
        include: ['src/**/*.spec.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'test/',
                'dist/',
                '**/*.spec.ts',
                '**/*.e2e-spec.ts',
                '**/interfaces/**',
                '**/dto/**',
                '**/entities/**',
                'src/main.ts',
            ],
        },
    },
});
