import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    images: { type: [String], default: [] },
    gemstoneType: { type: String, default: "" },
    jewelryType: { type: String, default: "" },
    colorType: { type: String, default: "" },
    dimensions: {
      innerDiameterMm: { type: Number },
      widthMm: { type: Number },
      thicknessMm: { type: Number },
      shape: { type: String },
      bangleProfile: { type: String },
      beadDiameterMm: { type: Number },
      maxBeadDiameterMm: { type: Number },
      minBeadDiameterMm: { type: Number },
      beadCount: { type: Number },
      lengthMm: { type: Number },
      ringSize: { type: Number },
      ringSizeUS: { type: Number },
      earringType: { type: String },
    },
    buyingPrice: { type: String, default: "" },
    sellingPrice: { type: String, default: "" },
    certificateId: { type: String, default: "" },
    certificateAuthority: { type: String, default: "" },
    certificateStatus: {
      type: String,
      enum: ["unverified", "pending", "verified"],
      default: "pending",
    },
    certificateLink: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const Product = mongoose.model("Product", productSchema);
