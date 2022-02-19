import awilixExpress from "awilix-express";
import runtime from "../exceptions/runtime.exceptions";
const { inject } = awilixExpress;
const { AuthorizationError, AuthenticationError } = runtime;
function authorizePermission(permission) {
    return inject(({ permissionService, roleService }) => async (req, res, next) => {
        if (!req.roles?.length) {
            throw new AuthorizationError(permission);
        }
        const assignedPermissions = roleService.getRolesPermissions(req.roles);
        if (!permissionService.authorizePermission(permission, assignedPermissions)) {
            throw new AuthorizationError(permission);
        }
        next();
    });
}
export const authenticate = () => inject(({ settingsStore }) => async (req, res, next) => {
    const serverSettings = settingsStore.getServerSettings();
    if (!serverSettings?.server?.loginRequired) {
        return next();
    }
    if (req.isAuthenticated()) {
        return next();
    }
    throw new AuthenticationError("Not authenticated", 401);
});
export function authorizeRoles(roles, subset = true) {
    return inject(({ roleService }) => async (req, res, next) => {
        if (!roleService.authorizeRoles(roles, req.roles, subset)) {
            throw new AuthorizationError(roles);
        }
        next();
    });
}
export function withPermission(permission) {
    return {
        before: [authorizePermission(permission)]
    };
}
export { authorizePermission };
export default {
    authenticate,
    authorizeRoles,
    authorizePermission,
    withPermission
};
