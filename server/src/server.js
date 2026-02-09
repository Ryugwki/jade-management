import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import authRouter from "./routes/authRoutes.js";
import productsRouter from "./routes/productRoutes.js";
import uploadsRouter from "./routes/uploadRoutes.js";
import userRouter from "./routes/userRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import permissionRoutes from "./routes/permissionRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { User } from "./models/User.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim()),
    credentials: true,
  }),
);
// Allow larger JSON bodies for base64 image uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Connect DB
async function seedAdmin() {
  const email = "granozita@gmail.com";
  const password = "Ryug4k12002!";
  const existing = await User.findOne({ email }).exec();
  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    name: "Admin",
    email,
    passwordHash,
    role: "SUPER_ADMIN",
  });
  console.log("✅ Seeded admin account:", email);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");
    await seedAdmin();
  })
  .catch((err) => console.error("❌ MongoDB error:", err));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/user", userRouter);
app.use("/api/certificates", certificateRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/notifications", notificationRoutes);

// Sample route
app.get("/", (req, res) => {
  res.send("Pet Shop API is running");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ API Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Server error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
