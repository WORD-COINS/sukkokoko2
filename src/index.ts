import { WebClient } from "@slack/web-api";
import * as slackUtils from "./slack-utils";
import * as chatspeed from "./chat-speed-aggregation";
import { BotName, ChannelName } from "./types";
import { validateNonNullableObject } from "./utils";
import { buildMessage } from "./message";

type Env = {
  botToken: string;
  userToken: string;
  channelName: string;
  botName: string;
};

const getEnv = (): Env => {
  const botToken = process.env.SLACK_BOT_TOKEN;
  const userToken = process.env.SLACK_USER_TOKEN;
  const channelName = process.env.CHANNEL_NAME;
  const botName = process.env.BOT_NAME;

  const env = { botToken, userToken, channelName, botName };
  if (!validateNonNullableObject(env)) {
    throw new Error("Not found some environment variables.");
  }
  return env;
};

const main = async (env: Env): Promise<void> => {
  const { botToken, userToken, channelName, botName } = env;

  const botClient = new WebClient(botToken);
  const userClient = new WebClient(userToken);

  const postTargetChannelId = await slackUtils.getChannelIdFromChannelName(
    botClient,
    channelName as ChannelName
  );
  const botId = await slackUtils.getBotIdFromBotName(
    botClient,
    botName as BotName
  );
  const allChannels = await slackUtils.getAllChannels(botClient);
  const channelsWithoutArchived = allChannels.filter(
    (channel) => !channel.is_archived
  );
  const channels = channelsWithoutArchived.map((channel) =>
    slackUtils.joinToNotInChannels(userClient, channel, botId)
  );

  console.log("aggregate chat speed");
  const numberOfPostPromises = channels
    .map(async (channel) => slackUtils.getChannelId(await channel))
    .map(async (id) => chatspeed.aggregateNumberOfPost(botClient, await id));
  const numberOfPost = await Promise.all(numberOfPostPromises);
  const results = numberOfPost
    .filter((channelObject) => channelObject.numberOfPost !== 0)
    .sort((a, b) => {
      return b.numberOfPost - a.numberOfPost;
    });

  console.log("make message");
  const text = buildMessage(results);
  console.log(text);

  console.log("post chat speed log");
  await botClient.chat.postMessage({
    channel: postTargetChannelId,
    text,
  });
};

main(getEnv());
