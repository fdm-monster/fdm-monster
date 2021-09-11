export function elem(id) {
  return document.getElementById(id);
}

export function withId(label, id) {
  return `${label}-${id}`;
}

export function addClick(selector, cb) {
  return elem(selector).addEventListener("click", cb);
}
