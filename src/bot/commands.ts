import ytdl from '@distube/ytdl-core';
import {
  BaseGuildVoiceChannel,
  CacheType,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Message,
  VoiceBasedChannel,
} from 'discord.js';
import ytpl from 'ytpl';
import { checkUserType, getIntArray, getRndNumber, isEnableFunction } from '../common/common.js';
import { Logger } from '../common/logger.js';
import { CONFIG, LiteLLMModel, LITELLM_MODEL } from '../config/config.js';
import { LiteLLMMode, Role } from '../constant/chat/chat.js';
import { HELP_COMMANDS, functionNames } from '../constant/constants.js';
import { ITO_TOPICS } from '../constant/words/ito.js';
import { TOPIC } from '../constant/words/topic.js';
import { RoleType } from '../model/models/role.js';
import { Users, UsersType } from '../model/models/users.js';
import { ColorRepository } from '../model/repository/colorRepository.js';
import { LogRepository } from '../model/repository/logRepository.js';
import { PlaylistRepository } from '../model/repository/playlistRepository.js';
import { RoleRepository } from '../model/repository/roleRepository.js';
import { UsersRepository } from '../model/repository/usersRepository.js';
import * as ChatService from '../service/chat.service.js';
import { LogLevel } from '../type/types.js';
import * as DotBotFunctions from './dot_function/index.js';
import { getDefaultRoomName } from './dot_function/voice.js';
import * as BotFunctions from './function/index.js';

let ITO_NUMS = getIntArray(100);

/**
 * 渡されたコマンドから処理を実行する
 *
 * @param command 渡されたメッセージ
 */
export async function commandSelector(message: Message) {
  // eslint-disable-next-line no-irregular-whitespace
  const content = message.content.replace('.', '').replace(/　/g, ' ').trimEnd().split(' ');
  const command = content[0];
  content.shift();

  switch (command) {
    case 'help': {
      await help(message);
      break;
    }
    case 'ping': {
      await ping(message);
      break;
    }
    case 'debug': {
      await DotBotFunctions.Debug.debug(message, content);
      break;
    }
    case 'speech': {
      if (!isEnableFunction(functionNames.GPT_WITHOUT_KEY)) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`機能が有効化されていません。`);

        message.reply({ content: `機能が有効化されてないよ！(GPT_WITHOUT_KEY)`, embeds: [send] });
        return;
      }
      const chat = content.join(' ');
      await DotBotFunctions.Chat.speech(message, chat);
      break;
    }
    case 'no-system-gpt': {
      if (!isEnableFunction(functionNames.GPT_WITHOUT_KEY)) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`機能が有効化されていません。`);

        message.reply({ content: `機能が有効化されてないよ！(GPT_WITHOUT_KEY)`, embeds: [send] });
        return;
      }
      const chat = content.join(' ');
      await DotBotFunctions.Chat.talk(message, chat, LITELLM_MODEL.GPT_4O, LiteLLMMode.NOPROMPT);
      break;
    }
    case 'gpt':
    case 'mikan': {
      if (!isEnableFunction(functionNames.GPT)) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`機能が有効化されていません。`);

        message.reply({ content: `機能が有効化されてないよ！(GPT)`, embeds: [send] });
        return;
      }
      const chat = content.join(' ');
      await DotBotFunctions.Chat.talk(message, chat, CONFIG.OPENAI.DEFAULT_MODEL, LiteLLMMode.DEFAULT);
      break;
    }
    case 'g3': {
      if (!isEnableFunction(functionNames.GPT)) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`機能が有効化されていません。`);

        message.reply({ content: `機能が有効化されてないよ！(GPT)`, embeds: [send] });
        return;
      }
      const chat = content.join(' ');
      await DotBotFunctions.Chat.talk(message, chat, CONFIG.OPENAI.G3_MODEL, LiteLLMMode.DEFAULT);
      break;
    }
    case 'g4': {
      if (!isEnableFunction(functionNames.GPT)) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`機能が有効化されていません。`);

        message.reply({ content: `機能が有効化されてないよ！(GPT)`, embeds: [send] });
        return;
      }

      const chat = content.join(' ');
      await DotBotFunctions.Chat.talk(message, chat, CONFIG.OPENAI.G4_MODEL, LiteLLMMode.DEFAULT);
      break;
    }
    case 'memory': {
      await DotBotFunctions.Chat.setMemory(message);
      break;
    }
    case 'model': {
      const dest = content[0];
      const model = content[1];

      const defaultModel = CONFIG.OPENAI.DEFAULT_MODEL;
      const g3Model = CONFIG.OPENAI.G3_MODEL;
      const g4Model = CONFIG.OPENAI.G4_MODEL;

      if (dest == null || model == null) {
        const send = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle(`現在のモデル`)
          .setDescription(`default: ${defaultModel}\ng3: ${g3Model}\ng4: ${g4Model}`);

        message.reply({ embeds: [send] });
        return;
      }

      await ChatService.setModel(dest as 'default' | 'g3' | 'g4', model as LiteLLMModel);
      const send = new EmbedBuilder()
        .setColor('#00ffff')
        .setTitle(`モデル変更`)
        .setDescription(`モデルを${model}に変更`);

      message.reply({ embeds: [send] });
      break;
    }
    case 'model-info': {
      await DotBotFunctions.Chat.getModel(message);
      break;
    }
    case 'pic': {
      // eslint-disable-next-line no-constant-condition
      if (!isEnableFunction(functionNames.GPT)) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`機能が有効化されていません。`);

        message.reply({ content: `機能が有効化されてないよ！(picture)`, embeds: [send] });
        return;
      }
      const chat = content.join(' ');
      await DotBotFunctions.Chat.generatePicture(message, chat);
      break;
    }
    case 'topic': {
      const num = getRndNumber(0, TOPIC.length - 1);
      const send = new EmbedBuilder().setColor('#ff9900').setTitle(`こんなのでました～！`).setDescription(TOPIC[num]);

      message.reply({ embeds: [send] });
      break;
    }
    case 'erase': {
      await DotBotFunctions.Chat.deleteChatData(message, content[0]);
      break;
    }
    case 'dice': {
      await DotBotFunctions.Dice.roll(message, content);
      break;
    }
    case 'dall': {
      await DotBotFunctions.Dice.rollAll(message);
      break;
    }
    case 'tenki': {
      if (!isEnableFunction(functionNames.FORECAST)) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`機能が有効化されていません。`);

        message.reply({ content: `機能が有効化されてないよ！(FORECAST)`, embeds: [send] });
        return;
      }
      await DotBotFunctions.Forecast.weather(message, content);
      break;
    }
    case 'luck': {
      await DotBotFunctions.Gacha.pickOmikuji(message, content);
      break;
    }
    case 'gacha': {
      await DotBotFunctions.Gacha.pickGacha(message, content);
      break;
    }
    case 'g': {
      await DotBotFunctions.Gacha.pickGacha(message, content);
      break;
    }
    case 'gp': {
      await DotBotFunctions.Gacha.showPercent(message);
      break;
    }
    case 'gl': {
      await DotBotFunctions.Gacha.pickGacha(message, ['limit']);
      break;
    }
    case 'give': {
      const uid = content[0];
      const iid = Number(content[1]);

      await DotBotFunctions.Gacha.givePresent(message, uid, iid);
      break;
    }
    case 'celo': {
      await DotBotFunctions.Dice.celo(message);
      break;
    }
    case 'celovs': {
      await DotBotFunctions.Dice.celovs(message);
      break;
    }
    /**
     * 音楽をキューに追加する.
     */
    case 'play':
    case 'pl': {
      if (!isEnableFunction(functionNames.YOUTUBE)) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`機能が有効化されていません。`);

        message.reply({ content: `機能が有効化されてないよ！(YOUTUBE)`, embeds: [send] });
        return;
      }
      try {
        if (!content || content.length === 0) {
          const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`URLが不正`);

          message.reply({ content: `YoutubeのURLを指定して～！`, embeds: [send] });
          return;
        }

        const url = content[0];
        const channel = message.member?.voice.channel;

        if (!channel) {
          const send = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`エラー`)
            .setDescription(`userのボイスチャンネルが見つからなかった`);

          message.reply({ content: `ボイスチャンネルに入ってから使って～！`, embeds: [send] });
          return;
        }

        await DotBotFunctions.Music.add(channel, url, message.author.id);
      } catch (e) {
        const error = e as Error;
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription([error.name, error.message, error.stack].join('\n'));

        message.reply({
          content: `ありゃ、何かで落ちたみたい…？よかったらりむくんに送ってみてね！`,
          embeds: [send],
        });
        return;
      }
      break;
    }
    case 'search':
    case 'sc': {
      if (!isEnableFunction(functionNames.YOUTUBE)) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`機能が有効化されていません。`);

        message.reply({ content: `機能が有効化されてないよ！(YOUTUBE)`, embeds: [send] });
        return;
      }

      try {
        if (!content || content.length === 0) {
          const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`URLが不正`);

          message.reply({ content: `検索する単語を指定してね！`, embeds: [send] });
          return;
        }

        const words = content.join(' ');
        const channel = message.member?.voice.channel;

        if (!channel) {
          const send = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`エラー`)
            .setDescription(`userのボイスチャンネルが見つからなかった`);

          message.reply({ content: `ボイスチャンネルに入ってから使って～！`, embeds: [send] });
          return;
        }

        await DotBotFunctions.Music.search(channel, words);
      } catch (e) {
        const error = e as Error;
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription([error.name, error.message, error.stack].join('\n'));

        message.reply({
          content: `ありゃ、何かで落ちたみたい…？よかったらりむくんに送ってみてね！`,
          embeds: [send],
        });
        return;
      }
      break;
    }
    case 'interrupt':
    case 'pi': {
      await interrupt(message, content);
      break;
    }
    case 'stop':
    case 'st': {
      await stop(message);
      break;
    }
    case 'rem':
    case 'rm': {
      await rem(message, content);
      break;
    }
    case 'pause': {
      const gid = message.guild?.id;
      if (!gid) {
        return;
      }
      await DotBotFunctions.Music.pause(message.channel as VoiceBasedChannel);
      break;
    }
    case 'list': {
      if (!content || content.length === 0) {
        const playlists = await DotBotFunctions.Music.getPlaylist(message.author.id);

        if (playlists.length === 0) {
          const send = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('エラー: ')
            .setDescription('プレイリストが登録されていない');

          message.reply({ content: `見つからなかった…もう一回登録してみて～！`, embeds: [send] });
          return;
        }

        const description = playlists
          .map(
            (p) =>
              `登録名: ${p.name}\n> プレイリスト名: ${p.title} | ループ: ${p.loop ? 'ON' : 'OFF'} | シャッフル: ${
                p.shuffle ? 'ON' : 'OFF'
              }`
          )
          .join('\n');

        const send = new EmbedBuilder().setColor('#00ffff').setTitle('プレイリスト:').setDescription(description);

        message.reply({ content: `プレイリストの一覧だよ！`, embeds: [send] });

        return;
      }

      switch (content[0]) {
        case 'rm':
        case 'rem': {
          try {
            const name = content[1];
            const deleted = await DotBotFunctions.Music.removePlaylist(message.author.id, name);

            if (!deleted) {
              const send = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('エラー:')
                .setDescription('削除するプレイリスト名を取得できなかった');

              message.reply({
                content: `削除できなかったみたい…もう一度名前を確認してみて！`,
                embeds: [send],
              });
              return;
            }

            const send = new EmbedBuilder().setColor('#00ffff').setTitle('プレイリスト: ').setDescription('削除完了');

            message.reply({ content: `削除できたよ～！`, embeds: [send] });
            break;
          } catch (e) {
            const error = e as Error;
            const send = new EmbedBuilder()
              .setColor('#ff0000')
              .setTitle(`エラー`)
              .setDescription([error.name, error.message, error.stack].join('\n'));

            message.reply({
              content: `ありゃ、何かで落ちたみたい…？よかったら下のメッセージをりむくんに送ってみてね！`,
              embeds: [send],
            });
            return;
          }
        }
        case 'reg':
        case 'add': {
          try {
            const name = content[1];
            const url = content[2];

            const repository = new PlaylistRepository();
            const p = await repository.get(message.author.id, name);

            if (p) {
              const send = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle(`エラー`)
                .setDescription(`プレイリストが存在している`);
              message.reply({
                content: `もうすでに同じ名前があるみたい……先に消すか別の名前にして！`,
                embeds: [send],
              });
              return;
            }

            const playlistFlag = ytpl.validateID(url);
            const movieFlag = ytdl.validateURL(url);

            if (playlistFlag) {
              const pid = await ytpl.getPlaylistID(url);
              const playlist = await ytpl(pid);

              await repository.save({
                name: name,
                user_id: message.author.id,
                title: playlist.title,
                url: playlist.url,
              });

              const send = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle(`登録`)
                .setDescription(`登録名: ${name}\nプレイリスト名: ${playlist.title}\nURL: ${url}`);
              message.reply({ content: `以下の内容で登録したよ～！`, embeds: [send] });

              return;
            }

            if (movieFlag) {
              const movie = await ytdl.getInfo(url);

              await repository.save({
                name: name,
                user_id: message.author.id,
                title: movie.videoDetails.title,
                url: movie.videoDetails.video_url,
              });

              const send = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle(`登録`)
                .setDescription(`登録名: ${name}\n動画名: ${movie.videoDetails.title}\nURL: ${url}`);
              message.reply({ content: `以下の内容で登録したよ～！`, embeds: [send] });

              return;
            }

            const send = new EmbedBuilder()
              .setColor('#ff0000')
              .setTitle(`エラー`)
              .setDescription(`プレイリストor動画のURLではない`);
            message.reply({ content: `プレイリストが非公開かも？`, embeds: [send] });

            return false;
          } catch (e) {
            const error = e as Error;
            const send = new EmbedBuilder()
              .setColor('#ff0000')
              .setTitle(`エラー`)
              .setDescription([error.name, error.message, error.stack].join('\n'));

            message.reply({
              content: `ありゃ、何かで落ちたみたい…？よかったらりむくんに送ってみてね！`,
              embeds: [send],
            });
            return;
          }
          break;
        }
        case 'loop':
        case 'lp': {
          const name = content[1];
          const state = content[2].toUpperCase() === 'ON';

          const repository = new PlaylistRepository();
          const p = await repository.get(message.author.id, name);

          if (!p) {
            return;
          }

          await repository.save({ id: p.id, loop: Number(state) });
          const send = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle(`更新`)
            .setDescription(`更新名: ${name}\nループ: ${state ? 'ON' : 'OFF'}`);
          message.reply({ content: `以下の内容で更新したよ～！`, embeds: [send] });
          break;
        }
        case 'shuffle':
        case 'sf': {
          const name = content[1];
          const state = content[2].toUpperCase() === 'ON';

          const repository = new PlaylistRepository();
          const p = await repository.get(message.author.id, name);

          if (!p) {
            return;
          }

          await repository.save({ id: p.id, shuffle: Number(state) });
          const send = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle(`更新`)
            .setDescription(`更新名: ${name}\nシャッフル: ${state ? 'ON' : 'OFF'}`);
          message.reply({ content: `以下の内容で更新したよ～！`, embeds: [send] });
          break;
        }
        default: {
          break;
        }
      }
      break;
    }
    case 'q': {
      await queue(message);
      break;
    }
    case 'silent':
    case 'si': {
      const channel = message.member?.voice.channel;
      if (!channel) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`userのボイスチャンネルが見つからなかった`);

        message.reply({ content: `ボイスチャンネルに入ってから使って～！`, embeds: [send] });
        return;
      }

      await DotBotFunctions.Music.changeNotify(channel);
      break;
    }
    case 'mode': {
      const name = content[0];
      const channel = message.member?.voice.channel;
      if (!channel) {
        await Logger.put({
          guild_id: message.guild?.id,
          channel_id: message.channel?.id,
          user_id: message.author.id,
          level: LogLevel.ERROR,
          event: 'received-command/mode',
          message: [`missing channel`],
        });
        return;
      }
      if (!name) {
        await DotBotFunctions.Music.getPlayerInfo(channel);
        return;
      }

      await DotBotFunctions.Music.editPlayerInfo(channel, name);
      break;
    }
    case 'shuffle':
    case 'sf': {
      await shuffle(message);
      break;
    }
    case 'reg': {
      await DotBotFunctions.Register.save(message, content);
      break;
    }
    case 'team': {
      if (content.length > 0) {
        const number = Number(content[0]);
        if (number < 1) {
          const send = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`エラー`)
            .setDescription(`1以上の数字を入れてね`);

          message.reply({ embeds: [send] });
          return;
        }
        await DotBotFunctions.Room.team(message, number, content[1] != undefined);
      }
      break;
    }
    case 'custom': {
      const value = content[0];
      const team = Number(content[1]);
      const limit = Number(content[2]);
      if (!value) {
        return;
      }
      if (value === 'start') {
        await DotBotFunctions.Room.createTeamRoom(message, team, limit);
      }
      if (value === 'end') {
        await DotBotFunctions.Room.deleteTeamRoom(message, !!content[1]);
      }
      return;
    }
    case 'room': {
      const mode = content[0];
      const value = content[1];

      if (!mode) {
        return;
      }

      switch (mode) {
        case 'name': {
          content.shift();
          let roomName;
          if (!value) {
            // 初期名(お部屋: #NUM)に変更
            const guild = message.guild;
            if (!guild) {
              return;
            }
            roomName = getDefaultRoomName(message.guild);
          } else {
            roomName = content.join(' ');
          }
          await DotBotFunctions.Room.changeRoomName(message, roomName);
          break;
        }
        case 'limit': {
          if (!value || Number(value) <= 0) {
            await DotBotFunctions.Room.changeLimit(message, 0);
            return;
          }
          let limit = Number(value);
          if (limit > 99) {
            limit = 99;
          }
          await DotBotFunctions.Room.changeLimit(message, Number(value));
          break;
        }
        case 'delete':
        case 'lock': {
          await DotBotFunctions.Room.changeRoomSetting(message, 'delete');
          break;
        }
        case 'live': {
          let roomName;
          if (!value) {
            // 初期名(お部屋: #NUM)に変更
            const guild = message.guild;
            if (!guild) {
              return;
            }
            const vc = message.member?.voice.channel;
            if (!vc) {
              return;
            }
            roomName = vc.name;
          } else {
            roomName = value;
          }

          await DotBotFunctions.Room.changeRoomSetting(message, 'live', roomName);
          break;
        }
      }
      break;
    }
    case 'rn': {
      const value = content.join(' ');
      let roomName;
      if (!value) {
        // 初期名(お部屋: #NUM)に変更
        const guild = message.guild;
        if (!guild) {
          return;
        }
        roomName = getDefaultRoomName(message.guild);
      } else {
        roomName = value;
      }
      await DotBotFunctions.Room.changeRoomName(message, roomName);
      break;
    }
    case 'dc': {
      if (!message.guild) {
        return;
      }
      if (!checkUserType(message.guild.id, message.author.id, UsersType.ADMIN)) {
        return;
      }
      const id = content[0];
      if (!id) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`id not found or invalid`);

        message.reply({ embeds: [send] });
        return;
      }

      if (message.channel.type === ChannelType.GuildVoice) {
        const channel = message.channel as BaseGuildVoiceChannel;
        const member = channel.members.find((member) => member.id === id || member.user.username === id);
        if (!member) {
          const send = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`エラー`)
            .setDescription(`id not found or invalid`);

          message.reply({ embeds: [send] });
          break;
        }
        await member.voice.disconnect();
      }
      break;
    }
    case 'seek': {
      if (content.length <= 0) {
        const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`時間を指定してください`);

        message.reply({ embeds: [send] });
        break;
      }
      let seek = 0;
      if (content[0].includes(':')) {
        const time = content[0].split(':');

        const min = Number(time[0]);
        const sec = Number(time[1]);
        seek = min * 60 + sec;
      } else {
        seek = Number(content[0]);
      }

      const channel = message.member?.voice.channel;

      if (!channel) {
        break;
      }

      await DotBotFunctions.Music.seek(channel, seek);
      break;
    }
    case 'choose':
    case 'choice':
    case 'ch': {
      if (content.length <= 0) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`選択肢を入力してください`);

        message.reply({ embeds: [send] });
      }
      const item = DotBotFunctions.Dice.choose(content);
      const send = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle(`選択結果: ${item}`)
        .setDescription(`選択肢: ${content.join(', ')}`);

      message.reply({ embeds: [send] });
      break;
    }
    case 'relief': {
      if (!message.guild) {
        return;
      }
      const channel = message.channel;
      if (!channel || channel.type === ChannelType.GroupDM) {
        return;
      }
      if (!checkUserType(message.guild.id, message.author.id, UsersType.OWNER)) {
        return;
      }

      const num = Number(content[0]);
      if (num <= 0) {
        return;
      }

      const userRepository = new UsersRepository();
      await userRepository.relief(message.guild.id, num);

      const send = new EmbedBuilder()
        .setColor('#ffcc00')
        .setTitle(`詫び石の配布`)
        .setDescription(`${num} 回のガチャチケットを配布しました`);
      await channel.send({ embeds: [send] });
      break;
    }
    case 'popup-rule': {
      if (!message.guild) {
        return;
      }
      if (!checkUserType(message.guild.id, message.author.id, UsersType.OWNER)) {
        return;
      }
      const channel = message.channel;
      if (channel && channel.type !== ChannelType.GroupDM) {
        const send = new EmbedBuilder()
          .setColor('#ffcc00')
          .setTitle(`ルールを読んだ`)
          .setDescription('リアクションをすると全ての機能が使えるようになります');
        const result = await channel.send({ embeds: [send] });
        result.react('✅');
        const m = await channel.send('pop-up success.');
        await m.delete();
      }
      break;
    }
    case 'popup-gamelist': {
      if (!message.guild) {
        return;
      }
      if (!checkUserType(message.guild.id, message.author.id, UsersType.OWNER)) {
        return;
      }
      const channel = message.channel;
      if (channel && channel.type !== ChannelType.GroupDM) {
        const send = new EmbedBuilder()
          .setColor('#ffcc00')
          .setTitle(`ゲームの選択`)
          .setDescription('リアクションをすると全ての機能が使えるようになります');
        const result = await channel.send({ embeds: [send] });
        result.react('✅');
      }

      break;
    }
    case 'add-role-all': {
      if (!message.guild) {
        return;
      }
      if (!checkUserType(message.guild.id, message.author.id, UsersType.OWNER)) {
        return;
      }

      const members = await message.guild.members.fetch();
      if (!members) {
        break;
      }
      const roleRepository = new RoleRepository();
      const memberRole = await roleRepository.getRoleByName(message.guild.id, 'member');
      if (!memberRole) {
        break;
      }

      members.map(async (m) => {
        if (m.user.bot) {
          return;
        }
        const userRepository = new UsersRepository();
        const user = await userRepository.get(m.guild.id, m.id);
        if (!user) {
          await userRepository.save({
            id: m.id,
            user_name: m.user.displayName,
            voice_channel_data: [
              {
                gid: message.guild?.id ?? 'DM',
                date: new Date(),
              },
            ],
          });
        } else {
          await userRepository.save({
            ...user,
            voice_channel_data: [
              {
                gid: message.guild?.id ?? 'DM',
                date: new Date(),
              },
            ],
          });
        }
        if (m.roles.cache.has(memberRole.role_id)) {
          return;
        }
        await m.roles.add(memberRole.role_id);
      });
      await message.reply('add roles to all members.');
      break;
    }
    case 'timer': {
      const description = content[0];
      const time = Number(content[1]);

      if (!time) {
        return;
      }

      message.reply(`set ${description} timer ${time} min.`);

      setTimeout(
        async () => {
          if (message.channel?.type === ChannelType.GuildVoice) {
            const channel = message.channel as BaseGuildVoiceChannel;
            const member = channel.members.find((member) => member.id === message.author.id);
            if (!member) {
              const send = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle(`エラー`)
                .setDescription(`id not found or invalid`);

              message.reply({ embeds: [send] });
              return;
            }
            await member.voice.disconnect();

            await Logger.put({
              guild_id: message.guild?.id,
              channel_id: message.channel?.id,
              user_id: message.author.id,
              level: LogLevel.INFO,
              event: 'disconnect-user',
              message: [`disconnect ${member.user.displayName} by ${message.author.displayName}`],
            });

            const send = new EmbedBuilder()
              .setColor('#00ff00')
              .setTitle(`成功`)
              .setDescription(`${member.user.displayName}を切断しました`);

            message.reply({ embeds: [send] });
          }
          return;
        },
        time * 1000 * 60
      );
      break;
    }
    case 'role': {
      if (!message.guild) {
        return;
      }
      if (!checkUserType(message.guild.id, message.author.id, UsersType.OWNER)) {
        return;
      }
      if (content.length <= 0) return;

      const type = content[0] as RoleType | undefined;
      const name = content[1];
      const role_id = content[2];

      if (!type || !name || !role_id) {
        return;
      }

      const roleRepository = new RoleRepository();
      await roleRepository.addRole({ type, name, role_id, guild_id: message.guild?.id });

      break;
    }
    case 'last-vc-join': {
      if (!message.guild) {
        return;
      }
      if (!checkUserType(message.guild.id, message.author.id, UsersType.OWNER)) {
        return;
      }

      if (!message.guild) {
        return;
      }

      const userRepository = new UsersRepository();
      const logRepository = new LogRepository();

      const members = await message.guild.members.fetch();
      if (!members) {
        return;
      }

      const result = members.map(async (m) => {
        if (m.user.bot) {
          return;
        }
        const user = await userRepository.get(m.guild.id, m.id);
        if (!user) {
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const lastJoin = await logRepository.getLastCallJoinDate(message.guild!.id, user.id);
        if (!lastJoin) {
          return;
        }

        if (!user.voice_channel_data) {
          return;
        }

        const guildVoiceData = user.voice_channel_data.find((v) => v.gid === message.guild?.id);
        if (!guildVoiceData) {
          return;
        }

        guildVoiceData.date = lastJoin;
        await userRepository.save(user);
      });

      await Promise.all(result);
      await message.reply('success.');
      break;
    }
    case 'color': {
      if (!message.guild) {
        return;
      }
      if (!checkUserType(message.guild.id, message.author.id, UsersType.OWNER)) {
        return;
      }
      if (content.length <= 0) return;

      const color_code = content[0];
      const color_name = content[1];
      const role_id = content[2];

      if (!color_code || !color_name || !role_id) {
        return;
      }

      const colorRepository = new ColorRepository();
      await colorRepository.addColor({ color_code, color_name, role_id });

      break;
    }
    case 'nickname': {
      const name = content[0];
      if (!name) {
        return;
      }
      if (message.guild) {
        const usersRepository = new UsersRepository();
        const user = await usersRepository.get(message.guild.id, message.author.id);
        if (!user) {
          await message.reply({ content: `あなたのことが登録されていないみたい……？` });
          return;
        }
        await usersRepository.save({ ...user, userSetting: { ...user.userSetting, nickname: name } });
        await message.reply({ content: `はーい！これから「${name}」って呼ぶね～！` });
      }
      break;
    }
    case 'user-type': {
      if (!message.guild) {
        return;
      }
      if (!checkUserType(message.guild.id, message.author.id, UsersType.OWNER)) {
        return;
      }
      if (!message.guild) {
        return;
      }
      const uid = content[0];
      const type = content[1] as UsersType | undefined;

      if (!uid || !type) {
        return;
      }

      const userRepository = new UsersRepository();
      const user = await userRepository.updateUsersType(message.guild.id, uid, type);

      const send = new EmbedBuilder()
        .setColor('#ffcc00')
        .setTitle(`権限変更`)
        .setDescription(`権限を変更: ${user?.user_name} / ${type}`);
      await message.reply({ embeds: [send] });
      break;
    }
    case 'restart': {
      if (!message.guild) {
        return;
      }
      if (!checkUserType(message.guild.id, message.author.id, UsersType.OWNER)) {
        return;
      }
      throw new Error('再起動');
    }
  }
}

/**
 * 渡されたスラッシュコマンドを処理する
 * @param interaction
 * @returns
 */
export async function interactionSelector(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
  const { commandName } = interaction;

  switch (commandName) {
    case 'ping': {
      await interaction.reply('Pong!');
      break;
    }
    case 'help': {
      await help(interaction);
      break;
    }
    case 'debug': {
      const url = interaction.options.getString('url');
      await Logger.put({
        guild_id: interaction.guild?.id,
        channel_id: interaction.channel?.id,
        user_id: interaction.user.id,
        level: LogLevel.INFO,
        event: 'received-command/debug',
        message: [`${url}`],
      });
      await interaction.reply('test.');
      break;
    }
    case 'gacha': {
      await Logger.put({
        guild_id: interaction.guild?.id,
        channel_id: interaction.channel?.id,
        user_id: interaction.user.id,
        level: LogLevel.INFO,
        event: 'received-command/gacha',
        message: [`${interaction}`],
      });
      const type = interaction.options.getSubcommand();
      switch (type) {
        case 'pick': {
          await interaction.deferReply();
          const num = interaction.options.getNumber('num') ?? undefined;
          const limit = interaction.options.getBoolean('limit') ?? undefined;

          await BotFunctions.Gacha.pickGacha(interaction, limit, num);
          break;
        }
        case 'list': {
          await BotFunctions.Gacha.getGachaInfo(interaction);
          break;
        }
        case 'extra': {
          await interaction.deferReply();
          await BotFunctions.Gacha.extraPick(
            interaction,
            interaction.options.getNumber('num') ?? undefined,
            interaction.options.getString('item') ?? undefined
          );
          break;
        }
      }
      break;
    }
    case 'gc': {
      await interaction.deferReply();
      const num = interaction.options.getNumber('num') ?? undefined;
      const limit = interaction.options.getBoolean('limit') ?? undefined;

      await BotFunctions.Gacha.pickGacha(interaction, limit, num);
      break;
    }
    case 'gl': {
      await interaction.deferReply();
      await BotFunctions.Gacha.pickGacha(interaction, true);
      break;
    }
    case 'dice': {
      await interaction.deferReply({ ephemeral: true });
      const num = interaction.options.getNumber('num') ?? 1;
      const max = interaction.options.getNumber('max') ?? 100;
      await BotFunctions.Dice.rollHideDice(interaction, num, max);
      break;
    }
    case 'genito': {
      await interaction.deferReply();
      ITO_NUMS = getIntArray(100);
      const nums = [];
      for (let i = 0; i < 4; i++) {
        const num = getRndNumber(0, ITO_TOPICS.length - 1);
        nums.push(num);
      }
      const send = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle(`今回のお題は？`)
        .setDescription(nums.map((num) => ITO_TOPICS[num]).join('\n'));

      interaction.editReply({ embeds: [send] });
      break;
    }
    case 'ito': {
      await interaction.deferReply({ ephemeral: true });
      const round = interaction.options.getNumber('round') ?? 1;
      // roundの数だけ取り出す
      const sendNums = ITO_NUMS.slice(0, round);
      ITO_NUMS.splice(0, round);

      await Logger.put({
        guild_id: interaction.guild?.id,
        channel_id: interaction.channel?.id,
        user_id: interaction.user.id,
        level: LogLevel.INFO,
        event: 'received-command/ito',
        message: [`${sendNums.join(', ')}`],
      });

      interaction.editReply({ content: `貴方の数は${sendNums.join(', ')}です.` });
      break;
    }
    case 'gpt': {
      if (!isEnableFunction(functionNames.GPT)) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`機能が有効化されていません。`);

        interaction.reply({ content: `機能が有効化されてないよ！(GPT)`, embeds: [send] });
        return;
      }
      await interaction.deferReply();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const text = interaction.options.getString('text')!;
      await BotFunctions.Chat.talk(interaction, text, CONFIG.OPENAI.DEFAULT_MODEL, LiteLLMMode.DEFAULT);
      break;
    }
    case 'g3': {
      if (!isEnableFunction(functionNames.GPT)) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`機能が有効化されていません。`);

        interaction.reply({ content: `機能が有効化されてないよ！(GPT)`, embeds: [send] });
        return;
      }
      await interaction.deferReply();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const text = interaction.options.getString('text')!;
      await BotFunctions.Chat.talk(interaction, text, CONFIG.OPENAI.G3_MODEL, LiteLLMMode.DEFAULT);
      break;
    }
    case 'g4': {
      if (!isEnableFunction(functionNames.GPT)) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`機能が有効化されていません。`);

        interaction.reply({ content: `機能が有効化されてないよ！(GPT)`, embeds: [send] });
        return;
      }
      await interaction.deferReply();
      const text = interaction.options.getString('text') ?? '';
      await BotFunctions.Chat.talk(interaction, text, CONFIG.OPENAI.G4_MODEL, LiteLLMMode.DEFAULT);
      break;
    }
    case 'o1': {
      if (!isEnableFunction(functionNames.GPT)) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`機能が有効化されていません。`);

        interaction.reply({ content: `機能が有効化されてないよ！(GPT)`, embeds: [send] });
        return;
      }
      const text = interaction.options.getString('text') ?? '';
      await BotFunctions.Chat.talk(interaction, text, LITELLM_MODEL.GPT_O1, LiteLLMMode.DEFAULT);
      break;
    }
    case 'o1m': {
      if (!isEnableFunction(functionNames.GPT)) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`機能が有効化されていません。`);

        interaction.reply({ content: `機能が有効化されてないよ！(GPT)`, embeds: [send] });
        return;
      }
      const text = interaction.options.getString('text') ?? '';
      await BotFunctions.Chat.talk(interaction, text, LITELLM_MODEL.GPT_O3_MINI, LiteLLMMode.DEFAULT);
      break;
    }
    case 'ai': {
      const type = interaction.options.getSubcommand();
      switch (type) {
        case 'start': {
          await interaction.deferReply();
          await BotFunctions.Vchat.initVc(interaction);
          break;
        }
        case 'stop': {
          await interaction.deferReply();
          BotFunctions.Vchat.closeVc(interaction.guild?.id ?? '');
          await interaction.editReply({ content: '切断しました' });
          break;
        }
      }
      break;
    }
    case 'speak': {
      await BotFunctions.Speak.call(interaction);
      break;
    }
    case 'memory': {
      await BotFunctions.Chat.setMemory(interaction);
      break;
    }
    case 'erase': {
      const last = interaction.options.getBoolean('last') ?? undefined;
      await BotFunctions.Chat.deleteChatData(interaction, last);
      break;
    }
    case 'topic': {
      const num = getRndNumber(0, TOPIC.length - 1);
      const send = new EmbedBuilder().setColor('#ff9900').setTitle(`こんなのでました～！`).setDescription(TOPIC[num]);

      interaction.reply({ embeds: [send] });
      break;
    }
    case 'dc': {
      // required option is not null
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const user = interaction.options.getUser('user')!;
      if (!interaction.guild) {
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
      const id = user.id;
      if (!id) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`id not found or invalid`);

        interaction.reply({ embeds: [send] });
        return;
      }

      if (interaction.channel?.type === ChannelType.GuildVoice) {
        const channel = interaction.channel as BaseGuildVoiceChannel;
        const member = channel.members.find((member) => member.id === id);
        if (!member) {
          const send = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`エラー`)
            .setDescription(`id not found or invalid`);

          interaction.reply({ embeds: [send] });
          break;
        }
        await member.voice.disconnect();

        await Logger.put({
          guild_id: interaction.guild?.id,
          channel_id: interaction.channel?.id,
          user_id: interaction.user.id,
          level: LogLevel.INFO,
          event: 'disconnect-user',
          message: [`disconnect ${member.user.displayName} by ${interaction.user}`],
        });

        const send = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle(`成功`)
          .setDescription(`${member.user.displayName}を切断しました`);

        interaction.reply({ embeds: [send] });
      }
      break;
    }
    case 'timeout': {
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

      const chatService = new ChatService.ChatService(interaction);
      await chatService.addChat(Role.USER, message);
      return;
    }
    case 'mute': {
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

      const chatService = new ChatService.ChatService(interaction);
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

      break;
    }
    case 'accept': {
      if (!interaction.guild) {
        return;
      }
      if (interaction.channel?.type === ChannelType.GuildText) {
        const user = interaction.user;
        await Logger.put({
          guild_id: interaction.guild.id,
          channel_id: interaction.channel.id,
          user_id: user.id,
          level: LogLevel.INFO,
          event: 'reaction-add',
          message: [`rule accepted: ${user.displayName}`],
        });

        const u = interaction.guild.members.cache.get(user.id);

        if (!u) {
          console.error('user not found');
          return;
        }

        const roleRepository = new RoleRepository();

        const r = await roleRepository.getRoleByName(interaction.guild.id, 'member');
        if (!r) {
          console.error('role not found');
          return;
        }
        const userRole = u?.roles.cache.find((role) => role.id === r.role_id);

        await Logger.put({
          guild_id: interaction.guild.id,
          channel_id: interaction.channel.id,
          user_id: user.id,
          level: LogLevel.INFO,
          event: 'role-check',
          message: [u?.roles.cache.map((role) => role.name).join(',')],
        });
        if (userRole) {
          const message = await interaction.reply({ content: `もうロールが付いてるみたい！`, ephemeral: true });
          setTimeout(async () => {
            await message.delete();
          }, 3000);
          return;
        }

        // add user role
        await u?.roles.add(r.role_id);

        // register user
        const userRepository = new UsersRepository();
        const userEntity = await userRepository.get(interaction.guild.id, user.id);
        if (!userEntity) {
          const saveUser: Partial<Users> = {
            id: user.id,
            user_name: user.displayName,
            pick_left: 10,
            voice_channel_data: [
              {
                gid: interaction.guild.id ?? 'DM',
                date: new Date(),
              },
            ],
          };
          await userRepository.save(saveUser);
        }
        const name = u?.roles.cache.find((role) => role.name === 'member')?.name;
        await Logger.put({
          guild_id: interaction.guild.id,
          channel_id: interaction.channel.id,
          user_id: user.id,
          level: LogLevel.INFO,
          event: 'add-role',
          message: name ? [name] : undefined,
        });

        const message = await interaction.reply({
          content: `読んでくれてありがと～！ロールを付与したよ！`,
          ephemeral: true,
        });
        setTimeout(async () => {
          await message.delete();
        }, 3000);
        return;
      }
      break;
    }
    case 'room': {
      const type = interaction.options.getSubcommand();
      await interaction.deferReply({ ephemeral: true });
      switch (type) {
        case 'create': {
          const name = interaction.options.getString('name');
          const isLive = interaction.options.getBoolean('live') ?? false;
          const isPrivate = interaction.options.getBoolean('private') ?? true;

          if (!name) {
            await interaction.editReply({ content: 'チャンネル名を指定してください' });
            return;
          }
          await BotFunctions.Room.createRoom(interaction, name, isLive, isPrivate);
          break;
        }
        case 'add': {
          const user = interaction.options.getUser('user');
          const member = interaction.guild?.members.cache.get(user?.id ?? '');
          if (!member) {
            await interaction.editReply({ content: 'ユーザーが見つかりません' });
            return;
          }
          await BotFunctions.Room.addPermission(interaction, member);
          break;
        }
        case 'remove': {
          const user = interaction.options.getUser('user');
          const member = interaction.guild?.members.cache.get(user?.id ?? '');
          if (!member) {
            await interaction.editReply({ content: 'ユーザーが見つかりません' });
            return;
          }
          await BotFunctions.Room.removePermission(interaction, member);
          break;
        }
        case 'lock': {
          await BotFunctions.Room.toggleAutoDelete(interaction);
          break;
        }
      }
      break;
    }
    case 'nickname': {
      const name = interaction.options.getString('name');
      if (!name) {
        return;
      }
      if (interaction.guild) {
        const usersRepository = new UsersRepository();
        const user = await usersRepository.get(interaction.guild.id, interaction.user.id);
        if (!user) {
          await interaction.reply({ content: `あなたのことが登録されていないみたい……？` });
          return;
        }
        await usersRepository.save({ ...user, userSetting: { ...user.userSetting, nickname: name } });
        await interaction.reply({ content: `はーい！これから「${name}」って呼ぶね～！` });
      }
      break;
    }
    default: {
      return;
    }
  }
}

/**
 * Ping-Pong
 * 疎通確認のコマンドです.
 *
 * @param message 受け取ったメッセージング情報
 */
export async function ping(message: Message) {
  message.reply('pong!');
}

/**
 * 現在の言語、コマンドを表示する
 * @param message
 */
export async function help(message: Message | ChatInputCommandInteraction<CacheType>) {
  if (message instanceof Message) {
    HELP_COMMANDS.map(async (c) => {
      if (message.channel.type === ChannelType.GroupDM) {
        return;
      }
      await message.channel.send({ embeds: [c] });
    });
  } else if (message instanceof ChatInputCommandInteraction) {
    await message.reply({ content: 'ヘルプを表示', ephemeral: true });
    HELP_COMMANDS.map(async (c) => await message.followUp({ embeds: [c], ephemeral: true }));
  }
}

/**
 * 音楽を再生する.
 * @param message
 * @param args
 * @returns
 */
export async function play(message: Message, args?: string[]) {
  if (!args || args.length === 0) {
    const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`URLが不正`);

    message.reply({ content: `YoutubeのURLを指定して～！`, embeds: [send] });
    return;
  }

  const url = args[0];
  const channel = message.member?.voice.channel;

  if (!channel) {
    const send = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(`エラー`)
      .setDescription(`userのボイスチャンネルが見つからなかった`);

    message.reply({ content: `ボイスチャンネルに入ってから使って～！`, embeds: [send] });
    return;
  }

  await DotBotFunctions.Music.add(channel, url, message.author.id);
}

/**
 * 音楽を停止する.
 * @param message
 * @returns
 */
export async function stop(message: Message) {
  const channel = message.member?.voice.channel;
  if (!channel) {
    const send = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(`エラー`)
      .setDescription(`userのボイスチャンネルが見つからなかった`);

    message.reply({ content: `ボイスチャンネルに入ってから使って～！`, embeds: [send] });
    return;
  }
  await DotBotFunctions.Music.stopMusic(channel);
}

export async function rem(message: Message, args?: string[]) {
  if (!args) {
    return;
  }
  if (args[0] === 'all') {
    await exterm(message);
    return;
  }
  const num = Number(args[0]);
  if (num === undefined) {
    return;
  }

  const channel = message.member?.voice.channel;
  if (!channel) {
    const send = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(`エラー`)
      .setDescription(`userのボイスチャンネルが見つからなかった`);

    message.reply({ content: `ボイスチャンネルに入ってから使って～！`, embeds: [send] });
    return;
  }
  await DotBotFunctions.Music.removeId(channel, channel.guild.id, num);
}

export async function interrupt(message: Message, args?: string[]) {
  if (!args || args.length === 0) {
    const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`URLが不正`);

    message.reply({ content: `YoutubeのURLを指定して～！`, embeds: [send] });
    return;
  }

  const channel = message.member?.voice.channel;
  const url = args[0];
  const num = Number(url);

  if (!channel) {
    const send = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(`エラー`)
      .setDescription(`userのボイスチャンネルが見つからなかった`);

    message.reply({ content: `ボイスチャンネルに入ってから使って～！`, embeds: [send] });
    return;
  }

  if (!Number.isNaN(num)) {
    await DotBotFunctions.Music.interruptIndex(channel, num);
    return;
  }

  if (!ytdl.validateURL(args[0])) {
    const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`URLが不正`);

    message.reply({ content: `YoutubeのURLを指定して～！`, embeds: [send] });
    return;
  }

  await DotBotFunctions.Music.interruptMusic(channel, url);
}

export async function queue(message: Message) {
  const channel = message.member?.voice.channel;
  if (!channel) {
    return;
  }
  await DotBotFunctions.Music.showQueue(channel);
  return;
}

export async function shuffle(message: Message) {
  const channel = message.member?.voice.channel;
  if (!channel) {
    return;
  }
  DotBotFunctions.Music.shuffleMusic(channel);
}

export async function exterm(message: Message) {
  if (!message.guild?.id) {
    return;
  }

  await DotBotFunctions.Music.extermAudioPlayer(message.guild.id, message.channel.id);
}
