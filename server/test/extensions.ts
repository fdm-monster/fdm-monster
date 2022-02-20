export function getExpectExtensions() {
    return {
        toHaveErrors(received, keys) {
            expect(received.errors).toMatchObject(keys);
            return {
                pass: true,
                message: () => "Extended expect message"
            };
        }

    };
}

export function expectEmptyResponse(response) {
    expect(response.statusCode).toEqual(204);
    expect(response.body).toBeFalsy();
}

export function expectOkResponse(response, matchedBody) {
    if (response.statusCode >= 400) {
        console.warn(response.body);
    }
    expect(response.statusCode).toEqual(200);
    if (!matchedBody) {
        return;
    }
    expect(response.body).toMatchObject(matchedBody);
    return response.body;
}

export function expectValidationError(object, keys, exact = false) {
    const objectErrors = Object.keys(object.errors);
    if (!exact) {
        keys.forEach((key) => expect(objectErrors).toContain(key));
    } else {
        expect(keys).toMatchObject(objectErrors);
    }
}

export function expectInternalServerError(response) {
    expect(response.statusCode).toEqual(500);
}

export function expectRedirectResponse(response) {
    expect(response.statusCode).toEqual(302);
}

export function expectUnauthorizedResponse(response) {
    expect(response.statusCode).toEqual(401);
}

export function expectInvalidResponse(response, keys, exact = false) {
    expect(response.statusCode).toEqual(400);
    if (!keys)
        return;
    expectValidationError(response.body, keys, exact);
}

export function expectNotFoundResponse(response) {
    expect(response.statusCode).toEqual(404);
}
