import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    certificateId: { type: String, required: true },
    authority: { type: String, default: "" },
    status: {
      type: String,
      enum: ["unverified", "pending", "verified"],
      default: "pending",
    },
    link: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    issuedAt: { type: Date },
    expiresAt: { type: Date },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

export const Certificate = mongoose.model("Certificate", certificateSchema);
