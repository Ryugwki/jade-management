import mongoose from "mongoose";

const approvalRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    requester: { type: String, required: true },
    requesterId: { type: String },
    requesterEmail: { type: String },
    area: { type: String },
    status: {
      type: String,
      enum: ["waiting", "needsSuper", "approved", "rejected"],
      default: "waiting",
    },
  },
  { timestamps: true },
);

export const ApprovalRequest = mongoose.model(
  "ApprovalRequest",
  approvalRequestSchema,
);
