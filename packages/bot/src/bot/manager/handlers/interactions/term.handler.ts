import { exec, type ExecException } from 'node:child_process';
import { CacheType, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { UsersType } from '@orangebot/shared';
import { checkUserType } from '../../../../common/common.js';
import { Logger } from '../../../../common/logger.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';

const COMMAND_TIMEOUT_MS = 60 * 1000;
const MAX_BUFFER_BYTES = 1024 * 1024;
const MAX_OUTPUT_LENGTH = 1700;

interface CommandResult {
  stdout: string;
  stderr: string;
  code: number | string | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
}

export class TermHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({ content: 'このコマンドはサーバー内でのみ使用できます。', flags: MessageFlags.Ephemeral });
      return;
    }

    if (!(await checkUserType(interaction.guild.id, interaction.user.id, UsersType.OWNER))) {
      await interaction.reply({ content: 'このコマンドを実行する権限がありません。', flags: MessageFlags.Ephemeral });
      return;
    }

    const command = interaction.options.getString('command')?.trim();
    if (!command) {
      await interaction.reply({ content: '実行するコマンドを指定してください。', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    await this.logger.info(
      'term-command-start',
      [`User: ${interaction.user.displayName}`, `Command: ${command}`],
      interaction.guild.id,
      interaction.channel?.id,
      interaction.user.id
    );

    const result = await this.runCommand(command);

    await this.logger.info(
      'term-command-end',
      [
        `User: ${interaction.user.displayName}`,
        `Command: ${command}`,
        `Code: ${result.code ?? 'unknown'}`,
        `Signal: ${result.signal ?? 'none'}`,
        `TimedOut: ${result.timedOut}`,
      ],
      interaction.guild.id,
      interaction.channel?.id,
      interaction.user.id
    );

    await interaction.editReply(this.formatResult(result));
  }

  private runCommand(command: string): Promise<CommandResult> {
    return new Promise((resolve) => {
      exec(command, { timeout: COMMAND_TIMEOUT_MS, maxBuffer: MAX_BUFFER_BYTES }, (error, stdout, stderr) => {
        const execError = error as ExecException | null;
        resolve({
          stdout,
          stderr,
          code: execError?.code ?? 0,
          signal: execError?.signal ?? null,
          timedOut: execError?.killed ?? false,
        });
      });
    });
  }

  private formatResult(result: CommandResult): string {
    const status = result.timedOut
      ? `timeout (${COMMAND_TIMEOUT_MS / 1000}s)`
      : result.signal
        ? `signal ${result.signal}`
        : String(result.code ?? 'unknown');

    const output = [
      result.stdout ? `stdout:\n${result.stdout.trimEnd()}` : '',
      result.stderr ? `stderr:\n${result.stderr.trimEnd()}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const body = this.truncate(this.escapeCodeBlock(output || '(出力なし)'), MAX_OUTPUT_LENGTH);
    return [`実行しました。`, `終了コード: ${status}`, '```', body, '```'].join('\n');
  }

  private escapeCodeBlock(text: string): string {
    return text.replace(/```/g, '`\u200b``');
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength)}\n... (出力が長いため省略しました)`;
  }
}
