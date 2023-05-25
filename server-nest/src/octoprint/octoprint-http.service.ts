import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { PrinterLoginDto } from "@/shared/dtos/printer-login.dto";
import { validate, validateOrReject } from "class-validator";
import { apiKeyHeaderKey, contentTypeHeaderKey, jsonContentType } from "@/octoprint/octoprint.constants";
import { fromPromise } from "rxjs/internal/observable/innerFrom";
import { catchError, switchMap, throwError, timeout, TimeoutError } from "rxjs";
import { map } from "rxjs/operators";
import { AxiosError, ResponseType } from "axios";
import { ConfigService } from "@nestjs/config";
import { externalHttpTimeoutKey } from "@/app.constants";
import { ExternalHttpError } from "@/shared/errors/external-http.error";

@Injectable()
export class OctoPrintHttpService {
  constructor(private httpService: HttpService, private configService: ConfigService) {}

  get<T>(login: PrinterLoginDto, path: string, headers: any = {}, signal?: AbortSignal) {
    return fromPromise(this.prepareRequest(login, path, headers)).pipe(
      switchMap((options) => {
        return this.httpService.get<T>(options.url, {
          timeout: this.configService.get(externalHttpTimeoutKey),
          headers: options.headers,
          signal,
        });
      }),
      map((response) => {
        return response.data;
      }),
      catchError((e: AxiosError) => {
        return throwError(() => this.transformExternalError(e));
      })
    );
  }

  getPipe(login: PrinterLoginDto, path: string, headers: any = {}, signal?: AbortSignal, responseType: ResponseType = "stream") {
    const timeoutSetting = this.configService.get<number>(externalHttpTimeoutKey);
    return fromPromise(this.prepareRequest(login, path, headers)).pipe(
      switchMap((options) => {
        return this.httpService.get(options.url, {
          timeout: this.configService.get(externalHttpTimeoutKey),
          headers: options.headers,
          signal,
          responseType,
        });
      }),
      timeout(timeoutSetting),
      catchError((e: AxiosError | TimeoutError) => {
        if (e instanceof TimeoutError) {
          return throwError(() => e);
        }
        return throwError(() => this.transformExternalError(e));
      })
    );
  }

  post<T>(
    login: PrinterLoginDto,
    path: string,
    body: any = {},
    headers: any = {},
    signal?: AbortSignal,
    responseType: ResponseType = "json"
  ) {
    return fromPromise(this.prepareRequest(login, path, headers)).pipe(
      switchMap((options) => this.validateBody(body, options)),
      switchMap(({ options, body }) => {
        return this.httpService.post<T>(options.url, body, {
          timeout: this.configService.get(externalHttpTimeoutKey),
          headers: options.headers,
          signal,
          responseType,
        });
      }),
      map((response) => {
        return response.data;
      }),
      catchError((e: AxiosError) => {
        return throwError(() => this.transformExternalError(e));
      })
    );
  }

  delete<T>(login: PrinterLoginDto, path: string, body: any = {}, headers: any = {}) {
    return fromPromise(this.prepareRequest(login, path, headers)).pipe(
      switchMap((options) => this.validateBody(body, options)),
      switchMap(({ options, body }) => {
        return this.httpService.delete<T>(options.url, {
          timeout: this.configService.get(externalHttpTimeoutKey),
          headers: options.headers,
          data: body,
        });
      }),
      map((response) => {
        return response.data;
      }),
      catchError((e: AxiosError) => {
        return throwError(() => this.transformExternalError(e));
      })
    );
  }

  transformExternalError(e: AxiosError) {
    return new ExternalHttpError(e);
  }

  async prepareRequest(
    login: PrinterLoginDto,
    requestPath: string,
    appendedHeaders: any = {},
    contentType: string = jsonContentType
  ) {
    await validateOrReject(login.validateParams());
    const url = new URL(requestPath, login.printerUrl).href;

    let headers = {
      [contentTypeHeaderKey]: contentType || jsonContentType,
      [apiKeyHeaderKey]: login.apiKey,
      ...(appendedHeaders || {}),
    };

    return {
      url,
      headers,
    };
  }

  private async validateBody(body, options) {
    // TODO need to throw?
    if (body) await validate(body);
    return {
      options,
      body,
    };
  }
}
