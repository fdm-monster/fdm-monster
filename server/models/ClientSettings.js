const mongoose = require("mongoose");

const ClientSettingsSchema = new mongoose.Schema({
});

const ClientSettings = mongoose.model("ClientSettings", ClientSettingsSchema);

module.exports = ClientSettings;
