import { WebClient } from "@slack/web-api";
import * as utils from "./slack-utils";
import type { ChannelID } from "./types";

// IDで指定されたchannelの24時間以内のpost数を集計する
const getNumberOfDayPost = async (client: WebClient, channel: ChannelID) => {
  const unixDayTime = 1000 * 60 * 60 * 24;
  const current = new Date();
  const yesterday = new Date(current.valueOf() - unixDayTime).getTime() / 1000;
  const oldest = yesterday.toString();

  const result = await client.conversations.history({
    channel,
    oldest,
    limit: 500,
  });

  const messages = result.messages || [];
  const numberOfPost = messages.length;
  return {
    channel,
    numberOfPost,
  };
};

// 全てのチャンネルのIDと流速のペアをソートして返す
const getAllChannelsNumberOfPost = async (
  client: WebClient,
  slackUserToken: string,
  signingSecret: string,
  botName: string
) => {
  const channels = (
    await client.conversations.list({
      limit: 500,
    })
  ).channels;
  if (channels == null) {
    throw new Error("channels couldn't be get");
  }

  const botInfo = await utils.getBotInfo(client, botName);
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
  const joinedChannels = channelsWithoutArchived.map(async (channel) => {
    if (!channel.is_member) {
      console.log(`invite bot to ${channel.name}`);
      await utils.inviteChannel(
        utils.getChannelId(channel),
        botId,
        slackUserToken,
        signingSecret
      );
    }

    return channel;
  });

  const numberOfPostPromises = joinedChannels.map(async (channel) =>
    getNumberOfDayPost(client, utils.getChannelId(await channel))
  );

  const numberOfPost = await Promise.all(numberOfPostPromises);

  return numberOfPost
    .filter((channelObject) => channelObject.numberOfPost !== 0)
    .sort((a, b) => {
      return b.numberOfPost - a.numberOfPost;
    });
};

// 過去24時間の流速をchannelに投稿
export const postChatSpeed = async (
  client: WebClient,
  channel: ChannelID,
  slackUserToken: string,
  signingSecret: string,
  botName: string
) => {
  console.log("aggregate chat speed");
  const channelArray = await getAllChannelsNumberOfPost(
    client,
    slackUserToken,
    signingSecret,
    botName
  );

  console.log("make message");
  let text = "*⏱本日の 流速強さ ランキング (575)🏃‍♂️🏃‍♂️🏃‍♂️*\n";
  for (let i = 0; i < channelArray.length; i++) {
    const s = `<#${channelArray[i].channel}>:\t${channelArray[i].numberOfPost}\n`;
    text += s;
  }
  console.log(text);

  console.log("post chat speed log");
  await client.chat.postMessage({
    channel,
    text,
  });
};
