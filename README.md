# بصمة فن | BASMAT FAN

An Arabic, right-to-left digital art museum for مدارس الابتكارية الأهلية. The workspace is an npm monorepo with a Next.js public site, a NestJS REST API, shared TypeScript contracts, Prisma/PostgreSQL persistence, and Cloudinary media storage.

## What is included

- Immersive, responsive Arabic homepage with school/company marks and teacher portrait supplied for the project.
- Installable progressive web app, with an offline connection notice; live gallery content still requires an internet connection.
- Searchable, published-only public gallery with animated category stories, 3-second multi-image slides and 4-second single-image works, server-backed pagination, artwork details, student privacy labels, and a lightweight Three.js gallery-room scene. Auto-advance pauses for dialogs, hidden tabs, and reduced-motion preferences.
- Separate `/admin` content-management area with administrator login, summary metrics, and CRUD for artwork, students, grades, classes, categories, projects, and gallery events, plus website settings.
- NestJS API with request validation, Swagger docs, Helmet, CORS allow-list, rate limiting, Argon2 admin password hashes, short-lived JWT in an HttpOnly cookie, role checks, and Cloudinary uploads.
- PostgreSQL schema, Prisma seed, Neon pooled runtime URL and direct migration URL support, and conventional Node deployment configuration.

## Requirements

- Node.js 20.11 or newer
- npm 10+
- PostgreSQL / Neon database
- Cloudinary account for persistent uploads

## Local setup

1. Copy the root `.env.example` to `.env`. Set Neon `DATABASE_URL` (pooled) and `DIRECT_URL` (direct), a random `JWT_SECRET` of at least 32 characters, and the admin bootstrap credentials. Configure Cloudinary before uploading any media.
2. Copy `apps/web/.env.example` to `apps/web/.env.local` and set `NEXT_PUBLIC_API_URL` for the local API.
3. Install and prepare the workspace:

   ```sh
   npm install
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

4. Start both applications:

   ```sh
   npm run dev
   ```

   The Next.js site is at `http://localhost:3000`, the API at `http://localhost:4000/api`, and OpenAPI docs at `http://localhost:4000/api/docs`.
5. Sign in at `/admin` with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. There is no public registration. Seeding requires an administrator password with at least 12 characters.

The API reads the root environment file when started from this workspace. Next.js reads its app-local `.env.local`. On independent deployments, configure the same variables in each service. `NEXT_PUBLIC_API_URL` is the web app's public API base URL.

## Installing the app

On the production HTTPS site, open **أدوات المعرض** and choose **تثبيت التطبيق**, or use the browser's install option. On iOS, use Safari's Share menu and choose **Add to Home Screen**. Installation and service worker registration require HTTPS (or localhost); the service worker is enabled only in production builds. When offline, the app shows a connection notice instead of caching private data or stale gallery results.

## Database and migrations

The Prisma schema is `apps/api/prisma/schema.prisma`. Runtime queries use `DATABASE_URL`; Prisma migrations use `DIRECT_URL`. The initial migration enables PostgreSQL `pg_trgm` indexes for substring search. Run `npm run db:migrate` to apply reviewed migrations and `npm run db:seed` to create the initial admin, settings row, and categories. Seeding does not change an existing administrator's password or reactivate a disabled account.

For schema changes during development, use Prisma Migrate to create and review migration SQL, then commit the resulting migration directory. Never run `db push` against production.

## Uploads and privacy

The API accepts JPEG, PNG, WebP, MP4, and WebM files through the authenticated `/api/admin/media/upload` endpoint. Files go to Cloudinary; images are limited to 10 MB, video to 50 MB. Artwork metadata and Cloudinary public IDs are stored in PostgreSQL. Deleting an artwork removes associated Cloudinary media and database records. Cloudinary credentials are server-only.

Set a student's `anonymous` flag when their published artwork must not expose their full name. Public API queries include only `PUBLISHED` artwork and return the anonymous label when that flag is enabled. Confirm school consent requirements before publishing student work, photos, or identifying information.

## Deployment

Deploy the web and API as separate services; a Next.js Vercel deployment does not host this NestJS API.

### Web (Vercel)

1. Import the repository in Vercel. Select `apps/web` as the project root and enable access to files outside the root directory for this monorepo. [`apps/web/vercel.json`](./apps/web/vercel.json) builds the shared types before the web app.
2. Set `NEXT_PUBLIC_API_URL` to the deployed API base ending in `/api`. Production browser requests use the same-origin `/api` proxy configured by Next.js, avoiding third-party cookie restrictions; redeploy after changing this variable.
3. Set `WEB_ORIGIN` on the API to the public web origin. For multiple origins, use a comma-separated allow-list.
4. Build using the monorepo install context. The shared workspace package must be built before the web production build (`npm run build -w @basmat-fan/shared`, then `npm run build -w @basmat-fan/web`).

### API (Node host / Railway / Render)

1. Create a persistent Node.js service from the repository root using `apps/api/Dockerfile`, or the commands `npm install`, `npm run db:generate -w @basmat-fan/api`, `npm run build -w @basmat-fan/shared`, and `npm run build -w @basmat-fan/api`. On Railway, select the Dockerfile builder and set the Dockerfile path to `apps/api/Dockerfile`. The API listens on Railway's `PORT` when set, otherwise `API_PORT` or 4000. Railway's legacy `railway.toml` config-as-code support is scheduled to end on 2026-12-01, so configure these settings in the service dashboard or migrate to Railway's current infrastructure-as-code mechanism.
2. Start with `npm run start -w @basmat-fan/api`.
3. Configure `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `WEB_ORIGIN`, `API_PORT`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and all three Cloudinary credentials.
4. The Docker startup runs `npm run db:migrate`, then runs the seed when both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set. Set them in the host's secret environment variables for the first deployment; never commit them. Existing administrators are not overwritten. Remove the bootstrap variables afterwards. If using the non-Docker start command, run migrations and the seed as controlled release/one-off jobs instead. Expose `/api/health` for health checks.
5. Configure `WEB_ORIGIN` for the deployed web URL. When web and API are on separate sites, the admin cookie uses `SameSite=None; Secure`; both services must be HTTPS.
6. Keep `WEB_ORIGIN` set to the exact frontend origin even when using the proxy: the API validates the browser's `Origin` on state-changing requests. Configure the proxy destination through `NEXT_PUBLIC_API_URL` and use HTTPS in production.

Do not commit environment files or credentials. If a Cloudinary API secret has been exposed, rotate it in Cloudinary and enter the replacement directly in the API host's secret variables.

## Useful commands

```sh
npm run typecheck
npm run build
npm run db:generate
npm run db:migrate
npm run db:seed
```

`npm run build` builds the shared package, API, and web application in order. External Neon and Cloudinary services and credentials are required to exercise database-backed and upload flows; the public homepage reports an API connection issue rather than presenting local mock artwork when the API is unavailable.

## Project layout

```text
apps/
  api/      NestJS REST API, Prisma schema/seed, Cloudinary integration
  web/      Next.js App Router public site and admin CMS
packages/
  shared/   Shared public API types
```
