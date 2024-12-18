import { Response } from "supertest";
import CustomMatcherResult = jest.CustomMatcherResult;

export function getExpectExtensions() {
  return {
    toHaveErrors(received: { errors: string[] }, keys: string[]) {
      expect(received.errors).toMatchObject(keys);

      return {
        pass: true,
      } as CustomMatcherResult;
    },
  };
}

export function expectEmptyResponse(response: Response) {
  expect(response.statusCode).toEqual(204);
  expect(response.body).toBeFalsy();
}

export function expectOkResponse(response: Response, matchedBody?: any) {
  if (response.statusCode >= 400) {
    console.warn(response.body + " url " + response.request.url);
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

export function expectUnauthenticatedResponse(response: Response) {
  expect(response.statusCode).toEqual(401);
}

export function expectUnauthorizedResponse(response: Response) {
  expect(response.statusCode).toEqual(403);
  expect(response.body.roles).toBeDefined();
}

export function expectForbiddenResponse(response: Response) {
  expect(response.statusCode).toEqual(403);
}

export function expectInvalidResponse(response: Response, keys?: string[], exact = false) {
  expect(response.statusCode).toEqual(400);

  if (!keys) return;

  expectValidationError(response.body, keys, exact);
}

export function expectNotFoundResponse(response: Response) {
  expect(response.statusCode).toEqual(404);
}
