import { DefaultHttpClientBuilder } from "@/shared/default-http-client.builder";
import {
  authorizationHeaderKey,
  wwwAuthenticationHeaderKey,
} from "@/services/octoprint/constants/octoprint-service.constants";
import { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { generateDigestAuthHeader } from "./digest-auth.util";
import { randomBytes } from "node:crypto";

export interface DigestAuthInfo {
  realm: string;
  nonce: string;
  qop?: string;
  hasQop: boolean;
  opaque?: string;
  algorithm?: string;
}

export class PrusaLinkHttpClientBuilder extends DefaultHttpClientBuilder {
  private readonly maxRetries: number = 1;
  private username?: string;
  private password?: string;
  private authHeaderContext?: DigestAuthInfo;
  private onAuthError?: (error: AxiosError) => void;
  private onAuthSuccess?: (authHeader: string) => void;
  private onRequestRetry?: (error: AxiosError, attemptCount: number) => void;

  public override build<D = any>(): AxiosInstance {
    if (!this.axiosOptions.baseURL) {
      throw new Error("Base URL is required");
    }

    const axiosInstance = super.build<D>();

    // Add request interceptor for digest auth
    if (this.username && this.password) {
      axiosInstance.interceptors.request.use(async (config) => {
        if (this.authHeaderContext) {
          const method = config.method?.toUpperCase() ?? "GET";
          const rawUrl = config.url ?? "/";
          let uri = rawUrl;

          if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
            try {
              const parsed = new URL(rawUrl);
              uri = `${parsed.pathname}${parsed.search ?? ""}`;
            } catch {
              // If URL parsing fails, use the raw URL
            }
          }

          config.headers[authorizationHeaderKey] = this.generateDigestHeader(method, uri);
        }
        return config;
      });

      axiosInstance.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
          const originalRequest = error.config as AxiosRequestConfig & { _retryCount?: number };

          if (
            error.response?.status === 401 &&
            this.username?.length &&
            this.password?.length &&
            (!originalRequest._retryCount || originalRequest._retryCount < this.maxRetries)
          ) {
            const wwwAuthHeader = error.response.headers[wwwAuthenticationHeaderKey] as string;
            if (wwwAuthHeader) {
              if (typeof this.onAuthSuccess === "function") {
                this.onAuthSuccess(wwwAuthHeader);
              }

              this.saveParsedAuthHeaderContext(wwwAuthHeader);
              originalRequest._retryCount = (originalRequest._retryCount ?? 0) + 1;

              if (typeof this.onRequestRetry === "function") {
                this.onRequestRetry(error, originalRequest._retryCount);
              }
              return axiosInstance(originalRequest);
            }
          }

          if (error.response?.status === 401 && this.onAuthError && typeof this.onAuthError === "function") {
            this.onAuthError(error);
          }

          return Promise.reject(error);
        },
      );
    }

    return axiosInstance;
  }

  public withDigestAuth(
    username?: string,
    password?: string,
    onAuthError?: (error: AxiosError) => void,
    onRequestRetry?: (error: AxiosError, attemptCount: number) => void,
    onAuthSuccess?: (authHeader: string) => void,
  ): this {
    if (!username?.length) {
      throw new Error("username may not be an empty string");
    }
    if (!password?.length) {
      throw new Error("password may not be an empty string");
    }
    if (onAuthError && typeof onAuthError !== "function") {
      throw new Error("onAuthError must be a function");
    }
    if (onAuthSuccess && typeof onAuthSuccess !== "function") {
      throw new Error("onAuthSuccess must be a function");
    }
    if (onRequestRetry && typeof onRequestRetry !== "function") {
      throw new Error("onRequestRetry must be a function");
    }

    this.username = username;
    this.password = password;
    this.onAuthError = onAuthError;
    this.onRequestRetry = onRequestRetry;
    this.onAuthSuccess = onAuthSuccess;

    return this;
  }

  public withAuthHeader(authHeader: string): this {
    if (!authHeader?.length) {
      throw new Error("Digest header may not be an empty string");
    }

    this.saveParsedAuthHeaderContext(authHeader);
    return this;
  }

  private saveParsedAuthHeaderContext(authHeader: string): void {
    const cleanedHeader = authHeader.trim();
    const headerValue = cleanedHeader.startsWith("Digest ") ? cleanedHeader.substring(7) : cleanedHeader;

    const tokens: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const ch of headerValue) {
      if (ch === '"') {
        inQuotes = !inQuotes;
        current += ch;
        continue;
      }
      if (ch === "," && !inQuotes) {
        if (current.trim().length) {
          tokens.push(current.trim());
        }
        current = "";
        continue;
      }
      current += ch;
    }
    if (current.trim().length) {
      tokens.push(current.trim());
    }

    const authParams = Object.fromEntries(
      tokens.map((param) => {
        const idx = param.indexOf("=");
        if (idx === -1) {
          return [param.trim(), ""];
        }
        const key = param.slice(0, idx).trim();
        let value = param.slice(idx + 1).trim();
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        return [key, value];
      }),
    );

    const qopRaw = authParams.qop;
    const qop = qopRaw
      ? (qopRaw
          .split(",")
          .map((q) => q.trim())
          .find((q) => q === "auth") ?? qopRaw.split(",")[0].trim())
      : undefined;

    this.authHeaderContext = {
      realm: authParams.realm,
      nonce: authParams.nonce,
      qop,
      hasQop: !!qop,
      opaque: authParams.opaque,
      algorithm: authParams.algorithm,
    };
  }

  private generateDigestHeader(method: string, uri: string): string {
    if (!this.authHeaderContext || !this.username || !this.password) {
      throw new Error("Digest auth not properly configured");
    }

    const { realm, nonce, qop, hasQop, opaque, algorithm } = this.authHeaderContext;
    const needsCnonce = hasQop || algorithm?.toLowerCase() === "md5-sess";
    const cnonce = needsCnonce ? randomBytes(8).toString("hex") : undefined;

    return generateDigestAuthHeader({
      username: this.username,
      password: this.password,
      method,
      uri,
      realm,
      nonce,
      qop: hasQop ? qop : undefined,
      nc: hasQop ? "00000001" : undefined,
      cnonce,
      opaque,
      algorithm,
    });
  }
}
