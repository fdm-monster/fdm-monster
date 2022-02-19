import awilixExpress from "awilix-express";
const { inject } = awilixExpress;
export const interceptRoles = inject(({ settingsStore, roleService }) => async (req, res, next) => {
    const serverSettings = settingsStore.getServerSettings();
    req.roles = req.user?.roles;
    if (!serverSettings?.server?.loginRequired && !req.user) {
        req.roles = [roleService.getDefaultRole()];
    }
    next();
});
export default {
    interceptRoles
};
