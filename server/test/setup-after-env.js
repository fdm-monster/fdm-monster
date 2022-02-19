import extensions from "./extensions.js";
const { getExpectExtensions } = extensions;
expect.extend(getExpectExtensions());
