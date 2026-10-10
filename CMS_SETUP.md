# Staff content management

The staff workspace uses `public/cms.php` and SQLite to store content and members on the server. Published events, images, testimonials and business categories are loaded by the landing page. Existing website content remains in place; the new editors manage content created through the CMS.

## Local setup

Use PHP 8.1+ with PDO SQLite enabled. Run from the project root:

```powershell
php scripts/setup-cms.php "your-admin-email@example.com" "Administrator Name"
php -S 127.0.0.1:8080 -t public
```

The setup command prompts for a password of at least 12 characters. It only creates the first administrator and refuses to run again once users exist. Password input may be visible in the terminal: use a private terminal. No default credentials are included.

In a second terminal run `npm.cmd run dev`. Vite proxies `/cms.php` to the local PHP server on port 8080. Open `/#/login` and use the account you created. Old preview credentials and browser session flags do not grant staff access.

By default, local data is saved in the ignored `mulembe-cms/` directory, outside the `public/` document root. To change storage, set `MULEMBE_CMS_DATA_DIR` before running both the setup command and PHP server. Keep it outside the web document root.

## VentraIP / cPanel

1. Enable PHP 8.1+ and PDO SQLite in the hosting PHP configuration. Set `upload_max_filesize` to at least `5M` and `post_max_size` to at least `32M` for bulk uploads. The application accepts 20 images per batch, at most 5 MB per image and 25 MB total in the browser.
2. Build with `npm.cmd run build` and upload the **contents** of `dist/` to the site's document root. This includes `cms.php` and `cms-lib.php`. Existing deployment ZIPs must be rebuilt; they do not contain these updates.
3. The default private storage path is `mulembe-cms/` alongside `public_html/`, not inside it. Ensure the PHP user can create/write this directory. Never place the database or setup script inside `public_html/`.
4. From cPanel Terminal, run the CLI setup script from a private source checkout, setting `MULEMBE_CMS_DATA_DIR` to the same absolute path the live endpoint uses. For example: `MULEMBE_CMS_DATA_DIR=/home/ACCOUNT/mulembe-cms php scripts/setup-cms.php "your-admin-email@example.com" "Administrator Name"`. Substitute the actual account path. The setup script needs the source checkout's `public/cms-lib.php`.
5. Visit the HTTPS site's Staff Login, sign in, create a draft, then publish it and check the landing page in a separate browser. Test an image upload and staff sign-out before onboarding others.

If the hosting account does not provide PDO SQLite or a terminal, confirm the available database/runtime with the host before going live. The app reports setup errors rather than pretending browser-only changes have been published.

## Roles and workflow

- Administrator: publish content and onboard/edit members and staff roles.
- Editor: create, edit and publish content; cannot manage users.
- Member: community record only; cannot sign in to the staff workspace.

Use **Create event**, **Add images**, **Add testimonial**, or **Add category** to open the editor. Save a draft or choose Published. Change an existing item back to Draft to withdraw it from the landing page. Gallery bulk uploads use a shared caption with numbered suffixes; edit individual entries to refine captions. Testimonial publication requires permission confirmation.

User management accepts a name, email, role and active state. Staff accounts require an initial password. Share credentials privately; the system does not send invitations or offer password-reset emails. Updating a user's record invalidates their previous sessions. Administrators cannot remove their own administrator access. No personal member data is exposed by the public content endpoint.

Back up the complete private storage directory (database and uploaded images). Rebuilding or uploading the frontend does not erase server content. Replaced images are retained privately for recovery and are no longer served unless referenced by accessible content. Content saves reject stale edits to avoid silently overwriting another staff member's changes.
