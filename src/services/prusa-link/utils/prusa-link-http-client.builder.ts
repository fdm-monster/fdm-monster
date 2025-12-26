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
        // If we have auth info, add the digest header
        if (this.authHeaderContext) {
          const computedDigestHeader = this.generateDigestHeader(
            config.method?.toUpperCase() ?? "GET",
            config.url ?? "/",
          );

          config.headers[authorizationHeaderKey] = computedDigestHeader;
        }
        return config;
      });

      // Add response interceptor to handle 401s
      axiosInstance.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
          const originalRequest = error.config as AxiosRequestConfig & { _retryCount?: number };

          // If we get a 401 and have credentials but no auth info or retried less than once
          if (
            error.response?.status === 401 &&
            this.username?.length &&
            this.password?.length &&
            (!originalRequest._retryCount || originalRequest._retryCount < this.maxRetries)
          ) {
            // Extract WWW-Authenticate header
            const wwwAuthHeader = error.response.headers[wwwAuthenticationHeaderKey] as string;
            if (wwwAuthHeader) {
              // Allow caching the value for reuse
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

          // If this is an auth error, and we have a callback, invoke it
          if (error.response?.status === 401 && this.onAuthError && typeof this.onAuthError === "function") {
            this.onAuthError(error);
          }

          // If we can't handle it, pass the error on
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
    const headerValue = authHeader.startsWith("Digest ") ? authHeader.substring(7) : authHeader;

    const authParams = Object.fromEntries(
      headerValue.split(", ").map((param) => {
        const parts = param.split("=");
        if (parts.length === 2) {
          return [parts[0], parts[1].replace(/"/g, "")];
        }
        return [parts[0], ""];
      }),
    );

    this.authHeaderContext = {
      realm: authParams.realm,
      nonce: authParams.nonce,
      qop: authParams.qop,
      hasQop: "qop" in authParams,
    };
  }

  private generateDigestHeader(method: string, uri: string): string {
    if (!this.authHeaderContext || !this.username || !this.password) {
      throw new Error("Digest auth not properly configured");
    }

    const { realm, nonce, qop, hasQop } = this.authHeaderContext;

    return generateDigestAuthHeader({
      username: this.username,
      password: this.password,
      method,
      uri,
      realm,
      nonce,
      qop: hasQop ? qop : undefined,
      nc: hasQop ? "00000001" : undefined, // For simplicity, always use 00000001
      cnonce: hasQop ? randomBytes(8).toString("hex") : undefined,
    });
  }
}
