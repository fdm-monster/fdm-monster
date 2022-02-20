const registerUserRules = {
    name: "required|string",
    username: "required|string",
    password: "required|string",
    roles: "required|array",
    "roles.*": "required|mongoId"
};
export { registerUserRules };
export default {
    registerUserRules
};
