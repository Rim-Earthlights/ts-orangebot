/**
 * Smoke Test Script
 *
 * Bot の基本的な起動シーケンスを検証する:
 * 1. import パスの正常性 (モジュール解決)
 * 2. DB 接続
 * 3. Discord Gateway 接続
 * 4. コマンドハンドラの登録
 * 5. 正常シャットダウン
 *
 * 使い方: pnpm --filter @orangebot/bot smoke-test
 * 環境変数: DB, Discord トークンが設定済みであること
 */

import dotenv from 'dotenv';
dotenv.config();

const TIMEOUT_MS = 30_000;
let exitCode = 0;

function ok(label: string) {
  console.log(`  [OK] ${label}`);
}

function fail(label: string, error: unknown) {
  console.error(`  [FAIL] ${label}:`, error instanceof Error ? error.message : error);
  exitCode = 1;
}

console.log('=== Smoke Test Start ===\n');

// --- 1. Import check ---
console.log('1. Checking imports...');
try {
  await import('../src/config/config.js');
  ok('config');
} catch (e) {
  fail('config', e);
}

try {
  await import('../src/constant/constants.js');
  ok('constants');
} catch (e) {
  fail('constants', e);
}

try {
  await import('../src/constant/slashCommands.js');
  ok('slashCommands');
} catch (e) {
  fail('slashCommands', e);
}

try {
  await import('../src/model/typeorm/typeorm.js');
  ok('typeorm');
} catch (e) {
  fail('typeorm', e);
}

try {
  await import('../src/model/models/index.js');
  ok('models');
} catch (e) {
  fail('models', e);
}

try {
  await import('../src/bot/manager/message.manager.js');
  ok('message.manager');
} catch (e) {
  fail('message.manager', e);
}

try {
  await import('../src/bot/manager/interaction.manager.js');
  ok('interaction.manager');
} catch (e) {
  fail('interaction.manager', e);
}

try {
  await import('../src/bot/dot_function/index.js');
  ok('dot_function');
} catch (e) {
  fail('dot_function', e);
}

try {
  await import('../src/bot/function/index.js');
  ok('bot function');
} catch (e) {
  fail('bot function', e);
}

try {
  await import('../src/routers.js');
  ok('routers');
} catch (e) {
  fail('routers', e);
}

if (exitCode !== 0) {
  console.log('\n=== Smoke Test Failed (import errors) ===');
  process.exit(exitCode);
}

console.log('\n2. Checking DB connection...');
try {
  const { TypeOrm } = await import('../src/model/typeorm/typeorm.js');
  await Promise.race([
    TypeOrm.dataSource.initialize(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('DB connection timeout')), TIMEOUT_MS)),
  ]);
  ok('DB connected');
  await TypeOrm.dataSource.destroy();
  ok('DB disconnected');
} catch (e) {
  fail('DB connection', e);
}

console.log('\n3. Checking Discord Gateway connection...');
try {
  const { DISCORD_CLIENT } = await import('../src/constant/constants.js');
  const { CONFIG } = await import('../src/config/config.js');

  await Promise.race([
    DISCORD_CLIENT.login(CONFIG.DISCORD.TOKEN),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Discord login timeout')), TIMEOUT_MS)),
  ]);
  ok('Discord logged in');

  // コマンドハンドラ登録の確認
  console.log('\n4. Checking command handlers...');
  const { SERVER_SLASH_COMMANDS, DM_SLASH_COMMANDS } = await import('../src/constant/slashCommands.js');
  const serverCommands = SERVER_SLASH_COMMANDS.map((c) => c.toJSON());
  const dmCommands = DM_SLASH_COMMANDS.map((c) => c.toJSON());
  ok(`Server commands: ${serverCommands.length}`);
  ok(`DM commands: ${dmCommands.length}`);

  // シャットダウン
  console.log('\n5. Shutting down...');
  DISCORD_CLIENT.destroy();
  ok('Discord client destroyed');
} catch (e) {
  fail('Discord connection', e);
}

console.log(`\n=== Smoke Test ${exitCode === 0 ? 'Passed' : 'Failed'} ===`);
process.exit(exitCode);
