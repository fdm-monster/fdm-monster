import { AppConstants } from "@/server.constants";
module.exports = async () => {
  process.env.TZ = "UTC";
  process.env[AppConstants.VERSION_KEY] = "1.0.0";
};
