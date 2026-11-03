# BINANCE REWARD BOT — NEXT GENERATION

Phase 1: Secure Project Foundation.

A Telegram Mini App built with Vite, Firebase (Auth, Firestore, Storage, Cloud Functions),
and deployed to GitHub Pages. Premium black + metallic gold + Binance yellow design.

## Architecture

- **Frontend** : Vite (vanilla HTML/CSS/JS) → GitHub Pages
- **Backend**  : Firebase Cloud Functions (Node.js 20, v2 callable)
- **Database** : Firestore (default-deny security rules)
- **Auth**     : Telegram Mini App `initData` → server-side HMAC-SHA256 validation →
                 Firebase Custom Token → `signInWithCustomToken`
- **Storage**  : Firebase Storage (avatar uploads, admin assets)
- **Admin**    : One Main Admin, authorized by Firebase Custom Claim `admin: true`
- **Languages**: English (default) + Bengali
- **Currencies**: BDT (2 dp), USD (2 dp), USDT (6 dp), integer minor units only

## Quick start

### Prerequisites

- Node.js 20+
- Firebase CLI (`npm i -g firebase-tools`)
- A Firebase project
- A Telegram bot token from @BotFather

### 1. Install

```bash
npm install
cd functions && npm install && cd ..
