# Vercel + GitHub Setup

This project is a Next.js 16 app and can be deployed directly on Vercel.

## 1. Create the GitHub repository

Create a repository in the `blackwellen` GitHub account.

Suggested repository name:

- `measure-deck-final-release-v1`

## 2. Initialize Git locally

Run from the project root:

```bash
git init
git add .
git commit -m "Initial MeasureDeck release"
git branch -M main
git remote add origin git@github.com:blackwellen/measure-deck-final-release-v1.git
git push -u origin main
```

If you prefer HTTPS:

```bash
git remote add origin https://github.com/blackwellen/measure-deck-final-release-v1.git
git push -u origin main
```

## 3. Import into Vercel

In Vercel:

1. Click `Add New...`
2. Choose `Project`
3. Import the GitHub repository
4. Keep the detected framework as `Next.js`
5. Leave the build command as `npm run build`

## 4. Add environment variables in Vercel

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

Common optional values:

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

Production value:

```txt
NEXT_PUBLIC_APP_URL=https://<your-vercel-domain>
```

## 5. Redeploy

After saving variables, trigger a redeploy in Vercel.

## Notes

- `.env.local` and other `.env*` files are already ignored by Git.
- This app uses Google fonts through `next/font/google`, so builds need network access.
- Vercel can fetch those assets during deployment.
