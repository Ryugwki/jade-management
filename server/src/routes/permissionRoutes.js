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
import { requireAuth } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = Router();

router.use(requireAuth);

router.post("/approvals/request", createApprovalRequest);
router.get("/approvals/me", listApprovalsForUser);

router.get(
  "/policy",
  requirePermission("Security settings", "read"),
  getPolicy,
);
router.put(
  "/policy",
  requirePermission("Security settings", "manage"),
  updatePolicy,
);
router.get(
  "/approvals",
  requirePermission("Security settings", "manage"),
  listApprovals,
);
router.patch(
  "/approvals",
  requirePermission("Security settings", "manage"),
  updateApprovals,
);
router.delete(
  "/approvals/:id",
  requirePermission("Security settings", "manage"),
  deleteApprovalRequest,
);
router.get("/audit", requirePermission("Audit logs", "read"), listAuditLogs);
router.post(
  "/audit",
  requirePermission("Audit logs", "manage"),
  createAuditLog,
);
router.get(
  "/emergency",
  requirePermission("Security settings", "manage"),
  getEmergency,
);
router.post(
  "/emergency",
  requirePermission("Security settings", "manage"),
  updateEmergency,
);

export default router;
