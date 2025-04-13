import { DefaultHttpClientBuilder } from "@/shared/default-http-client.builder";
import { authorizationHeaderKey } from "@/services/octoprint/constants/octoprint-service.constants";
import { AxiosInstance } from "axios";
import { generateDigestAuthHeader } from "./digest-auth.util";
import { randomBytes } from "node:crypto";

export class PrusaLinkHttpClientBuilder extends DefaultHttpClientBuilder {
  public override build<D = any>(): AxiosInstance {
    if (!this.axiosOptions.baseURL) {
      throw new Error("Base URL is required");
    }

    return super.build<D>();
  }

  /**
   * Add digest auth header. This assumes the Digest header has been requested from the target server.
   * @param authHeader format like 'Digest realm="Printer API", nonce="1234abc1ef123456", stale=false'
   * @param username
   * @param password
   * @param method
   * @param pathname
   */
  public withDigestAuth(
    authHeader?: string,
    username?: string,
    password?: string,
    method?: string,
    pathname?: string,
  ): this {
    if (!authHeader?.length) {
      throw new Error("Digest header may not be an empty string");
    }
    if (!username?.length) {
      throw new Error("username may not be an empty string");
    }
    if (!password?.length) {
      throw new Error("password may not be an empty string");
    }
    if (!method?.length) {
      throw new Error("method may not be an empty string");
    }
    if (!pathname?.length) {
      throw new Error("pathname may not be an empty string");
    }

    const authParams = Object.fromEntries(
      authHeader
        .replace("Digest ", "")
        .split(", ")
        .map((param) => param.split("=").map((s) => s.replace(/"/g, ""))),
    );

    const hasQop = "qop" in authParams;
    const digestHeader = generateDigestAuthHeader({
      username,
      password,
      method: method.toUpperCase(),
      uri: pathname,
      realm: authParams.realm,
      nonce: authParams.nonce,
      qop: hasQop ? authParams.qop : undefined,
      nc: hasQop ? "00000001" : undefined,
      cnonce: hasQop ? randomBytes(8).toString("hex") : undefined,
    });

    this.withHeaders({ [authorizationHeaderKey]: digestHeader });

    return this;
  }
}
