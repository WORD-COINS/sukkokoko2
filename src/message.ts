import { ChatSpeedAggregationResult } from "./types";

export const buildMessage = (results: ChatSpeedAggregationResult[]): string => {
  return (
    "*⏱本日の 流速強さ ランキング (575)🏃‍♂️🏃‍♂️🏃‍♂️*\n" +
    results
      .map((result) => `<#${result.channel}>:\t${result.numberOfPost}\n`)
      .join("")
  );
};
