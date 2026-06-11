import axios from 'axios';
import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

const VOICEVOX_URI = 'http://127.0.0.1:50021';

/** VOICEVOXユーザー辞書の単語情報 */
interface UserDictWord {
  surface: string;
  pronunciation: string;
  accent_type: number;
  priority: number;
}

const WORD_TYPE_NAMES: Record<string, string> = {
  PROPER_NOUN: '固有名詞',
  COMMON_NOUN: '普通名詞',
  VERB: '動詞',
  ADJECTIVE: '形容詞',
  SUFFIX: '語尾',
};

/**
 * ユーザー辞書に単語を登録する
 * @param interaction
 */
export async function add(interaction: ChatInputCommandInteraction<CacheType>) {
  await interaction.deferReply();

  const surface = interaction.options.getString('surface', true);
  const pronunciation = interaction.options.getString('pronunciation', true);
  const accentType = interaction.options.getNumber('accent_type', true);
  const wordType = interaction.options.getString('word_type');
  const priority = interaction.options.getNumber('priority');

  const params = new URLSearchParams({
    surface,
    pronunciation,
    accent_type: String(accentType),
  });
  if (wordType) {
    params.append('word_type', wordType);
  }
  if (priority != null) {
    params.append('priority', String(priority));
  }

  try {
    const response = await axios.post(`${VOICEVOX_URI}/user_dict_word?${params.toString()}`);
    const uuid = response.data as string;

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('辞書登録')
      .setDescription(`「${surface}」を「${pronunciation}」として登録したよ～！`)
      .addFields(
        { name: '単語', value: surface, inline: true },
        { name: '読み', value: pronunciation, inline: true },
        { name: 'アクセント型', value: String(accentType), inline: true },
        { name: '品詞', value: WORD_TYPE_NAMES[wordType ?? 'PROPER_NOUN'], inline: true },
        { name: '優先度', value: String(priority ?? 5), inline: true },
        { name: 'UUID', value: uuid }
      );
    await interaction.editReply({ embeds: [embed] });
  } catch (e) {
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('エラー')
      .setDescription(`辞書登録に失敗しちゃった: ${(e as Error).message}`);
    await interaction.editReply({ embeds: [embed] });
  }
}

/**
 * ユーザー辞書の単語一覧を表示する
 * @param interaction
 */
export async function list(interaction: ChatInputCommandInteraction<CacheType>) {
  await interaction.deferReply();

  try {
    const response = await axios.get(`${VOICEVOX_URI}/user_dict`);
    const words = response.data as Record<string, UserDictWord>;
    const entries = Object.entries(words);

    if (entries.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('Yellow')
        .setTitle('辞書一覧')
        .setDescription('まだ何も登録されていないみたい');
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const lines = entries.map(
      ([uuid, word]) =>
        `**${word.surface}** → ${word.pronunciation} (アクセント: ${word.accent_type})\n\`${uuid}\``
    );

    // Discordのdescription上限(4096文字)を超えないように分割する
    const embeds: EmbedBuilder[] = [];
    let description = '';
    for (const line of lines) {
      if (description.length + line.length + 1 > 4000) {
        embeds.push(new EmbedBuilder().setColor('Green').setDescription(description));
        description = '';
      }
      description += line + '\n';
    }
    embeds.push(new EmbedBuilder().setColor('Green').setDescription(description));
    embeds[0].setTitle(`辞書一覧 (${entries.length}件)`);

    await interaction.editReply({ embeds: embeds.slice(0, 10) });
  } catch (e) {
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('エラー')
      .setDescription(`辞書一覧の取得に失敗しちゃった: ${(e as Error).message}`);
    await interaction.editReply({ embeds: [embed] });
  }
}

/**
 * ユーザー辞書から単語を削除する
 * @param interaction
 */
export async function remove(interaction: ChatInputCommandInteraction<CacheType>) {
  await interaction.deferReply();

  const uuid = interaction.options.getString('uuid', true);

  try {
    const response = await axios.get(`${VOICEVOX_URI}/user_dict`);
    const words = response.data as Record<string, UserDictWord>;
    const word = words[uuid];

    if (!word) {
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('エラー')
        .setDescription('そのUUIDの単語は見つからなかったよ～？ /dict list で確認してね');
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    await axios.delete(`${VOICEVOX_URI}/user_dict_word/${uuid}`);

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('辞書削除')
      .setDescription(`「${word.surface}」(${word.pronunciation}) を削除したよ`);
    await interaction.editReply({ embeds: [embed] });
  } catch (e) {
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('エラー')
      .setDescription(`辞書削除に失敗しちゃった: ${(e as Error).message}`);
    await interaction.editReply({ embeds: [embed] });
  }
}
