function toDefinedKeyValue(prop, key) {
    return typeof prop !== "undefined" && prop !== null ? { [key]: prop } : {};
}
export { toDefinedKeyValue };
export default {
    toDefinedKeyValue
};
