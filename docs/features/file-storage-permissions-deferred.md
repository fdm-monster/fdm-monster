# File Storage API — Deferred Feature: Permission-Based Access Control

**Category:** Planning
**Status:** Deferred from v0.3.0 Phase 4
**Version:** 1.0
**Last Updated:** 2026-03-13

## Overview

This document provides implementation guidance for adding permission-based access control to the FileStorage API. This feature was originally planned for v0.3.0 Phase 4 but has been deferred as permission management is currently out of scope for the File Management CRUD effort.

**Note:** Bulk operations (delete, analyze) remain in v0.3.0 Phase 4 scope and are NOT deferred.

---

## Feature Description

Add fine-grained permission controls to FileStorageController endpoints following the existing authorization pattern used in other controllers (e.g., `PrinterFilesController`).

**Priority:** Medium
**Complexity:** Low-Medium
**Estimated Effort:** 6-10 hours

---

## Implementation Requirements

### 1. Add Permission Constants

**File:** `src/constants/authorization.constants.ts`

```typescript
export const PERM_GROUP = {
  // ... existing groups
  FileStorage: "FileStorage",
} as const;

export const PERMS = {
  // ... existing permissions
  [PERM_GROUP.FileStorage]: {
    Default: "FileStorage.Default",
    List: "FileStorage.List",
    Get: "FileStorage.Get",
    Upload: "FileStorage.Upload",
    Delete: "FileStorage.Delete",
    Update: "FileStorage.Update",
    Analyze: "FileStorage.Analyze",
  },
} as const;
```

### 2. Update Role Permissions

**File:** `src/constants/authorization.constants.ts`

```typescript
export const ROLE_PERMS: Record<RoleName, PermissionName[]> = {
  [ROLES.ADMIN]: union(
    // ... existing permissions
    allPerms(PERM_GROUP.FileStorage),
  ),
  [ROLES.OPERATOR]: union(
    // ... existing permissions
    allPerms(PERM_GROUP.FileStorage),
  ),
  [ROLES.GUEST]: [],
};
```

### 3. Add Middleware to Controller

**File:** `src/controllers/file-storage.controller.ts`

```typescript
import { before } from "awilix-express";
import { authenticate, authorizeRoles, permission } from "@/middleware/authenticate";
import { PERMS, ROLES } from "@/constants/authorization.constants";

@route(AppConstants.apiRoute + "/file-storage")
@before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
export class FileStorageController {

  @GET()
  @before(permission(PERMS.FileStorage.List))
  async listFiles(req: Request, res: Response) { /* ... */ }

  @GET()
  @route("/:fileStorageId")
  @before(permission(PERMS.FileStorage.Get))
  async getFileInfo(req: Request, res: Response) { /* ... */ }

  @POST()
  @route("/upload")
  @before(permission(PERMS.FileStorage.Upload))
  async uploadFile(req: Request, res: Response) { /* ... */ }

  @PATCH()
  @route("/:fileStorageId")
  @before(permission(PERMS.FileStorage.Update))
  async updateFileMetadata(req: Request, res: Response) { /* ... */ }

  @DELETE()
  @route("/:fileStorageId")
  @before(permission(PERMS.FileStorage.Delete))
  async deleteFile(req: Request, res: Response) { /* ... */ }

  @POST()
  @route("/:fileStorageId/analyze")
  @before(permission(PERMS.FileStorage.Analyze))
  async analyzeFile(req: Request, res: Response) { /* ... */ }

  @GET()
  @route("/:fileStorageId/thumbnail/:index")
  @before(permission(PERMS.FileStorage.Get))
  async getThumbnail(req: Request, res: Response) { /* ... */ }

  // Bulk operations (if implemented in Phase 4)
  @POST()
  @route("/bulk/delete")
  @before(permission(PERMS.FileStorage.Delete))
  async bulkDeleteFiles(req: Request, res: Response) { /* ... */ }

  @POST()
  @route("/bulk/analyze")
  @before(permission(PERMS.FileStorage.Analyze))
  async bulkAnalyzeFiles(req: Request, res: Response) { /* ... */ }
}
```

---

## Testing Requirements

### 1. Test File Structure

**File:** `test/api/file-storage-permission.test.ts` (new file)

### 2. Test Coverage

All 7 existing endpoints (or 9 if bulk operations implemented) must be tested with:
- ADMIN role (should succeed - 200/201)
- OPERATOR role (should succeed - 200/201)
- GUEST role (should return 403 Forbidden)
- Unauthenticated (should return 401 Unauthorized)

**Minimum Tests:** 28 (7 endpoints × 4 scenarios) or 36 (9 endpoints × 4 scenarios)

### 3. Example Test Structure

```typescript
import { setupTestApp } from "../test-server";
import { ROLES } from "@/constants/authorization.constants";

describe("FileStorageController - Permission Tests", () => {
  let testApp: any;
  let testRequest: any;
  const baseRoute = "/api/file-storage";

  beforeAll(async () => {
    testApp = await setupTestApp();
    testRequest = testApp.request;
  });

  afterAll(async () => {
    await testApp.cleanup();
  });

  // Helper function to login and get token
  async function loginAs(role: string): Promise<string> {
    // Implementation depends on auth service
    // Return JWT token for given role
  }

  describe("GET /api/file-storage - List Files", () => {
    it("should allow ADMIN to list files", async () => {
      const token = await loginAs(ROLES.ADMIN);
      const res = await testRequest
        .get(baseRoute)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it("should allow OPERATOR to list files", async () => {
      const token = await loginAs(ROLES.OPERATOR);
      const res = await testRequest
        .get(baseRoute)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it("should deny GUEST from listing files", async () => {
      const token = await loginAs(ROLES.GUEST);
      const res = await testRequest
        .get(baseRoute)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it("should require authentication", async () => {
      const res = await testRequest.get(baseRoute);
      expect(res.status).toBe(401);
    });
  });

  // Repeat pattern for remaining endpoints:
  // - GET /:fileStorageId
  // - POST /upload
  // - PATCH /:fileStorageId
  // - DELETE /:fileStorageId
  // - POST /:fileStorageId/analyze
  // - GET /:fileStorageId/thumbnail/:index
  // - POST /bulk/delete (if implemented)
  // - POST /bulk/analyze (if implemented)
});
```

### 4. Test Requirements Per Rule 7

- NO guaranteed-success patterns
- Realistic assertions that can fail
- Test actual permission enforcement, not mocked responses
- Verify both authorization (401) and role-based access (403)

---

## Reference Implementation

The existing `PrinterFilesController` follows this exact pattern:

**File:** `src/controllers/printer-files.controller.ts` (lines 1-50)

```typescript
import { before, DELETE, GET, POST, route } from "awilix-express";
import { authenticate, authorizeRoles, permission } from "@/middleware/authenticate";
import { PERMS, ROLES } from "@/constants/authorization.constants";

@route(AppConstants.apiRoute + "/printer-files")
@before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR]), printerResolveMiddleware()])
export class PrinterFilesController {

  @GET()
  @route("/thumbnails")
  @before(permission(PERMS.PrinterFiles.Get))
  async getThumbnails(req: Request, res: Response) { /* ... */ }

  // ... other endpoints with @before(permission(...))
}
```

---

## Effort Breakdown

| Task | Estimated Hours |
|------|----------------|
| Add permission constants | 0.5 |
| Update role permissions | 0.5 |
| Add middleware to 7-9 endpoints | 1-2 |
| Write permission tests (28-36 tests) | 4-6 |
| Debug and fix issues | 1-2 |
| **Total** | **6-10 hours** |

---

## Related Files

- `src/constants/authorization.constants.ts` — Permission definitions
- `src/middleware/authenticate.ts` — Authentication/authorization middleware
- `src/controllers/file-storage.controller.ts` — API endpoints
- `src/controllers/printer-files.controller.ts` — Reference implementation
- `test/api/file-storage-controller-integration.test.ts` — Integration test suite (27 existing tests)

---

## Open Questions

1. **Permissions Granularity:** Should there be separate permissions for bulk operations vs single operations?
2. **Audit Trail:** Should file operations be logged for audit purposes when permissions are enforced?
3. **GUEST Role:** Should GUEST have read-only access (List, Get) or no access at all?

---

## Deferral Justification

Permission management is currently out of scope for the File Management CRUD effort (v0.3.0). This feature should be implemented when:
1. User authentication/authorization becomes a priority
2. Multi-user access control is required
3. Production deployment necessitates security hardening

Until then, the FileStorage API remains functional but lacks fine-grained access control.
