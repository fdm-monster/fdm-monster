import { extend, setInteractionMode } from "vee-validate";
import { digits, max, required } from "vee-validate/dist/rules";

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

  extend("max", {
    ...max,
    message: "{_field_} may not be greater than {length} characters"
  });
}
