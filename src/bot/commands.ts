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
import { checkUserType, isEnableFunction } from '../common/common.js';
import { Logger } from '../common/logger.js';
import { LITELLM_MODEL } from '../config/config.js';
import { LiteLLMMode } from '../constant/chat/chat.js';
import { HELP_COMMANDS, functionNames } from '../constant/constants.js';
import { RoleType } from '../model/models/role.js';
import { UsersType } from '../model/models/users.js';
import { ColorRepository } from '../model/repository/colorRepository.js';
import { LogRepository } from '../model/repository/logRepository.js';
import { PlaylistRepository } from '../model/repository/playlistRepository.js';
import { RoleRepository } from '../model/repository/roleRepository.js';
import { UsersRepository } from '../model/repository/usersRepository.js';
import { LogLevel } from '../type/types.js';
import * as DotBotFunctions from './dot_function/index.js';
import { getDefaultRoomName } from './dot_function/voice.js';

/**
 * 渡されたコマンドから処理を実行する
 * @deprecated message.managerが実装完了後移行する
 * @param command 渡されたメッセージ
 */
export async function commandSelector(message: Message) {
  // eslint-disable-next-line no-irregular-whitespace
  const content = message.content.replace('.', '').replace(/　/g, ' ').trimEnd().split(' ');
  const command = content[0];
  content.shift();

  switch (command) {
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
    case 'memory': {
      await DotBotFunctions.Chat.setMemory(message);
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
