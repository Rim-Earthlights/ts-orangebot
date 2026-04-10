import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { checkUserType } from '../../../../common/common.js';
import { Logger } from '../../../../common/logger.js';
import { Role } from '../../../../constant/chat/chat.js';
import { UsersType } from '../../../../model/models/users.js';
import * as ChatService from '../../../../service/chat.service.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';

/**
 * /mute
 * 特定のユーザーを一時的にミュートする
 */
export class MuteHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guild = interaction.guild;
    if (!guild) {
      return;
    }
    if (!checkUserType(interaction.guild.id, interaction.user.id, UsersType.ADMIN)) {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription(`このコマンドは管理者のみ使用できます。`);

      interaction.reply({ embeds: [send] });
      return;
    }

    const user = interaction.options.getUser('user')!;
    const time = interaction.options.getNumber('time')!;
    const reason = interaction.options.getString('reason')!;
    const member = guild.members.cache.find((member) => member.id === user.id);

    if (!member) {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription('ユーザーが見つからなかった');
      await interaction.reply({ embeds: [send] });
      return;
    }

    member.voice.setMute(true, reason);

    let dmChannel = user.dmChannel;
    if (!dmChannel) {
      // 一度もDMを送信していない場合
      dmChannel = await user.createDM();
    }

    const message = await ChatService.getMuteMessage(interaction.user.id, user.id, reason, time);

    const dmSend = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(`⚠️警告：マイクミュート処分が行われました`)
      .setDescription(message);
    await dmChannel.send({ embeds: [dmSend] });

    const send = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle(`ミュートの実行`)
      .setDescription(`${member.user.displayName}をサーバーミュートしました.`);
    send.addFields({ name: '規制時間', value: `${time.toString()} 分` });
    send.addFields({ name: '事由', value: reason });
    await interaction.reply({ embeds: [send] });

    const chatService = new ChatService.InteractionChatService(interaction);
    await chatService.addChat(Role.USER, message);

    setTimeout(
      async () => {
        const dmSend = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle(`マイクミュートの解除`)
          .setDescription(`${member.user.displayName}のマイクミュートを解除しました.`);
        await dmChannel.send({ embeds: [dmSend] });
        member.voice.setMute(false);
      },
      time * 60 * 1000
    );
  }
}
