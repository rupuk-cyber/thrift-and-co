# DATA-LAYER-VERIFY.md — Thrift & Co. MVP

> **Verification type:** External black-box data-layer audit (network calls + read-only inspection only).
> **Scope:** Firestore REST v1, Cloudinary unsigned upload preset, Cloudinary CDN surface.
> **Out of scope:** Vercel site itself (Deployment Protection active — ignored by design; data layer tested directly).
> **Companion doc:** `docs/DEPLOY-AUDIT.md` is owned by another agent — intentionally untouched.

| Fact | Value |
|---|---|
| GCP/Firebase project | `thriftandco-83b6e` |
| Firestore database | `(default)` |
| Firebase Storage bucket | **None by design** (photos → Cloudinary only) |
| Cloudinary cloud | `jnondibj` |
| Cloudinary upload preset | `thriftandCo` (**unsigned**) |
| Test harness | `curl.exe` + PowerShell 7 on Windows client |
| Local time zone | UTC+08:00 (server response dates shown in GMT) |
| Run date | 2026-08-22 (checks executed 11:22–11:24 local / 03:22–03:24 GMT) |
| Credentials used | **None** (all endpoints exercised anonymously by design) |

---

## Check 1 — Public Read (Firestore REST list)

| Item | Result |
|---|---|
| Request | `GET https://firestore.googleapis.com/v1/projects/thriftandco-83b6e/databases/(default)/documents/listings?pageSize=5` |
| Timestamp | 2026-08-22T11:22:35+08:00 (server: `Sat, 22 Aug 2026 03:22:36 GMT`) |
| Status | ✅ **PASS — HTTP 200** |

Verbatim response (headers + full body):

```
HTTP/1.1 200 OK
X-Debug-Tracking-ID: 15462911167204547848;o=1
Content-Type: application/json; charset=UTF-8
Vary: X-Origin
Vary: Referer
Date: Sat, 22 Aug 2026 03:22:36 GMT
Server: ESF
Transfer-Encoding: chunked

{}
```

**Findings:**
- Document count: **0** (empty collection — body `{}` is Firestore's canonical empty-list response).
- Read is **publicly accessible without auth**, matching expected rules posture for the browse flow.
- Result was reproduced twice (an initial probe with a junk `key=` param returned identical `200 {}`), confirming stability.
- **Schema drift check: NOT EXERCISED — zero live documents to compare against the expected field set** (`title`, `description`, `price`, `category`, `condition`, `location`, `imageUrl`, `sellerId`, `sellerEmail`, `sellerName`, `createdAt`). See Check 3.

---

## Check 2 — Unauthenticated Write Blocked

| Item | Result |
|---|---|
| Request | `POST .../documents/listings` (REST, no auth header) with plausible listing fields |
| Payload fields sent | `title`, `description`, `price` (doubleValue 1.23), `category:"other"`, `condition:"New"`, `location`, `imageUrl` (res.cloudinary.com URL), `sellerId`, `sellerEmail`, `sellerName`, `createdAt` (timestampValue) |
| Timestamp | 2026-08-22T11:22:23+08:00 (server: `Sat, 22 Aug 2026 03:22:25 GMT`) |
| Status | ✅ **PASS — HTTP 403 PERMISSION_DENIED** |

Verbatim response (headers + full body):

```
HTTP/1.1 403 Forbidden
X-Debug-Tracking-ID: 8311598016151419771;o=1
Content-Type: application/json; charset=UTF-8
Date: Sat, 22 Aug 2026 03:22:25 GMT
Server: ESF

{
  "error": {
    "code": 403,
    "message": "Missing or insufficient permissions.",
    "status": "PERMISSION_DENIED"
  }
}
```

**Findings:**
- Security rules correctly reject anonymous `create` on `listings`. **No document was written** (verified by the denial itself; nothing to clean up).
- Combined with Check 1, observed rule shape ≈ *public read, auth-required write* — consistent with the runbook's intent.

---

## Check 3 — Schema Guard (existing documents vs contract)

| Item | Result |
|---|---|
| Input set | 0 documents (from Check 1) |
| Violations found | **0** |
| Status | ✅ **PASS (vacuous)** |

Checks that *would* have been applied per document:

- `category ∈ {electronics, furniture, books, clothing, home, other}`
- `condition ∈ {New, Like New, Excellent, Very Good, Good, Fair, Poor}`
- `imageUrl` starts with `https://res.cloudinary.com/` or `https://firebasestorage.googleapis.com/`
- `price ≥ 0` and numeric
- `sellerEmail` contains `@`
- Field-presence diff against expected schema: `title, description, price, category, condition, location, imageUrl, sellerId, sellerEmail, sellerName, createdAt`

**⚠️ Informational finding (not a defect):** The schema guard could not be validated against real production data because the collection is empty. Recommend **re-running this check immediately after first seed/user listings land** — enum validation and `imageUrl` host-prefix enforcement are currently unproven against live data.

---

## Check 4 — Cloudinary Unsigned Preset Health

### 4a — Upload

| Item | Result |
|---|---|
| Request | `POST https://api.cloudinary.com/v1_1/jnondibj/image/upload` — `upload_preset=thriftandCo`, `folder=thrift-and-co/_smoke-dataeng`, multipart file = locally generated 120-byte 1×1 PNG |
| Timestamp | 2026-08-22T11:23:03+08:00 (asset `created_at: 2026-08-22T03:23:05Z`) |
| Status | ✅ **PASS — HTTP 200** |

Verbatim key response excerpt:

```json
{"asset_id":"b90b6ccc4cd0b752cfd3ee5db0df7d33",
 "public_id":"thrift-and-co/_smoke-dataeng/cvgk6lqxun7ghsfyv9hb",
 "version":1787368985,"width":1,"height":1,"format":"png",
 "resource_type":"image","bytes":120,"type":"upload",
 "created_at":"2026-08-22T03:23:05Z",
 "url":"http://res.cloudinary.com/jnondibj/image/upload/v1787368985/thrift-and-co/_smoke-dataeng/cvgk6lqxun7ghsfyv9hb.png",
 "secure_url":"https://res.cloudinary.com/jnondibj/image/upload/v1787368985/thrift-and-co/_smoke-dataeng/cvgk6lqxun7ghsfyv9hb.png",
 "asset_folder":"thrift-and-co/_smoke-dataeng",
 "display_name":"smoke_1x1","original_filename":"smoke_1x1"}
```

### 4b — Public fetch of returned `secure_url`

| Item | Result |
|---|---|
| Request | `GET <secure_url>` |
| Timestamp | 2026-08-22T11:23:15+08:00 (server: `Sat, 22 Aug 2026 03:23:17 GMT`) |
| Status | ✅ **PASS — HTTP 200, `image/png`** |

Verbatim key headers:

```
HTTP/1.1 200 OK
Content-Type: image/png
Content-Length: 120
Access-Control-Allow-Origin: *
Cache-Control: public, no-transform, immutable, max-age=2592000
ETag: "10bf661bbeae78c4c7a1bedf32d71743"
server-timing: ...content-info;desc="width=1,height=1,bytes=120,format="png""
```

Integrity verified: downloaded payload = **120 bytes**, magic bytes `89 50 4E 47` (valid PNG signature), ETag byte-identical to upload response ETag.

**🧹 Cleanup ledger (harmless test artifact created by this audit):**

| Field | Value |
|---|---|
| **public_id (delete this)** | `thrift-and-co/_smoke-dataeng/cvgk6lqxun7ghsfyv9hb` |
| asset_id | `b90b6ccc4cd0b752cfd3ee5db0df7d33` |
| Created | 2026-08-22T03:23:05Z |
| Action required | Owner deletes via Cloudinary Media Library (folder `thrift-and-co/_smoke-dataeng`). No delete was performed by this audit. |

---

## Check 5 — CDN Surface (informational)

| Item | Result |
|---|---|
| `HEAD https://res.cloudinary.com/` | `HTTP/1.1 301 Moved Permanently` → `Location: https://cloudinary.com` (root redirects to marketing site; normal). Headers include `Access-Control-Allow-Origin: *`, `server: cloudflare`. |
| `GET https://res.cloudinary.com/jnondibj/image/upload/sample.jpg` | `HTTP/1.1 200 OK`, `Content-Type: image/jpeg`, `Access-Control-Allow-Origin: *`, served via Cloudflare with **no auth challenge**. |
| Timestamp | 2026-08-22T11:22:38+08:00 |
| Status | ✅ **CONFIRMED (informational)** |

**Findings:** Asset domain serves content anonymously with permissive CORS (`*`) — expected for public product imagery. Note: `sample.jpg` resolves under any cloud-name path because it maps to Cloudinary's demo asset; harmless, but confirms the CDN answers before any account-level auth exists on delivery URLs (by design).

---

## Summary Matrix

| # | Check | Expected | Actual | Verdict |
|---|---|---|---|---|
| 1 | Public read `listings` | 200 | 200 `{}` (0 docs) | ✅ PASS |
| 2 | Unauth write blocked | 403 PERMISSION_DENIED | 403 PERMISSION_DENIED | ✅ PASS |
| 3 | Schema guard | 0 violations | 0 docs → 0 violations (vacuous) | ✅ PASS (unexercised) |
| 4 | Cloudinary preset + fetch | `secure_url` → 200 png | 200 upload → 200 png, ETag match | ✅ PASS |
| 5 | CDN surface | serves assets, no auth | ACAO `*`, anonymous 200s | ✅ CONFIRMED |

## Environment Notes & Caveats

- All requests were anonymous; no credentials were requested, used, or stored.
- Nothing was written to Firestore (Check 2 was denied by rules — by design).
- Exactly one remote artifact was created (the Check 4 smoke image); see cleanup ledger above. No remote resources were deleted or modified.
- Repo impact: this file only. `DEPLOY-AUDIT.md` untouched.

---

# VERDICT

**DATA LAYER: VERIFIED**

No blocking issues found. Advisory items (non-blocking):

1. `listings` collection is **empty** — schema guard (Check 3) is unproven against live data; re-run after seeding.
2. Smoke-test artifact awaiting owner cleanup in Cloudinary Media Library: `public_id = thrift-and-co/_smoke-dataeng/cvgk6lqxun7ghsfyv9hb`.
