export function elem(selector) {
  return document.getElementById(selector);
}

export function withId(label, id) {
  return `${label}-${id}`;
}

export function addClick(selector, cb) {
  return elem(selector).addEventListener("click", cb);
}
