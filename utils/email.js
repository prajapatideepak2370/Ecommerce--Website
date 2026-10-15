const nodemailer = require("nodemailer");

function getConfig() {
  const host = process.env.SMTP_HOST;
  const portValue = process.env.SMTP_PORT;
  const port = Number(portValue);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM;

  if (
    !host ||
    !portValue ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !user ||
    !pass ||
    !from
  ) {
    return null;
  }

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE.toLowerCase() === "true"
      : port === 465,
    auth: { user, pass },
    from,
  };
}

module.exports.isConfigured = () => Boolean(getConfig());

module.exports.sendPasswordResetEmail = async (email, token) => {
  const config = getConfig();
  if (!config) {
    throw new Error("SMTP email service is not configured.");
  }

  const resetUrl = new URL(
    "/reset-password",
    process.env.FRONTEND_URL || "http://localhost:5173",
  );
  resetUrl.searchParams.set("token", token);

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.auth.user, pass: config.auth.pass },
  });

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: "Reset your TRYVOXEL password",
    text: `Use this link to reset your TRYVOXEL password. It expires in 15 minutes:\n\n${resetUrl.toString()}\n\nIf you did not request this, you can ignore this email.`,
  });
};
