# Vibe Chat（PWA対応リアルタイムチャットアプリ）

「Vibe Chat」は、PCおよびスマートフォンから利用可能なリアルタイムチャットサービスです。  
React + TailwindCSS + Node.js + Express + PostgreSQL + Redis + Socket.io によって構成され、Docker Compose による開発・運用が可能です。

## 🚀 主な特徴

- ✅ PWA対応（モバイル端末へインストール可能）
- ✅ メールアドレスを使った仮登録 → 本登録フロー
- ✅ 友達申請・承認による双方向チャット許可制
- ✅ Socket.io によるリアルタイム通信
- ✅ オンライン／オフライン表示
- ✅ メッセージ履歴の保存（DB）
- ✅ 未読表示の管理
- ✅ 最新メッセージへの自動スクロール
- ✅ チャット履歴のタイムスタンプ表示

## 🌐 本番URL

- https://vibe-chat.ai-trans-labo.fun/

## 🛠 技術スタック

| 項目             | 技術                            |
|------------------|---------------------------------|
| フロントエンド   | React 18, Vite, TailwindCSS     |
| バックエンド     | Node.js 20, Express             |
| DB               | PostgreSQL 16                   |
| キャッシュ       | Redis                           |
| リアルタイム通信 | Socket.io 4.8.1                 |
| メール確認       | MailHog                         |
| デプロイ環境     | Ubuntu 24 + PM2 + Nginx         |
| 開発環境         | Docker Compose                  |

## 📁 ディレクトリ構成

frontend/ - Reactクライアント（PWA）
backend/ - Node.js/Express サーバー 
postdb/ - PostgreSQL領域(デバッグ用)
postinit/ - PostgreSQL定義
docker-compose.yml - Docker開発構成


## 🧪 ローカル開発手順（Docker利用）

1. このリポジトリをクローン

```bash
git clone https://github.com/kumakake/vibe-chat.git
cd vibe-chat

2. .env ファイルを作成

・frontend/.env
VITE_API_URL=http://localhost:3001

・frontend/.env.production
VITE_API_URL=/api

・backend/.env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=chatapp
REDIS_HOST=redis
REDIS_PORT=6379

3. Docker起動
docker compose up --build

4. フロントエンドビルド（本番用）
cd frontend
npm install
npm run build

## 🔐 本番環境向けメモ
・ecosystem.config.js で PORT や NODE_ENV を設定して PM2 起動。
・Express は /api/* に対してルーティングし、dist/ を静的ファイルとして配信。
・本番用では .env.production の VITE_API_URL=/api を利用。

## 💡 補足情報
・フロント側で API ベースURL は src/config.js で切替管理：
export const API_URL = import.meta.env.VITE_API_URL;

・Socket.io の接続先も同様に VITE_SOCKET_URL などで環境ごとに切替可能。

## 📜 ライセンス
MIT License



