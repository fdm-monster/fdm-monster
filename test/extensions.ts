import { expect } from "@jest/globals";
import { Response } from "supertest";

export function getExpectExtensions() {
  return {
    toHaveErrors(received, keys) {
      expect(received.errors).toMatchObject(keys);

      return {
        pass: true,
      };
    },
  };
}

export function expectEmptyResponse(response: Response) {
  expect(response.statusCode).toEqual(204);
  expect(response.body).toBeFalsy();
}

export function expectOkResponse(response: Response, matchedBody?: any) {
  if (response.statusCode >= 400) {
    console.warn(response.body);
  }
  expect(response.statusCode).toEqual(200);
  if (!matchedBody) {
    return response.body;
  }

  expect(response.body).toMatchObject(matchedBody);
  return response.body;
}

export function expectValidationError(object: any, keys: string[], exact = false) {
  const objectErrors = Object.keys(object.errors);
  if (!exact) {
    keys.forEach((key) => expect(objectErrors).toContain(key));
  } else {
    expect(keys).toMatchObject(objectErrors);
  }
}

export function expectBadRequestError(response: Response) {
  expect(response.statusCode).toEqual(400);
}

export function expectInternalServerError(response: Response) {
  expect(response.statusCode).toEqual(500);
}

export function expectRedirectResponse(response: Response) {
  expect(response.statusCode).toEqual(302);
}

export function expectUnauthorizedResponse(response: Response) {
  expect(response.statusCode).toEqual(401);
}

export function expectInvalidResponse(response: Response, keys?: string[], exact = false) {
  expect(response.statusCode).toEqual(400);

  if (!keys) return;

  expectValidationError(response.body, keys, exact);
}

export function expectNotFoundResponse(response: Response) {
  expect(response.statusCode).toEqual(404);
}
