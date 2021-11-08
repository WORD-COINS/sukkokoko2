import { WebClient } from "@slack/web-api";
import { Channel } from "@slack/web-api/dist/response/ConversationsListResponse";
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
  channels: Promise<Channel>[]
) => {
  const numberOfPostPromises = channels.map(async (channel) =>
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
  channels: Promise<Channel>[]
) => {
  console.log("aggregate chat speed");
  const channelArray = await getAllChannelsNumberOfPost(
    client,
    channels
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
