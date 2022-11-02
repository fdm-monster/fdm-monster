const groupArrayBy = (array, predicate) =>
  array.reduce((acc, value, index, array) => {
    (acc[predicate(value, index, array)] ||= []).push(value);
    return acc;
  }, {});

module.exports = {
  groupArrayBy,
};
