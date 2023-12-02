// For future reference
module.exports = {
    apps: [{
        name: "fdm-monster",
        exec_mode: "fork",
        watch: false,
        script: "./index.js",
        max_memory_restart: "1G",
        env_production: {
            NODE_ENV: "production"
        },
        env_development: {
            NODE_ENV: "development"
        }
    }]
}