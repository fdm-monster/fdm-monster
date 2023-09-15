function getExpectExtensions() {
  return {
    toHaveErrors(received, keys) {
      expect(received.errors).toMatchObject(keys);

      return {
        pass: true,
      };
    },
  };
}

function expectEmptyResponse(response) {
  expect(response.statusCode).toEqual(204);
  expect(response.body).toBeFalsy();
}

function expectOkResponse(response, matchedBody) {
  if (response.statusCode >= 400) {
    console.warn(response.body);
  }
  expect(response.statusCode, response.body).toEqual(200);
  if (!matchedBody) {
    return response.body;
  }

  expect(response.body).toMatchObject(matchedBody);
  return response.body;
}

function expectValidationError(object, keys, exact = false) {
  const objectErrors = Object.keys(object.errors);
  if (!exact) {
    keys.forEach((key) => expect(objectErrors).toContain(key));
  } else {
    expect(keys).toMatchObject(objectErrors);
  }
}

function expectBadRequestError(response) {
  expect(response.statusCode).toEqual(400);
}

function expectInternalServerError(response) {
  expect(response.statusCode).toEqual(500);
}

function expectRedirectResponse(response) {
  expect(response.statusCode).toEqual(302);
}

function expectUnauthorizedResponse(response) {
  expect(response.statusCode).toEqual(401);
}

function expectInvalidResponse(response, keys, exact = false) {
  expect(response.statusCode).toEqual(400);

  if (!keys) return;

  expectValidationError(response.body, keys, exact);
}

function expectNotFoundResponse(response) {
  expect(response.statusCode).toEqual(404);
}

module.exports = {
  expectEmptyResponse,
  expectRedirectResponse,
  expectBadRequestError,
  expectOkResponse,
  expectValidationError,
  expectUnauthorizedResponse,
  expectInternalServerError,
  expectInvalidResponse,
  expectNotFoundResponse,
  getExpectExtensions,
};
