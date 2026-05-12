import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// ✅ FIX: Added payment routes logging
app.use("/api/payment", paymentRoutes);

// ✅ FIX: Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "running",
    service: "Vinvelil Razorpay Backend",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// ✅ FIX: 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.path,
    method: req.method
  });
});

// ✅ FIX: Error handler
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ IARRD Payment Backend Running`);
  console.log(`📌 Port: ${PORT}`);
  console.log(`🔑 Razorpay Key ID: ${process.env.RAZORPAY_KEY_ID ? "✅ Loaded" : "❌ Missing"}`);
  console.log(`🔐 Razorpay Secret: ${process.env.RAZORPAY_KEY_SECRET ? "✅ Loaded" : "❌ Missing"}`);
  console.log(`🌐 CORS: Enabled`);
  console.log(`📡 API: http://localhost:${PORT}/api/payment`);
  console.log(`${"=".repeat(60)}\n`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received - shutting down gracefully");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});