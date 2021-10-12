module.exports = {
  transpileDependencies: ["vuetify"],
  pwa: {
    workboxOptions: {
      ignoreURLParametersMatching: [/^api/]
    }
  }
};
