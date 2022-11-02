function prettyPrintArray(array) {
  let arrayText = "";

  array.forEach((l) => {
    if (!arrayText.includes(l)) {
      arrayText += ` ${l}  \n`;
    }
  });

  return arrayText;
}

module.exports = { prettyPrintArray };
