# Admin interface

The admin UI follows the layouts in `design guide/bright-haven-admin` and runs inside the existing React 18 / React Router / Tailwind 3 application. The reference project is not a runtime dependency.

## Routes

- `/#/login`: Staff Login, reached from the site header (or the mobile menu).
- `/#/admin`: dashboard with content counts.
- `/#/admin/events`: create, edit, publish and filter events and activities.
- `/#/admin/gallery`: upload single images or bulk upload up to 20 at once.
- `/#/admin/testimonials`: add testimonials (publishing requires permission confirmation).
- `/#/admin/business-categories`: add and edit business categories.
- `/#/admin/users`: administrators onboard members and assign roles (Administrator, Editor, Member).

Hash routes preserve compatibility with the existing static/cPanel deployment.

## Data source

All admin requests go through `cmsRequest` in `src/lib/cms.ts`, which supports two modes:

- **Preview (default).** `src/lib/cms-local.ts` stores content and users in the browser's IndexedDB. Any email and password signs in, and the first sign-in becomes an administrator. Sign-in is not verified and nothing is shared with other browsers or visitors. Uploaded images are downscaled to 1600px before saving. Sample events, photos, testimonials and categories are seeded as drafts.
- **PHP API.** Build with `VITE_CMS_API=php` to use `public/cms.php` (SQLite, hashed passwords, CSRF protection, role checks). See `CMS_SETUP.md` for setup.

Both modes accept the same actions (`session`, `login`, `logout`, `public`, `content`, `save`, `users`), so the admin screens do not change when the API is connected.

## Publishing

Every item is saved as a Draft (staff only) or Published. Published items appear at the top of the matching landing page section (Events, Gallery, Community, Business Directory) through `src/components/PublishedContent.tsx`. In preview mode they appear only in the browser that created them.

## Design and accessibility

Admin colors are scoped to `.admin-ui` in `src/components/admin/admin.css`. Theme preference is saved in browser local storage. The public site does not inherit the admin theme.

The desktop sidebar collapses; mobile navigation uses a focus-trapped dialog. Create and edit forms use Radix dialogs for keyboard navigation, dismissal and focus restoration. User management is shown only to administrators. Admin route code is lazy-loaded.

Before going live, connect the PHP API (or another backend) so sign-in is verified and content is shared with all visitors.
