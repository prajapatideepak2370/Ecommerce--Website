function isProductionEnvironment(env = process.env) {
  return env.NODE_ENV === "production" || env.RENDER === "true";
}

module.exports = { isProductionEnvironment };
