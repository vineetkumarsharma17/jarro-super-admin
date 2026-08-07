# JArro — Super Admin Panel

Web control plane for the JArro platform (super-admin role): restaurants, users, subscriptions,
system analytics, and banners. Vite + React + MUI + Recharts. Talks to the JArro API
(`https://api.jarro.in/api`).

> Extracted from `backend-jaaro/admin-panel` into its own repo so it can be deployed independently.

## Develop
```bash
npm install
npm run dev        # http://localhost:5173
```
Local API override: create `.env` (gitignored) with `VITE_API_URL=http://localhost:3001/api`.

## Build
```bash
npm run build      # outputs dist/ (reads .env.production)
npm run preview
```

## Deploy — GitHub Pages
`.github/workflows/deploy-pages.yml` builds and deploys `dist/` to Pages on every push to `main`.
To enable: repo **Settings → Pages → Source: GitHub Actions**.

- Uses **HashRouter** + relative `base` so it works at `https://<user>.github.io/<repo>/` with no
  server rewrites (deep links / refresh work).
- Build-time API URL comes from `.env.production` (the API URL is public, not a secret).

### ⚠️ Security note
This is a super-admin console. GitHub Pages sites are **publicly reachable** (private Pages needs
GitHub Enterprise). Anyone with the URL can load the login screen and reach the prod API (which is
already public). Access is still gated by super-admin credentials, but consider a private host
(subdomain behind IP allow-list / auth) for production instead of public Pages.

## Environment
| Var | Where | Value |
|---|---|---|
| `VITE_API_URL` | `.env.production` (committed) | `https://api.jarro.in/api` |
| `VITE_API_URL` | `.env` (local, gitignored) | your dev/local API |
