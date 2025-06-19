import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import { checkUserType } from '../../../../common/common.js';
import { UsersType } from '../../../../model/models/users.js';
import { Role } from '../../../../constant/chat/chat.js';
import * as ChatService from '../../../../service/chat.service.js';

export class TimeoutHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const user = interaction.options.getUser('user')!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const time = interaction.options.getNumber('time')!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

    let dmChannel = user.dmChannel;
    if (!dmChannel) {
      // 一度もDMを送信していない場合
      dmChannel = await user.createDM();
    }

    const message = await ChatService.getTimeoutMessage(interaction.user.id, user.id, reason, time);

    const dmSend = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(`⚠️警告：タイムアウト処分が行われました`)
      .setDescription(message);
    await dmChannel.send({ embeds: [dmSend] });

    await member.timeout(time * 60 * 60 * 1000, reason);

    const send = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle(`タイムアウトの実行`)
      .setFields(
        { name: '対象人物', value: member.user.displayName },
        { name: '規制時間', value: `${time.toString()} 時間` },
        { name: '理由', value: reason }
      );
    await interaction.reply({ embeds: [send] });

    const chatService = new ChatService.InteractionChatService(interaction);
    await chatService.addChat(Role.USER, message);
  }
}