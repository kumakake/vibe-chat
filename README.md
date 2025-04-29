# ChatApp（PWA対応テキストチャットサービス）

PC・スマートフォン両対応のテキストチャットサービスです。  
React + TailwindCSS + Node.js + Express + PostgreSQL + Redis + Socket.io を使用しています。

## 🚀 特徴

- PWA対応（インストール可能）
- メールアドレスによる新規ユーザー登録
- 友達申請・承認機能
- オンライン・オフライン表示
- チャット履歴の保存・検索
- 未読メッセージ表示
- Socket.ioによるリアルタイム通信
- 本番用ビルド（Vite）

## 🛠 技術スタック

| 項目 | 技術 |
|:---|:---|
| フロントエンド | React 18, Vite, TailwindCSS |
| バックエンド | Node.js 20, Express |
| データベース | PostgreSQL 16 |
| キャッシュ | Redis |
| リアルタイム通信 | Socket.io |
| メールデバッグ | MailHog |
| 開発環境 | Docker Compose |

## 📦 ディレクトリ構成

```
/frontend       ... Reactフロントエンド
/backend        ... Node.jsバックエンド
/docker-compose.yml ... 開発用Docker構成
```

## 🔧 セットアップ手順

1. リポジトリをクローン

```bash
git clone https://github.com/yourname/your-repo.git
cd your-repo
```

2. `.envファイル`を用意

- `/frontend/.env`
```env
VITE_API_URL=http://localhost:3001
```
- `/frontend/.env.production`
```env
VITE_API_URL=/api
```

- `/backend/.env`
```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=chatapp

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

3. Docker環境を起動

```bash
docker compose up --build
```

4. フロントエンドのビルド（必要時）

```bash
cd frontend
npm install
npm run build
```

## 🌐 本番環境

- フロントエンドはビルド後、Expressサーバーで`dist/`を配信します。
- APIエンドポイントは `/api/` 配下に配置しています。

## ✨ 開発メモ

- `src/config.js`でAPI_URLを管理しています。
- 環境ごとにURLを自動切り替えできます。

```javascript
export const API_URL = import.meta.env.VITE_API_URL;
```

## 📜 ライセンス

MITライセンス

---

開発：AI翻訳研修所