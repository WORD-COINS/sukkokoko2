declare const channelIdNominality: unique symbol;
export type ChannelID = string & { [channelIdNominality]: never };

declare const channelNameNominality: unique symbol;
export type ChannelName = string & { [channelNameNominality]: never };

declare const botIdNominality: unique symbol;
export type BotID = string & { [botIdNominality]: never };

declare const botNameNominality: unique symbol;
export type BotName = string & { [botNameNominality]: never };

export type ChatSpeedAggregationResult = {
  channel: ChannelID;
  numberOfPost: number;
};
