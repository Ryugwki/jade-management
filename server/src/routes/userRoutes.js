import { Router } from "express";
import {
  changePassword,
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUserStatus,
  updateUser,
} from "../controllers/userController.js";
import {
  requireAdmin,
  requireAuth,
  requireSuperAdmin,
} from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.post("/me/password", changePassword);
router.get("/", requireSuperAdmin, listUsers);
router.post("/", requireSuperAdmin, createUser);
router.get("/:id", getUser);
router.patch("/:id/status", requireSuperAdmin, updateUserStatus);
router.put("/:id", updateUser);
router.delete("/:id", requireSuperAdmin, deleteUser);

export default router;
