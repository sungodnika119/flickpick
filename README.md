# FlickPick — Movie Night Matcher

A mobile-first, real-time movie discovery app for finding a film everyone wants to watch. It is a standard Next.js project ready to deploy to Vercel.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app works immediately in demo mode using a 1,500-title fallback catalog and cross-tab room syncing. Each room assembles up to 500 filtered movies. To enable production rooms, current TMDB posters, and live streaming-provider data, add your Firebase web config and TMDB credentials to `.env.local`.

## Firebase setup

1. Create a Firebase project.
2. Enable Anonymous Authentication.
3. Create a Firestore database.
4. Add the Firebase web app values to `.env.local`.
5. Deploy `firestore.rules` with the Firebase CLI.

## TMDB setup

Add either `NEXT_PUBLIC_TMDB_API_KEY` or `NEXT_PUBLIC_TMDB_BEARER_TOKEN`. Streaming providers default to the US region. TMDB attribution is displayed in the product.
