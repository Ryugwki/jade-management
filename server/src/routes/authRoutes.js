import { Router } from "express";
import {
  login,
  loginGuest,
  logout,
  me,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", login);
router.post("/guest", loginGuest);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
