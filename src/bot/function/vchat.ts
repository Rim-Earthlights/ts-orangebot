/**
 * TODO: 仮実装
 */

import { createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, EndBehaviorType, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import dayjs from "dayjs";
import { CacheType, ChannelType, ChatInputCommandInteraction } from "discord.js";
import prism from "prism-media";
import { Stream } from "stream";
import WebSocket from "ws";
import { getOpenAIToken } from "../../controller/sessionRouter.js";

export const vcClients: { guildId: string, userId: string, ws: WebSocket, connection: VoiceConnection, eventId: string | null }[] = [];

/**
 * AIと通話する
 * @param interaction
 */
export async function vchat(interaction: ChatInputCommandInteraction<CacheType>) {
}


export async function initVc(interaction: ChatInputCommandInteraction<CacheType>) {
  if (interaction.guild == null) {
    await interaction.editReply({ content: 'サーバーで使ってね！' });
    return;
  }

  const channel = interaction.channel;

  if (!channel || channel.type !== ChannelType.GuildVoice) {
    await interaction.editReply({ content: 'ボイスチャンネルに入ってから使ってね！' });
    return;
  }

  const session = await getOpenAIToken();

  const model = "gpt-4o-mini-realtime-preview-2024-12-17";
  // Connect WebSocket
  const ws = new WebSocket(
    `wss://api.openai.com/v1/realtime?model=${model}`, {
    headers: {
      'Authorization': `Bearer ${session.client_secret.value}`,
      'Content-Type': 'application/json',
      'openai-beta': 'realtime=v1',
    },
  });

  ws.on('open', () => {
    console.log('WebSocket connected');
  });

  ws.on('message', handleEvent);

  ws.on('error', (error) => {
    console.error('WebSocket error', error);
  });

  ws.on('close', () => {
    console.log('WebSocket closed');
  });

  const connection = joinVoiceChannel({
    adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
    channelId: channel.id,
    guildId: channel.guild.id,
    selfDeaf: false,
    selfMute: false,
  });

  const index = vcClients.push({ guildId: channel.guild.id, userId: interaction.user.id, ws, connection: connection, eventId: dayjs().format('event_YYYYMMDDHHmmss_SSS') });
  const client = vcClients[index - 1];


  connection.subscribe(createAudioPlayer());

  connection.receiver.speaking.on('start', (userId) => {
    if (client == null) return;

    if (userId === client.userId) {
      console.log('speaking start', userId);
      const audio = connection.receiver.subscribe(userId, { end: { behavior: EndBehaviorType.AfterSilence, duration: 500 } });
      const passThrough = new Stream.PassThrough();
      audio.pipe(new prism.opus.Decoder({ rate: 24000, channels: 1, frameSize: 120 })).pipe(passThrough);
      audio.on('end', async () => {
        console.log('speaking end', userId);
        audioBufferAppend(client.ws, passThrough.read());

        const p = createAudioPlayer();
        client.connection.subscribe(p);
        const resource = createAudioResource(passThrough.pipe(new prism.opus.Encoder({ rate: 24000, channels: 1, frameSize: 120 })));
        p.play(resource);
        audio.destroy();
      });
    }
  })

  interaction.editReply({ content: '参加' });
};

export function closeVc(guildId: string) {
  const index = vcClients.findIndex(client => client.guildId === guildId);
  if (index !== -1) {
    vcClients[index].connection.destroy();
    vcClients[index].ws.close();
    vcClients.splice(index, 1);
  }
}

function audioBufferAppend(ws: WebSocket, buffer: Buffer) {
  const event = {
    type: 'input_audio_buffer.append',
    audio: buffer.toString('base64'),
  }
  ws.send(JSON.stringify(event));
  ws.send(JSON.stringify({
    type: 'input_audio_buffer.commit',
  }));
}

function handleEvent(event: Buffer) {
  const data = JSON.parse(event.toString());

  switch (data.type) {
    case 'conversation.item.created': {
      console.dir(data, { depth: null });
      break;
    }
    default: {
      console.log(data);
    }
  }
}
