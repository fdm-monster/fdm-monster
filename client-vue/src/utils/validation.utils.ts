export function isValidIPOrMask(str: string) {
  const splitArray = str.split(".");
  const subAddresses = splitArray.length;
  const arr = splitArray.filter((el) => {
    return !/^0.|\D/g.test(el);
  });

  if (subAddresses <= 1) return false;

  return (
    arr.filter((el) => el.length && parseInt(el) >= 0 && parseInt(el) <= 255).length ===
    subAddresses
  );
}
