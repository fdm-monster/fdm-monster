const dtFormat = new Intl.DateTimeFormat("en-GB", {
  timeStyle: "medium",
  dateStyle: "short",
  timeZone: "UTC",
});

export const envTestE2e = "test-e2e";
export function isE2eEnv() {
  return process.env.NODE_ENV === envTestE2e;
}

export function isProduction() {
  return (
    process.env.NODE_ENV?.length &&
    (process.env.NODE_ENV?.includes("prod") || process.env.NODE_ENV?.toLowerCase() === "production")
  );
}

export function isTest() {
  return process.env.NODE_ENV === "test";
}

export const dateFormat = () => {
  return dtFormat.format(new Date());
};
