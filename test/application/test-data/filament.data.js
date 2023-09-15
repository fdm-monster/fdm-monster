const testBadSpool = {};
const testNewSpool = {
  name: "PLA",
  cost: 20.5,
  weight: 500.0,
  consumedRatio: 0.0,
  printTemperature: 215.0
};
const newSpoolManufacturer = {
  ...testNewSpool,
  manufacturer: "BigRoller"
};

module.exports = {
  testBadSpool,
  testNewSpool,
  newSpoolManufacturer
};
