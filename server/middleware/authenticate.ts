import {inject} from "awilix-express";

import {AuthenticationError, AuthorizationError} from "../exceptions/runtime.exceptions";

export function authorizePermission(permission) {
    return inject(({permissionService, roleService}) => async (req, res, next) => {
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

export const authenticate = () => inject(({settingsStore}) => async (req, res, next) => {
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
    return inject(({roleService}) => async (req, res, next) => {
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