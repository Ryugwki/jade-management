import { Router } from "express";
import {
  login,
  loginGuest,
  logout,
  me,
  initGuestToken,
  getGuestStats,
} from "../controllers/authController.js";
import {
  requireAuth,
  ensureGuestToken,
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", login);
router.post("/guest", loginGuest);
router.post("/guest-token", initGuestToken); // New endpoint for guest token
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.get("/guest-stats", requireAuth, requireAdmin, getGuestStats); // Admin only

export default router;
