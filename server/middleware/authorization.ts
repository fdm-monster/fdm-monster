import {inject} from "awilix-express";

export const interceptRoles = inject(({settingsStore, roleService}) => async (req, res, next) => {
    const serverSettings = settingsStore.getServerSettings();
    req.roles = req.user?.roles;
    if (!serverSettings?.server?.loginRequired && !req.user) {
        req.roles = [roleService.getDefaultRole()];
    }
    next();
});