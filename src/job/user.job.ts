import { Logger } from '../common/logger.js';
import { DISCORD_CLIENT } from '../constant/constants.js';
import { UsersRepository } from '../model/repository/usersRepository.js';
import { LogLevel } from '../type/types.js';

export class UserJob {
  private readonly logger = new Logger();

  constructor() {
    this.logger = new Logger();
  }

  async execute() {
    Logger.put({
      guild_id: undefined,
      channel_id: undefined,
      user_id: undefined,
      level: LogLevel.INFO,
      event: 'UserJob: execute',
      message: undefined,
    });

    const repository = new UsersRepository();

    DISCORD_CLIENT.guilds.cache.forEach(async (guild) => {
      const members = await guild.members.fetch();
      members.forEach(async (member) => {
        const user = await repository.get(guild.id, member.id);
        if (!user) {
          return;
        }
        user.user_name = member.displayName;
        if (user.pick_left < 30) {
          user.pick_left += 10;
        }
        await repository.save(user);
      });
    });
  }
}
