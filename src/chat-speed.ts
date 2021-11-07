import { WebClient } from "@slack/web-api";
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

// 全てのチャンネルの情報と流速のペアをソートして返す
const getAllChannelsNumberOfPost = async (
  client: WebClient,
  token: string,
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

  const channelsInfoWithNumberOfPost = [];

  const botInfo = await utils.getBotInfo(client, token, botName);
  if (botInfo == null) {
    throw new Error("botInfo couldn't be get");
  }

  const botId = botInfo.id;
  if (botId == null) {
    throw new Error("botId couldn't be get");
  }

  // conversationsをforEachで回したらクロージャ内でオブジェクトが破棄されて厳しくなったので普通のfor文で書いてます
  for (let i = 0; i < Object.keys(channels).length; i++) {
    const channelId = channels[i].id as ChannelID | undefined;
    if (channelId == null) {
      throw new Error("channeId couldn't be get");
    }

    // もしボットが入っていないパブリックチャンネルがあったら参加する
    if ((await utils.isBotJoined(client, token, channelId, botId)) === false) {
      await utils.inviteChannel(channelId, botId);
    }

    // チャンネルの投稿数を集計してchannelsInfoWithNumberOfPostにpushする
    const channelObject = await getNumberOfDayPost(client, token, channelId);
    if (channelObject === undefined) continue;
    const numberOfPost = channelObject.numberOfPost;
    const channelWithNumberOfPost = { channel: channels[i], numberOfPost };
    channelsInfoWithNumberOfPost.push(channelWithNumberOfPost);
  }

  return channelsInfoWithNumberOfPost.sort((a, b) => {
    return b.numberOfPost - a.numberOfPost;
  });
};

// 過去24時間の流速をchannelに投稿
export const postChatSpeed = async (
  client: WebClient,
  token: string,
  channel: ChannelID,
  botName: string
) => {
  const channelArray = await getAllChannelsNumberOfPost(client, token, botName);

  let text = "*⏱本日の 流速強さ ランキング (575)🏃‍♂️🏃‍♂️🏃‍♂️*\n";
  for (let i = 0; i < channelArray.length; i++) {
    const s = `<#${channelArray[i].channel.id}>:\t${channelArray[i].numberOfPost}\n`;
    text += s;
  }

  await client.chat.postMessage({
    token,
    channel,
    text,
  });
  console.log("post chat speed log");
};
