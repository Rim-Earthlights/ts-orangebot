import { CONFIG, LiteLLMModel } from '../config/config.js';
import { ChatInputCommandInteraction, CacheType } from 'discord.js';
import { initalize, LiteLLMMode, llmList, Role } from '../constant/chat/chat.js';
import { MUTE_MESSAGE, TIMEOUT_MESSAGE } from '../constant/constants.js';

export class ChatService {
  private interaction: ChatInputCommandInteraction<CacheType>;
  constructor(interaction: ChatInputCommandInteraction<CacheType>) {
    this.interaction = interaction;
  }

  async getIdInfo() {
    const guild = this.interaction.guild;
    if (!guild) {
      return { id: this.interaction.channel?.id ?? this.interaction.user.dmChannel?.id, isGuild: false };
    }
    return { id: guild.id, isGuild: true };
  }

  async addChat(role: Role, content: string) {
    const { id, isGuild } = await this.getIdInfo();
    if (!id) {
      return;
    }

    let llm = llmList.gpt.find((c) => c.id === id);
    if (!llm) {
      llm = await initalize(id, CONFIG.OPENAI.DEFAULT_MODEL, LiteLLMMode.DEFAULT, isGuild);
      llmList.gpt.push(llm);
    }

    llm.chat.push({ role: role, content: content });
  }
}

export async function setModel(dest: 'default' | 'g3' | 'g4', model: LiteLLMModel) {
  if (dest === 'default') {
    CONFIG.OPENAI.DEFAULT_MODEL = model;
  } else if (dest === 'g3') {
    CONFIG.OPENAI.G3_MODEL = model;
  } else if (dest === 'g4') {
    CONFIG.OPENAI.G4_MODEL = model;
  }
}

export async function getMuteMessage(adminUserId: string, userId: string, reason: string, time: number) {
  return MUTE_MESSAGE.replace('{adminUserId}', adminUserId)
    .replace('{userId}', userId)
    .replace('{reason}', reason)
    .replace('{time}', time.toString());
}

export async function getTimeoutMessage(adminUserId: string, userId: string, reason: string, time: number) {
  return TIMEOUT_MESSAGE.replace('{adminUserId}', adminUserId)
    .replace('{userId}', userId)
    .replace('{reason}', reason)
    .replace('{time}', time.toString());
}
