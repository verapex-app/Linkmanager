---
name: Next.js scaffolding in non-empty Replit directory
description: create-next-app fails when the project root already has Replit scaffolding files; workaround is scaffolding elsewhere and copying in.
---

`create-next-app` refuses to run in a directory containing files like `.replit`, `.git`, `.config`, `.upm`, `.cache`, even with `--no-git`.

**Why:** its non-empty-directory check flags these as conflicts regardless of flags.

**How to apply:** scaffold into a throwaway directory (e.g. `/tmp/nextapp`) with `create-next-app@latest . <flags>`, then `cp -r` (with dotglob) its contents into the real project root, then delete the temp dir. Afterwards patch `package.json` scripts to bind `next dev`/`next start` to `-H 0.0.0.0 -p 5000` and add `allowedDevOrigins` in `next.config.ts` for the Replit proxy.
