import {
  apiKeyHeaderKey,
  contentTypeHeaderKey,
  jsonContentType,
} from "@/services/octoprint/constants/octoprint-service.constants";
import { ValidationException } from "@/exceptions/runtime.exceptions";
import type { LoginDto } from "@/services/interfaces/login.dto";

export function validateLogin(login: LoginDto) {
  if (!login.apiKey || !login.printerURL) {
    throw new ValidationException("printer apiKey or printerURL undefined");
  }

  return {
    apiKey: login.apiKey,
    printerURL: login.printerURL,
  };
}

export function constructHeaders(apiKey: string, contentType = jsonContentType) {
  return {
    [contentTypeHeaderKey]: contentType, // Can be overwritten without problem
    [apiKeyHeaderKey]: apiKey,
  };
}
