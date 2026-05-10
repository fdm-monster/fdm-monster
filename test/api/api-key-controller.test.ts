import { AppConstants } from "@/server.constants";
import { setupTestApp } from "../test-server";
import {
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

let request: TestAgent<Test>;
let container: AwilixContainer;
let apiKeyService: IApiKeyService;

const baseRoute = AppConstants.apiRoute + "/api-keys";

beforeAll(async () => {
  ({ request, container } = await setupTestApp(true));
  apiKeyService = container.resolve<IApiKeyService>(DITokens.apiKeyService);
});

describe(ApiKeyController.name, () => {
  describe("auth gating", () => {
    it("rejects list without auth", async () => {
      const response = await request.get(baseRoute);
      expectUnauthenticatedResponse(response);
    });

    it("rejects create without auth", async () => {
      const response = await request.post(baseRoute).send({ label: "x" });
      expectUnauthenticatedResponse(response);
    });

    it("rejects revoke without auth", async () => {
      const response = await request.delete(`${baseRoute}/1`);
      expectUnauthenticatedResponse(response);
    });
  });

  describe("create", () => {
    it("issues a fdmm_pat_ token and returns it once", async () => {
      const { token: jwt } = await loginTestUser(request, "apikey-user-create");
      const response = await request.post(baseRoute).set("Authorization", `Bearer ${jwt}`).send({ label: "my-script" });
      expectOkResponse(response);

      expect(response.body.token).toMatch(/^fdmm_pat_[A-Za-z0-9_-]{20,}$/);
      expect(response.body.label).toBe("my-script");
      expect(response.body.prefix).toHaveLength(16);
      expect(response.body.userId).toBeGreaterThan(0);
      expect(response.body.revokedAt).toBeNull();
      expect(response.body.lastUsedAt).toBeNull();
    });

    it("rejects empty label with invalid response", async () => {
      const { token: jwt } = await loginTestUser(request, "apikey-user-empty-label");
      const response = await request.post(baseRoute).set("Authorization", `Bearer ${jwt}`).send({ label: "" });
      expectInvalidResponse(response);
    });

    it("rejects whitespace-only label", async () => {
      const { token: jwt } = await loginTestUser(request, "apikey-user-ws-label");
      const response = await request.post(baseRoute).set("Authorization", `Bearer ${jwt}`).send({ label: "   " });
      expectInvalidResponse(response);
    });
  });

  describe("list", () => {
    it("returns only the calling user's keys, never the secret", async () => {
      const { token: jwtA } = await loginTestUser(request, "apikey-user-isolation-a");
      const { token: jwtB } = await loginTestUser(request, "apikey-user-isolation-b");
      await request.post(baseRoute).set("Authorization", `Bearer ${jwtA}`).send({ label: "a-key" });
      await request.post(baseRoute).set("Authorization", `Bearer ${jwtB}`).send({ label: "b-key" });

      const responseA = await request.get(baseRoute).set("Authorization", `Bearer ${jwtA}`);
      expectOkResponse(responseA);
      const labelsA = responseA.body.map((k: any) => k.label);
      expect(labelsA).toContain("a-key");
      expect(labelsA).not.toContain("b-key");
      // Secret-bearing fields are never returned.
      for (const k of responseA.body) {
        expect(k).not.toHaveProperty("token");
        expect(k).not.toHaveProperty("hashedSecret");
      }
    });
  });

  describe("revoke", () => {
    it("sets revokedAt and the token stops authenticating", async () => {
      const { token: jwt } = await loginTestUser(request, "apikey-user-revoke");
      const created = await request.post(baseRoute).set("Authorization", `Bearer ${jwt}`).send({ label: "to-revoke" });
      const apiKeyToken: string = created.body.token;
      const apiKeyId: number = created.body.id;

      // Token should auth before revoke.
      const before = await request.get(baseRoute).set("Authorization", `Bearer ${apiKeyToken}`);
      expectOkResponse(before);

      // Revoke via JWT.
      const revoke = await request.delete(`${baseRoute}/${apiKeyId}`).set("Authorization", `Bearer ${jwt}`);
      expectOkResponse(revoke);
      expect(revoke.body.revokedAt).toBeTruthy();

      // Token should fail after revoke.
      const after = await request.get(baseRoute).set("Authorization", `Bearer ${apiKeyToken}`);
      expectUnauthenticatedResponse(after);
    });

    it("returns 404 when revoking a foreign user's key", async () => {
      const { token: jwtOwner } = await loginTestUser(request, "apikey-user-foreign-owner");
      const { token: jwtIntruder } = await loginTestUser(request, "apikey-user-foreign-intruder");
      const created = await request.post(baseRoute).set("Authorization", `Bearer ${jwtOwner}`).send({ label: "owned" });
      const otherId: number = created.body.id;

      const response = await request.delete(`${baseRoute}/${otherId}`).set("Authorization", `Bearer ${jwtIntruder}`);
      expectNotFoundResponse(response);
    });
  });

  describe("api-key bearer auth path", () => {
    it("authenticates via API key against any protected route", async () => {
      const { token: jwt } = await loginTestUser(request, "apikey-bearer-test");
      const created = await request
        .post(baseRoute)
        .set("Authorization", `Bearer ${jwt}`)
        .send({ label: "bearer-test" });
      const apiKeyToken: string = created.body.token;

      // Hit a sibling protected route to prove the auth pipeline accepts the
      // api key as a JWT-equivalent bearer.
      const printerList = await request
        .get(`${AppConstants.apiRoute}/printer`)
        .set("Authorization", `Bearer ${apiKeyToken}`);
      expectOkResponse(printerList);
    });

    it("rejects garbage api-key-shaped tokens", async () => {
      const response = await request
        .get(baseRoute)
        .set("Authorization", "Bearer fdmm_pat_garbageABCDEFGHIJKLMNOPQRSTUVWXYZ");
      expectUnauthenticatedResponse(response);
    });

    it("bumps lastUsedAt on successful api-key auth", async () => {
      const { token: jwt } = await loginTestUser(request, "apikey-lastused");
      const created = await request.post(baseRoute).set("Authorization", `Bearer ${jwt}`).send({ label: "lastused" });
      const apiKeyToken: string = created.body.token;
      expect(created.body.lastUsedAt).toBeNull();

      // Use the key.
      await request.get(baseRoute).set("Authorization", `Bearer ${apiKeyToken}`);

      // Allow the best-effort async bump to land.
      await new Promise((resolve) => setTimeout(resolve, 50));

      const list = await request.get(baseRoute).set("Authorization", `Bearer ${jwt}`);
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
    it("returns the entity for a valid, non-revoked token", async () => {
      const user = await ensureTestUserCreated("apikey-svc-valid", "pw", false);
      const created = await apiKeyService.createForUser(user.id, "valid-key");

      const verified = await apiKeyService.verify(created.token);
      expect(verified?.id).toBe(created.id);
      expect(verified?.userId).toBe(user.id);
    });

    it("returns null for a tampered token (same prefix, different secret)", async () => {
      const user = await ensureTestUserCreated("apikey-svc-tamper", "pw", false);
      const created = await apiKeyService.createForUser(user.id, "tamper-key");
      const tampered = `fdmm_pat_${created.prefix}${"X".repeat(30)}`;

      const verified = await apiKeyService.verify(tampered);
      expect(verified).toBeNull();
    });

    it("returns null for revoked tokens", async () => {
      const user = await ensureTestUserCreated("apikey-svc-revoke", "pw", false);
      const created = await apiKeyService.createForUser(user.id, "revoke-key");
      await apiKeyService.revokeForUser(user.id, created.id);

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
