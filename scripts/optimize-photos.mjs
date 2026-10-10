// Resizes photos in src/assets/photos for the web and writes grid thumbnails.
// Run after adding new photos: npm run photos
import { readdir, stat, rename } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const PHOTO_DIR = "src/assets/photos";
const THUMB_DIR = path.join(PHOTO_DIR, "thumbs");
const FULL_MAX = 2000; // longest edge for full-size viewing
const THUMB_WIDTH = 640; // grid thumbnails

const files = (await readdir(PHOTO_DIR)).filter((f) => /\.jpe?g$/i.test(f));

for (const file of files) {
  const src = path.join(PHOTO_DIR, file);
  const before = (await stat(src)).size;
  const meta = await sharp(src).metadata();

  if (Math.max(meta.width ?? 0, meta.height ?? 0) > FULL_MAX) {
    const tmp = `${src}.tmp`;
    await sharp(src)
      .rotate() // bake in EXIF orientation before metadata is dropped
      .resize({ width: FULL_MAX, height: FULL_MAX, fit: "inside" })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(tmp);
    await rename(tmp, src);
  }

  await sharp(src)
    .rotate()
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 75, mozjpeg: true })
    .toFile(path.join(THUMB_DIR, file));

  const after = (await stat(src)).size;
  console.log(`${file}: ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(2)} MB`);
}
