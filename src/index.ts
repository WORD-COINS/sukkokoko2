import { App } from "@slack/bolt";
import * as slackUtils from "./slack-utils";
import * as chatspeed from "./chat-speed";
import { ChannelID, ChannelName } from "./types";
import { validateNonNullableObject } from "./utils";

type Env = {
  token: string;
  signingSecret: string;
  channelName: string;
  botName: string;
};

const getEnv = (): Env => {
  const token = process.env.SLACK_BOT_TOKEN;
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  const channelName = process.env.CHANNEL_NAME;
  const botName = process.env.BOT_NAME;

  const env = { token, signingSecret, channelName, botName };
  if (!validateNonNullableObject(env)) {
    throw new Error("Not found some environment variables.");
  }
  return env;
};

const main = async (env: Env) => {
  const { token, signingSecret, channelName } = env;

  const app = new App({
    token,
    signingSecret,
  });

  const [, channelNameMap] = await slackUtils.getChannelInformation(app.client);

  const channel = channelNameMap.get(channelName as ChannelName);
  if (channel == null) {
    throw new Error("Not found post channel");
  }
  const channelId = channel.id as ChannelID | undefined;
  if (channelId == null) {
    throw new Error("channelId couldn't be get");
  }

  chatspeed.postChatSpeed(app.client, token, channelId, env.botName);

  console.log("⚡️ Bolt app is running!");
};

main(getEnv());
