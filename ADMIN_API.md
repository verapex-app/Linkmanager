# Admin API — Internal Dashboard API

These endpoints power the admin dashboard UI itself (websites/links management, stats). They are not meant for the consuming Vercel websites — see `PUBLIC_API.md` for that.

Base URL: your deployed app's domain, or `http://localhost:5000` in development.

**Auth:** every endpoint below requires a valid session. Sessions are issued by `POST /api/auth/login` as an httpOnly cookie (`lms_session`). There is currently no separate API-key/token auth for scripting — you'd need to log in first and reuse the cookie jar (e.g. `curl -c cookies.txt` then `-b cookies.txt` on subsequent requests).

---

## Auth

### `POST /api/auth/login`
Logs in and sets the session cookie.

**Body:**
```json
{ "email": "admin@example.com", "password": "ChangeMe123!" }
```

**Response `200`:**
```json
{ "user": { "id": 1, "email": "admin@example.com", "role": "admin" } }
```
**Errors:** `400` invalid format, `401` invalid credentials.

### `POST /api/auth/logout`
Clears the session cookie. No body. Response: `{ "success": true }`.

### `GET /api/auth/me`
Returns the currently logged-in user from the session cookie, or `401` if not logged in.

---

## Websites

### `GET /api/websites`
List all websites, each with its `links` array embedded.

**Response `200`:**
```json
{ "websites": [ { "id": 1, "name": "Website A", "slug": "website-a", "domain": "example.com", "status": "active", "links": [ /* ... */ ], "createdAt": "...", "updatedAt": "..." } ] }
```

### `POST /api/websites`
Create a website.

**Body:**
```json
{
  "name": "Website A",
  "slug": "website-a",
  "domain": "example.com",
  "status": "active"
}
```
- `name`: required, non-empty.
- `slug`: required, lowercase letters/numbers/hyphens only, must be unique.
- `domain`: optional.
- `status`: `"active"` or `"inactive"`, defaults to `"active"`.

**Response:** `201` with `{ "website": { ... } }`.
**Errors:** `400` validation error, `409` slug already exists.

### `GET /api/websites/{id}`
Get one website (with its `links`). `404` if not found.

### `PATCH /api/websites/{id}`
Partial update — send only the fields you want to change (same shape as `POST`, all optional). `409` if changing `slug` to one already in use. `404` if the website doesn't exist.

### `DELETE /api/websites/{id}`
Deletes the website **and cascades to delete all of its links**. Response: `{ "success": true }`. `404` if not found.

---

## Links

Links always belong to a website.

### `GET /api/websites/{id}/links`
List all links for a website (active and inactive), sorted by priority (desc) then creation date.

### `POST /api/websites/{id}/links`
Create a link under that website.

**Body:**
```json
{
  "platform": "whatsapp",
  "name": "Main WhatsApp",
  "url": "https://wa.me/123456789",
  "status": "active",
  "priority": 0,
  "notes": "optional"
}
```
- `platform`: one of `whatsapp`, `telegram`, `signal`, `messenger`, `instagram`, `discord`, `other`.
- `name`: required.
- `url`: required, must be a valid URL.
- `status`: `"active"` or `"inactive"`, defaults to `"active"`.
- `priority`: integer, higher wins when multiple active links share a platform. Defaults to `0`.
- `notes`: optional free text.

**Response:** `201` with `{ "link": { ... } }`. `404` if the website doesn't exist.

### `PATCH /api/links/{id}`
Partial update — same fields as create, all optional (can't move a link to a different website via this endpoint). Commonly used to just flip `status` for the dashboard's active/inactive toggle. `404` if not found.

### `DELETE /api/links/{id}`
Deletes a single link. Response: `{ "success": true }`. `404` if not found.

---

## Stats

### `GET /api/stats`
Aggregate counts shown on the dashboard overview page.

**Response `200`:**
```json
{
  "totalWebsites": 5,
  "activeWebsites": 4,
  "totalLinks": 12,
  "activeWhatsappLinks": 5,
  "activeTelegramLinks": 4,
  "inactiveLinks": 2
}
```

---

## Data model reference

**Website**
| Field | Type | Notes |
|-------|------|-------|
| `id` | number | |
| `name` | string | |
| `slug` | string | unique, used in the public API URL |
| `domain` | string \| null | informational only |
| `status` | `"active" \| "inactive"` | inactive websites are hidden from the public API |
| `createdAt`, `updatedAt` | timestamp | |

**Link**
| Field | Type | Notes |
|-------|------|-------|
| `id` | number | |
| `websiteId` | number | foreign key |
| `platform` | `"whatsapp" \| "telegram" \| "signal" \| "messenger" \| "instagram" \| "discord" \| "other"` | extensible enum |
| `name` | string | internal label, not shown publicly |
| `url` | string | the actual checkout link |
| `status` | `"active" \| "inactive"` | only `active` links are returned publicly |
| `priority` | number | highest wins per platform |
| `notes` | string \| null | |
| `createdAt`, `updatedAt` | timestamp | |
