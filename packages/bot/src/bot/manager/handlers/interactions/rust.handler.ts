import { execFile, type ExecException } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { CacheType, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { isRegisteredUser } from '../../../../common/common.js';
import { Logger } from '../../../../common/logger.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';

const COMMAND_TIMEOUT_MS = 30 * 1000;
const MAX_BUFFER_BYTES = 1024 * 1024;
const STEAM_ID_MAX_LENGTH = 32;
const RCON_CONFIG_DISPLAY_PATH = '~/rcon.yaml';

type WhitelistAction = 'add' | 'revoke';
type WhitelistResultStatus = 'success' | 'player_not_found' | 'unknown';

interface CommandResult {
  stdout: string;
  stderr: string;
  code: number | string | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
}

export function resolveSteamId(target: string): string | null {
  const normalizedTarget = target.trim().replace(/^<(.+)>$/, '$1');

  if (/^\d+$/.test(normalizedTarget) && normalizedTarget.length <= STEAM_ID_MAX_LENGTH) {
    return normalizedTarget;
  }

  try {
    const url = new URL(normalizedTarget);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host !== 'steamcommunity.com') {
      return null;
    }

    const match = /^\/profiles\/(\d+)\/?$/.exec(url.pathname);
    const steamId = match?.[1];
    if (!steamId || steamId.length > STEAM_ID_MAX_LENGTH) {
      return null;
    }

    return steamId;
  } catch {
    return null;
  }
}

export class RustHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({ content: 'このコマンドはサーバー内でのみ使用できます。', flags: MessageFlags.Ephemeral });
      return;
    }

    // 一旦は利用規約に同意済みのユーザー (= DBに登録されているユーザー) なら使えるようにする。
    if (!(await isRegisteredUser(interaction.guild.id, interaction.user.id))) {
      await interaction.reply({
        content: 'このコマンドを使うには、先に利用規約への同意が必要です。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();
    if (group !== 'whitelist' || (sub !== 'add' && sub !== 'revoke')) {
      await interaction.reply({ content: '対応していないサブコマンドです。', flags: MessageFlags.Ephemeral });
      return;
    }

    await this.handleWhitelist(interaction, sub);
  }

  private async handleWhitelist(
    interaction: ChatInputCommandInteraction<CacheType>,
    action: WhitelistAction
  ): Promise<void> {
    const target = interaction.options.getString('url_or_id', true);
    const steamId = resolveSteamId(target);

    if (!steamId) {
      await interaction.reply({
        content: 'SteamID、または https://steamcommunity.com/profiles/<SteamID>/ 形式のURLを指定してください。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const command = this.formatCommand(steamId, action);
    await this.logger.info(
      `rust-whitelist-${action}-start`,
      [`User: ${interaction.user.displayName}`, `Command: ${command}`],
      interaction.guild?.id,
      interaction.channel?.id,
      interaction.user.id
    );

    const result = await this.runWhitelistCommand(steamId, action);

    await this.logger.info(
      `rust-whitelist-${action}-end`,
      [
        `User: ${interaction.user.displayName}`,
        `Command: ${command}`,
        `Code: ${result.code ?? 'unknown'}`,
        `Signal: ${result.signal ?? 'none'}`,
        `TimedOut: ${result.timedOut}`,
      ],
      interaction.guild?.id,
      interaction.channel?.id,
      interaction.user.id
    );

    await interaction.editReply(this.formatResult(steamId, action, result));
  }

  private runWhitelistCommand(steamId: string, action: WhitelistAction): Promise<CommandResult> {
    return new Promise((resolve) => {
      execFile(
        'rcon',
        [
          '-c',
          join(homedir(), 'rcon.yaml'),
          '-t',
          'web',
          '-e',
          'rust',
          `oxide.${this.toOxideVerb(action)} user ${steamId} whitelist.allow`,
        ],
        { timeout: COMMAND_TIMEOUT_MS, maxBuffer: MAX_BUFFER_BYTES },
        (error, stdout, stderr) => {
          const execError = error as ExecException | null;
          resolve({
            stdout,
            stderr,
            code: (execError?.code as number | string | undefined) ?? 0,
            signal: execError?.signal ?? null,
            timedOut: execError?.killed ?? false,
          });
        }
      );
    });
  }

  private formatCommand(steamId: string, action: WhitelistAction): string {
    return `rcon -c ${RCON_CONFIG_DISPLAY_PATH} -t web -e rust "oxide.${this.toOxideVerb(
      action
    )} user ${steamId} whitelist.allow"`;
  }

  /**
   * interactionへの返信文を生成する。
   * 一般ユーザーも利用するため、実行コマンド・標準出力(stdout)・終了コードなどの
   * 内部情報は返信に含めず、成否に応じたユーザー向けメッセージのみを返す。
   * (実行コマンドや終了コードなどの詳細は logger 経由で記録される)
   */
  private formatResult(steamId: string, action: WhitelistAction, result: CommandResult): string {
    // 成否判定にはコマンド出力を利用するが、返信文には出力しない。
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
    const resultStatus = this.classifyWhitelistResult(steamId, action, output);
    return this.formatResultTitle(action, resultStatus);
  }

  private classifyWhitelistResult(steamId: string, action: WhitelistAction, output: string): WhitelistResultStatus {
    if (output.includes(`Player '${steamId}' not found`)) {
      return 'player_not_found';
    }

    const successVerb = action === 'add' ? 'granted' : 'revoked';
    const successPattern = new RegExp(`Player '.+' ${successVerb} permission 'whitelist\\.allow'`);
    if (successPattern.test(output)) {
      return 'success';
    }

    return 'unknown';
  }

  private formatResultTitle(action: WhitelistAction, status: WhitelistResultStatus): string {
    switch (status) {
      case 'success':
        return action === 'add' ? 'Rust whitelist に追加しました。' : 'Rust whitelist から削除しました。';
      case 'player_not_found':
        return 'Rust側でプレイヤーが見つかりませんでした。';
      case 'unknown':
        return '実行しましたが、結果を確認できませんでした。時間をおいて確認するか、管理者に連絡してください。';
    }
  }

  private toOxideVerb(action: WhitelistAction): 'grant' | 'revoke' {
    return action === 'add' ? 'grant' : 'revoke';
  }
}
