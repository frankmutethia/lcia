# Admin interface

The staff workspace runs inside the existing React application and connects to the live backend through `src/lib/api.ts`. See [API integration and deployment](API_INTEGRATION.md) for environment variables, CORS, the direct password-reset route, and test instructions.

## Routes and capabilities

- `/#/login`, `/#/forgot-password`, `/#/reset-password`: verified staff access and password setup/reset.
- `/#/admin`: backend dashboard counts, upcoming events and recent updates.
- `/#/admin/events`: event/activity creation, date precision and timezone inputs, publication status, registration links, cover upload/replacement.
- `/#/admin/gallery`: album creation and editing; images uploaded singly or in batches of ten, with per-file results and retries, captions, alternative text, order and cover selection.
- `/#/admin/testimonials`: content creation and pending-submission moderation.
- `/#/admin/business-categories`: category creation, images and active/inactive controls.
- `/#/admin/businesses`: businesses, media, category assignment and services.
- `/#/admin/users`: staff invitations and management for super administrators.
- `/#/admin/change-password`: change the signed-in account's password and return to login.

## Authentication and permissions

The backend validates an HttpOnly session cookie. CSRF tokens and the current account remain in memory and are recovered with `/auth/me` after refresh. No browser-only sign-in or local content store remains.

Editors manage and publish content. Super administrators also manage staff and delete records. Staff accounts use the backend's `editor` and `super_admin` roles; general community membership is outside this API.

## Publication

Landing-page content uses the public API. Events, albums and businesses support draft/published/archived; testimonials also have pending/rejected states. Categories use `active`, not publication status. Public API caching can delay visible changes for up to 30 seconds. An image must be published and its album published to appear in the public gallery.

## Accessibility

Create/edit forms and image viewers use Radix dialogs with focus trapping and keyboard dismissal. Layouts adapt to narrow screens; the mobile sidebar has its own dialog. Image ordering offers move buttons as well as drag/drop. Admin theme preference alone is saved in local storage.
