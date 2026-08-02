# Skybrew

Skybrew は、TweetDeck のような使用感を目指した、デスクトップ向けの Bluesky クライアントです。
空とコーヒー（Sky + Brew）を掛け合わせた名前とアイコンが特徴です。

## 主な機能
- 複数カラム対応による快適なタイムライン閲覧（自動更新付き）
- ユーザーごとのカラーテーマ、フォント、文字サイズの詳細設定機能
- アプリ再起動時のウィンドウ状態（サイズ、位置）の復元
- Tauri v2 + Svelte 5 を用いた高速なネイティブデスクトップ体験

## 技術スタック
- **Frontend**: Svelte 5 (SvelteKit), Tailwind CSS
- **Desktop**: Tauri v2
- **Backend**: Rust
- **APIs**: `@atproto/api`

## 開発・ビルド方法

```bash
# 依存パッケージのインストール
npm install

# プロダクションビルド
npm run tauri build
```
