import { Client } from 'discord.js';

// 連携できるbot
export const COORDINATION_ID = ['985704725016105000'];

// Client
export const DISCORD_CLIENT = new Client({
    partials: ['CHANNEL'],
    intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES', 'GUILD_VOICE_STATES']
});
