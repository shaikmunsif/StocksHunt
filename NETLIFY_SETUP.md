# Netlify Deployment Setup

## Automatic Deployment Configuration

This project is configured to automatically deploy to Netlify from the `main` branch.

### Setup Steps in Netlify Dashboard

1. **Connect Your Repository**

   - Go to your Netlify dashboard
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and authorize Netlify
   - Select your repository: `shaikmunsif/StocksHunt`

2. **Configure Build Settings**

   - Branch to deploy: `main`
   - Build command: `npm run build` (should auto-detect from netlify.toml)
   - Publish directory: `dist/stocks-pulse/browser` (should auto-detect)

3. **Set Environment Variables** (CRITICAL)

   - Go to Site settings → Environment variables
   - Add the following variables:
     - `SUPABASE_URL` = Your Supabase project URL
     - `SUPABASE_KEY` = Your Supabase anon/public key
     - `NODE_VERSION` = `20` (optional, already in netlify.toml)

4. **Deploy**
   - Click "Deploy site"
   - Netlify will automatically deploy whenever you push to `main`

### How It Works

- The `netlify.toml` file configures build settings
- When you push to `main`, Netlify automatically:
  1. Pulls your latest code
  2. Runs `npm install`
  3. Executes `set-env.js --prod` (via prebuild:prod)
  4. Runs `ng build --configuration production`
  5. Deploys the contents of `dist/stocks-pulse/browser`

### Local Testing

To test the production build locally:

```bash
npm run build
```

The output will be in `dist/stocks-pulse/browser/`.

### Important Notes

- **Never commit `.env`** - it's in `.gitignore`
- **Set environment variables in Netlify dashboard** - they inject at build time
- **Angular routing works** - the `netlify.toml` includes redirects for SPA routing
