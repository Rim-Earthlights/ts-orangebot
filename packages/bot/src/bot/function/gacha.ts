/**
 * ガチャ関連処理
 * おみくじもここで処理している
 * 抽選・保存ロジックは @orangebot/shared の GachaService に移動済み (Phase 2-2)
 */

import { CacheType, ChannelType, ChatInputCommandInteraction, EmbedBuilder, Message } from 'discord.js';
import { checkUserType } from '../../common/common.js';
import { DISCORD_CLIENT } from '../../constant/constants.js';
import { GachaItem, GachaService, Omikuji, UsersType } from '@orangebot/shared';

/**
 * ガチャを引く
 * @param interaction 発行されたコマンド情報
 * @param limit 全て引くかどうか
 * @param num 引く回数
 */
export const pickGacha = async (
  interaction: ChatInputCommandInteraction<CacheType>,
  limit?: boolean,
  num?: number
): Promise<void> => {
  await pickNormal(interaction, num, limit ?? false);
};

/**
 * ガチャ情報の取得
 * @param interaction
 */
export const getGachaInfo = async (interaction: ChatInputCommandInteraction<CacheType>): Promise<void> => {
  await getPresent(interaction);
};

/**
 * 指定条件でガチャを引く(景品は無効)
 * @param interaction 発行されたコマンド情報
 * @param num 引く回数
 * @param word 検索ワード
 */
export const extraPick = async (
  interaction: ChatInputCommandInteraction<CacheType>,
  num?: number,
  word?: string
): Promise<void> => {
  await pickExtra(interaction, num, word);
};

/**
 * 指定された条件でガチャを引く
 * @param interaction
 * @param args
 * @returns
 */
async function pickExtra(
  interaction: ChatInputCommandInteraction<CacheType>,
  num?: number,
  word?: string
): Promise<void> {
  let result;
  if (num) {
    result = GachaService.simulateExtraPicks({ mode: 'count', count: num });
  } else if (word) {
    result = GachaService.simulateExtraPicks({ mode: 'target', target: word, matchByName: false });
  } else {
    result = GachaService.simulateExtraPicks({ mode: 'count', count: 10 });
  }

  if ('error' in result) {
    const send = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(`エラー`)
      .setDescription(`1,000,000回引いても該当の等級が出なかった`);

    interaction.editReply({ content: `ガチャ、出なかったみたい・・・`, embeds: [send] });
    return;
  }

  const gachaList = result.list;
  const rareList = [...new Set(gachaList.map((g) => g.rare))];

  // 等級と総数
  const fields = rareList.map((r) => {
    const length = gachaList.filter((l) => l.rare === r).length;
    return {
      name: r,
      value: length.toString() + ` > 確率: ${((length / gachaList.length) * 100).toFixed(4)}%`,
    };
  });
  fields.push({ name: '当たり数', value: gachaList.filter((g) => g.is_present).length.toString() });
  fields.push({ name: '総数', value: gachaList.length.toString() });

  // 等級の高い順に並び替える
  const t = gachaList.sort((a, b) => {
    return a.rank - b.rank;
  });

  const highTier = t.slice(0, 50);
  highTier.reverse();

  const send = new EmbedBuilder()
    .setColor('#ff9900')
    .setTitle(`${gachaList.length}連の結果: 高い順から50個まで表示しています`)
    .setDescription(`${highTier.map((g) => `[${g.rare}]${g.icon ? g.icon : ''} ${g.name}`).join('\n')}`)
    .setFields(fields)
    .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/gacha.png');

  interaction.editReply({ content: `ガチャを${gachaList.length}回ひいたよ！(_**景品無効**_)`, embeds: [send] });
}

/**
 * 通常ガチャを引く
 * @param interaction
 * @returns
 */
async function pickNormal(
  interaction: ChatInputCommandInteraction<CacheType>,
  gnum = 10,
  limit: boolean
): Promise<void> {
  if (interaction.channel?.type !== ChannelType.GuildText && interaction.channel?.type !== ChannelType.GuildVoice) {
    return;
  }
  if (!interaction.guild) {
    return;
  }

  const gachaService = new GachaService();
  const result = await gachaService.pickNormal({
    guildId: interaction.guild.id,
    userId: interaction.user.id,
    userName: interaction.user.displayName,
    count: Number(gnum),
    limit,
  });

  if ('type' in result) {
    if (result.type === 'INSUFFICIENT_PICKS') {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`ガチャ回数不足`)
        .setFields({ name: '残り回数', value: result.pickLeft.toString() });
      interaction.editReply({
        content: `ガチャを引く残り回数が足りないみたい！`,
        embeds: [send],
      });
    }
    return;
  }

  const { totalRolls, pickLeft, presents } = result;

  // 等級の高い順に並び替える
  const t = [...result.list].sort((a, b) => {
    return a.rank - b.rank;
  });

  const highTier = t.slice(0, 50);
  t.reverse();

  const desc = t.map((g) => `[${g.rare}]${g.icon ? g.icon : ''} ${g.name}`).join('\n');

  if (t.length > 99) {
    const send = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(`${t.length}連の結果: 高い順に50要素のみ抜き出しています`)
      .setDescription(`${highTier.map((g) => `[${g.rare}]${g.icon ? g.icon : ''} ${g.name}`).join('\n')}`)
      .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/gacha.png')
      .setFields(
        { name: 'チケット増加回数', value: totalRolls.toString() },
        { name: '残り回数', value: pickLeft.toString() }
      );
    await interaction.editReply({ content: `ガチャだよ！からんころーん！`, embeds: [send] });
    if (presents.length > 0) {
      const send = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('プレゼントだ～！おめでと～！！')
        .setDescription(presents.map((p) => `[${p.rare}] ${p.name}`).join('\n'))
        .setFields({ name: '通知:', value: '<@246007305156558848>' });
      await interaction.followUp({ embeds: [send] });
    }
  } else {
    const send = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(`${t.length}連の結果`)
      .setDescription(`${desc}`)
      .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/gacha.png')
      .setFields(
        { name: 'チケット増加回数', value: totalRolls.toString() },
        { name: '残り回数', value: pickLeft.toString() }
      );
    await interaction.editReply({ content: `ガチャだよ！からんころーん！`, embeds: [send] });
    if (presents.length > 0) {
      const send = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('プレゼントだ～！おめでと～！！')
        .setDescription(presents.map((p) => `[${p.rare}] ${p.name}`).join('\n'))
        .setFields({ name: '通知用:', value: '<@246007305156558848>' });
      await interaction.followUp({ embeds: [send] });
    }
  }
}

/**
 * プレゼント一覧を取得する
 * @param interaction
 */
export async function getPresent(interaction: ChatInputCommandInteraction<CacheType>, uid?: string): Promise<void> {
  let getUid: string;
  if (interaction.channel?.type !== ChannelType.GuildText && interaction.channel?.type !== ChannelType.GuildVoice) {
    return;
  }
  if (!interaction.guild) {
    return;
  }

  if (uid == undefined) {
    getUid = interaction.user.id;
  } else {
    if (!(await checkUserType(interaction.guild.id, interaction.user.id, UsersType.OWNER))) {
      interaction.reply({
        content: `他ユーザーのプレゼントの閲覧権限がないよ！`,
      });
      return;
    }
    getUid = uid;
  }

  const gachaService = new GachaService();
  const info = await gachaService.getPresentInfo(interaction.guild.id, getUid);

  if (info) {
    const presentDescription = info.presents
      .map((p) => `${p.id}: [${p.rare}]${p.icon ? p.icon : ''} ${p.name}`)
      .join('\n');
    const send = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(`${info.userName} さんのガチャ情報だよ！`)
      .setFields(
        { name: '当選したプレゼント', value: presentDescription ? presentDescription : 'なし' },
        { name: '現在の金額', value: info.totalPrice.toString() },
        { name: '残りガチャ回数', value: info.pickLeft.toString() }
      );
    interaction.reply({ embeds: [send] });
  } else {
    interaction.reply({
      content: `ユーザーが登録されていないみたい？ガチャを引いてみると解決するかも！`,
    });
  }
}

/**
 * プレゼントを使用する
 *
 */
export async function usePresent(interaction: ChatInputCommandInteraction<CacheType>, args: string[]): Promise<void> {
  if (!interaction.guild) {
    return;
  }
  if (!(await checkUserType(interaction.guild.id, interaction.user.id, UsersType.OWNER))) {
    interaction.editReply({
      content: `プレゼントの使用権限がないよ！`,
    });
    return;
  }

  const gachaService = new GachaService();
  args.map(async (arg) => {
    const result = await gachaService.usePresent(Number(arg));
    if (result) {
      const send = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('プレゼントを使用したよ！')
        .setDescription(
          `ユーザ: ${(await DISCORD_CLIENT.users.fetch(result.userId)).displayName}\nプレゼント: ${result.itemName}`
        );

      interaction.editReply({
        embeds: [send],
      });
    } else {
      interaction.editReply({
        content: `id:${arg} のプレゼントが見つからないよ！`,
      });
    }
  });
}

/**
 * プレゼントを渡す
 * @param message
 * @param uid
 * @param itemId
 * @returns
 */
export async function givePresent(message: Message, uid: string, itemId: number): Promise<void> {
  if (!message.guild) {
    return;
  }
  if (!(await checkUserType(message.guild.id, message.author.id, UsersType.OWNER))) {
    message.reply({
      content: `プレゼントを渡す権限がないよ！`,
    });
    return;
  }

  const gachaService = new GachaService();
  const result = await gachaService.givePresent(uid, itemId);
  if (result) {
    const send = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle('プレゼントを渡したよ！')
      .setDescription(
        `ユーザ: ${(await DISCORD_CLIENT.users.fetch(uid)).displayName}\nプレゼント: ${result.itemName}`
      );

    message.reply({
      embeds: [send],
    });
  } else {
    message.reply({
      content: `プレゼントが見つからないよ！`,
    });
  }
}

/**
 * おみくじを引く
 * @param message 受け取ったメッセージング情報
 * @returns
 */
export async function pickOmikuji(message: Message, args?: string[]): Promise<void> {
  if (args != undefined && args.length > 0) {
    const { list, found } = GachaService.drawOmikujiUntil(args[0]);

    if (!found) {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription(`500回引いても該当のおみくじが出なかった`);

      message.reply({ content: `おみくじ、出なかったみたい・・・`, embeds: [send] });
      return;
    }

    const send = buildOmikujiSummary(list);

    message.reply({ content: `おみくじ！がらがらがら～！`, embeds: [send] });
    return;
  } else {
    const omikuji = GachaService.drawOmikuji();

    const send = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(omikuji.luck)
      .setDescription(omikuji.description)
      .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/mikuji.png');

    message.reply({ content: `おみくじ！がらがらがら～！`, embeds: [send] });
    return;
  }
}

/**
 * 引いたおみくじ一覧の集計 Embed を作る
 */
export function buildOmikujiSummary(omikujis: Omikuji[]): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#ff9900')
    .setTitle(`${omikujis.length}回目で出たよ！`)
    .setDescription(`${omikujis.map((o) => o.luck).join(', ')}`)
    .addFields({
      name: '大吉',
      value: omikujis.filter((o) => o.luck === '大吉').length.toString(),
    })
    .addFields({
      name: '吉',
      value: omikujis.filter((o) => o.luck === '吉').length.toString(),
    })
    .addFields({
      name: '中吉',
      value: omikujis.filter((o) => o.luck === '中吉').length.toString(),
    })
    .addFields({
      name: '小吉',
      value: omikujis.filter((o) => o.luck === '小吉').length.toString(),
    })
    .addFields({
      name: '末吉',
      value: omikujis.filter((o) => o.luck === '末吉').length.toString(),
    })
    .addFields({
      name: '凶',
      value: omikujis.filter((o) => o.luck === '凶').length.toString(),
    })
    .addFields({
      name: '大凶',
      value: omikujis.filter((o) => o.luck === '大凶').length.toString(),
    })
    .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/mikuji.png');
}

export type { GachaItem };
