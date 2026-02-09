import mongoose from "mongoose";

const emergencyAccessSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["enforced", "override_requested"],
      default: "enforced",
    },
    requestedBy: { type: String },
    requestedAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

export const EmergencyAccess = mongoose.model(
  "EmergencyAccess",
  emergencyAccessSchema,
);
