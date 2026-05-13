import { AppConstants } from "@/server.constants";
import { setupTestApp } from "../test-server";
import {
  expectForbiddenResponse,
  expectInvalidResponse,
  expectNotFoundResponse,
  expectOkResponse,
  expectUnauthenticatedResponse,
} from "../extensions";
import { ensureTestUserCreated } from "./test-data/create-user";
import { DITokens } from "@/container.tokens";
import { type AwilixContainer } from "awilix";
import { Test } from "supertest";
import { loginTestUser } from "./auth/login-test-user";
import { ApiKeyController } from "@/controllers/api-key.controller";
import TestAgent from "supertest/lib/agent";
import type { IApiKeyService } from "@/services/interfaces/api-key.service.interface";
import { ROLES } from "@/constants/authorization.constants";
import { Role } from "@/entities";
import { getDatasource } from "../typeorm.manager";
import { SettingsStore } from "@/state/settings.store";

let request: TestAgent<Test>;
let container: AwilixContainer;
let apiKeyService: IApiKeyService;
let settingsStore: SettingsStore;

const baseRoute = AppConstants.apiRoute + "/api-keys";

async function adminRoleId(): Promise<number> {
  const role = await getDatasource().getRepository(Role).findOneByOrFail({ name: ROLES.ADMIN });
  return role.id;
}

async function operatorRoleId(): Promise<number> {
  const role = await getDatasource().getRepository(Role).findOneByOrFail({ name: ROLES.OPERATOR });
  return role.id;
}

function authHeader(token: string): [string, string] {
  return ["Authorization", `Bearer ${token}`];
}

function postCreate(token: string, body: Record<string, unknown>) {
  return request
    .post(baseRoute)
    .set(...authHeader(token))
    .send(body);
}

function getList(token: string) {
  return request.get(baseRoute).set(...authHeader(token));
}

function deleteKeyRequest(token: string, id: number | string) {
  return request.delete(`${baseRoute}/${id}`).set(...authHeader(token));
}

beforeAll(async () => {
  ({ request, container } = await setupTestApp(true));
  apiKeyService = container.resolve<IApiKeyService>(DITokens.apiKeyService);
  settingsStore = container.resolve(DITokens.settingsStore);
  // The test env defaults to loginRequired=false, which makes the auth
  // middleware fall through for unauthenticated requests. The api-keys
  // controller is admin-only and depends on the auth chain rejecting bare
  // requests with 401, so flip the setting on for this file.
  await settingsStore.setLoginRequired(true);
});

describe(ApiKeyController.name, () => {
  describe("auth gating", () => {
    it("rejects list without auth", async () => {
      const response = await request.get(baseRoute);
      expectUnauthenticatedResponse(response);
    });

    it("rejects create without auth", async () => {
      const response = await request.post(baseRoute).send({ label: "x", roleIds: [1] });
      expectUnauthenticatedResponse(response);
    });

    it("rejects delete without auth", async () => {
      const response = await request.delete(`${baseRoute}/1`);
      expectUnauthenticatedResponse(response);
    });

    it("rejects non-admin users with 403 on list", async () => {
      const { token } = await loginTestUser(request, "apikey-non-admin-list", "pw", ROLES.OPERATOR);
      const response = await getList(token);
      expectForbiddenResponse(response);
    });

    it("rejects non-admin users with 403 on create", async () => {
      const { token } = await loginTestUser(request, "apikey-non-admin-create", "pw", ROLES.OPERATOR);
      const response = await postCreate(token, { label: "blocked", roleIds: [await operatorRoleId()] });
      expectForbiddenResponse(response);
    });

    it("rejects non-admin users with 403 on delete", async () => {
      const { token } = await loginTestUser(request, "apikey-non-admin-delete", "pw", ROLES.OPERATOR);
      const response = await deleteKeyRequest(token, 1);
      expectForbiddenResponse(response);
    });
  });

  describe("create", () => {
    it("issues a fdmm_pat_ token and returns it once with the requested roles", async () => {
      const { token: jwt } = await loginTestUser(request, "apikey-create");
      const response = await postCreate(jwt, { label: "my-script", roleIds: [await adminRoleId()] });
      expectOkResponse(response);

      expect(response.body.token).toMatch(/^fdmm_pat_[A-Za-z0-9_-]{20,}$/);
      expect(response.body.label).toBe("my-script");
      expect(response.body.prefix).toHaveLength(16);
      expect(response.body.userId).toBeGreaterThan(0);
      expect(response.body.lastUsedAt).toBeNull();
      expect(response.body.roles).toEqual([ROLES.ADMIN]);
    });

    it("rejects empty label", async () => {
      const { token: jwt } = await loginTestUser(request, "apikey-empty-label");
      const response = await postCreate(jwt, { label: "", roleIds: [await adminRoleId()] });
      expectInvalidResponse(response);
    });

    it("rejects whitespace-only label", async () => {
      const { token: jwt } = await loginTestUser(request, "apikey-ws-label");
      const response = await postCreate(jwt, { label: "   ", roleIds: [await adminRoleId()] });
      expectInvalidResponse(response);
    });

    it("rejects empty roleIds", async () => {
      const { token: jwt } = await loginTestUser(request, "apikey-empty-roles");
      const response = await postCreate(jwt, { label: "no-roles", roleIds: [] });
      expectInvalidResponse(response);
    });

    it("rejects missing roleIds field", async () => {
      const { token: jwt } = await loginTestUser(request, "apikey-missing-roles");
      const response = await postCreate(jwt, { label: "no-roles" });
      expectInvalidResponse(response);
    });

    it("rejects roleIds referencing nonexistent roles", async () => {
      const { token: jwt } = await loginTestUser(request, "apikey-bad-role-id");
      const response = await postCreate(jwt, { label: "fake-role", roleIds: [99999] });
      expectNotFoundResponse(response);
    });

    it("allows admins to assign any role to a key (no escalation check)", async () => {
      // David's call: admins are super users; they can already grant themselves
      // any role via user management, so the api-key create path doesn't need
      // an additional escalation check.
      const { token: jwt } = await loginTestUser(request, "apikey-cross-role");
      const response = await postCreate(jwt, {
        label: "broad",
        roleIds: [await adminRoleId(), await operatorRoleId()],
      });
      expectOkResponse(response);
      expect(response.body.roles).toEqual(expect.arrayContaining([ROLES.ADMIN, ROLES.OPERATOR]));
      expect(response.body.roles).toHaveLength(2);
    });
  });

  describe("list", () => {
    it("returns all keys across users (admin scope), never the secret", async () => {
      // Create two keys as the admin user — list should show both.
      const { token: jwt } = await loginTestUser(request, "apikey-list-admin");
      const adminId = await adminRoleId();
      await postCreate(jwt, { label: "first", roleIds: [adminId] });
      await postCreate(jwt, { label: "second", roleIds: [adminId] });

      const response = await getList(jwt);
      expectOkResponse(response);
      const labels = response.body.map((k: any) => k.label);
      expect(labels).toEqual(expect.arrayContaining(["first", "second"]));
      for (const k of response.body) {
        expect(k).not.toHaveProperty("token");
        expect(k).not.toHaveProperty("hashedSecret");
      }
    });
  });

  describe("delete (hard delete)", () => {
    it("removes the row, key stops authenticating, subsequent delete is 404", async () => {
      const { token: jwt } = await loginTestUser(request, "apikey-delete");
      const created = await postCreate(jwt, { label: "to-delete", roleIds: [await adminRoleId()] });
      const apiKeyToken: string = created.body.token;
      const apiKeyId: number = created.body.id;

      const before = await getList(apiKeyToken);
      expectOkResponse(before);

      const del = await deleteKeyRequest(jwt, apiKeyId);
      expect(del.statusCode).toBe(204);

      const after = await getList(apiKeyToken);
      expectUnauthenticatedResponse(after);

      const delAgain = await deleteKeyRequest(jwt, apiKeyId);
      expectNotFoundResponse(delAgain);
    });

    it("admins can delete any user's key (no foreign-user 404)", async () => {
      // Create two distinct admin users; each mints a key. Either admin can
      // delete the other's key without a 404 — admin scope is global.
      const { token: jwtA } = await loginTestUser(request, "apikey-delete-admin-a");
      const { token: jwtB } = await loginTestUser(request, "apikey-delete-admin-b");
      const aCreated = await postCreate(jwtA, { label: "a-owned", roleIds: [await adminRoleId()] });
      const aKeyId: number = aCreated.body.id;

      const del = await deleteKeyRequest(jwtB, aKeyId);
      expect(del.statusCode).toBe(204);
    });
  });

  describe("api-key bearer auth path", () => {
    it("authenticates with the key's own roles, NOT the bound user's roles", async () => {
      // Create a user, give them ADMIN. Mint a key with ONLY operator role.
      // The key should authenticate but only have operator permissions — the
      // admin role of the bound user does NOT leak through.
      const { token: jwt } = await loginTestUser(request, "apikey-roles-from-key");
      const created = await postCreate(jwt, { label: "operator-only", roleIds: [await operatorRoleId()] });
      const apiKeyToken: string = created.body.token;

      // Hit an ADMIN-only route with the operator-scoped key — should be 403.
      expectForbiddenResponse(await getList(apiKeyToken));

      // But the key still authenticates at all — hit a route accepting any
      // authenticated user.
      const anyAuth = await request.get(`${AppConstants.apiRoute}/auth/login-required`).set(...authHeader(apiKeyToken));
      expectOkResponse(anyAuth);
    });

    it("rejects garbage api-key-shaped tokens", async () => {
      const response = await request
        .get(baseRoute)
        .set("Authorization", "Bearer fdmm_pat_garbageABCDEFGHIJKLMNOPQRSTUVWXYZ");
      expectUnauthenticatedResponse(response);
    });

    it("bumps lastUsedAt on successful api-key auth", async () => {
      const { token: jwt } = await loginTestUser(request, "apikey-lastused");
      const created = await postCreate(jwt, { label: "lastused", roleIds: [await adminRoleId()] });
      const apiKeyToken: string = created.body.token;
      expect(created.body.lastUsedAt).toBeNull();

      await getList(apiKeyToken);
      await new Promise((resolve) => setTimeout(resolve, 50));

      const list = await getList(jwt);
      const refreshed = list.body.find((k: any) => k.id === created.body.id);
      expect(refreshed?.lastUsedAt).not.toBeNull();
    });
  });
});

describe("ApiKeyService", () => {
  describe("looksLikeApiKey", () => {
    it("recognises the fdmm_pat_ prefix shape", () => {
      expect(apiKeyService.looksLikeApiKey("fdmm_pat_" + "x".repeat(40))).toBe(true);
    });

    it("rejects JWT-shaped strings", () => {
      expect(apiKeyService.looksLikeApiKey("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.foo.bar")).toBe(false);
    });

    it("rejects empty / undefined inputs", () => {
      expect(apiKeyService.looksLikeApiKey("")).toBe(false);
      expect(apiKeyService.looksLikeApiKey(undefined as any)).toBe(false);
    });

    it("rejects fdmm_pat_ that's too short to contain a prefix+secret", () => {
      expect(apiKeyService.looksLikeApiKey("fdmm_pat_short")).toBe(false);
    });
  });

  describe("verify", () => {
    it("returns the entity for a valid token", async () => {
      const user = await ensureTestUserCreated("apikey-svc-valid", "pw", false);
      const created = await apiKeyService.create(user.id, "valid-key", [await adminRoleId()]);
      const verified = await apiKeyService.verify(created.token);
      expect(verified?.id).toBe(created.id);
    });

    it("returns null for a tampered token (same prefix, different secret)", async () => {
      const user = await ensureTestUserCreated("apikey-svc-tamper", "pw", false);
      const created = await apiKeyService.create(user.id, "tamper-key", [await adminRoleId()]);
      const tampered = `fdmm_pat_${created.prefix}${"X".repeat(30)}`;
      const verified = await apiKeyService.verify(tampered);
      expect(verified).toBeNull();
    });

    it("returns null for deleted tokens", async () => {
      const user = await ensureTestUserCreated("apikey-svc-deleted", "pw", false);
      const created = await apiKeyService.create(user.id, "delete-key", [await adminRoleId()]);
      await apiKeyService.delete(created.id);
      const verified = await apiKeyService.verify(created.token);
      expect(verified).toBeNull();
    });

    it("returns null for completely unknown prefixes", async () => {
      const verified = await apiKeyService.verify("fdmm_pat_" + "Z".repeat(48));
      expect(verified).toBeNull();
    });

    it("returns null for non-API-key inputs", async () => {
      expect(await apiKeyService.verify("not-a-token")).toBeNull();
      expect(await apiKeyService.verify("")).toBeNull();
    });
  });
});
