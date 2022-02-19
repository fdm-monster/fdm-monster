import random from "../../utils/random.util";
const { randomString } = random;
class UserTokenService {
    tokens = {};
    async issueTokenWithDone(user) {
        const token = randomString(64);
        // Purge beforehand
        await this.clearUserToken(user.id);
        // Create it
        await this.create(token, user.id);
        return token;
    }
    /**
     * Stores a new printer into the database.
     * @param {Object} token object to create.
     * @param userId
     * @throws {Error} If the printer is not correctly provided.
     */
    async create(token, userId) {
        if (!token)
            throw new Error("Missing token to save");
        return (this.tokens[token] = userId);
    }
    /**
     * Clear all tokens, irrespective of user or creation time
     */
    clearAll() {
        this.tokens = {};
    }
    /**
     * Checks whether one token exists by providing the userToken instance
     */
    clearUserToken(userId) {
        if (!userId)
            return;
        const foundTokenIndex = Object.values(this.tokens).findIndex((tokenUserId) => userId === tokenUserId);
        if (foundTokenIndex === -1) {
            return;
        }
        delete this.tokens[foundTokenIndex];
    }
}
export default UserTokenService;
