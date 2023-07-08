import { WebClient } from "@slack/web-api";
import { Env, getEnv } from "./env";
import * as slackUtils from "./slack-utils";
import * as chatspeed from "./chat-speed-aggregation";
import { buildMessage } from "./message";

const main = async (env: Env): Promise<void> => {
  const { botToken, userToken, channelName, botName } = env;

  const botClient = new WebClient(botToken);
  const userClient = new WebClient(userToken);

  const postTargetChannelId = await slackUtils.getChannelIdFromChannelName(
    botClient,
    channelName,
  );
  const botId = await slackUtils.getBotIdFromBotName(botClient, botName);
  const allChannels = await slackUtils.getAllChannels(botClient);
  const channelsWithoutArchived = allChannels.filter(
    (channel) => !channel.is_archived,
  );
  const channels = channelsWithoutArchived.map((channel) =>
    slackUtils.joinToNotInChannels(userClient, channel, botId),
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
