/**
 * チャットセッションの管理は @orangebot/shared の ChatService に移動した (Phase 2-3)。
 * ここには Discord 依存の ID 解決ヘルパーと互換用の再エクスポートのみを残す。
 */
import { CacheType, ChatInputCommandInteraction, Message } from 'discord.js';

export { ChatRole as Role, LiteLLMMode } from '@orangebot/shared';
export type { ChatSession as LiteLLM } from '@orangebot/shared';

export function getIdInfoMessage(message: Message) {
  const guild = message.guild;
  if (!guild) {
    return { id: message.author.id, name: message.author.displayName, isGuild: false };
  }
  return { id: guild.id, name: message.guild?.name, isGuild: true };
}

export function getIdInfoInteraction(interaction: ChatInputCommandInteraction<CacheType>) {
  const guild = interaction.guild;
  if (!guild) {
    return {
      id: interaction.user.id,
      name: interaction.user.displayName,
      isGuild: false,
    };
  }
  return { id: guild.id, name: interaction.guild?.name, isGuild: true };
}
