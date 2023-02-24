import { Message, EmbedBuilder, VoiceBasedChannel } from 'discord.js';
import ytdl from 'ytdl-core';
import * as BotFunctions from './function';
import { PlaylistRepository } from '../model/repository/playlistRepository';
import ytpl from 'ytpl';
import * as logger from '../common/logger';
import { GachaRepository } from '../model/repository/gachaRepository';
import { ItemRepository } from '../model/repository/itemRepository';

/**
 * 渡されたコマンドから処理を実行する
 *
 * @param command 渡されたメッセージ
 */
export async function commandSelector(message: Message) {
    const content = message.content.replace('.', '').trimEnd().split(' ');
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
        case 'dice': {
            await BotFunctions.Dice.roll(message, content);
            break;
        }
        case 'tenki': {
            await BotFunctions.Forecast.weather(message, content);
            break;
        }
        case 'luck': {
            await BotFunctions.Gacha.pickOmikuji(message, content);
            break;
        }
        case 'gacha': {
            await BotFunctions.Gacha.pickGacha(message, content);
            break;
        }
        case 'g': {
            await BotFunctions.Gacha.pickGacha(message, content);
            break;
        }
        case 'give': {
            const uid = content[0];
            const iid = Number(content[1]);

            await BotFunctions.Gacha.givePresent(message, uid, iid);
            break;
        }
        case 'celo': {
            await BotFunctions.Dice.celo(message);
            break;
        }
        case 'celovs': {
            await BotFunctions.Dice.celovs(message);
            break;
        }
        /**
         * 音楽をキューに追加する.
         */
        case 'play':
        case 'pl': {
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

                await BotFunctions.Music.add(channel, url, message.author.id);
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
            await BotFunctions.Music.pause(gid);
            break;
        }
        case 'list': {
            if (!content || content.length === 0) {
                const playlists = await BotFunctions.Music.getPlaylist(message.author.id);

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
                        const deleted = await BotFunctions.Music.removePlaylist(message.author.id, name);

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

            await BotFunctions.Music.changeNotify(channel);
            break;
        }
        case 'mode': {
            const name = content[0];
            const channel = message.member?.voice.channel;
            if (!channel) {
                logger.info(message.guild?.id, 'received-command/mode', `missing channel`);
                return;
            }
            if (!name) {
                await BotFunctions.Music.getPlayerInfo(channel);
                return;
            }

            await BotFunctions.Music.editPlayerInfo(channel, name);
            break;
        }
        case 'shuffle':
        case 'sf': {
            await shuffle(message);
            break;
        }
        case 'reg': {
            await BotFunctions.Register.save(message, content);
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
                await BotFunctions.Room.team(message, number, content[1] != undefined);
            }
            break;
        }
        case 'room': {
            if (content.length <= 0) {
                const send = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(`エラー`)
                    .setDescription(`変更したいルーム名を入れてね`);

                message.reply({ embeds: [send] });
                return;
            }
            await BotFunctions.Room.changeRoomName(message, content.join(' '));
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

            await BotFunctions.Music.seek(channel, seek);
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
            const item = BotFunctions.Dice.choose(content);
            const send = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle(`選択結果: ${item}`)
                .setDescription(`選択肢: ${content.join(', ')}`);

            message.reply({ embeds: [send] });
            break;
        }
        case 'restart': {
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
 * デバッグ用コマンドです.
 * 通常は使用しなくても良い.
 * @param message 受け取ったメッセージング情報
 * @param args 引数
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function debug(message: Message, args?: string[]) {
    const channel = message.member?.voice.channel as VoiceBasedChannel;
    await BotFunctions.Music.playMusic(channel);
}

/**
 * 現在の言語、コマンドを表示する
 * @param message
 */
export async function help(message: Message) {
    const res: string[] = [];
    res.push(`今動いている言語は[TypeScript]版だよ！\n`);
    res.push('コマンドはここだよ～！');
    res.push('```');
    res.push('===== 便利コマンド系 =====');
    res.push(' * .tenki [地域] [?日数]');
    res.push('   > 天気予報を取得する');
    res.push('   > 指定した地域の天気予報を取得します');
    res.push('   > 日数を指定するとその日数後の天気予報を取得します(6日後まで)');
    res.push(' * .dice [ダイスの振る数] [ダイスの面の数]');
    res.push('   > サイコロを振る (例: [.dice 5 6] (6面体ダイスを5個振る))');
    res.push(' * .choose [選択肢1] [選択肢2]... / .choice ... / .ch ...');
    res.push('   > 選択肢からランダムに選ぶ');
    res.push('   > 選択肢をスペース区切りで入力するとランダムに選んでくれるよ');
    res.push('===== みかんちゃんと遊ぶ系 =====');
    res.push(' * .luck [?運勢]');
    res.push('   > おみくじを引く');
    res.push('     運勢を指定するとその運勢が出るまで引きます');
    res.push(' * .gacha [?回数 or limit] | .g [?回数 or l]');
    res.push('   > 10連ガチャを引く');
    res.push('     回数を指定するとその回数回します');
    res.push('     limitを指定するとガチャの上限まで引きます');
    res.push(' * .celovs');
    res.push('   > チンチロリンで遊ぶ');
    res.push('     みかんちゃんとチンチロリンで遊べます');
    res.push('     3回まで投げて出た目で勝負します');
    res.push('===== お部屋管理系 =====');
    res.push(' * .team [チーム数] [?move]');
    res.push('   > チーム分けを行います');
    res.push('    moveを指定するとチーム分け後にメンバーを移動します');
    res.push(' * .room [名前]');
    res.push('   > お部屋の名前を変更します');
    res.push('===== れもんちゃん系 =====');
    res.push(' * .speak [ボイス番号] [?速度]');
    res.push('   > 読み上げを開始します');
    res.push('    読み上げ番号は`http://rim-linq.net:4044/speakers`で確認できます');
    res.push('    速度は(0.1 - 5.0 | 整数可)で指定できます');
    res.push(' * .discon');
    res.push('   > 読み上げを終了します');
    res.push('===== 音楽再生系 =====');
    res.push(' * .play [URL] / .pl [URL]');
    res.push('   > Youtube の音楽を再生します. プレイリストも可能');
    res.push(' * .interrupt [URL] | .pi [URL]');
    res.push('   > 曲を1番目に割り込んで予約する');
    res.push(' * .interrupt [予約番号] | .pi [予約番号]');
    res.push('   > 予約番号の曲を1番目に割り込んで予約する');
    res.push(' * .stop | .st');
    res.push('   > 現在再生中の音楽を止める(次がある場合は次を再生する)');
    res.push(' * .shuffle | .sf');
    res.push('   > 現在のキューの音楽をシャッフルする');
    res.push(' * .rem [予約番号] | .rm [予約番号]');
    res.push('   > 予約している曲を削除する');
    res.push(' * .rem all | .rm all');
    res.push('   > 予約している曲を全て削除し、音楽再生を中止する');
    res.push(' * .silent | .si');
    res.push('   > 音楽再生の通知を切り替えます');
    res.push('   > offの場合は次の曲に変わっても通知しなくなりますが, 自動シャッフル時にのみ通知されます');
    res.push('===== プレイリスト系 =====');
    res.push(' * .list');
    res.push('   > 登録されているプレイリストの一覧を表示します');
    res.push(' * .list add [名前] [URL]');
    res.push('   > プレイリストを登録します');
    res.push(' * .list rem [名前] | .list rm [名前]');
    res.push('   > プレイリストを削除します');
    res.push(' * .list loop [名前] [on | off] | .list lp [名前] [on | off]');
    res.push('   > 対象プレイリストのループ処理を書き換えます');
    res.push(' * .list shuffle [名前] [on | off] | .list sf [名前] [on | off]');
    res.push('   > 対象プレイリストの自動シャッフル処理を書き換えます');
    res.push('```');
    message.reply(res.join('\n'));
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

    await BotFunctions.Music.add(channel, url, message.author.id);
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
    await BotFunctions.Music.stopMusic(channel);
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
    await BotFunctions.Music.removeId(channel, channel.guild.id, num);
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

    if (num !== undefined) {
        await BotFunctions.Music.interruptIndex(channel, num);
        return;
    }

    if (!ytdl.validateURL(args[0])) {
        const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`URLが不正`);

        message.reply({ content: `YoutubeのURLを指定して～！`, embeds: [send] });
        return;
    }

    await BotFunctions.Music.interruptMusic(channel, url);
}

export async function queue(message: Message) {
    const channel = message.member?.voice.channel;
    if (!channel) {
        return;
    }
    await BotFunctions.Music.showQueue(channel);
    return;
}

export async function shuffle(message: Message) {
    const channel = message.member?.voice.channel;
    if (!channel) {
        return;
    }
    BotFunctions.Music.shuffleMusic(channel);
}

export async function exterm(message: Message) {
    if (!message.guild?.id) {
        return;
    }

    await BotFunctions.Music.extermAudioPlayer(message.guild.id);
}
