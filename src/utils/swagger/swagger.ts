import { SwaggerGenerator } from "./generator";
import { Application, static as expressStatic } from "express";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { AppConstants } from "@/server.constants";
import { ensureDirExists, getMediaPath } from "@/utils/fs.utils";
import { LoggerService } from "@/handlers/logger";
import { writeFile } from "node:fs/promises";

function getSwaggerUiDistPath(): string {
  try {
    const resolved = import.meta.resolve("swagger-ui-dist/package.json");
    return dirname(fileURLToPath(resolved));
  } catch {
    return join(process.cwd(), "node_modules", "swagger-ui-dist");
  }
}

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

export async function setupSwagger(app: Application, logger: LoggerService) {
  const generator = new SwaggerGenerator(logger);
  const specification = await generator.generate();

  const generateJsonFile = process.env[AppConstants.GENERATE_SWAGGER_JSON] === "true";
  if (generateJsonFile) {
    try {
      const mediaPath = getMediaPath();
      ensureDirExists(mediaPath);

      const swaggerJsonPath = join(mediaPath, "swagger.json");
      const jsonContent = JSON.stringify(specification, null, 2);

      await writeFile(swaggerJsonPath, jsonContent, "utf-8");
      logger.log(`Swagger JSON file generated at: ${swaggerJsonPath}`);
    } catch (error) {
      logger.error("Failed to generate swagger.json file", error);
    }
  }

  const swaggerUiPath = getSwaggerUiDistPath();
  app.use("/api-docs/static", expressStatic(swaggerUiPath));
  app.get("/api-docs/swagger.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specification);
  });
  app.get("/api-docs", (_req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(generateSwaggerHTML());
  });

  return specification;
}
