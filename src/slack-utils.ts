import { App } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { Channel } from "@slack/web-api/dist/response/ConversationsListResponse";
import { ChannelID, ChannelName } from "./types";

// channel情報をマップにして返す関数
// IDがキーのマップとnameがキーのマップの2つ
export const getChannelInformation = async (
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

// 主にbotをchannel IDにinviteする関数
export const inviteChannel = async (
  channel: ChannelID,
  users: string,
  slackUserToken: string,
  signingSecret: string
) => {
  const appUser = new App({
    token: slackUserToken,
    signingSecret,
  });
  await appUser.client.conversations.invite({
    token: slackUserToken,
    users,
    channel,
  });
};

// ボットの情報を取ってくる関数
export const getBotInfo = async (client: WebClient, botName: string) => {
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
