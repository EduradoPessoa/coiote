import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts', 'src/**/*.tsx'],
            exclude: ['src/**/*.d.ts', 'src/index.ts'],
            reporter: ['text', 'html', 'lcov'],
            thresholds: {
                lines: 60,
                functions: 60,
                branches: 60,
                statements: 60,
            },
        },
    },
});
