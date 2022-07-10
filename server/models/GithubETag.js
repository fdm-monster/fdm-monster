const mongoose = require("mongoose");

const GithubETagSchema = new mongoose.Schema({
  repoUrl: {
    type: String,
    required: true
  },
  etag: {
    type: String,
    required: true
  },
  cachedResponse: {
    type: Object,
    required: true
  }
});

const GithubETag = mongoose.model("GithubETag", GithubETagSchema);
module.exports = GithubETag;
