# Market - Expo Web App

A React Native web application built with Expo.

## 🚀 Deployment to Vercel

This app is configured for deployment on Vercel. Follow these steps to deploy:

### 1. Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel
```

Or for production:
```bash
vercel --prod
```

### 4. Environment Variables

Set these environment variables in your Vercel project settings:

- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` - Your Google OAuth web client ID

### 5. Build Configuration

The app uses:
- **Framework**: Expo
- **Build Command**: `pnpm run build:web`
- **Output Directory**: `web-build`
- **Install Command**: `pnpm install`

## 🛠️ Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start

# Start web development server
pnpm web

# Build for web
pnpm build:web
```

## 📱 Features

- React Native Web support
- Supabase integration
- Google OAuth authentication
- Expo Router navigation
- TypeScript support 