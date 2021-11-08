import { App } from "@slack/bolt";
import * as slackUtils from "./slack-utils";
import * as chatspeed from "./chat-speed";
import { ChannelID, ChannelName } from "./types";
import { validateNonNullableObject } from "./utils";

type Env = {
  token: string;
  signingSecret: string;
  userToken: string;
  channelName: string;
  botName: string;
};

const getEnv = (): Env => {
  const token = process.env.SLACK_BOT_TOKEN;
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  const userToken = process.env.SLACK_USER_TOKEN;
  const channelName = process.env.CHANNEL_NAME;
  const botName = process.env.BOT_NAME;

  const env = { token, signingSecret, userToken, channelName, botName };
  if (!validateNonNullableObject(env)) {
    throw new Error("Not found some environment variables.");
  }
  return env;
};

const main = async (env: Env) => {
  const { token, signingSecret, userToken, channelName, botName } = env;

  const app = new App({
    token,
    signingSecret,
  });

  const channelId = await (async () => {
    const [, channelNameMap] = await slackUtils.getChannelInformation(
      app.client
    );

    const channel = channelNameMap.get(channelName as ChannelName);
    if (channel == null) {
      throw new Error("Not found post channel");
    }
    const channelId = channel.id as ChannelID | undefined;
    if (channelId == null) {
      throw new Error("channelId couldn't be get");
    }

    return channelId;
  })();

  await chatspeed.postChatSpeed(
    app.client,
    channelId,
    userToken,
    signingSecret,
    botName
  );
};

main(getEnv());
