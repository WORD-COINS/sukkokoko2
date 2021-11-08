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

  const botApp = new App({
    token,
    signingSecret,
  });
  const botClient =  botApp.client;

  const postTargetChannelId = await (async () => {
    const [, channelNameMap] = await slackUtils.getChannelInformation(
      botClient
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

  const channels = await (async () => {
    const channels = (
      await botClient.conversations.list({
        limit: 500,
      })
    ).channels;
    if (channels == null) {
      throw new Error("channels couldn't be get");
    }

    const botInfo = await slackUtils.getBotInfo(botClient, botName);
    if (botInfo == null) {
      throw new Error("botInfo couldn't be get");
    }

    const botId = botInfo.id;
    if (botId == null) {
      throw new Error("botId couldn't be get");
    }

    const channelsWithoutArchived = channels.filter(
      (channel) => !channel.is_archived
    );

    // もしボットが入っていないパブリックチャンネルがあったら参加する
    return channelsWithoutArchived.map(async (channel) => {
      if (!channel.is_member) {
        console.log(`invite bot to ${channel.name}`);
        await slackUtils.inviteChannel(
          slackUtils.getChannelId(channel),
          botId,
          userToken,
          signingSecret
        );
      }

      return channel;
    });
  })();

  await chatspeed.postChatSpeed(
    botClient,
    postTargetChannelId,
    channels
  );
};

main(getEnv());
