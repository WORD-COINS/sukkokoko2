import { WebClient } from "@slack/web-api";
import * as slackUtils from "./slack-utils";
import * as chatspeed from "./chat-speed-aggregation";
import { BotID, BotName, ChannelID, ChannelName } from "./types";
import { validateNonNullableObject } from "./utils";
import { Channel } from "@slack/web-api/dist/response/ConversationsListResponse";
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

const getChannelIdFromChannelName = async (
  client: WebClient,
  channelName: ChannelName
): Promise<ChannelID> => {
  const [, channelNameMap] = await slackUtils.getChannelInformation(client);

  const channel = channelNameMap.get(channelName);
  if (channel == null) {
    throw new Error("Not found post channel");
  }
  const channelId = channel.id as ChannelID | undefined;
  if (channelId == null) {
    throw new Error("channelId couldn't be get");
  }

  return channelId;
};

const getBotIdFromBotName = async (
  botClient: WebClient,
  botName: BotName
): Promise<BotID> => {
  const botInfo = await slackUtils.getBotInfo(botClient, botName);
  if (botInfo == null) {
    throw new Error("botInfo couldn't be get");
  }

  const botId = botInfo.id as BotID | undefined;
  if (botId == null) {
    throw new Error("botId couldn't be get");
  }

  return botId;
};

const getAllChannels = async (botClient: WebClient): Promise<Channel[]> => {
  const channels = (
    await botClient.conversations.list({
      limit: 500,
    })
  ).channels;
  if (channels == null) {
    throw new Error("channels couldn't be get");
  }
  return channels;
};

// もしボットが入っていないパブリックチャンネルがあったら参加する
const joinToNotInChannels = (
  client: WebClient,
  channels: Channel[],
  botId: BotID
): Promise<Channel>[] => {
  return channels.map(async (channel) => {
    if (!channel.is_member) {
      console.log(`invite bot to ${channel.name}`);
      await slackUtils.inviteChannel(
        client,
        slackUtils.getChannelId(channel),
        botId
      );
    }

    return channel;
  });
};

const main = async (env: Env): Promise<void> => {
  const { botToken, userToken, channelName, botName } = env;

  const botClient = new WebClient(botToken);
  const userClient = new WebClient(userToken);

  const postTargetChannelId = await getChannelIdFromChannelName(
    botClient,
    channelName as ChannelName
  );
  const botId = await getBotIdFromBotName(botClient, botName as BotName);
  const allChannels = await getAllChannels(botClient);
  const channelsWithoutArchived = allChannels.filter(
    (channel) => !channel.is_archived
  );
  const channels = await joinToNotInChannels(
    userClient,
    channelsWithoutArchived,
    botId
  );

  console.log("aggregate chat speed");
  const results = await chatspeed.aggregateNumberOfPost(botClient, channels);

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
