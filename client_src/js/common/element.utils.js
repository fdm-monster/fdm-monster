export function elem(selector) {
  return document.getElementById(selector);
}

export function addClick(selector, cb) {
  return elem(selector).addEventListener("click", cb);
}
