import User from "../../../models/Auth/User.ts";
import bcrypt from "bcryptjs";
function getUserData(username = "tester", password = "testpassword") {
    return {
        name: "Tester",
        username,
        password
    };
}
async function ensureTestUserCreated(usernameIn = "test", passwordIn = "test") {
    const foundUser = await User.findOne({ username: usernameIn });
    if (foundUser)
        return {
            id: foundUser.id,
            username: foundUser.username,
            name: foundUser.name
        };
    const { name, username, password } = getUserData(usernameIn, passwordIn);
    const salt = await bcrypt.genSaltSync(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await User.create({
        name,
        username,
        passwordHash: hash
    });
    return {
        id: user.id,
        username: user.username,
        name: user.name
    };
}
export { ensureTestUserCreated };
export { getUserData };
export default {
    ensureTestUserCreated,
    getUserData
};
