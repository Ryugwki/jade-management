import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProductStatus,
  updateProduct,
} from "../controllers/productController.js";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", listProducts);
router.get("/:id", getProduct);
router.patch("/:id/status", requireAdmin, updateProductStatus);
router.post("/", requireAdmin, createProduct);
router.put("/:id", requireAdmin, updateProduct);
router.delete("/:id", requireAdmin, deleteProduct);

export default router;
