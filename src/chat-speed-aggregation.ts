import { WebClient } from "@slack/web-api";
import type { ChannelID, ChatSpeedAggregationResult } from "./types";

// IDで指定されたchannelの24時間以内のpost数を集計する
export const aggregateNumberOfPost = async (
  client: WebClient,
  channel: ChannelID,
): Promise<ChatSpeedAggregationResult> => {
  const yesterday = (() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0);
    yesterday.setMinutes(0);
    yesterday.setSeconds(0);
    yesterday.setMilliseconds(0);
    return yesterday;
  })();
  const oldest = (yesterday.getTime() / 1000).toString();

  const today = (() => {
    const today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    return today;
  })();
  const latest = (today.getTime() / 1000).toString();

  const result = await client.conversations.history({
    channel,
    oldest,
    latest,
    limit: 500,
  });

  const messages = result.messages || [];
  const numberOfPost = messages.length;
  return {
    channel,
    numberOfPost,
  };
};
