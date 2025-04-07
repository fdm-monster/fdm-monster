import { Response } from "supertest";
import CustomMatcherResult = jest.CustomMatcherResult;
import { ZodIssue } from "zod";

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

export function expectValidationError(
  response: any,
  expectedErrors: Array<{ code: string; path: string }>,
  exact = false,
) {
  // Extract the issues array from the ZodError
  const issues: ZodIssue[] = response.errors?.issues || [];

  // Convert each issue's path array to a dot-notation string
  const responseErrors = issues.map((issue) => ({
    code: issue.code,
    path: issue.path.join("."),
  }));

  if (!exact) {
    const missingErrors = expectedErrors.filter(
      (expected) => !responseErrors.some((actual) => actual.code === expected.code && actual.path === expected.path),
    );
    expect(missingErrors).toEqual([]);
  } else {
    // For exact matching, both arrays should have the same errors
    expect(responseErrors).toEqual(expect.arrayContaining(expectedErrors));
    expect(expectedErrors).toEqual(expect.arrayContaining(responseErrors));
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

export function expectInvalidResponse(
  response: Response,
  expectedErrors: Array<{ code: string; path: string }>,
  exact = false,
) {
  expect(response.statusCode).toEqual(400);

  if (!expectedErrors?.length) return;

  expectValidationError(response.body, expectedErrors, exact);
}

export function expectNotFoundResponse(response: Response) {
  expect(response.statusCode).toEqual(404);
}
