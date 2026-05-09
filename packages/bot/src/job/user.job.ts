import { Logger } from '../common/logger.js';
import { DISCORD_CLIENT } from '../constant/constants.js';
import { ModelType } from "@orangebot/shared";
import { UsersRepository } from "@orangebot/shared";
import { LogLevel } from "@orangebot/shared";

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
        const userSetting = await repository.getUserSetting(member.id);
        if (!user || !userSetting) {
          return;
        }
        user.user_name = member.displayName;
        userSetting.model_type = ModelType.DEFAULT;
        if (user.pick_left < 30) {
          user.pick_left += 10;
        }
        await repository.save(user);
        await repository.saveUserSetting(userSetting);
      });
    });
  }
}
