// edited by claude on 2026.01.25.13.45
import { setupTestApp } from "../test-server";
import { expectOkResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import TestAgent from "supertest/lib/agent";
import { Test } from "supertest";

const baseRoute = AppConstants.apiRoute + "/file-storage";
const virtualDirRoute = `${baseRoute}/virtual-directories`;
const directoryTreeRoute = `${baseRoute}/directory-tree`;

let request: TestAgent<Test>;

beforeAll(async () => {
  ({ request } = await setupTestApp(true));
});

describe("Virtual Directory API", () => {
  let bobMarkerId: string;
  let jillMarkerId: string;

  describe("POST /virtual-directories", () => {
    // edited by claude on 2026.01.25.15.00
    it("should create nested virtual directory with all intermediate markers", async () => {
      const response = await request.post(virtualDirRoute).send({
        path: "a/b/c",
      });

      expectOkResponse(response);
      expect(response.body.message).toBe("Virtual directory created");
      expect(response.body.path).toBe("a/b/c");
      expect(response.body.markerId).toBeDefined();
      expect(response.body.createdMarkers).toBeDefined();
      expect(Array.isArray(response.body.createdMarkers)).toBe(true);
      expect(response.body.createdMarkers.length).toBe(3);

      // Verify all intermediate markers were created
      expect(response.body.createdMarkers[0].path).toBe("a");
      expect(response.body.createdMarkers[0].markerId).toBeDefined();
      expect(response.body.createdMarkers[1].path).toBe("a/b");
      expect(response.body.createdMarkers[1].markerId).toBeDefined();
      expect(response.body.createdMarkers[2].path).toBe("a/b/c");
      expect(response.body.createdMarkers[2].markerId).toBeDefined();

      // Clean up test data
      for (const marker of response.body.createdMarkers) {
        await request.delete(`${virtualDirRoute}/${marker.markerId}`);
      }
    });
    // End of Claude's edit

    it("should create virtual directory /family/bob", async () => {
      const response = await request.post(virtualDirRoute).send({
        path: "family/bob",
      });

      expectOkResponse(response);
      expect(response.body.message).toBe("Virtual directory created");
      expect(response.body.path).toBe("family/bob");
      expect(response.body.markerId).toBeDefined();

      bobMarkerId = response.body.markerId;
    });

    it("should create virtual directory /family/jill", async () => {
      const response = await request.post(virtualDirRoute).send({
        path: "family/jill",
      });

      expectOkResponse(response);
      expect(response.body.message).toBe("Virtual directory created");
      expect(response.body.path).toBe("family/jill");
      expect(response.body.markerId).toBeDefined();

      jillMarkerId = response.body.markerId;
    });

    it("should reject invalid path (missing path field)", async () => {
      const response = await request.post(virtualDirRoute).send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid path");
    });

    it("should reject invalid path (non-string)", async () => {
      const response = await request.post(virtualDirRoute).send({
        path: 123,
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid path");
    });
  });

  describe("GET /virtual-directories", () => {
    it("should list all virtual directories including bob and jill", async () => {
      const response = await request.get(virtualDirRoute);

      expectOkResponse(response);
      expect(response.body.directories).toBeDefined();
      expect(Array.isArray(response.body.directories)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(2);

      const bobDir = response.body.directories.find(
        (d: any) => d.path === "family/bob"
      );
      const jillDir = response.body.directories.find(
        (d: any) => d.path === "family/jill"
      );

      expect(bobDir).toBeDefined();
      expect(bobDir.markerId).toBe(bobMarkerId);
      expect(bobDir.createdAt).toBeDefined();

      expect(jillDir).toBeDefined();
      expect(jillDir.markerId).toBe(jillMarkerId);
      expect(jillDir.createdAt).toBeDefined();
    });
  });

  describe("GET /directory-tree", () => {
    it("should return directory tree with family/bob and family/jill folders", async () => {
      const response = await request.get(directoryTreeRoute);

      expectOkResponse(response);
      expect(response.body.tree).toBeDefined();
      expect(response.body.tree.type).toBe("directory");
      expect(response.body.tree.name).toBe("root");
      expect(response.body.tree.children).toBeDefined();

      // Find family folder
      const familyFolder = response.body.tree.children.find(
        (node: any) => node.name === "family" && node.type === "directory"
      );

      expect(familyFolder).toBeDefined();
      expect(familyFolder.children).toBeDefined();

      // Check for bob and jill subdirectories
      const bobFolder = familyFolder.children.find(
        (node: any) => node.name === "bob" && node.type === "directory"
      );
      const jillFolder = familyFolder.children.find(
        (node: any) => node.name === "jill" && node.type === "directory"
      );

      expect(bobFolder).toBeDefined();
      expect(bobFolder.path).toBe("family/bob");
      // edited by claude on 2026.01.25.14.30 - Verify markerId is included for virtual directories
      expect(bobFolder.markerId).toBeDefined();
      expect(bobFolder.markerId).toBe(bobMarkerId);
      // End of Claude's edit

      expect(jillFolder).toBeDefined();
      expect(jillFolder.path).toBe("family/jill");
      // edited by claude on 2026.01.25.14.30 - Verify markerId is included for virtual directories
      expect(jillFolder.markerId).toBeDefined();
      expect(jillFolder.markerId).toBe(jillMarkerId);
      // End of Claude's edit
    });
  });

  describe("DELETE /virtual-directories/:markerId", () => {
    it("should delete bob's virtual directory", async () => {
      const response = await request.delete(
        `${virtualDirRoute}/${bobMarkerId}`
      );

      expectOkResponse(response);
      expect(response.body.message).toBe("Virtual directory deleted");
      expect(response.body.markerId).toBe(bobMarkerId);
    });

    it("should delete jill's virtual directory", async () => {
      const response = await request.delete(
        `${virtualDirRoute}/${jillMarkerId}`
      );

      expectOkResponse(response);
      expect(response.body.message).toBe("Virtual directory deleted");
      expect(response.body.markerId).toBe(jillMarkerId);
    });

    it("should return 404 for non-existent directory", async () => {
      const response = await request.delete(
        `${virtualDirRoute}/non-existent-id-123`
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Virtual directory not found");
    });
  });

  describe("Cleanup verification", () => {
    it("should confirm bob and jill directories are removed from list", async () => {
      const response = await request.get(virtualDirRoute);

      expectOkResponse(response);

      const bobDir = response.body.directories.find(
        (d: any) => d.path === "family/bob"
      );
      const jillDir = response.body.directories.find(
        (d: any) => d.path === "family/jill"
      );

      expect(bobDir).toBeUndefined();
      expect(jillDir).toBeUndefined();
    });
  });
});
// End of Claude's edit
