# ROVER — Ride • Relocate • Earn

A premium biker community + bike relocation platform.

## Architecture

```
ROVER/
├── backend/          # Node.js + Express + TypeScript + MongoDB
├── mobile/           # React Native + Expo + TypeScript
└── admin/            # Next.js + Tailwind + Shadcn UI
```

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

### Admin Dashboard
```bash
cd admin
npm install
npm run dev
```

## Environment Variables

See `backend/.env.example` for all required variables.

## Tech Stack

| Layer       | Tech                                      |
|-------------|-------------------------------------------|
| Mobile      | React Native, Expo SDK, TypeScript        |
| Backend     | Node.js, Express, TypeScript              |
| Database    | MongoDB Atlas                             |
| Auth        | Firebase OTP                              |
| Realtime    | Socket.IO                                 |
| Maps        | Google Maps SDK                           |
| Storage     | Cloudinary                                |
| Payments    | Razorpay                                  |
| Push        | Firebase Cloud Messaging                  |
| State       | Zustand                                   |
| Admin       | Next.js, Tailwind CSS, Shadcn UI          |

## Features

- 🏍️ Peer-to-peer bike relocation marketplace
- 👤 Hinge-style rider discovery (no swipe)
- 🛡️ Trust score + KYC verification
- 📍 Live GPS tracking with Socket.IO
- 💬 Real-time chat (DM + group)
- 🌐 Biker social feed + video reels
- 🤝 Trip partner matching
- 💰 Razorpay escrow payments
- 🏆 Gamification (badges, XP, leaderboard)
- 🚨 SOS emergency feature
- 🤖 AI-powered rider recommendations
- 📊 Admin dashboard with analytics
