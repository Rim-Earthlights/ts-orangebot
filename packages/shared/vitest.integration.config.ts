import { defineConfig } from 'vitest/config';

// インテグレーションテスト用設定。
// テスト用 DB コンテナ (ルートの docker-compose.test.yml) が起動している前提で実行する:
//   pnpm test:db:up && pnpm test:integration
export default defineConfig({
  test: {
    include: ['test/integration/**/*.test.ts'],
    // 同一 DB を共有するため直列実行する
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
