import { WebClient } from "@slack/web-api";
import { Channel } from "@slack/web-api/dist/response/ConversationsListResponse";
import { Member } from "@slack/web-api/dist/response/UsersListResponse";
import { BotID, BotName, ChannelID, ChannelName } from "./types";

// channel情報をマップにして返す関数
// IDがキーのマップとnameがキーのマップの2つ
const getChannelInformation = async (
  client: WebClient
): Promise<[Map<ChannelID, Channel>, Map<ChannelName, Channel>]> => {
  const channels = (await client.conversations.list()).channels;

  const channelIdMap = new Map<ChannelID, Channel>(); // channel情報をIDで引けるようにしたマップ
  channels?.forEach((channel) => {
    const id = channel.id as ChannelID | undefined;
    if (id == null) {
      throw new Error("channelId couldn't be get");
    }
    channelIdMap.set(id, channel);
  });

  const channelNameMap = new Map<ChannelName, Channel>(); // channel情報をnameで引けるようにしたマップ
  channels?.forEach((channel) => {
    const name = channel.name as ChannelName | undefined;
    if (name == null) {
      throw new Error("channelName could'nt be get");
    }

    channelNameMap.set(name, channel);
  });

  return [channelIdMap, channelNameMap];
};

export const getChannelIdFromChannelName = async (
  client: WebClient,
  channelName: ChannelName
): Promise<ChannelID> => {
  const [, channelNameMap] = await getChannelInformation(client);

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

// ボットの情報を取ってくる関数
const getBotInfo = async (
  client: WebClient,
  botName: string
): Promise<Member | undefined> => {
  const usersList = await client.users.list();
  if (usersList.members == null) {
    return undefined;
  }

  for (let i = 0; i < usersList.members.length; i++) {
    if (usersList.members[i].name === botName) {
      return usersList.members[i];
    }
  }
  return undefined;
};

export const getChannelId = (channel: Channel): ChannelID => {
  const channelId = channel.id as ChannelID | undefined;
  if (channelId == null) {
    throw new Error("channelId couldn't be get");
  }
  return channelId;
};

export const getBotIdFromBotName = async (
  botClient: WebClient,
  botName: BotName
): Promise<BotID> => {
  const botInfo = await getBotInfo(botClient, botName);
  if (botInfo == null) {
    throw new Error("botInfo couldn't be get");
  }

  const botId = botInfo.id as BotID | undefined;
  if (botId == null) {
    throw new Error("botId couldn't be get");
  }

  return botId;
};

export const getAllChannels = async (
  botClient: WebClient
): Promise<Channel[]> => {
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

// 主にbotをchannel IDにinviteする関数
const inviteChannel = async (
  client: WebClient,
  channel: ChannelID,
  users: string
): Promise<void> => {
  await client.conversations.invite({
    users,
    channel,
  });
};

// もしボットが入っていないパブリックチャンネルがあったら参加する
export const joinToNotInChannels = async (
  client: WebClient,
  channel: Channel,
  botId: BotID
): Promise<Channel> => {
  if (!channel.is_member) {
    console.log(`invite bot to ${channel.name}`);
    await inviteChannel(client, getChannelId(channel), botId);
  }

  return channel;
};
