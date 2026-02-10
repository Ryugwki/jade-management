import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProductStatus,
  updateProduct,
} from "../controllers/productController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = Router();

router.use(requireAuth);
router.get(
  "/",
  requirePermission("Inventory & products", "read"),
  listProducts,
);
router.get(
  "/:id",
  requirePermission("Inventory & products", "read"),
  getProduct,
);
router.patch(
  "/:id/status",
  requirePermission("Inventory & products", "manage"),
  updateProductStatus,
);
router.post(
  "/",
  requirePermission("Inventory & products", "manage"),
  createProduct,
);
router.put(
  "/:id",
  requirePermission("Inventory & products", "manage"),
  updateProduct,
);
router.delete(
  "/:id",
  requirePermission("Inventory & products", "manage"),
  deleteProduct,
);

export default router;
