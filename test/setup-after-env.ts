import { expect } from "@jest/globals";
import { getExpectExtensions } from "./extensions";

expect.extend(getExpectExtensions());
