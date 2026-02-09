import { cloudinary } from "../utils/cloudinary.js";

export async function uploadCertificate(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "File is required" });
  }

  if (
    !process.env.CLOUDINARY_URL &&
    (!process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET)
  ) {
    return res.status(500).json({
      message: "Cloudinary is not configured",
    });
  }

  const folder = process.env.CLOUDINARY_FOLDER || "gemstone/certificates";
  const base64 = req.file.buffer.toString("base64");
  const dataUri = `data:${req.file.mimetype};base64,${base64}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "auto",
    });

    return res.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (error) {
    console.error("Upload certificate failed", error);
    return res.status(500).json({
      message: "Upload failed",
      error:
        error?.message ||
        error?.error?.message ||
        error?.error?.name ||
        "Unknown error",
      details: error?.error || null,
    });
  }
}

export async function uploadProductImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "File is required" });
  }

  if (
    !process.env.CLOUDINARY_URL &&
    (!process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET)
  ) {
    return res.status(500).json({
      message: "Cloudinary is not configured",
    });
  }

  const folder = process.env.CLOUDINARY_PRODUCT_FOLDER || "gemstone/products";
  const base64 = req.file.buffer.toString("base64");
  const dataUri = `data:${req.file.mimetype};base64,${base64}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "auto",
    });

    return res.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (error) {
    console.error("Upload product image failed", error);
    return res.status(500).json({
      message: "Upload failed",
      error:
        error?.message ||
        error?.error?.message ||
        error?.error?.name ||
        "Unknown error",
      details: error?.error || null,
    });
  }
}
