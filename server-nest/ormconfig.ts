module.exports = {
  type: "mongodb",
  synchronize: true,
  hostname: process.env.TYPEORM_HOSTNAME || "127.0.0.1",
  database: process.env.TYPEORM_DATABASE || "fdm-monster2",
  username: process.env.TYPEORM_USERNAME || "root",
  password: process.env.TYPEORM_PASSWORD || "",
  port: process.env.TYPEORM_PORT || 27017,
  autoLoadEntities: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  driverExtra: {
    authSource: process.env.TYPEORM_AUTHSOURCE || "admin"
  },
  entities: ["dist/**/*.entity{.ts,.js}"],
  subscribers: ["dist/**/*.subscriber{.ts,.js}"],
  migrations: ["dist/**/*.migration{.ts,.js}"],
  cli: {
    entitiesDir: "src/entity/*",
    migrationsDir: "src/migration/*",
    subscribersDir: "src/subscriber/*"
  }
};
