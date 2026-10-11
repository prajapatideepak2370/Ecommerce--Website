const crypto = require("crypto");
const Razorpay = require("razorpay");
const ExpressError = require("./ExpressError");

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const isConfigured = Boolean(KEY_ID && KEY_SECRET);
const isTestMode = Boolean(KEY_ID && KEY_ID.startsWith("rzp_test_"));

let razorpayInstance = null;
if (isConfigured) {
  razorpayInstance = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
}

const amountInPaise = (amount) => {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new ExpressError(400, "The payment amount must be greater than zero.");
  }
  return Math.round((value + Number.EPSILON) * 100);
};

const logGatewayError = (stage, error) => {
  console.error("[payments] Razorpay request failed", {
    stage,
    code: error?.error?.code || error?.code || "UNKNOWN",
    status: Number(error?.statusCode || error?.status_code) || undefined,
  });
};

const gatewayError = (stage, error) => {
  logGatewayError(stage, error);
  return new ExpressError(
    502,
    "Online payments are temporarily unavailable. Please try again.",
  );
};

async function createOrder({ amount, receipt, currency = "INR", notes = {} }) {
  if (!razorpayInstance) {
    throw new ExpressError(
      500,
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
  }
  const amountPaise = amountInPaise(amount);
  try {
    return await razorpayInstance.orders.create({
      amount: amountPaise,
      currency,
      receipt: String(receipt),
      notes,
      payment_capture: 1,
    });
  } catch (error) {
    throw gatewayError("create_order", error);
  }
}

async function fetchOrder(orderId) {
  if (!razorpayInstance) {
    throw new ExpressError(
      500,
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
  }
  try {
    return await razorpayInstance.orders.fetch(orderId);
  } catch (error) {
    throw gatewayError("fetch_order", error);
  }
}

async function fetchPayment(paymentId) {
  if (!razorpayInstance) {
    throw new ExpressError(
      500,
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
  }
  try {
    return await razorpayInstance.payments.fetch(paymentId);
  } catch (error) {
    throw gatewayError("fetch_payment", error);
  }
}

function verifyPaymentSignature({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }
  if (!KEY_SECRET || !/^[a-f0-9]{64}$/i.test(razorpay_signature)) {
    return false;
  }
  const expected = Buffer.from(
    crypto
      .createHmac("sha256", KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex"),
    "hex",
  );
  const supplied = Buffer.from(razorpay_signature, "hex");
  return (
    expected.length === supplied.length &&
    crypto.timingSafeEqual(expected, supplied)
  );
}

module.exports = {
  isConfigured,
  isTestMode,
  keyId: KEY_ID,
  createOrder,
  fetchOrder,
  fetchPayment,
  verifyPaymentSignature,
};
