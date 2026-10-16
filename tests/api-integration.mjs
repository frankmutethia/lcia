// Browser contract tests. All backend requests are intercepted: no live writes or emails.
// Run with PLAYWRIGHT_MODULE pointing to Playwright, or install Playwright locally.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const port = 5181;
const origin = `http://localhost:${port}`;
const base = "http://localhost:4000/api/v1";
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--host",
    "localhost",
    "--port",
    String(port),
    "--strictPort",
  ],
  { stdio: "ignore" },
);
let browser;
const oid = (n) => n.toString(16).padStart(24, "0");
const media = {
  publicId: "test/image",
  url: "https://images.example.test/image.png",
  width: 1,
  height: 1,
  bytes: 68,
};
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
);
try {
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error("Test Vite server exited.");
    try {
      if ((await fetch(origin)).ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  await context.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/css", body: "" }),
  );
  await context.addInitScript(() => {
    window.__badCredentials = [];
    const original = window.fetch;
    window.fetch = (input, options) => {
      if (
        String(input).includes("/api/v1") &&
        options?.credentials !== "include"
      )
        window.__badCredentials.push(String(input));
      return original(input, options);
    };
  });
  let signedIn = false,
    role = "super_admin",
    expired = false,
    nextId = 10;
  const csrf = "test-csrf";
  const admin = {
    id: oid(1),
    name: "Test Administrator",
    email: "admin@example.test",
    role,
    active: true,
  };
  const rows = {
    events: [],
    albums: [],
    testimonials: [],
    "business-categories": [
      {
        _id: oid(3),
        name: "Community services",
        active: true,
        businessCount: 0,
      },
    ],
    businesses: [],
    users: [
      { _id: oid(1), name: admin.name, email: admin.email, role, active: true },
    ],
  };
  const images = [];
  const requests = [];
  const unexpected = [];
  let uploadCount = 0;
  const uploadMetadata = [];
  let fieldFailure = false,
    rateLimited = false;
  await context.route("https://images.example.test/**", (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: png }),
  );
  await context.route("**/api/v1/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace("/api/v1", "");
    const method = req.method();
    const headers = req.headers();
    let body;
    try {
      body = req.postDataJSON();
    } catch {}
    requests.push({ path, method, body, search: url.search, headers });
    const respond = (data, status = 200, pagination) =>
      route.fulfill({
        status,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
        },
        body: JSON.stringify({
          success: true,
          data,
          ...(pagination ? { pagination } : {}),
        }),
      });
    const failure = (status, message, details) =>
      route.fulfill({
        status,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: "HTTP_" + status,
            message,
            ...(details ? { details } : {}),
          },
        }),
      });
    const list = (data) =>
      respond(data, 200, {
        page: Number(url.searchParams.get("page") || 1),
        limit: Number(url.searchParams.get("limit") || 20),
        total: data.length,
        pages: 1,
      });
    if (method === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Headers": "Content-Type,X-CSRF-Token",
          "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE",
        },
      });
    if (path === "/auth/me")
      return signedIn && !expired
        ? respond({ user: { ...admin, role }, csrfToken: csrf })
        : failure(401, "Session expired");
    if (path === "/auth/login") {
      signedIn = true;
      expired = false;
      return respond({ user: { ...admin, role }, csrfToken: csrf });
    }
    if (path === "/auth/reset-password")
      return body.token === "a".repeat(64)
        ? respond({ message: "Password updated. Sign in again." })
        : failure(400, "Invalid or expired reset token");
    if (path === "/auth/forgot-password") {
      if (rateLimited)
        return route.fulfill({
          status: 429,
          contentType: "application/json",
          headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Expose-Headers": "Retry-After",
            "Retry-After": "60",
          },
          body: JSON.stringify({
            success: false,
            error: { code: "HTTP_429", message: "Too many requests" },
          }),
        });
      return respond({
        message: "If the account exists, a reset link has been sent.",
      });
    }
    if (path === "/public/home") {
      assert.equal(url.search, "");
      return respond({
        upcomingEvents: rows.events.filter(
          (item) => item.status === "published",
        ),
        featuredEvents: [],
        albums: rows.albums.filter((item) => item.status === "published"),
        testimonials: rows.testimonials.filter(
          (item) => item.status === "published",
        ),
        businesses: [],
      });
    }
    if (
      path.startsWith("/admin/") ||
      ["/auth/logout", "/auth/change-password"].includes(path)
    ) {
      if (!signedIn || expired) return failure(401, "Session expired");
      if (method !== "GET")
        assert.equal(headers["x-csrf-token"], csrf, "CSRF required");
      if (
        role === "editor" &&
        (path.startsWith("/admin/users") || method === "DELETE")
      )
        return failure(403, "Forbidden");
    }
    if (path === "/auth/logout") {
      signedIn = false;
      return respond({ message: "Signed out" });
    }
    if (path === "/auth/change-password") {
      signedIn = false;
      return respond({ message: "Password changed" });
    }
    if (path === "/admin/dashboard") {
      assert.equal(url.search, "");
      return respond({
        eventsByStatus: [],
        eventsByTemporal: [],
        albums: rows.albums.length,
        galleryImages: images.length,
        testimonials: [],
        businessesByStatus: [],
        businessesByCategory: [],
        activeServices: 0,
        recentUpdates: [],
        nextUpcomingEvents: [],
      });
    }
    if (/^\/admin\/albums\/[a-f0-9]+\/images$/.test(path)) {
      if (method === "GET") return list(images);
      if (method === "POST") {
        const raw = req.postDataBuffer().toString("utf8");
        const metadata = JSON.parse(
          raw.match(/name="metadata"\r\n\r\n([^\r]+)\r\n/)[1],
        );
        assert.ok(metadata.length <= 10);
        assert.equal(
          (raw.match(/name="images";/g) || []).length,
          metadata.length,
        );
        uploadMetadata.push(metadata);
        uploadCount++;
        const results = metadata.map((item, index) => {
          const success = uploadCount > 1 || index === 0;
          const image = {
            _id: oid(nextId++),
            album: oid(20),
            media,
            title: item.title,
            caption: item.caption,
            alt: item.alt,
            status: item.status,
            displayOrder: index,
          };
          if (success) images.push(image);
          return {
            index,
            key: item.key,
            success,
            ...(success
              ? { image }
              : { status: 415, error: { message: "Invalid static image" } }),
          };
        });
        return respond({ results }, uploadCount === 1 ? 207 : 201);
      }
    }
    if (/^\/admin\/albums\/[a-f0-9]+\/images\/order$/.test(path)) {
      assert.equal(new Set(body.imageIds).size, body.imageIds.length);
      return respond({ message: "Order updated" });
    }
    if (/^\/admin\/albums\/[a-f0-9]+\/cover$/.test(path))
      return respond({ ...rows.albums[0], coverImage: body.imageId });
    const mediaRoute = path.match(
      /^\/admin\/(events|businesses|testimonials|business-categories)\/([a-f0-9]+)\/(cover|photo|image)$/,
    );
    if (mediaRoute) {
      const raw = req.postDataBuffer()?.toString("utf8") || "";
      assert.equal((raw.match(/name="images";/g) || []).length, 1);
      assert.equal(
        (raw.match(/Content-Disposition: form-data;/g) || []).length,
        1,
      );
      const row = rows[mediaRoute[1]].find(
        (item) => item._id === mediaRoute[2],
      );
      row[mediaRoute[3]] = media;
      return respond(row);
    }
    if (/^\/admin\/businesses\/[a-f0-9]+\/services$/.test(path))
      return method === "GET"
        ? list([])
        : respond({ _id: oid(nextId++), ...body }, 201);
    const match = path.match(
      /^\/admin\/(events|albums|testimonials|business-categories|businesses|users)(?:\/([a-f0-9]+))?(?:\/(status))?$/,
    );
    if (match) {
      const [, resource, id, status] = match;
      const data = rows[resource];
      if (method === "GET")
        return id
          ? respond(data.find((item) => item._id === id))
          : list(
              data.filter(
                (item) =>
                  !url.searchParams.get("status") ||
                  item.status === url.searchParams.get("status"),
              ),
            );
      if (method === "POST") {
        if (resource === "events" && fieldFailure) {
          fieldFailure = false;
          return failure(400, "Please correct title", [
            { path: "title", message: "A more specific title is required." },
          ]);
        }
        const created = {
          _id: oid(nextId++),
          ...body,
          ...(resource === "users"
            ? { invitationSent: false }
            : { slug: "test-" + nextId }),
        };
        data.push(created);
        return respond(created, 201);
      }
      const row = data.find((item) => item._id === id);
      if (!row) return failure(404, "Not found");
      if (method === "PATCH") {
        if (status) assert.deepEqual(Object.keys(body), ["status"]);
        Object.assign(row, body);
        return respond(row);
      }
      if (method === "DELETE") {
        data.splice(data.indexOf(row), 1);
        return respond({ message: "Deleted" });
      }
    }
    if (method === "GET") {
      const detail = path.match(
        /^\/(events|albums|businesses)\/slug\/([^/]+)(?:\/(images|services))?$/,
      );
      if (detail) {
        const row = rows[detail[1]].find((item) => item.slug === detail[2]);
        return detail[3]
          ? list(detail[3] === "images" ? images : [])
          : row
            ? respond(row)
            : failure(404, "Not found");
      }
      if (path === "/gallery/images") return list(images);
      const resource = path.slice(1);
      if (rows[resource])
        return list(
          rows[resource].filter(
            (item) => item.status === "published" || item.active,
          ),
        );
    }
    if (path === "/testimonials/submit")
      return respond(
        {
          id: oid(nextId++),
          status: "pending",
          message: "Thank you. Your testimonial is awaiting review.",
        },
        201,
      );
    unexpected.push(method + " " + path);
    return failure(404, "Unexpected test endpoint");
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin + "/#/admin/events");
  await page
    .getByRole("button", { name: "Member Login", exact: true })
    .waitFor();
  await page.getByLabel(/^Email address/).fill("admin@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("test-password-long-enough");
  await page.getByRole("button", { name: "Member Login", exact: true }).click();
  await page.getByRole("button", { name: "Create event / activity" }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel(/^Title/).fill("Community API Event");
  await dialog.getByLabel("Date precision").selectOption("exact");
  await dialog.getByLabel("Starts at").fill("2027-07-04T14:00");
  await dialog.getByLabel("Status", { exact: true }).selectOption("published");
  fieldFailure = true;
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await dialog.getByText("A more specific title is required.").waitFor();
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await dialog.waitFor({ state: "hidden" });
  const create = requests
    .filter((req) => req.path === "/admin/events" && req.method === "POST")
    .at(-1).body;
  assert.match(create.startsAt, /\+10:00$/);
  assert.equal(create.datePrecision, "exact");
  assert.ok(!("year" in create) && !("month" in create));
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Date precision").selectOption("month");
  await dialog.getByLabel("Year", { exact: true }).fill("2027");
  await dialog.getByLabel("Month", { exact: true }).fill("11");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await dialog.waitFor({ state: "hidden" });
  const patch = requests
    .filter(
      (req) => req.path.startsWith("/admin/events/") && req.method === "PATCH",
    )
    .at(-1).body;
  assert.equal(patch.startsAt, null);
  assert.equal(patch.year, 2027);
  assert.equal(patch.month, 11);
  assert.ok(!("title" in patch));
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Cover image", { exact: true })
    .setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: png });
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await dialog.waitFor({ state: "hidden" });
  console.log(
    "PASS cookie client, login, CSRF, field errors, Sydney date offset, precision PATCH and cover multipart",
  );

  await page.goto(origin + "/#/admin/gallery");
  await page.getByRole("button", { name: "Create album" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Album title").fill("Community API Album");
  await dialog.getByLabel("Status", { exact: true }).selectOption("published");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Manage / upload images" }).click();
  await page.getByLabel("Add images / bulk upload").setInputFiles([
    { name: "one.png", mimeType: "image/png", buffer: png },
    { name: "two.png", mimeType: "image/png", buffer: png },
  ]);
  await page.getByRole("button", { name: "Upload selected images" }).click();
  await page.getByText("Invalid static image", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Upload / retry failed files" })
    .click();
  await page
    .getByRole("button", { name: "Dismiss", exact: true })
    .nth(1)
    .waitFor();
  assert.equal(uploadMetadata[0].length, 2);
  assert.equal(uploadMetadata[1].length, 1);
  assert.equal(uploadMetadata[1][0].key, uploadMetadata[0][1].key);
  assert.notEqual(uploadMetadata[1][0].key, uploadMetadata[0][0].key);
  await page
    .getByRole("button", { name: "Set cover", exact: true })
    .first()
    .click();
  await page.getByText("Album cover updated.", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Move later", exact: true })
    .first()
    .click();
  await page.getByText("Image order saved.", { exact: true }).waitFor();
  console.log(
    "PASS album creation, 207 per-file results, retry only failed with stable key, cover and ordering",
  );

  await page.goto(origin + "/#/admin/users");
  await page
    .getByRole("button", { name: "Invite administrator", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel(/^Full name/).fill("New Editor");
  await dialog.getByLabel(/^Email address/).fill("editor@example.test");
  await dialog.getByRole("button", { name: "Send invitation" }).click();
  await dialog.getByRole("button", { name: "Resend invitation" }).waitFor();
  assert.ok(
    !(
      "password" in
      requests.find(
        (req) => req.path === "/admin/users" && req.method === "POST",
      ).body
    ),
  );
  await dialog.getByRole("button", { name: "Resend invitation" }).click();
  await dialog
    .getByText("If the account exists, a reset link has been sent.")
    .waitFor();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.goto(origin + "/#/admin/testimonials");
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/admin/testimonials") &&
        response.url().includes("status=pending"),
    ),
    page.getByRole("button", { name: "Moderation queue" }).click(),
  ]);
  await page
    .getByRole("button", { name: "Add testimonial", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel(/^Full name/).fill("API Member");
  await dialog.getByLabel(/^Testimonial/).fill("A welcoming community.");
  await dialog.getByLabel("Status", { exact: true }).selectOption("published");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.goto(origin + "/#/admin/business-categories");
  await page.getByRole("button", { name: "Add category" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Category name").fill("API Category");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await dialog.waitFor({ state: "hidden" });
  const categoryBody = requests.find(
    (req) => req.path === "/admin/business-categories" && req.method === "POST",
  ).body;
  assert.ok("active" in categoryBody);
  assert.ok(!("status" in categoryBody));
  await page.goto(origin + "/#/admin/businesses");
  await page.getByRole("button", { name: "Add business" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Business name").fill("API Business");
  await dialog.getByLabel(/^Business category/).selectOption(oid(3));
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Manage services" }).click();
  await page.getByRole("button", { name: "Add service" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Service title").fill("Community catering");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await dialog.waitFor({ state: "hidden" });
  console.log(
    "PASS invitation failure/resend, moderation, active categories, businesses and services",
  );

  await page.goto(origin);
  await page
    .getByRole("heading", { name: "Community API Album", exact: true })
    .waitFor();
  await page
    .getByRole("heading", { name: "API Member", exact: true })
    .waitFor();
  await page.goto(origin + "/#/events");
  await page.getByRole("button", { name: "past", exact: true }).click();
  await page.waitForTimeout(100);
  assert.ok(
    requests.some(
      (req) => req.path === "/events" && req.search.includes("temporal=past"),
    ),
  );
  await page.goto(origin + "/#/albums/" + rows.albums[0].slug);
  await page.getByRole("heading", { name: "Album photos" }).waitFor();
  await page.goto(origin + "/#/businesses");
  await page.getByLabel("Suburb / location").fill("Sydney");
  await page.waitForTimeout(100);
  assert.ok(
    requests.some(
      (req) =>
        req.path === "/businesses" && req.search.includes("location=Sydney"),
    ),
  );
  await page.goto(origin + "/#/testimonials");
  await page.getByRole("button", { name: "Share your testimonial" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel(/^Full name/).fill("Visitor");
  await dialog
    .getByLabel("Your testimonial")
    .fill("Thank you for the community events.");
  await dialog.getByRole("button", { name: "Submit for review" }).click();
  await dialog
    .getByText("Thank you. Your testimonial is awaiting review.")
    .waitFor();
  const submitted = requests.find(
    (req) => req.path === "/testimonials/submit",
  ).body;
  assert.equal(submitted.website, "");
  assert.equal(submitted.rating, 5);
  console.log(
    "PASS public home, event tabs, album details, business filters and moderated testimonial submission",
  );

  await page.goto(origin + "/reset-password?token=" + "a".repeat(64));
  await page.getByRole("heading", { name: "Set your password" }).waitFor();
  assert.ok(!page.url().includes("token="));
  assert.equal(
    await page.evaluate(() => localStorage.getItem("csrfToken")),
    null,
  );
  await page.getByLabel("New password").fill("new-test-password-123");
  await page.getByLabel("Confirm password").fill("new-test-password-123");
  await page.getByRole("button", { name: "Save password" }).click();
  await page.getByText("Password updated. Sign in again.").waitFor();
  role = "editor";
  await page.goto(origin + "/#/admin/events");
  await page.reload();
  await page.getByRole("button", { name: "Create event / activity" }).waitFor();
  assert.equal(
    await page
      .getByRole("link", { name: "User management", exact: true })
      .count(),
    0,
  );
  assert.equal(
    await page.getByRole("button", { name: "Delete", exact: true }).count(),
    0,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Create event / activity" }).click();
  dialog = page.getByRole("dialog");
  const bounds = await dialog.boundingBox();
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390);
  await dialog.getByRole("button", { name: "Cancel" }).click();
  expired = true;
  await page.goto(origin + "/#/admin/gallery");
  await page
    .getByRole("button", { name: "Member Login", exact: true })
    .waitFor();
  await page.goto(origin + "/reset-password?token=" + "b".repeat(64));
  await page.getByLabel("New password").fill("another-password-123");
  await page.getByLabel("Confirm password").fill("another-password-123");
  await page.getByRole("button", { name: "Save password" }).click();
  await page
    .getByText("This link is invalid or expired (links last 15 minutes).", {
      exact: false,
    })
    .waitFor();
  await page.getByRole("link", { name: "Request a new link" }).click();
  rateLimited = true;
  await page.getByLabel("Email address").fill("admin@example.test");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Try again in 60 seconds" })
    .waitFor();
  const beforeRetry = requests.filter(
    (req) => req.path === "/auth/forgot-password",
  ).length;
  await page.getByRole("button", { name: "Send reset link" }).click();
  await page.getByRole("alert").filter({ hasText: "Please wait" }).waitFor();
  assert.equal(
    requests.filter((req) => req.path === "/auth/forgot-password").length,
    beforeRetry,
  );
  console.log(
    "PASS expired reset links and Retry-After cooldown without repeated requests",
  );
  assert.deepEqual(await page.evaluate(() => window.__badCredentials), []);
  assert.deepEqual(unexpected, []);
  assert.deepEqual(errors, []);
  assert.ok(requests.every((req) => !req.headers.authorization));
  console.log(
    "PASS direct reset route/token removal, editor permissions, phone modal and 401 redirect",
  );
} finally {
  await browser?.close();
  if (server.exitCode === null)
    await new Promise((resolve) => {
      server.once("exit", resolve);
      server.kill();
    });
}
