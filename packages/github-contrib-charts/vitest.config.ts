import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/bin.ts', 'dist/**'],
      thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
    },
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: [
            'tests/unit/*.test.{ts,tsx}',
            'tests/integration/*.test.{ts,tsx}',
            'tests/functional/*.test.{ts,tsx}',
            'tests/cli/**/*.test.{ts,tsx}',
          ],
        },
      },
      {
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          setupFiles: ['./tests/setup.ts'],
          include: ['tests/react/**/*.test.{ts,tsx}'],
        },
      },
    ],
  },
});
