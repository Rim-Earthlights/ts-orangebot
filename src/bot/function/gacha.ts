/**
 * ガチャ関連処理
 * おみくじもここで処理している
 */

import dayjs from 'dayjs';
import { CacheType, ChannelType, ChatInputCommandInteraction, EmbedBuilder, Message } from 'discord.js';
import { checkUserType, getRndNumber } from '../../common/common.js';
import { DISCORD_CLIENT } from '../../constant/constants.js';
import { Gacha, GachaPercents, Omikuji } from '../../constant/gacha/gacha.js';
import * as Models from '../../model/models/index.js';
import { UsersType } from '../../model/models/users.js';
import { GachaRepository } from '../../model/repository/gachaRepository.js';
import { ItemRepository } from '../../model/repository/itemRepository.js';
import { UsersRepository } from '../../model/repository/usersRepository.js';

export class GachaList {
  static allItemList: Models.Item[] = [];
}

/**
 * ガチャの当選結果を重み付けして取得する
 * @param list
 * @returns
 */
function getWeight(list: Models.Item[]): Models.Item[] {
  const weightList = [];

  for (const gacha of list) {
    for (let i = 0; i < gacha.weight; i++) {
      weightList.push(gacha);
    }
  }

  return weightList;
}

/**
 * ランダムにガチャを一度引き、等級を返す
 * @returns
 */
export async function getGachaOnce(): Promise<Gacha> {
  const rnd = Math.random();

  if (rnd < GachaPercents.UUR) {
    return await convertGacha('UUR');
  } else if (rnd < GachaPercents.UR) {
    return await convertGacha('UR');
  } else if (rnd < GachaPercents.SSR) {
    return await convertGacha('SSR');
  } else if (rnd < GachaPercents.SR) {
    return await convertGacha('SR');
  } else if (rnd < GachaPercents.R) {
    return await convertGacha('R');
  } else if (rnd < GachaPercents.UC) {
    return await convertGacha('UC');
  } else {
    return await convertGacha('C');
  }
}

/**
 * 当選結果からランダムにガチャを引く
 * @param rare
 * @returns
 */
async function convertGacha(rare: string): Promise<Gacha> {
  const allItems = GachaList.allItemList;
  const itemList = allItems.filter((i) => i.rare === rare);
  const weightList = getWeight(itemList);

  const index = getRndNumber(1, weightList.length) - 1;

  return {
    item_id: weightList[index].id,
    name: weightList[index].name,
    icon: weightList[index].icon,
    rare: weightList[index].rare,
    rank: weightList[index].item_rank.rank,
    is_present: weightList[index].is_present === 1,
    reroll: weightList[index].reroll,
  };
}

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
  const gachaList: Gacha[] = [];

  if (num) {
    for (let i = 0; i < num; i++) {
      const gacha = await getGachaOnce();
      gachaList.push(gacha);
    }
  } else if (word) {
    do {
      const gacha = await getGachaOnce();
      gachaList.push(gacha);
      if (gacha.rare === word) {
        if (gacha.reroll === 0) {
          break;
        }
      }
      if (!['C', 'UC', 'R', 'SR', 'SSR', 'UR', 'UUR'].find((r) => r === word.toUpperCase())) {
        break;
      }
      if (gachaList.length > 1_000_000) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`1,000,000回引いても該当の等級が出なかった`);

        interaction.editReply({ content: `ガチャ、出なかったみたい・・・`, embeds: [send] });
        return;
      }
      // eslint-disable-next-line no-constant-condition
    } while (true);
  } else {
    for (let i = 0; i < 10; i++) {
      const gacha = await getGachaOnce();
      gachaList.push(gacha);
    }
  }

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

  let num = 10;

  const gachaList = [];

  const users = new UsersRepository();
  const user = await users.get(interaction.guild.id, interaction.user.id);

  if (limit) {
    num = user?.pick_left ? user.pick_left : 1;
  } else {
    num = Number(gnum);
  }

  if (user) {
    if (user.pick_left < num) {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`ガチャ回数不足`)
        .setFields({ name: '残り回数', value: user.pick_left.toString() });
      interaction.editReply({
        content: `ガチャを引く残り回数が足りないみたい！`,
        embeds: [send],
      });
      return;
    }
  } else {
    await users.save({
      id: interaction.user.id,
      guild_id: interaction.guild.id,
      user_name: interaction.user.displayName,
      pick_left: 10,
    });
  }

  for (let i = 0; i < num; i++) {
    const gacha = await getGachaOnce();
    gachaList.push(gacha);
  }

  // チケットを引いた分だけ加算する
  const ticketRolls = gachaList
    .filter((g) => g.reroll > 0)
    .reduce(function (sum, element) {
      return sum + element.reroll;
    }, 0);

  let totalRolls = ticketRolls;
  if (limit) {
    let tickets = ticketRolls;

    do {
      let tempList = 0;
      if (tickets <= 0) {
        break;
      }
      for (let i = 0; i < tickets; i++) {
        const gacha = await getGachaOnce();
        gachaList.push(gacha);
        if (gacha.reroll > 0) {
          tempList += gacha.reroll;
        }
      }
      tickets = tempList;
      totalRolls += tickets;
      // eslint-disable-next-line no-constant-condition
    } while (true);
  }

  const t = gachaList.sort((a, b) => {
    return a.rank - b.rank;
  });

  const highTier = t.slice(0, 50);
  t.reverse();

  const gachaTable = new GachaRepository();
  const nowTime = dayjs().toDate();
  const createTables = t.map((g) => {
    return {
      user_id: interaction.user.id,
      item_id: g.item_id,
      pick_date: nowTime,
      rare: g.rare,
      rank: g.rank,
      is_used: 0,
    };
  });

  await gachaTable.save(createTables);

  const itemRepository = new ItemRepository();
  const items = await itemRepository.getAll();
  let pickLeft = 0;
  if (!limit) {
    pickLeft = (user ? user.pick_left : 10) - num + ticketRolls;
  }

  await users.save({
    id: interaction.user.id,
    guild_id: interaction.guild.id,
    user_name: interaction.user.displayName,
    last_pick_date: dayjs().toDate(),
    pick_left: pickLeft,
  });
  const presents = t.filter((g) => items.find((i) => i.id === g.item_id)?.is_present === 1);
  const desc = t.map((g) => `[${g.rare}]${g.icon ? g.icon : ''} ${g.name}`).join('\n');

  if (t.length > 99) {
    const send = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(`${gachaList.length}連の結果: 高い順に50要素のみ抜き出しています`)
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
      .setTitle(`${gachaList.length}連の結果`)
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
    if (!checkUserType(interaction.guild.id, interaction.user.id, UsersType.OWNER)) {
      interaction.reply({
        content: `他ユーザーのプレゼントの閲覧権限がないよ！`,
      });
      return;
    }
    getUid = uid;
  }
  const gachaRepository = new GachaRepository();
  const users = new UsersRepository();
  const user = await users.get(interaction.guild.id, getUid);
  const pickLeft = user?.pick_left;
  const gachaList = await gachaRepository.getPresents(getUid, false);

  if (pickLeft != undefined) {
    const presentDescription = gachaList
      .map((p) => `${p.id}: [${p.items.rare}]${p.items.icon ? p.items.icon : ''} ${p.items.name}`)
      .join('\n');
    const money = gachaList.reduce((prev, current) => {
      return prev + current.items.price;
    }, 0);
    const send = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(`${user?.user_name} さんのガチャ情報だよ！`)
      .setFields(
        { name: '当選したプレゼント', value: presentDescription ? presentDescription : 'なし' },
        { name: '現在の金額', value: money.toString() },
        { name: '残りガチャ回数', value: pickLeft.toString() }
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
  if (!checkUserType(interaction.guild.id, interaction.user.id, UsersType.OWNER)) {
    interaction.editReply({
      content: `プレゼントの使用権限がないよ！`,
    });
    return;
  }

  const gachaRepository = new GachaRepository();
  args.map(async (arg) => {
    const result = await gachaRepository.usePresent(Number(arg));
    if (result) {
      const send = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('プレゼントを使用したよ！')
        .setDescription(
          `ユーザ: ${(await DISCORD_CLIENT.users.fetch(result.user_id)).displayName}\nプレゼント: ${result.items.name}`
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
  if (!checkUserType(message.guild.id, message.author.id, UsersType.OWNER)) {
    message.reply({
      content: `プレゼントを渡す権限がないよ！`,
    });
    return;
  }

  const gachaRepository = new GachaRepository();
  const result = await gachaRepository.givePresent(uid, itemId);
  if (result) {
    const send = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle('プレゼントを渡したよ！')
      .setDescription(
        `ユーザ: ${(await DISCORD_CLIENT.users.fetch(uid)).displayName}\nプレゼント: ${result.items.name}`
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
  const omikujis: Omikuji[] = [];

  if (args != undefined && args.length > 0) {
    do {
      const o = getOmikujiOnce();
      omikujis.push(o);
      if (o.luck === args[0]) {
        break;
      }
      if (omikujis.length > 500) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`500回引いても該当のおみくじが出なかった`);

        message.reply({ content: `おみくじ、出なかったみたい・・・`, embeds: [send] });
        return;
      }
      // eslint-disable-next-line no-constant-condition
    } while (true);

    const send = new EmbedBuilder()
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

    message.reply({ content: `おみくじ！がらがらがら～！`, embeds: [send] });
    return;
  } else {
    const omikuji = getOmikujiOnce();

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
 * ランダムにおみくじを一度引く
 * @returns
 */
function getOmikujiOnce(): Omikuji {
  const rnd = Math.random();
  let luck = '';
  let description = '';

  if (rnd < 0.141) {
    luck = '大吉';
    description = 'おめでとういいことあるよ！！！';
  } else if (rnd < 0.426) {
    luck = '吉';
    description = '結構よき！誇っていいよ！';
  } else if (rnd < 0.56) {
    luck = '中吉';
    description = 'それなりにいいことありそう。';
  } else if (rnd < 0.692) {
    luck = '小吉';
    description = 'ふつうがいちばんだよね。';
  } else if (rnd < 0.831) {
    luck = '末吉';
    description = 'まあこういうときもあるよね。';
  } else if (rnd < 0.975) {
    luck = '凶';
    description = '気をつけようね。';
  } else {
    luck = '大凶';
    description = '逆にレアだしポジティブに考えてこ';
  }
  return {
    luck,
    description,
  };
}
