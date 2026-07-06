# Public API — For Consuming Websites

This is the only endpoint your Vercel-hosted websites need to integrate. It requires no authentication and is safe to call from server or client code on any site.

Base URL: your deployed app's domain (e.g. `https://your-app.replit.app`).

---

## `GET /api/public/websites/{slug}/links`

Returns the currently active links for a website, one URL per platform. If a platform has multiple active links, the one with the highest `priority` wins.

**Auth:** none required.

**Path parameter:**
| Name | Type | Description |
|------|------|--------------|
| `slug` | string | The website's unique slug (set in the dashboard) |

**Example request:**
```bash
curl https://your-app.replit.app/api/public/websites/website-a/links
```

**Example response — `200 OK`:**
```json
{
  "website": "website-a",
  "whatsapp": "https://wa.me/123456789",
  "telegram": "https://t.me/example"
}
```
If a website has links on other platforms (e.g. `signal`, `discord`), those show up as extra keys in the same object using the platform name. `whatsapp`/`telegram` are always present (as `null` if not set) since those are the two platforms most integrations care about.

**Error responses:**
| Status | Body | When |
|--------|------|------|
| `404` | `{ "error": "Website not found or inactive" }` | Slug doesn't exist, or the website itself is set to `inactive` |

**Caching:** the response is sent with:
```
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```
This means CDN/edge caches (including Vercel's Data Cache) can serve it for 60 seconds without hitting this server, and keep serving a stale copy for up to 5 minutes while revalidating in the background if this server is briefly unreachable.

---

## Recommended integration

**Server Component (Next.js) — cheapest option, uses Vercel's Data Cache:**
```ts
const res = await fetch(
  "https://your-app.replit.app/api/public/websites/website-a/links",
  { next: { revalidate: 60 } }
);
const { whatsapp, telegram } = await res.json();
```

**Client-side fetch, with a last-known-good fallback:**
```ts
async function getCheckoutLinks() {
  try {
    const res = await fetch(
      "https://your-app.replit.app/api/public/websites/website-a/links"
    );
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    localStorage.setItem("checkout-links", JSON.stringify(data));
    return data;
  } catch {
    const cached = localStorage.getItem("checkout-links");
    return cached ? JSON.parse(cached) : { whatsapp: null, telegram: null };
  }
}
```

Prefer the Server Component approach where possible — it avoids a network round-trip per visitor and keeps your serverless function invocations low on a free Vercel plan.
