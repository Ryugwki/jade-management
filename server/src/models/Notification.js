import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String },
    userId: { type: String },
    role: { type: String },
    type: { type: String, default: "general" },
    sourceId: { type: String },
    readAt: { type: Date },
  },
  { timestamps: true },
);

export const Notification = mongoose.model("Notification", notificationSchema);
