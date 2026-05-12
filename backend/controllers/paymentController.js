import dotenv from "dotenv";
dotenv.config();

import Razorpay from "razorpay";
import crypto from "crypto";

// ✅ CRITICAL FIX: Validate env vars on startup
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("❌ FATAL ERROR: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing in .env");
  console.error("   Payment module will not work. Server starting anyway for diagnostics.");
  // DO NOT process.exit(1) here - let server start for debugging
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
  try {
    // ✅ FIX: Changed from 1 * 100 to 99 * 100
    const options = {
      amount: 99 * 100,  // ₹99.00 = 9900 paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    console.log("📦 Creating Razorpay order for ₹99...");
    const order = await razorpay.orders.create(options);
    console.log(`✅ Order created: ${order.id}`);

    res.status(200).json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error("❌ Order creation failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create payment order: " + error.message
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // ✅ FIX: Validate all required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.warn("⚠️  Missing payment verification fields:", {
        order_id: !!razorpay_order_id,
        payment_id: !!razorpay_payment_id,
        signature: !!razorpay_signature
      });
      return res.status(400).json({
        success: false,
        message: "Missing required payment fields"
      });
    }

    // ✅ Generate signature from backend secret
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(
        razorpay_order_id + "|" + razorpay_payment_id
      )
      .digest("hex");

    // ✅ Compare signatures securely
    const isValid = generatedSignature === razorpay_signature;
    
    console.log(`🔐 Signature verification: ${isValid ? "✅ PASSED" : "❌ FAILED"}`);
    console.log(`   Order: ${razorpay_order_id}`);
    console.log(`   Payment: ${razorpay_payment_id}`);

    if (isValid) {
      res.status(200).json({
        success: true,
        message: "Payment verified successfully"
      });
    } else {
      console.warn("⚠️  Signature mismatch detected - possible tampering attempt");
      res.status(400).json({
        success: false,
        message: "Invalid payment signature"
      });
    }

  } catch (error) {
    console.error("❌ Payment verification error:", error.message);
    res.status(500).json({
      success: false,
      message: "Payment verification failed: " + error.message
    });
  }
};