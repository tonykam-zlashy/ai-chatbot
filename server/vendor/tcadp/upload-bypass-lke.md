# Upload Bypass LKE — Analysis

## What Changed

The `upload()` method in `tcadp.py` previously called LKE's **`DescribeStorageCredential`** API to broker temporary COS credentials for each file upload. It now uses **static COS credentials** from `.env` directly, bypassing LKE entirely for the upload step.

---

## Original Flow (`DescribeStorageCredential`)

```
POST /file/upload
  └─ TCADP.upload()
       ├─ DescribeStorageCredential (LKE API via tc_request)
       │    Returns: { TmpSecretId, TmpSecretKey, Token, Bucket, Region,
       │               UploadUrl (presigned), UploadPath, FileUrl }
       ├─ Read request stream body
       ├─ If UploadUrl exists → PUT directly to presigned URL (fastest)
       │  Else → AsyncWareHouseS3 with temp credentials
       └─ Return { Url, CosUrl, CosBucket }
```

### `DescribeStorageCredential` Response Fields

| Field | Purpose |
|---|---|
| `Credentials.TmpSecretId` | Temp access key (short-lived, rotated per upload) |
| `Credentials.TmpSecretKey` | Temp secret key |
| `Credentials.Token` | Session token (required for temp creds) |
| `Bucket` | Which COS bucket to use (dynamic, set by LKE platform) |
| `Region` | Bucket region |
| `UploadUrl` | **Presigned URL** — fastest upload path (direct PUT, no SDK) |
| `UploadPath` | Object key in bucket (e.g. `/public/xxx/file.pdf`) |
| `FileUrl` | LKE-recognizable URL (used downstream by doc parse & chat) |
| `DownloadUrl` | (claw mode only) Public URL for agent access |

---

## New Flow (Direct COS)

```
POST /file/upload
  └─ TCADP.upload()
       ├─ Read request stream body
       ├─ AsyncWareHouseS3 with permanent creds from tagentic_config
       │    TC_SECRET_ID, TC_SECRET_KEY, COS_REGION, COS_BUCKET
       ├─ Upload path: /uploads/{account_id}/{uuid}.{ext}
       └─ Return { Url, CosUrl, CosBucket }
```

### Config Values Used

| Config | Source |
|---|---|
| `TC_SECRET_ID` | `.env` / `TAgenticConfig` |
| `TC_SECRET_KEY` | `.env` / `TAgenticConfig` |
| `COS_REGION` | `.env` / `TAgenticConfig` (default: `ap-guangzhou`) |
| `COS_BUCKET` | `.env` / `TAgenticConfig` |

---

## Side-by-Side Comparison

| Aspect | Before (LKE) | After (Direct COS) |
|---|---|---|
| **Credentials** | Temp, rotated per upload | Permanent `TC_SECRET_ID`/`TC_SECRET_KEY` |
| **Session token** | Required (`Token` from LKE) | `""` (permanent keys don't need it) |
| **Bucket** | Dynamic — returned by LKE per-request | Static — `COS_BUCKET` from `.env` |
| **Region** | Dynamic — returned by LKE | Static — `COS_REGION` from `.env` |
| **Upload method** | Presigned URL (direct PUT, fastest) or S3 SDK fallback | S3 SDK only |
| **Presigned URL** | Available for zero-SDK upload | Not generated |
| **`FileUrl` format** | LKE-recognizable path | Manually constructed URL |
| **Claw mode** | Called LKE twice (upload + get `DownloadUrl`) | Claw `DownloadUrl` step **skipped** |

---

## Other LKE/ADP Dependencies — NOT Affected

These still call Tencent Cloud LKE/ADP APIs and are unchanged:

| Component | API/Endpoint | Service |
|---|---|---|
| `get_info()` — app greeting, name, config | `DescribeRobotBizIDByAppKey` + `DescribeApp` | LKE + ADP |
| Chat SSE — send/receive messages | Direct SSE to `wss.lke...` | LKE SSE |
| `parse_document()` — get `doc_id` for AI | Direct SSE to `/v1/qbot/chat/docParse` | LKE SSE |
| Conversation history | `DescribeConversationMessageList` | ADP |
| Workspace/file listing | `CreateWorkspaceCredential` | ADP |
| Rate feedback | `RateMsgRecord` | LKE |
| Reference details | `DescribeRefer` | LKE |
| Forward requests | Dynamic (via `action_version.json` routing) | LKE / ADP |

---

## Potential Side Effects

### 1. Document Parsing (`/file/parse`) May Fail

The `parse_document()` function sends `cos_url` + `cos_bucket` to LKE's docParse SSE endpoint. If LKE expects a specific URL format (like the `FileUrl` from `DescribeStorageCredential`), the manually constructed URL/path might not match.

**Observed error:** `"Request parameter error, please refer to the access document."`

**To fix:** Verify the exact `cos_url` format LKE expects for docParse.

### 2. Claw/Agent Mode Uploads Degraded

The original code called `DescribeStorageCredential` a second time in claw mode to get a public `DownloadUrl` for agent access. This step is now **skipped**. If claw mode uploads are needed, this path must be restored.

### 3. No Signed URL Optimization

The original had a fast path using a presigned `UploadUrl` (PUT directly to COS, no SDK). We now always use the S3 SDK (`AsyncWareHouseS3`), which is slightly heavier but functionally identical.

### 4. Security: Permanent Keys in `.env`

LKE's approach used **short-lived temp credentials** rotated per upload. If the temp token leaked, it expired within minutes. Permanent `TC_SECRET_ID`/`TC_SECRET_KEY` in `.env` have indefinite access — if compromised, the bucket is exposed until the key is revoked.

### 5. Static Bucket Config

The LKE approach could dynamically route to different buckets per-request (based on `BotBizId`, file type, etc.). The bucket is now fixed to the value of `COS_BUCKET`.

---

## Summary

```
Removed:  DescribeStorageCredential (LKE API) ── temp COS creds broker
Kept:     All other LKE/ADP calls ── chat SSE, doc parse, app info, etc.

Risk:     Low for standard mode
          Claw mode upload is degraded
          doc parse may need cos_url format adjustment
          Security profile changes (permanent vs temp keys)
```
