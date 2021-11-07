import { WebClient } from "@slack/web-api";
import { Channel } from "@slack/web-api/dist/response/ConversationsListResponse";
import * as utils from "./slack-utils";
import type { ChannelID } from "./types";

// IDで指定されたchannelの24時間以内のpost数を集計する
const getNumberOfDayPost = async (
  client: WebClient,
  token: string,
  channel: ChannelID
) => {
  const unixDayTime = 1000 * 60 * 60 * 24;
  const current = new Date();
  const yesterday = new Date(current.valueOf() - unixDayTime).getTime() / 1000;
  const oldest = yesterday.toString();

  const result = await client.conversations.history({
    token,
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

// 指定されたチャンネルのIDと流速のペアをソートして返す
const getChannelNumberOfPost = async (
  channel: Channel,
  client: WebClient,
  slackBotToken: string,
  slackUserToken: string,
  signingSecret: string,
  botId: string
) => {
  const channelId = channel.id as ChannelID | undefined;
  if (channelId == null) {
    throw new Error("channeId couldn't be get");
  }

  if (channel.is_archived) {
    console.log(`${channel.name} has been archived`);
    return { channel: channelId, numberOfPost: 0 };
  }

  // もしボットが入っていないパブリックチャンネルがあったら参加する
  if (!channel.is_member) {
    console.log(`invite bot to ${channel.name}`);
    await utils.inviteChannel(channelId, botId, slackUserToken, signingSecret);
  }

  const channelObject = await getNumberOfDayPost(
    client,
    slackBotToken,
    channelId
  );
  return channelObject;
};

// 全てのチャンネルのIDと流速のペアをソートして返す
const getAllChannelsNumberOfPost = async (
  client: WebClient,
  slackBotToken: string,
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

  const botInfo = await utils.getBotInfo(client, slackBotToken, botName);
  if (botInfo == null) {
    throw new Error("botInfo couldn't be get");
  }

  const botId = botInfo.id;
  if (botId == null) {
    throw new Error("botId couldn't be get");
  }

  const numberOfPostPromises = channels.map((channel) =>
    getChannelNumberOfPost(
      channel,
      client,
      slackBotToken,
      slackUserToken,
      signingSecret,
      botId
    )
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
  slackBotToken: string,
  channel: ChannelID,
  slackUserToken: string,
  signingSecret: string,
  botName: string
) => {
  console.log("aggregate chat speed");
  const channelArray = await getAllChannelsNumberOfPost(
    client,
    slackBotToken,
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
    slackBotToken,
    channel,
    text,
  });
};
