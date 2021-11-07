import { App } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { Channel } from "@slack/web-api/dist/response/AdminUsergroupsListChannelsResponse";
import { ChannelID, ChannelName } from "./types";
import { hasProperty } from "./utils";

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
export const inviteChannel = async (channel: ChannelID, users: string) => {
  try {
    const appUser = new App({
      token: process.env.SLACK_USER_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
    });
    await appUser.client.conversations.invite({
      token: process.env.SLACK_USER_TOKEN,
      channel,
      users,
    });
  } catch (error) {
    if (
      hasProperty(error, "data") &&
      hasProperty(error.data, "error") &&
      error.data.error !== "already_in_channel" &&
      error.data.error !== "is_archived"
    )
      console.error(error);
  }
};

// ボットの情報を取ってくる関数
export const getBotInfo = async (
  client: WebClient,
  token: string,
  botName: string
) => {
  try {
    const usersList = await client.users.list({ token });
    if (usersList.members == null) {
      return undefined;
    }

    let botInfo = undefined;
    for (let i = 0; i < usersList.members.length; i++) {
      if (usersList.members[i].name === botName) {
        botInfo = usersList.members[i];
      }
    }
    return botInfo;
  } catch (error) {
    return undefined;
  }
};

// channel内にボットが参加しているか判定する関数
export const isBotJoined = async (
  client: WebClient,
  token: string,
  channel: ChannelID,
  botId: string
) => {
  try {
    const members = await client.conversations.members({
      token,
      channel,
    });
    members.members?.forEach((userId) => {
      if (userId === botId) return true;
    });
    return false;
  } catch (error) {
    console.error(error);
    return undefined;
  }
};
