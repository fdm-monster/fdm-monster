export function elem(id) {
  return document.getElementById(id);
}

export function withId(label, id) {
  return `${label}-${id}`;
}

export function addClick(selector, cb) {
  const element = elem(selector);
  if (!element) return;
  return element.addEventListener("click", cb);
}
