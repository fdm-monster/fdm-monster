const parseOctoPrintWebsocketMessage = (message) => {
    const packet = JSON.parse(message);
    const header = Object.keys(packet)[0];
    return {
        header,
        data: packet[header]
    };
};
export { parseOctoPrintWebsocketMessage };
export default {
    parseOctoPrintWebsocketMessage
};
