import dotenv from "dotenv";
dotenv.config();

import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {

  try {

    const options = {
      amount: 99 * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {

    console.error("Create Order Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create order"
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

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(
        razorpay_order_id + "|" + razorpay_payment_id
      )
      .digest("hex");

    if (generatedSignature === razorpay_signature) {

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully"
      });

    } else {

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature"
      });

    }

  } catch (error) {

    console.error("Verification Error:", error);

    res.status(500).json({
      success: false,
      message: "Payment verification failed"
    });

  }

};