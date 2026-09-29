const ExpressError = require("../utils/ExpressError");

module.exports = (err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message).join(", ");
    statusCode = 400;
    message = messages;
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  if (err.code && err.code === 11000) {
    statusCode = 409;
    const key = Object.keys(err.keyPattern || {})[0] || "field";
    message = `Duplicate value for ${key}. Please use a different value.`;
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  if (process.env.NODE_ENV === "development") {
    return res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode,
        message,
        stack: err.stack,
      },
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode,
      message,
    },
  });
};
