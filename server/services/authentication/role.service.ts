import {union} from "lodash";

import {ROLE_PERMS, ROLES} from "../../constants/authorization.constants";
import RoleModel from "../../models/Auth/Role";
import {NotFoundException} from "../../exceptions/runtime.exceptions";

class RoleService {
    #roles = [];
    #logger;
    #defaultRole;

    constructor({loggerFactory, defaultRole}) {
        this.#logger = loggerFactory("RoleService");
        this.#defaultRole = defaultRole;
    }

    get roles() {
        return this.#roles;
    }

    getRolesPermissions(roles) {
        let permissions = [];
        if (!roles?.length)
            return [];
        for (let role of roles) {
            const normalizedRole = this.#normalizeRole(role);
            const rolePermissions = this.getRolePermissions(normalizedRole);
            permissions = union(permissions, rolePermissions);
        }
        return permissions;
    }

    getRolePermissions(role) {
        const normalizedRole = this.#normalizeRole(role);
        return ROLE_PERMS[normalizedRole];
    }

    getDefaultRole() {
        return this.#defaultRole;
    }

    async getDefaultRolesId() {
        if (!this.#roles?.length) {
            await this.syncRoles();
        }
        const guestRole = await this.getRoleByName(this.getDefaultRole());
        return [guestRole.id];
    }

    #normalizeRole(assignedRole) {
        const roleInstance = this.roles.find((r) => r.id === assignedRole || r.name === assignedRole);
        if (!roleInstance) {
            console.warn(`The role by ID '${assignedRole}' did not exist in definition. Skipping.`);
            return;
        }
        return roleInstance.name;
    }

    authorizeRole(requiredRole, assignedRoles) {
        return !!assignedRoles.find((ar) => {
            const normalizedRole = this.#normalizeRole(ar);
            if (!normalizedRole)
                return false;
            return normalizedRole === requiredRole;
        });
    }

    authorizeRoles(requiredRoles, assignedRoles, subset = true) {
        let isAuthorized = false;
        if (!requiredRoles?.length)
            return true;
        requiredRoles.forEach((rr) => {
            const result = this.authorizeRole(rr, assignedRoles);
            isAuthorized = subset ? isAuthorized || result : isAuthorized && result;
        });
        return isAuthorized;
    }

    getRoleByName(roleName) {
        const role = this.#roles.find((r) => r.name === roleName);
        if (!role)
            throw new NotFoundException("Role not found");
        return role;
    }

    getRole(roleId) {
        const role = this.#roles.find((r) => r.id === roleId);
        if (!role)
            throw new NotFoundException(`Role Id '${roleId}' not found`);
        return role;
    }

    async syncRoles() {
        this.#roles = [];
        for (let roleName of Object.values(ROLES)) {
            const storedRole = await RoleModel.findOne({name: roleName});
            if (!storedRole) {
                const newRole = await RoleModel.create({
                    name: roleName
                });
                this.#roles.push(newRole);
            } else {
                this.#roles.push(storedRole);
            }
        }
    }
}

export default RoleService;
