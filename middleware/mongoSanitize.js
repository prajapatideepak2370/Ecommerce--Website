function has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function sanitize(target, opts = {}) {
  const replaceWith = opts.replaceWith;
  const dryRun = opts.dryRun === true;

  if (Array.isArray(target)) {
    return target.map((item) => sanitize(item, opts));
  }

  if (target && typeof target === "object" && target.constructor === Object) {
    const output = {};
    Object.keys(target).forEach((key) => {
      const value = target[key];
      let cleanKey = key;
      const firstChar = key.charAt(0);
      if (firstChar === "$") {
        cleanKey = replaceWith !== undefined ? replaceWith : key.slice(1);
      }
      if (cleanKey.includes(".")) {
        cleanKey = replaceWith !== undefined
          ? cleanKey.replace(/\./g, replaceWith)
          : cleanKey.replace(/\./g, "_");
      }
      if (cleanKey && !dryRun) {
        output[cleanKey] = sanitize(value, opts);
      }
    });
    return output;
  }
  return target;
}

module.exports = function mongoSanitize(opts) {
  return function mongoSanitizeMiddleware(req, _res, next) {
    if (req.body && typeof req.body === "object") {
      req.body = sanitize(req.body, opts);
    }
    if (req.query && typeof req.query === "object") {
      req.query = { ...sanitize(req.query, opts) };
    }
    if (req.params && typeof req.params === "object") {
      req.params = sanitize(req.params, opts);
    }
    next();
  };
};

module.exports.sanitize = sanitize;
