import express from "express";
import cloudinary from "../config/cloudinary.js";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.post("/image", requireAdmin, async (req, res) => {
  try {
    const { image, folder } = req.body;
    if (!image || typeof image !== "string") {
      return res.status(400).json({ message: "No image provided" });
    }
    if (
      !process.env.CLOUDINARY_URL &&
      (!process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET)
    ) {
      return res
        .status(500)
        .json({ message: "Cloudinary is not configured on the server" });
    }
    const result = await cloudinary.uploader.upload(image, {
      folder: folder || process.env.CLOUDINARY_PRODUCT_FOLDER || "products",
      resource_type: "auto",
    });
    return res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    console.error("/api/uploads/image error:", err);
    return res.status(500).json({ message: err?.message || "Upload failed" });
  }
});

router.delete("/image", requireAdmin, async (req, res) => {
  try {
    const { imageUrl, public_id } = req.body;
    const id =
      public_id ||
      (imageUrl ? imageUrl.split("/").pop()?.split(".")[0] : undefined);
    if (!id) {
      return res.status(400).json({ message: "No image identifier provided" });
    }
    await cloudinary.uploader.destroy(id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Delete failed" });
  }
});

export default router;
