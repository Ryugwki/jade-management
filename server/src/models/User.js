import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "GUEST"],
      default: "GUEST",
    },
    permissions: {
      type: Map,
      of: String,
      default: {},
    },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    language: { type: String, default: "vi" },
    timezone: { type: String, default: "Asia/Ho_Chi_Minh" },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
