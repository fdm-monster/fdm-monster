import DITokens from "../container.tokens.js";

export async function interceptDatabaseError(req, res, next) {
    const serverHost = req.container.resolve(DITokens.serverHost);
    const databaseReadyState = serverHost.hasConnected();
    if (databaseReadyState === 1) {
        next();
    }
    else {
        res.send({
            databaseReadyState: serverHost.hasConnected(),
            state: "Retrying mongo connection. Please contact the developer if this persists."
        });
    }
}
export default {
    interceptDatabaseError
};
