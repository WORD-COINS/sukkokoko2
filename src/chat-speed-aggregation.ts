import { WebClient } from "@slack/web-api";
import { Channel } from "@slack/web-api/dist/response/ConversationsListResponse";
import * as utils from "./slack-utils";
import type { ChatSpeedAggregationResult, ChannelID } from "./types";

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
export const aggregateNumberOfPost = async (
  client: WebClient,
  channels: Promise<Channel>[]
): Promise<ChatSpeedAggregationResult[]> => {
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
