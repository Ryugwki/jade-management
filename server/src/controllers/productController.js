import { Product } from "../models/Product.js";

const PRICING_AREA = "Pricing & billing";
const canViewBuyingPrice = (role, permissions) => {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return true;
  const level = permissions?.[PRICING_AREA];
  return level === "read" || level === "manage" || level === "full";
};

const sanitizeProduct = (product, role, permissions) => {
  const base = {
    id: product._id.toString(),
    description: product.description,
    image: product.image || product.images?.[0] || "",
    images: product.images?.length
      ? product.images
      : product.image
        ? [product.image]
        : [],
    gemstoneType: product.gemstoneType,
    jewelryType: product.jewelryType,
    colorType: product.colorType,
    dimensions: product.dimensions,
    buyingPrice: product.buyingPrice,
    sellingPrice: product.sellingPrice,
    certificateId: product.certificateId,
    certificateAuthority: product.certificateAuthority,
    certificateStatus: product.certificateStatus,
    certificateLink: product.certificateLink,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };

  if (!canViewBuyingPrice(role, permissions)) {
    delete base.buyingPrice;
  }

  return base;
};

export async function listProducts(req, res) {
  const products = await Product.find().sort({ createdAt: -1 }).exec();
  const payload = products.map((product) =>
    sanitizeProduct(product, req.user?.role, req.user?.permissions),
  );
  return res.json({ products: payload });
}

export async function getProduct(req, res) {
  const product = await Product.findById(req.params.id).exec();
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  return res.json({
    product: sanitizeProduct(product, req.user?.role, req.user?.permissions),
  });
}

export async function createProduct(req, res) {
  const payload = { ...req.body };
  if (!payload.images?.length && payload.image) {
    payload.images = [payload.image];
  }
  if (payload.images?.length && !payload.image) {
    payload.image = payload.images[0];
  }
  const product = await Product.create(payload);
  return res
    .status(201)
    .json({ product: sanitizeProduct(product, req.user?.role, req.user?.permissions) });
}

export async function updateProduct(req, res) {
  const payload = { ...req.body };
  if (!payload.images?.length && payload.image) {
    payload.images = [payload.image];
  }
  if (payload.images?.length && !payload.image) {
    payload.image = payload.images[0];
  }
  const product = await Product.findByIdAndUpdate(req.params.id, payload, {
    new: true,
  }).exec();

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  return res.json({
    product: sanitizeProduct(product, req.user?.role, req.user?.permissions),
  });
}

export async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id).exec();
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  return res.json({ message: "Product deleted" });
}
