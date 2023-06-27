import { Message, EmbedBuilder, VoiceBasedChannel, ChatInputCommandInteraction, CacheType } from 'discord.js';
import ytdl from 'ytdl-core';
import * as DotBotFunctions from './dot_function/index.js';
import * as BotFunctions from './function/index.js';
import { PlaylistRepository } from '../model/repository/playlistRepository.js';
import ytpl from 'ytpl';
import * as logger from '../common/logger.js';
import { CONFIG } from '../config/config.js';
import { isEnableFunction } from '../common/common.js';
import { HELP_COMMANDS, functionNames } from '../constant/constants.js';
import { ChatGPTModel } from '../constant/chat/chat.js';
import { UsersRepository } from '../model/repository/usersRepository.js';

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
            await debug(message, content);
            break;
        }
        case 'gpt-no-system': {
            if (!isEnableFunction(functionNames.GPT_WITHOUT_KEY)) {
                const send = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(`エラー`)
                    .setDescription(`機能が有効化されていません。`);

                message.reply({ content: `機能が有効化されてないよ！(GPT_WITHOUT_KEY)`, embeds: [send] });
                return;
            }
            const chat = content.join(' ');
            await DotBotFunctions.Chat.talkWithoutPrompt(message, chat);
            break;
        }
        case 'gpt': {
            if (!isEnableFunction(functionNames.GPT)) {
                const send = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(`エラー`)
                    .setDescription(`機能が有効化されていません。`);

                message.reply({ content: `機能が有効化されてないよ！(GPT)`, embeds: [send] });
                return;
            }
            const chat = content.join(' ');
            await DotBotFunctions.Chat.talk(message, chat, ChatGPTModel.GPT_3_16K);
            break;
        }
        case 'g4': {
            if (!isEnableFunction(functionNames.GPT) || !isEnableFunction(functionNames.ENABLE_GPT4)) {
                const send = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(`エラー`)
                    .setDescription(`機能が有効化されていません。`);

                message.reply({ content: `機能が有効化されてないよ！(GPT-4)`, embeds: [send] });
                return;
            }

            const chat = content.join(' ');
            await DotBotFunctions.Chat.talk(message, chat, ChatGPTModel.GPT_4);
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
                    embeds: [send]
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
                    embeds: [send]
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
                            `登録名: ${p.name}\n> プレイリスト名: ${p.title} | ループ: ${
                                p.loop ? 'ON' : 'OFF'
                            } | シャッフル: ${p.shuffle ? 'ON' : 'OFF'}`
                    )
                    .join('\n');

                const send = new EmbedBuilder()
                    .setColor('#00ffff')
                    .setTitle('プレイリスト:')
                    .setDescription(description);

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
                                embeds: [send]
                            });
                            return;
                        }

                        const send = new EmbedBuilder()
                            .setColor('#00ffff')
                            .setTitle('プレイリスト: ')
                            .setDescription('削除完了');

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
                            embeds: [send]
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
                                embeds: [send]
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
                                url: playlist.url
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
                                url: movie.videoDetails.video_url
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
                            embeds: [send]
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
                await logger.info(message.guild?.id, 'received-command/mode', `missing channel`);
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
        case 'room': {
            if (content.length <= 0) {
                // 初期名(お部屋: #NUM)に変更
                const guild = message.guild;
                if (!guild) {
                    return;
                }
                const channelLength = guild.channels.cache.filter((c) => c.name.includes('お部屋:')).size + 1;
                const roomName = `お部屋: #${('000' + channelLength).slice(-3)}`;

                const vc = message.member?.voice.channel;

                if (!vc) {
                    const send = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle(`エラー`)
                        .setDescription(`ボイスチャンネルに入ってから使ってね`);

                    message.reply({ embeds: [send] });
                    return;
                }

                await vc.setName(roomName, '部屋名変更: ' + message.author.username);
                message.reply(`お部屋の名前を${roomName}に変更したよ！`);
                return;
            }
            await DotBotFunctions.Room.changeRoomName(message, content.join(' '));
            break;
        }
        case 'seek': {
            if (content.length <= 0) {
                const send = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(`エラー`)
                    .setDescription(`時間を指定してください`);

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
        case 'popup-rule': {
            const channel = message.channel;
            if (channel) {
                const send = new EmbedBuilder()
                    .setColor('#ffcc00')
                    .setTitle(`ルールを読んだ`)
                    .setDescription('リアクションをすると全ての機能が使えるようになります');
                const result = await channel?.send({ embeds: [send] });
                result.react('✅');
            }
            const m = await channel.send('pop-up success.');
            await m.delete();
            break;
        }
        case 'add-role-all': {
            const members = await message.guild?.members.fetch();
            if (!members) {
                break;
            }
            members.map(async (m) => {
                if (m.user.bot) {
                    return;
                }
                const userRepository = new UsersRepository();
                const user = await userRepository.get(m.id);
                if (!user) {
                    await userRepository.save({ id: m.id, user_name: m.user.username });
                }
                if (m.roles.cache.has(CONFIG.DISCORD.MEMBER_ROLE_ID)) {
                    return;
                }
                await m.roles.add(CONFIG.DISCORD.MEMBER_ROLE_ID);
            });
            await message.reply('add roles to all members.');
            break;
        }
        case 'restart': {
            throw new Error('再起動');
        }
    }
}

export async function interactionSelector(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const { commandName } = interaction;

    switch (commandName) {
        case 'ping': {
            await interaction.reply('Pong!');
            break;
        }
        case 'debug': {
            const url = interaction.options.getString('url');
            await logger.info('system', 'received command', `${url}`);
            await interaction.reply('test.');
            break;
        }
        case 'gacha': {
            await logger.info(interaction.guildId ?? undefined, 'received-command/gacha', `${interaction}`);
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
            await BotFunctions.Chat.talk(interaction, text, ChatGPTModel.GPT_3_16K);
            break;
        }
        case 'g4': {
            if (!isEnableFunction(functionNames.GPT) || !isEnableFunction(functionNames.ENABLE_GPT4)) {
                const send = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(`エラー`)
                    .setDescription(`機能が有効化されていません。`);

                interaction.reply({ content: `機能が有効化されてないよ！(ENABLE_GPT4)`, embeds: [send] });
                return;
            }
            await interaction.deferReply();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const text = interaction.options.getString('text')!;
            await BotFunctions.Chat.talk(interaction, text, ChatGPTModel.GPT_4);
            break;
        }
        case 'erase': {
            const last = interaction.options.getBoolean('last') ?? undefined;
            await BotFunctions.Chat.deleteChatData(interaction, last);
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
 * デバッグ用コマンドです.
 * 通常は使用しなくても良い.
 * @param message 受け取ったメッセージング情報
 * @param args 引数
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function debug(message: Message, args?: string[]) {
    const channel = message.member?.voice.channel as VoiceBasedChannel;
    await DotBotFunctions.Music.playMusic(channel);
}

/**
 * 現在の言語、コマンドを表示する
 * @param message
 */
export async function help(message: Message) {
    message.reply(HELP_COMMANDS);
    return;
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

    await DotBotFunctions.Music.extermAudioPlayer(message.guild.id);
}
