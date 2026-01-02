// src/swagger/setup.ts
import { SwaggerGenerator } from "./generator";
import * as fs from "node:fs/promises";
import { Express, static as expressStatic } from "express";
import { join, dirname } from "node:path";
import { AppConstants } from "@/server.constants";
import { superRootPath, ensureDirExists } from "@/utils/fs.utils";

// Find swagger-ui-dist path
function getSwaggerUiDistPath(): string {
  try {
    // Try to resolve from node_modules
    return dirname(require.resolve("swagger-ui-dist/package.json"));
  } catch {
    // Fallback for different module resolution scenarios
    return join(process.cwd(), "node_modules", "swagger-ui-dist");
  }
}

// Swagger UI HTML template that loads from local static files
function generateSwaggerHTML(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FDM Monster API Documentation</title>
  <link rel="stylesheet" href="/api-docs/static/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/api-docs/static/swagger-ui-bundle.js"></script>
  <script src="/api-docs/static/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: '/api-docs/swagger.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
  `.trim();
}

export async function setupSwagger(app: Express) {
  const generator = new SwaggerGenerator();
  const specification = await generator.generate();

  // Conditionally save specification to file
  const generateJsonFile = process.env[AppConstants.GENERATE_SWAGGER_JSON] === "true";
  console.log(`GENERATE_SWAGGER_JSON flag: ${process.env[AppConstants.GENERATE_SWAGGER_JSON]} (enabled: ${generateJsonFile})`);

  if (generateJsonFile) {
    try {
      const mediaPath = join(superRootPath(), AppConstants.defaultFileStorageFolder);
      console.log(`Media path: ${mediaPath}`);
      console.log(`Super root path: ${superRootPath()}`);

      ensureDirExists(mediaPath);
      console.log(`Directory ensured/created`);

      const swaggerJsonPath = join(mediaPath, "swagger.json");
      const jsonContent = JSON.stringify(specification, null, 2);
      console.log(`Writing ${jsonContent.length} bytes to ${swaggerJsonPath}`);

      await fs.writeFile(swaggerJsonPath, jsonContent, "utf-8");
      console.log(`File write completed successfully`);

      // Verify file exists
      try {
        const stats = await fs.stat(swaggerJsonPath);
        console.log(`File verified: ${stats.size} bytes`);

        // Also check if file is readable
        const readBack = await fs.readFile(swaggerJsonPath, "utf-8");
        console.log(`File read back successfully: ${readBack.length} bytes`);

        // List directory contents
        const dirContents = await fs.readdir(mediaPath);
        console.log(`Media directory contains: ${dirContents.join(", ")}`);
      } catch (statError) {
        console.error(`Failed to verify file:`, statError);
      }

      console.log(`Swagger JSON generated at: ${swaggerJsonPath}`);
    } catch (error) {
      console.error("Failed to generate swagger.json file:", error);
    }
  } else {
    console.log("Swagger JSON file generation disabled");
  }

  // Serve swagger-ui-dist static files
  const swaggerUiPath = getSwaggerUiDistPath();
  app.use("/api-docs/static", expressStatic(swaggerUiPath));

  // Serve OpenAPI spec as JSON
  app.get("/api-docs/swagger.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specification);
  });

  // Serve Swagger UI HTML
  app.get("/api-docs", (_req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(generateSwaggerHTML());
  });

  return specification;
}
