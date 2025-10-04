import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import { getIdInfoInteraction, llmList } from '../../../../constant/chat/chat.js';
import { ModelType } from '../../../../model/models/userSetting.js';
import { UsersRepository } from '../../../../model/repository/usersRepository.js';
import { CONFIG, LiteLLMModel } from '../../../../config/config.js';

export class ModelHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await this.setModel(interaction);
  }

  private async setModel(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const { id } = getIdInfoInteraction(interaction);
    if (!id) {
      return;
    }
    const model = interaction.options.getString('model');
    if (!model) {
      return;
    }
    let modelType: LiteLLMModel;
    switch (model) {
      case ModelType.DEFAULT:
        modelType = CONFIG.OPENAI.DEFAULT_MODEL;
        break;
      case ModelType.LOW:
        modelType = CONFIG.OPENAI.LOW_MODEL;
        break;
      case ModelType.HIGH:
        modelType = CONFIG.OPENAI.HIGH_MODEL;
        break;
      default:
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`default, low, high のいずれかを選択してください。`);
        interaction.reply({ embeds: [send] });
        return;
    }
    const userRepository = new UsersRepository();
    await userRepository.saveUserSetting({
      user_id: id,
      model_type: model as (typeof ModelType)[keyof typeof ModelType],
    });

    const llm = llmList.llm.find((c) => c.id === id);
    if (llm) {
      llm.model = modelType;
    }

    const send = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle(`モデル変更`)
      .setDescription(`モデルを\`${model}\`に変更`);
    interaction.reply({ embeds: [send] });
  }
}
