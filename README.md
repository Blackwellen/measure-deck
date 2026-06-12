This is a Next.js 16 application for MeasureDeck.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3005](http://localhost:3005) with your browser to see the result.

You can start editing the app under `src/app`. The page auto-updates as you edit the file.

## Deployment

This app is ready for Vercel, with a few required environment variables.

Required in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

Optional or feature-specific:

- `OPENAI_MODEL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER_MONTHLY`
- `STRIPE_PRICE_PROFESSIONAL_MONTHLY`
- `STRIPE_PRICE_ENTERPRISE_MONTHLY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET_NAME`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_NAME`

Set `NEXT_PUBLIC_APP_URL` to your production Vercel URL, for example `https://measuredeck.vercel.app`.

GitHub and Vercel flow:

1. Create a GitHub repository under the `blackwellen` account.
2. Push this folder to that repository.
3. Import the GitHub repository into Vercel.
4. Add the environment variables from `.env.example` in the Vercel project settings.
5. Redeploy after the variables are saved.

Build notes:

- The app uses `next/font/google`, so builds need outbound network access to fetch Google Fonts.
- Vercel supports that during deployment.
- Local builds in restricted environments can fail even when the Vercel deployment is fine.

Reference docs:

- [Next.js documentation](https://nextjs.org/docs)
- [Vercel deployment docs](https://nextjs.org/docs/app/building-your-application/deploying)
