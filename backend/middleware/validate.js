const ExpressError = require("../utils/ExpressError");

module.exports.validate = (schema, source = "body") => (req, res, next) => {
  if (!schema) return next();
  const data = req[source];
  const { error } = schema.validate(data, { abortEarly: false, allowUnknown: false });
  if (error) {
    const messages = error.details.map((d) => d.message).join(", ");
    return next(new ExpressError(400, messages));
  }
  next();
};
