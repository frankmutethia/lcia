# Live API integration

The public site and staff workspace use the supplied `/api/v1` contract through `src/lib/api.ts`. No JWT or CSRF token is persisted in browser storage. Staff sessions use backend cookies. Existing preview-session flags do not provide access.

## Configuration

- `.env.production`: `VITE_API_URL=https://api.mulembecommunitynswinc.org.au/api/v1`
- `.env.development`: `VITE_API_URL=http://localhost:4000/api/v1`
- For local use, run the backend on port 4000 and Vite at **http://localhost:5173**. The supplied backend contract allows that origin for its local instance. `127.0.0.1`, another port or another hostname is a different origin.
- The production API accepts **https://mulembecommunitynswinc.org.au**. Ask the backend team to add other origins (including `www`, preview deployments or local access to production) to `CORS_ORIGINS` before using them. Changing the frontend URL alone cannot solve CORS.
- Rebuild after changing environment variables. There are no API secrets in the frontend configuration.

## Routes

Landing-page content comes from `/public/home`; public categories use `/business-categories`. API-backed gallery, testimonials and business cards replace the old hard-coded samples. The existing Mulembe Night promotional/ticket content remains separately configured in `Events.tsx`; it is not managed by the new API editors.

Public hash routes: `/#/events`, `/#/events/:slug`, `/#/albums`, `/#/albums/:slug`, `/#/gallery`, `/#/testimonials`, `/#/businesses`, `/#/businesses/:slug`. Lists use top-level pagination, documented filters and plain-text rendering. Public content can remain cached by the backend for 30 seconds after publishing.

Staff routes: `/#/login`, `/#/forgot-password`, `/#/admin`, `/#/admin/events`, `/#/admin/gallery`, `/#/admin/testimonials`, `/#/admin/business-categories`, `/#/admin/businesses`, `/#/admin/users`, `/#/admin/change-password`.

Staff editors use the resource create/update/status endpoints. Media is sent separately as multipart `images`, without a manual Content-Type. Album uploads send a matching metadata array, in batches of at most ten. Each file keeps its key through retries; successful files are not retried. Upload indicators report queued/uploading/success/failure, not estimated byte percentages. Drag/drop and keyboard-accessible move buttons save album ordering; this editor enables full-album reorder for up to 100 images, matching the request limit. Larger albums still support paginated viewing, upload, metadata edits and cover selection.

User management onboards **staff administrators only** (`editor`, `super_admin`). Invitations are sent by the API; failed invitation responses expose a resend action through forgot-password. Account changes revoke that account's sessions. Delete and user-management controls are hidden for editors, with API permission errors also handled.

## Password-reset links on VentraIP

Backend invitations and resets target the direct route `/reset-password?token=...`, not a hash URL. The `public/.htaccess` rewrite serves the application for this path. **Merge this rule into an existing hosting `.htaccess` instead of replacing unrelated hosting rules.** `dist/.htaccess` must be uploaded along with the production build.

The early script in `index.html` captures the token in memory and removes it from the address before the app or fonts load. Referrer policy is `no-referrer`. Do not add analytics before that script or record reset query strings in application logs. On refresh the in-memory token is gone: reopen the original link if it has not expired. Passwords enforce 12–72 characters and the 72-byte UTF-8 limit.

## Existing forms outside this API

Membership, leadership expressions of interest, welfare, voting, donations, payments, file/ZIP downloads and general contact submissions have no endpoints in the supplied API. Existing PHP forms, voting preview and payment links are not mapped to invented API routes. General member onboarding, voting storage or changes to those integrations require a separate backend contract.

The former local PHP/IndexedDB CMS adapter and setup scripts are retired. No migration from their private database/browser storage to the new backend is implied; existing records must be imported by the backend team or recreated through supported editors. Old deployment ZIP files must be rebuilt before deployment.

## Validation

Run `npm.cmd run build` and `npm.cmd exec -- eslint src`.

`tests/api-integration.mjs` runs browser contract tests with a mocked API: no production content or invitation emails are created. Install Playwright locally or set `PLAYWRIGHT_MODULE` to its module URL, then run `node tests/api-integration.mjs`. It uses a temporary Vite server on localhost port 5181. Tests verify outgoing payloads, cookie/CSRF configuration, errors, date offsets, status changes, media fields, partial upload retries, public rendering, roles, session expiry and reset links.

The backend repository's OpenAPI file returned 404 to the unauthenticated request during implementation, and the production health endpoint could not be reached from the execution environment. The supplied endpoint document is the integration source until the backend OpenAPI file can be reviewed. Live cookie/CORS behavior, actual invitation delivery and production data require a check from the allowed production origin with an authorized staff account.
