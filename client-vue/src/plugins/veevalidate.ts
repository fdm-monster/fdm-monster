import { extend, setInteractionMode } from "vee-validate";
import { digits, length, max, required } from "vee-validate/dist/rules";
import validator from "validator";

export function configureVeeValidate() {
  setInteractionMode("eager");

  extend("digits", {
    ...digits,
    message: "{_field_} needs to be {length} digits. ({_value_})"
  });

  extend("required", {
    ...required,
    message: "{_field_} can not be empty"
  });

  extend("length", {
    ...length,
    message: "{_field_} must be of length {length}"
  });

  extend("ip_or_fqdn", (value) => {
    return validator.isFQDN(value) || validator.isIP(value) || value === "localhost";
  });

  extend("max", {
    ...max,
    message: "{_field_} may not be greater than {length} characters"
  });
}
