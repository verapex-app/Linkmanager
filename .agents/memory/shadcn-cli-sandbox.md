---
name: shadcn CLI is unreliable in the agent sandbox
description: shadcn@latest init hangs on interactive prompts and rejects some flag values; write shadcn-style components by hand instead.
---

`npx shadcn@latest init` presents an interactive "Select a component library" prompt that can't be answered non-interactively, and `-b <color>` rejects previously-valid values like `neutral` (only `radix`/`base` accepted in some versions).

**Why:** the CLI's flag/prompt surface has shifted across versions and isn't scriptable reliably in a non-TTY bash tool call.

**How to apply:** skip the CLI. Hand-write the needed shadcn-style primitives (button, input, card, dialog, select, switch, table, tabs, alert-dialog, badge, label, textarea) directly using Radix primitives + `class-variance-authority` + the project's `cn()` helper. This is fast and avoids CLI hangs entirely.
