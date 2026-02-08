import { OpenAPIObject, PathItemObject, SchemaObject } from "openapi3-ts/oas31";
import { API_METADATA_KEY } from "@/utils/swagger/decorators";
import { findControllers, FindControllersResult } from "awilix-express";
import { MethodName } from "awilix-router-core/lib/state-util";
import type { IRouteConfig } from "awilix-router-core/lib/state-util";
import { LoggerService } from "@/handlers/logger";
import { getDirname } from "@/utils/fs.utils";

export class SwaggerGenerator {
  private readonly logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger;
  }
  private readonly openApiDoc: OpenAPIObject = {
    openapi: "3.1.0",
    info: {
      title: "FDM Monster API",
      version: process.env.npm_package_version || "2.0.0",
      description:
        "FDM Monster is a bulk OctoPrint, Klipper, PrusaLink and BambuLab manager to set up, configure and monitor 3D printers. Our aim is to provide neat overview over your farm.",
      license: {
        name: "AGPL-3.0-or-later",
        url: "https://www.gnu.org/licenses/agpl-3.0.en.html",
      },
      contact: {
        name: "FDM Monster GitHub",
        url: "https://github.com/fdm-monster/fdm-monster",
      },
    },
    servers: [
      {
        url: "/api",
        description: "API Server",
      },
    ],
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  };

  public async generate(): Promise<OpenAPIObject> {
    try {
      const routePath = "../../controllers";
      const discoveredControllers = await findControllers(`${routePath}/*.controller.js`, {
        cwd: getDirname(import.meta.url),
        ignore: ["**/*.map", "**/*.d.ts"],
        absolute: true,
        esModules: true,
      });
      for (const registration of discoveredControllers) {
        await this.processController(registration);
      }
      this.logger.log(`Generated OpenAPI spec with ${Object.keys(this.openApiDoc.paths || {}).length} paths`);
    } catch (error) {
      this.logger.error("Failed to generate swagger specification", error);
    }

    return this.openApiDoc;
  }

  private async processController(prototype: Awaited<FindControllersResult>[number]) {
    for (const [methodName, methodConfig] of prototype.state.methods) {
      if (methodConfig.paths.length > 0) {
        await this.processMethod(prototype, prototype.state.root, methodName, methodConfig);
      }
    }
  }

  private async processMethod(
    controller: Awaited<FindControllersResult>[number],
    root: IRouteConfig,
    methodName: MethodName,
    methodConfig: IRouteConfig,
  ) {
    if (!methodName) return;

    const method = methodName.toString();
    const name = method.toLowerCase();
    for (let methodPath of methodConfig.paths) {
      methodPath = root.paths[0] + methodPath;
      // Convert Express path format (:id) to OpenAPI format ({id})
      methodPath = methodPath.replaceAll(/:([a-zA-Z0-9_]+)/g, "{$1}");

      const metadata = Reflect.getMetadata(API_METADATA_KEY, controller.target);
      for (const verb of methodConfig.verbs) {
        const key = `${name}:operation`;
        const description = metadata?.hasOwnProperty(key) ? metadata[key] : null;

        const httpMethod = verb.toLowerCase() as
          | "get"
          | "post"
          | "put"
          | "delete"
          | "patch"
          | "options"
          | "head"
          | "trace";

        const operationObject = {
          tags: [controller.target.name],
          summary: description?.summary ?? method,
          description: description?.description ?? "",
          responses: description?.responses ?? {
            "200": {
              description: "Successful response",
            },
          },
        } as any;

        // Extract path parameters from the path (e.g., {id}, {userId}, etc.)
        operationObject.parameters = this.extractPathParameters(methodPath);

        // Process method parameters and response type
        const paramTypes = Reflect.getMetadata("design:paramtypes", controller.target, name);
        const returnType = Reflect.getMetadata("design:returntype", controller.target, name);

        if (paramTypes) {
          const additionalParams = this.processParameterTypes(paramTypes);
          operationObject.parameters = [...operationObject.parameters, ...additionalParams];
        }

        if (returnType && operationObject.responses?.["200"]) {
          operationObject.responses["200"].content = {
            "application/json": {
              schema: this.processReturnType(returnType),
            },
          };
        }

        const operation: PathItemObject = {
          [httpMethod]: operationObject,
        };

        this.openApiDoc.paths ??= {};

        this.openApiDoc.paths[methodPath] = {
          ...(this.openApiDoc.paths[methodPath] || {}),
          ...operation,
        };
      }
    }
  }

  private extractPathParameters(path: string): any[] {
    const paramRegex = /\{([a-zA-Z0-9_]+)\}/g;
    const params: any[] = [];
    let match;

    while ((match = paramRegex.exec(path)) !== null) {
      const paramName = match[1];
      params.push({
        name: paramName,
        in: "path",
        required: true,
        schema: {
          type: "string",
        },
        description: `The ${paramName} parameter`,
      });
    }

    return params;
  }

  private processParameterTypes(types: any[]): any[] {
    return types.map((type) => this.createParameterDefinition(type));
  }

  private processReturnType(type: any): SchemaObject {
    return this.createSchemaDefinition(type);
  }

  private createSchemaDefinition(type: any): SchemaObject {
    // Implementation for creating OpenAPI schema from TypeScript type
    // This is a simplified version - you'll want to expand this
    return {
      type: "object",
      properties: this.getTypeProperties(type),
    };
  }

  private createParameterDefinition(type: any): any {
    // Implementation for creating parameter definitions
    return {
      in: "body",
      schema: this.createSchemaDefinition(type),
    };
  }

  private getTypeProperties(type: any): Record<string, any> {
    const properties: Record<string, any> = {};
    const metadata = Reflect.getMetadata(API_METADATA_KEY, type) || {};

    Object.keys(metadata).forEach((key) => {
      properties[key] = {
        type: this.getPropertyType(metadata[key].type),
        description: metadata[key].description,
        example: metadata[key].example,
      };
    });

    return properties;
  }

  private getPropertyType(type: any): string {
    const typeMap: Record<string, string> = {
      String: "string",
      Number: "number",
      Boolean: "boolean",
      Object: "object",
      Array: "array",
    };

    return typeMap[type?.name] || "string";
  }
}
