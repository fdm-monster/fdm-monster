import { nothing, render } from "lit-html";

export const litTo = (element, container, options) => {
  render(element, container, options);
};

export function unlitTo(container, options) {
  render(nothing, container, options);
}
