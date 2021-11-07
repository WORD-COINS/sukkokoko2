# sukkokoko2

旧 sukkokoko(startbot2)を代替する Slack ワークスペースの流速集計 Bot

## ローカルで開発する

1. 以下の環境変数をセットする
   ```sh
   SLACK_SIGNING_SECRET
   SLACK_BOT_TOKEN
   SLACK_USER_TOKEN
   CHANNEL_NAME
   BOT_NAME
   ```
1. `yarn dev`

## デプロイ

1. ローカルでの開発と同様に環境変数をセットする
1. `yarn build`
1. `yarn start`
