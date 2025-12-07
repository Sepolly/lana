# Deployment Guide

This guide covers deploying the Lana platform to production using Vercel.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Vercel Setup](#vercel-setup)
- [Environment Variables](#environment-variables)
- [CI/CD Pipeline](#cicd-pipeline)
- [Deployment Process](#deployment-process)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code pushed to GitHub
3. **Production Services**:
   - Production database (NeonDB recommended)
   - Production API keys (Google, Pinecone, OpenRouter, etc.)
   - Production SMTP service
4. **Domain** (optional): Custom domain for your application

## Vercel Setup

### 1. Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Vercel will auto-detect Next.js settings

### 2. Configure Project Settings

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### 3. Environment Variables

Configure all environment variables in Vercel dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add each variable from `.env.production.example`
3. Set the environment scope:
   - **Production**: For production deployments
   - **Preview**: For pull request previews
   - **Development**: For local development (optional)

#### Required Environment Variables

| Variable | Description | Required For |
|----------|-------------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | All |
| `NEXTAUTH_SECRET` | NextAuth secret (min 32 chars) | All |
| `NEXTAUTH_URL` | Application URL | All |
| `NEXT_PUBLIC_APP_URL` | Public app URL | All |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | All |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | All |
| `GEMINI_API_KEY` | Google Gemini API key | All |
| `OPENROUTER_API_KEY` | OpenRouter API key | All |
| `PINECONE_API_KEY` | Pinecone API key | All |
| `PINECONE_INDEX` | Pinecone index name | All |
| `YOUTUBE_API_KEY` | YouTube Data API key | All |
| `SMTP_HOST` | SMTP server hostname | All |
| `SMTP_PORT` | SMTP server port | All |
| `SMTP_SECURE` | Use secure connection | All |
| `SMTP_USER` | SMTP username | All |
| `SMTP_PASSWORD` | SMTP password | All |
| `EMAIL_FROM` | Email sender address | All |

### 4. Domain Configuration

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to match your domain

## Environment Variables

### Production Environment

For production, use secure, production-ready values:

```bash
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_SECRET=<generate-strong-random-string>
NODE_ENV=production
DATABASE_URL=<production-database-url>
# ... other production values
```

### Generating NEXTAUTH_SECRET

Generate a secure secret:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials for production
3. Add authorized redirect URIs:
   - `https://your-domain.com/api/auth/callback/google`
   - `https://your-vercel-app.vercel.app/api/auth/callback/google` (for previews)

## CI/CD Pipeline

### GitHub Actions Workflow

The project includes automated CI/CD via GitHub Actions (`.github/workflows/ci-cd.yml`).

#### Workflow Steps

1. **Lint**: Runs ESLint on all code
2. **Type Check**: Validates TypeScript types
3. **Format Check**: Verifies Prettier formatting
4. **Build**: Builds Next.js application
5. **Deploy**: Deploys to Vercel

#### Required GitHub Secrets

Add these secrets in **Repository Settings** → **Secrets and variables** → **Actions**:

- `VERCEL_TOKEN`: Vercel API token
  - Get from: [vercel.com/account/tokens](https://vercel.com/account/tokens)
  - Required scopes: Full Account access

Optional (for build-time checks):
- `DATABASE_URL`: Production database URL
- `NEXTAUTH_SECRET`: NextAuth secret
- `NEXTAUTH_URL`: Production URL

> **Note**: Application environment variables should be in Vercel, not GitHub Secrets.

#### Workflow Triggers

- **Production Deployment**: Push to `main` or `master` branch
- **Preview Deployment**: Pull request to `main` or `master`

### Manual Deployment

Deploy manually using Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Deployment Process

### Automatic Deployment

1. **Push to Main Branch**:
   ```bash
   git push origin main
   ```

2. **GitHub Actions**:
   - Automatically runs lint, type check, format check
   - Builds the application
   - Deploys to Vercel production

3. **Vercel**:
   - Receives deployment request
   - Builds application with production environment variables
   - Deploys to production domain

### Preview Deployments

1. **Create Pull Request**:
   ```bash
   git checkout -b feature/new-feature
   git push origin feature/new-feature
   # Create PR on GitHub
   ```

2. **Automatic Preview**:
   - GitHub Actions creates preview deployment
   - Vercel generates unique preview URL
   - Preview URL is added to PR comments

### Deployment Verification

After deployment:

1. **Check Build Logs**:
   - GitHub Actions: View workflow run
   - Vercel: View deployment logs

2. **Verify Application**:
   - Visit production URL
   - Test critical user flows
   - Check console for errors

3. **Monitor Performance**:
   - Check Vercel Analytics (if enabled)
   - Monitor error rates
   - Check response times

## Rollback Procedures

### Via Vercel Dashboard

1. Go to **Deployments** in Vercel dashboard
2. Find the previous working deployment
3. Click the three dots menu (⋯)
4. Select **"Promote to Production"**

### Via Vercel CLI

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### Via Git

```bash
# Revert problematic commit
git revert <commit-hash>
git push origin main

# Or reset to previous commit (use with caution)
git reset --hard <previous-commit-hash>
git push origin main --force
```

### Emergency Rollback

For critical issues:

1. **Immediate**: Use Vercel dashboard to promote previous deployment
2. **Investigation**: Check deployment logs and error monitoring
3. **Fix**: Create hotfix branch and deploy
4. **Post-mortem**: Document issue and prevention measures

## Monitoring and Logging

### Vercel Analytics

Enable in **Settings** → **Analytics**:

- Real-time analytics
- Performance metrics
- Error tracking
- User behavior insights

### Logs

Access logs in Vercel dashboard:

- **Function Logs**: Serverless function execution logs
- **Build Logs**: Build process logs
- **Deployment Logs**: Deployment history

### Error Monitoring

Consider integrating:

- **Sentry**: Error tracking and monitoring
- **LogRocket**: Session replay and error tracking
- **Datadog**: Application performance monitoring

### Health Checks

Set up health check endpoints:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

Monitor with:
- Uptime monitoring services (UptimeRobot, Pingdom)
- Vercel Cron Jobs for scheduled checks

## Troubleshooting

### Build Failures

**Issue**: Build fails with TypeScript errors

**Solution**:
```bash
# Check types locally
npm run type-check

# Fix errors before pushing
```

**Issue**: Build fails with missing environment variables

**Solution**:
- Verify all required variables are set in Vercel
- Check variable names match exactly (case-sensitive)
- Ensure variables are set for correct environment (Production/Preview)

### Deployment Issues

**Issue**: Deployment succeeds but application doesn't work

**Solution**:
- Check function logs in Vercel dashboard
- Verify environment variables are correct
- Check database connectivity
- Review API route errors

**Issue**: Slow build times

**Solution**:
- Enable build caching in Vercel
- Optimize dependencies
- Review bundle size with `npm run build:analyze`
- Consider using Vercel's Edge Network

### Database Issues

**Issue**: Database connection errors

**Solution**:
- Verify `DATABASE_URL` is correct
- Check database allows connections from Vercel IPs
- Ensure SSL is enabled (`sslmode=require`)
- Check database connection limits

### Authentication Issues

**Issue**: Google OAuth not working

**Solution**:
- Verify redirect URIs in Google Cloud Console
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Ensure `NEXTAUTH_URL` matches your domain
- Check OAuth consent screen configuration

## Best Practices

1. **Always test locally** before pushing to main
2. **Use preview deployments** for testing
3. **Monitor deployments** after each release
4. **Keep dependencies updated** regularly
5. **Rotate secrets** periodically
6. **Document changes** in commit messages
7. **Use feature flags** for gradual rollouts
8. **Set up alerts** for critical errors

## Support

For deployment issues:

1. Check [Vercel Documentation](https://vercel.com/docs)
2. Review [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
3. Check GitHub Issues
4. Contact team lead or DevOps

---

Last updated: 2024

