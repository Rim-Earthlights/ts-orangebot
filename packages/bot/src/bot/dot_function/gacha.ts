import { ChannelType, EmbedBuilder, Message } from 'discord.js';
import { checkUserType } from '../../common/common.js';
import { Logger } from '../../common/logger.js';
import { CONFIG } from '../../config/config.js';
import { DISCORD_CLIENT } from '../../constant/constants.js';
import { GachaPercents, GachaService, LogLevel, UserService, UsersType } from '@orangebot/shared';
import { buildOmikujiSummary } from '../function/gacha.js';

/**
 * ガチャを引く
 * @param message 受け取ったメッセージング情報
 * @param args 0: 指定回数 or 等級 (出るまで引く)
 * @returns
 */
export async function pickGacha(message: Message, args?: string[]) {
  if (args != undefined && args.length > 0) {
    if (args[0] === 'list') {
      await getPresent(message, args[1], false);
    } else if (args[0] === 'hist') {
      await getPresent(message, args[1], true);
    } else if (args[0] === 'use') {
      await usePresent(message, args.slice(1));
    } else if (args[0] === 'reset') {
      await reset(message, args[1], args[2]);
    } else if (args[0] === 'extra') {
      await pickExtra(message, args);
    } else {
      await pickNormal(message, args[0]);
    }
  } else {
    await pickNormal(message);
  }
}

/**
 * ガチャフラグをリセットする
 * @param message
 * @param id
 * @returns
 */
async function reset(message: Message, id?: string, num?: string) {
  if (!message.guild) {
    return;
  }
  if (!checkUserType(message.guild.id, message.author.id, UsersType.OWNER)) {
    await message.reply({
      content: `ガチャフラグのリセット権限がないアカウントだよ！管理者にお願いしてね！`,
    });
    return;
  }
  if (id) {
    const userService = new UserService();
    const count = num ? Number(num) : 10;
    const user = await userService.resetGachaCount(message.guild.id, id, count);
    if (!user) {
      await message.reply({
        content: `リセットしようとするユーザが登録されてないみたい…？`,
      });
      return;
    }
    await message.reply({
      content: `${user.userName ? user.userName : user.id} さんのガチャ回数を${count}に再セットしたよ！`,
    });
  }
  return;
}

/**
 * 指定された条件でガチャを引く
 * @param message
 * @param args
 * @returns
 */
async function pickExtra(message: Message, args: string[]) {
  const num = Number(args[1]);
  const result = num
    ? GachaService.simulateExtraPicks({ mode: 'count', count: num })
    : GachaService.simulateExtraPicks({ mode: 'target', target: args[1], matchByName: true });

  if ('error' in result) {
    const send = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(`エラー`)
      .setDescription(`1,000,000回引いても該当の等級が出なかった`);

    await message.reply({ content: `ガチャ、出なかったみたい・・・`, embeds: [send] });
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

  await message.reply({ content: `ガチャを${gachaList.length}回ひいたよ！(_**景品無効**_)`, embeds: [send] });
}

/**
 * 通常ガチャを引く
 * @param message
 * @returns
 */
async function pickNormal(message: Message, gnum = '10') {
  if (message.channel.type === ChannelType.GuildStageVoice || message.channel.type === ChannelType.GroupDM) {
    return;
  }
  if (!message.guild) {
    return;
  }

  const limit = gnum === 'limit' || gnum === 'l';

  const gachaService = new GachaService();
  const result = await gachaService.pickNormal({
    guildId: message.guild.id,
    userId: message.author.id,
    userName: message.author.displayName,
    count: Number(gnum),
    limit,
    requireVoiceActivity: true,
  });

  if ('type' in result) {
    if (result.type === 'NO_VOICE_HISTORY') {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription(`7日以内の通話参加履歴が見つからなかった`);

      await message.reply({
        content: `このサーバーで通話に参加した履歴がないみたい……？`,
        embeds: [send],
      });
    } else if (result.type === 'VOICE_HISTORY_EXPIRED') {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription(`7日以内の通話参加履歴が見つからなかった`);

      await message.reply({
        content: `最後に通話してから1週間以上通話に参加してないみたい……`,
        embeds: [send],
      });
    } else if (result.type === 'INSUFFICIENT_PICKS') {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`ガチャ回数不足`)
        .setFields({ name: '残り回数', value: result.pickLeft.toString() });
      await message.reply({
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
    await message.reply({ content: `ガチャだよ！からんころーん！`, embeds: [send] });
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
    await message.reply({ content: `ガチャだよ！からんころーん！`, embeds: [send] });
  }

  if (presents.length > 0) {
    await Logger.put({
      guild_id: message.guild?.id,
      channel_id: message.channel.id,
      user_id: message.id,
      level: LogLevel.INFO,
      event: 'get-gacha',
      message: [`user: ${message.author.displayName}`, ...presents.map((p) => `[${p.rare}] ${p.name}`)],
    });
    const send = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle('プレゼントだ～！おめでと～！！')
      .setDescription(presents.map((p) => `[${p.rare}] ${p.name}`).join('\n'))
      .setFields({ name: '通知:', value: '<@246007305156558848>' });
    await message.channel.send({ embeds: [send] });
  }
}

/**
 * プレゼント一覧を取得する
 * @param message
 */
export async function getPresent(message: Message, uid?: string, hist?: boolean) {
  let getUid: string;
  if (!message.guild || message.channel.type === ChannelType.GuildStageVoice || message.channel.type === ChannelType.GroupDM) {
    return;
  }
  if (uid == undefined) {
    getUid = message.author.id;
  } else {
    if (!checkUserType(message.guild.id, message.author.id, UsersType.OWNER)) {
      message.reply({
        content: `他ユーザーのプレゼントの閲覧権限がないよ！`,
      });
      return;
    }
    getUid = uid;
  }

  const gachaService = new GachaService();
  const info = await gachaService.getPresentInfo(message.guild.id, getUid);

  if (info) {
    const send = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(`${info.userName} さんのガチャ情報だよ！`)
      .setDescription(
        `${CONFIG.COMMON.HOST_URL}/gacha/history?uid=${getUid}&hist=${hist ?? false}`
      );
    await message.channel.send({ embeds: [send] });
  } else {
    await message.reply({
      content: `ユーザーが登録されていないみたい？ガチャを引いてみると解決するかも！`,
    });
  }
}

/**
 * プレゼントを使用する
 *
 */
export async function usePresent(message: Message, args: string[]) {
  if (!message.guild) {
    return;
  }
  if (!checkUserType(message.guild.id, message.author.id, UsersType.OWNER)) {
    await message.reply({
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

      await message.reply({
        embeds: [send],
      });
    } else {
      await message.reply({
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
export async function givePresent(message: Message, uid: string, itemId: number) {
  if (!message.guild) {
    return;
  }
  if (!checkUserType(message.guild.id, message.author.id, UsersType.OWNER)) {
    await message.reply({
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

    await message.reply({
      embeds: [send],
    });
  } else {
    await message.reply({
      content: `プレゼントが見つからないよ！`,
    });
  }
}

export const showPercent = async (message: Message) => {
  const fields = [];
  fields.push({ name: 'UUR', value: `${GachaPercents.UUR * 100} %` });
  fields.push({ name: 'UR', value: `${GachaPercents.UR * 100 - GachaPercents.UUR * 100} %` });
  fields.push({
    name: 'SSR',
    value: `${(GachaPercents.SSR * 100 - GachaPercents.UR * 100).toFixed(4)} %`,
  });
  fields.push({
    name: 'SR',
    value: `${(GachaPercents.SR * 100 - GachaPercents.SSR * 100).toFixed(4)} %`,
  });
  fields.push({
    name: 'R',
    value: `${(GachaPercents.R * 100 - GachaPercents.SR * 100).toFixed(4)} %`,
  });
  fields.push({
    name: 'UC',
    value: `${(GachaPercents.UC * 100 - GachaPercents.R * 100).toFixed(4)} %`,
  });
  fields.push({
    name: 'C',
    value: `${(GachaPercents.C * 100 - GachaPercents.UC * 100).toFixed(4)} %`,
  });

  const send = new EmbedBuilder().setColor('#ff9900').setTitle('現在の確率一覧だよ！').setFields(fields);

  await message.reply({
    embeds: [send],
  });
};

/**
 * おみくじを引く
 * @param message 受け取ったメッセージング情報
 * @returns
 */
export async function pickOmikuji(message: Message, args?: string[]) {
  if (args != undefined && args.length > 0) {
    const { list, found } = GachaService.drawOmikujiUntil(args[0]);

    if (!found) {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription(`500回引いても該当のおみくじが出なかった`);

      await message.reply({ content: `おみくじ、出なかったみたい・・・`, embeds: [send] });
      return;
    }

    const send = buildOmikujiSummary(list);

    await message.reply({ content: `おみくじ！がらがらがら～！`, embeds: [send] });
    return;
  } else {
    const omikuji = GachaService.drawOmikuji();

    const send = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(omikuji.luck)
      .setDescription(omikuji.description)
      .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/mikuji.png');

    await message.reply({ content: `おみくじ！がらがらがら～！`, embeds: [send] });
    return;
  }
}
