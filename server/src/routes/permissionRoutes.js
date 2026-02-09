import { Router } from "express";
import {
  createApprovalRequest,
  createAuditLog,
  deleteApprovalRequest,
  getEmergency,
  getPolicy,
  listApprovals,
  listApprovalsForUser,
  listAuditLogs,
  updateApprovals,
  updateEmergency,
  updatePolicy,
} from "../controllers/permissionController.js";
import { requireAuth, requireSuperAdmin } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);

router.post("/approvals/request", createApprovalRequest);
router.get("/approvals/me", listApprovalsForUser);

router.use(requireSuperAdmin);
router.get("/policy", getPolicy);
router.put("/policy", updatePolicy);
router.get("/approvals", listApprovals);
router.patch("/approvals", updateApprovals);
router.delete("/approvals/:id", deleteApprovalRequest);
router.get("/audit", listAuditLogs);
router.post("/audit", createAuditLog);
router.get("/emergency", getEmergency);
router.post("/emergency", updateEmergency);

export default router;
