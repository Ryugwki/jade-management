import mongoose from "mongoose";

const roleCardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    badge: { type: String, required: true },
    perks: { type: [String], default: [] },
  },
  { _id: false },
);

const guardrailSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false },
);

const matrixRowSchema = new mongoose.Schema(
  {
    area: { type: String, required: true },
    description: { type: String, required: true },
    superAdmin: { type: String, required: true },
    admin: { type: String, required: true },
    guest: { type: String, required: true },
  },
  { _id: false },
);

const permissionPolicySchema = new mongoose.Schema(
  {
    roleCards: { type: [roleCardSchema], default: [] },
    guardrails: { type: [guardrailSchema], default: [] },
    matrix: { type: [matrixRowSchema], default: [] },
  },
  { timestamps: true },
);

export const PermissionPolicy = mongoose.model(
  "PermissionPolicy",
  permissionPolicySchema,
);
