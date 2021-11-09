declare const channelIdNominality: unique symbol;
export type ChannelID = string & { [channelIdNominality]: never };

declare const channelNameNominality: unique symbol;
export type ChannelName = string & { [channelNameNominality]: never };

export type ChatSpeedAggregationResult = {
  channel: ChannelID;
  numberOfPost: number;
};
