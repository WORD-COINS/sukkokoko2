import { BotName, ChannelName } from "./types";
import { validateNonNullableObject } from "./utils";

export type Env = {
  botToken: string;
  userToken: string;
  channelName: ChannelName;
  botName: BotName;
};

export const getEnv = (): Env => {
  const botToken = process.env.SLACK_BOT_TOKEN;
  const userToken = process.env.SLACK_USER_TOKEN;
  const channelName = process.env.CHANNEL_NAME as ChannelName | undefined;
  const botName = process.env.BOT_NAME as BotName | undefined;

  const env = { botToken, userToken, channelName, botName };
  if (!validateNonNullableObject(env)) {
    throw new Error("Not found some environment variables.");
  }
  return env;
};
