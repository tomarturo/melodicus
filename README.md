[![Melodicus: Learn the songs & licks you love. Any song on YouTube. Unlimited loops. Slow down the hard parts.](public/og-image.png)](https://melodicus.xyz)

This application allows you view any YouTube video in a custom player designed to optimize the experience of learning melodies, solos, and licks from your favorite songs. 

All of the controls in Melodicus exist in the standard YouTube player but on YouTube they are hidden in submenus and laborious to use repeatedly.

The heart of Melodicus is a looping function enabling users (musicians, music teachers, students, etc) to isolate a specific part of a song and play it back indefinitely. 

I designed Melodicus for optimal use in my transcribing situation - an iPad resting on a music stand and a guitar in my hands. I strove to make all of the controls easy to interact with on a touch screen and visible from a couple feet away. 

I hope others find it useful too.

## Development

Requires Node 22.12 or newer.

```bash
cp .env.example .env.local   # then fill in the Supabase and YouTube keys
npm install
npm run dev                  # http://localhost:3000
```

Other scripts: `npm test` (Vitest, watch mode), `npm run test:e2e` (Playwright), `npm run lint`, `npm run typecheck`, `npm run build`, `npm run preview`.

## Database

The Supabase schema lives in `supabase/migrations/`. Production predates the
migrations, so apply new ones by running their SQL in the Supabase SQL Editor.
After a schema change, regenerate the TypeScript types with `npm run db:types`
(requires `npx supabase login`).
