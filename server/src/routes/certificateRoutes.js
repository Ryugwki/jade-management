import { Router } from "express";
import {
  createCertificate,
  deleteCertificate,
  getCertificate,
  listCertificates,
  updateCertificate,
} from "../controllers/certificateController.js";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", listCertificates);
router.get("/:id", getCertificate);
router.post("/", requireAdmin, createCertificate);
router.put("/:id", requireAdmin, updateCertificate);
router.delete("/:id", requireAdmin, deleteCertificate);

export default router;
