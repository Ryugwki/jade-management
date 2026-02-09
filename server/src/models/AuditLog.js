import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    actorId: { type: String },
    actorEmail: { type: String },
    actorRole: { type: String },
    category: { type: String, default: "general" },
  },
  { timestamps: true },
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
