# Vercel Deployment Guide

This guide will help you deploy the OWASP SolGuard project to Vercel.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Git repository (GitHub, GitLab, or Bitbucket)
- OWASP Nest API key (optional, but recommended for full functionality)

## Deployment Steps

### 1. Push Your Code to Git

Make sure your code is pushed to a Git repository that Vercel can access:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Vercel will automatically detect Next.js

### 3. Configure Project Settings

**IMPORTANT**: In the Vercel project settings, you MUST set the Root Directory:

1. Go to **Settings** → **General**
2. Scroll to **Root Directory**
3. Click **Edit** and set it to `frontend`
4. Click **Save**

This tells Vercel where your Next.js app is located. Without this, Vercel will try to build from the root directory and won't find Next.js.

Other settings (auto-detected once Root Directory is set):
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 4. Set Environment Variables

In your Vercel project settings, go to **Settings** → **Environment Variables** and add:

- **NEST_API_KEY** (optional): Your OWASP Nest API key
  - If not provided, the app will use fallback guidelines
  - Get your API key from [OWASP Nest](https://nest.owasp.dev)

- **NEST_API_BASE_URL** (optional): OWASP Nest API base URL
  - Default: `https://nest.owasp.dev`
  - Only set this if you need to use a different endpoint

### 5. Deploy

Click **"Deploy"** and wait for the build to complete. Vercel will:
1. Install dependencies
2. Build your Next.js application
3. Deploy to a global CDN

Your app will be available at `https://your-project-name.vercel.app`

## Project Structure

The project has been configured for Vercel deployment:

```
OWASP-SolGuard/
├── frontend/              # Next.js application (deployed to Vercel)
│   ├── app/
│   │   ├── api/          # API routes (serverless functions)
│   │   │   ├── scan/     # POST /api/scan
│   │   │   └── health/   # GET /api/health
│   │   └── ...
│   ├── lib/              # Shared backend logic
│   └── ...
├── backend/              # Not deployed (logic moved to frontend/lib)
├── vercel.json           # Vercel configuration
└── .vercelignore         # Files to exclude from deployment
```

## How It Works

- **Frontend**: Next.js app with React components
- **API Routes**: Serverless functions in `app/api/` handle the scanning logic
- **Backend Logic**: Moved to `frontend/lib/` and used by API routes
- **Environment Variables**: Set in Vercel dashboard for serverless functions

## Local Development

For local development, the API routes work the same way:

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000` and API routes at `http://localhost:3000/api/scan`

## Troubleshooting

### Build Fails

- Check that all dependencies are in `frontend/package.json`
- Ensure `rootDirectory` is set to `frontend` in Vercel settings
- Check build logs in Vercel dashboard

### API Routes Not Working

- Verify environment variables are set correctly
- Check that `NEST_API_KEY` is set if you want OWASP Nest integration
- Review serverless function logs in Vercel dashboard

### Module Not Found Errors

- Run `npm install` in the `frontend` directory
- Ensure all backend dependencies are added to `frontend/package.json`

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [OWASP Nest API](https://nest.owasp.dev)

