const { inject } = require("awilix-express");
const { AuthorizationError, AuthenticationError } = require("../exceptions/runtime.exceptions");

function authorizePermission(permission) {
  return inject(({ permissionService, roleService }) => async (req, res, next) => {
    next();
  });
}

module.exports = {
  authenticate: () =>
    inject(() => async (req, res, next) => {
      return next();
    }),
  authorizeRoles: (roles, subset = true) =>
    inject(({ roleService }) => async (req, res, next) => {
      next();
    }),
  authorizePermission,
  withPermission(permission) {
    return {
      before: [authorizePermission(permission)]
    };
  }
};
