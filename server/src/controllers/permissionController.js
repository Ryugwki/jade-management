import { PermissionPolicy } from "../models/PermissionPolicy.js";
import { ApprovalRequest } from "../models/ApprovalRequest.js";
import { AuditLog } from "../models/AuditLog.js";
import { EmergencyAccess } from "../models/EmergencyAccess.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";

const defaultPolicy = {
  roleCards: [
    {
      title: "Super Admin",
      subtitle: "Governance",
      badge: "Owner tier",
      perks: [
        "Owns policy decisions and critical locks",
        "Full access to billing, users, and audit trails",
        "Can grant emergency access and revoke instantly",
      ],
    },
    {
      title: "Admin",
      subtitle: "Operations",
      badge: "Core access",
      perks: [
        "Manages products, certificates, and pricing",
        "Invites guests and assigns tasks",
        "Reviews change requests and approvals",
      ],
    },
    {
      title: "Guest",
      subtitle: "Observer",
      badge: "Limited",
      perks: [
        "Views inventory and certificate details",
        "Submits change requests for approval",
        "No access to buying prices or billing",
      ],
    },
  ],
  guardrails: [
    {
      title: "MFA required",
      description: "All admins must enable multi-factor authentication.",
    },
    {
      title: "Privileged actions",
      description: "Critical changes require two-person approval.",
    },
    {
      title: "Certificate integrity",
      description: "Verified certificates cannot be edited by guests.",
    },
  ],
  matrix: [
    {
      area: "Inventory & products",
      description: "Create, edit, and control pricing",
      superAdmin: "full",
      admin: "manage",
      guest: "read",
    },
    {
      area: "Certificates",
      description: "Verify, issue, and revoke",
      superAdmin: "full",
      admin: "manage",
      guest: "limited",
    },
    {
      area: "User management",
      description: "Invite, deactivate, and assign roles",
      superAdmin: "full",
      admin: "limited",
      guest: "none",
    },
    {
      area: "Pricing & billing",
      description: "Buying costs, payouts, and invoices",
      superAdmin: "full",
      admin: "manage",
      guest: "none",
    },
    {
      area: "Security settings",
      description: "SSO, MFA, and policy enforcement",
      superAdmin: "full",
      admin: "read",
      guest: "none",
    },
    {
      area: "Audit logs",
      description: "Export and monitor activity",
      superAdmin: "full",
      admin: "read",
      guest: "none",
    },
  ],
};


const toPolicyResponse = (policy) => ({
  id: policy._id.toString(),
  roleCards: policy.roleCards,
  guardrails: policy.guardrails,
  matrix: policy.matrix,
  updatedAt: policy.updatedAt,
});

const toApprovalResponse = (approval) => ({
  id: approval._id.toString(),
  title: approval.title,
  requester: approval.requester,
  state: approval.status,
  createdAt: approval.createdAt,
  updatedAt: approval.updatedAt,
});

const PRICING_AREA = "Pricing & billing";
const shouldGrantBuyingPrice = (approval) => {
  const title = (approval?.title || "").toLowerCase();
  const area = (approval?.area || "").toLowerCase();
  return (
    area === PRICING_AREA.toLowerCase() || title.includes("buying price")
  );
};

const resolveRequesterEmail = (approval) => {
  const email = approval?.requesterEmail || approval?.requester || "";
  return email.includes("@") ? email.toLowerCase() : "";
};

async function resolveRequesterUser(approval) {
  if (approval.requesterId) {
    return User.findById(approval.requesterId).exec();
  }
  const email = resolveRequesterEmail(approval);
  if (!email) return null;
  return User.findOne({ email }).exec();
}

async function grantBuyingPriceAccess(approval) {
  if (!shouldGrantBuyingPrice(approval)) return;

  const user = await resolveRequesterUser(approval);
  if (!user) return;

  const permissions = user.permissions || new Map();
  if (permissions instanceof Map) {
    permissions.set(PRICING_AREA, "read");
  } else {
    permissions[PRICING_AREA] = "read";
  }
  user.permissions = permissions;
  await user.save();
}

const buildDefaultPermissions = (matrix, role) => {
  const roleKey =
    role === "SUPER_ADMIN" ? "superAdmin" : role === "ADMIN" ? "admin" : "guest";
  return matrix.reduce((acc, row) => {
    acc[row.area] = row[roleKey];
    return acc;
  }, {});
};

const isEmptyPermissions = (permissions) => {
  if (!permissions) return true;
  if (permissions instanceof Map) return permissions.size === 0;
  return Object.keys(permissions).length === 0;
};

const toAuditResponse = (entry) => ({
  id: entry._id.toString(),
  message: entry.message,
  category: entry.category,
  actorEmail: entry.actorEmail,
  actorRole: entry.actorRole,
  createdAt: entry.createdAt,
});

const toEmergencyResponse = (emergency) => ({
  id: emergency._id.toString(),
  status: emergency.status,
  requestedBy: emergency.requestedBy,
  requestedAt: emergency.requestedAt,
  expiresAt: emergency.expiresAt,
});

async function ensurePolicy() {
  let policy = await PermissionPolicy.findOne().exec();
  if (!policy) {
    policy = await PermissionPolicy.create(defaultPolicy);
  }
  return policy;
}

async function ensureApprovals() {
  return ApprovalRequest.find().sort({ createdAt: -1 }).exec();
}

async function ensureEmergency() {
  let emergency = await EmergencyAccess.findOne().exec();
  if (!emergency) {
    emergency = await EmergencyAccess.create({ status: "enforced" });
  }
  return emergency;
}

async function createAudit({ message, actor, category = "permissions" }) {
  const entry = await AuditLog.create({
    message,
    actorId: actor?.id,
    actorEmail: actor?.email,
    actorRole: actor?.role,
    category,
  });
  await Notification.create({
    title: "New audit log",
    message,
    role: "SUPER_ADMIN",
    type: "audit",
    sourceId: entry._id.toString(),
  });
}

export async function createApprovalRequest(req, res) {
  const { title, status, area } = req.body || {};
  if (!title) {
    return res.status(400).json({ message: "Title required" });
  }

  const approval = await ApprovalRequest.create({
    title,
    requester: req.user?.email || req.user?.name || "Unknown",
    requesterId: req.user?.id,
    requesterEmail: req.user?.email,
    area,
    status: status || "waiting",
  });

  await Notification.create({
    title: "Approval request",
    message: `${approval.requester} · ${title}`,
    role: "SUPER_ADMIN",
    type: "approval",
    sourceId: approval._id.toString(),
  });

  await createAudit({
    message: `Created approval request: ${title}.`,
    actor: req.user,
    category: "approval",
  });

  return res.status(201).json({ approval: toApprovalResponse(approval) });
}

export async function getPolicy(_req, res) {
  const policy = await ensurePolicy();
  return res.json({ policy: toPolicyResponse(policy) });
}

export async function updatePolicy(req, res) {
  const { matrix, guardrails, roleCards } = req.body || {};
  const policy = await ensurePolicy();

  if (Array.isArray(matrix)) {
    policy.matrix = matrix;
  }
  if (Array.isArray(guardrails)) {
    policy.guardrails = guardrails;
  }
  if (Array.isArray(roleCards)) {
    policy.roleCards = roleCards;
  }

  await policy.save();
  const users = await User.find().exec();
  await Promise.all(
    users
      .filter((entry) => isEmptyPermissions(entry.permissions))
      .map(async (entry) => {
        entry.permissions = buildDefaultPermissions(policy.matrix, entry.role);
        await entry.save();
      }),
  );
  await createAudit({
    message: "Updated permission policy.",
    actor: req.user,
  });

  return res.json({ policy: toPolicyResponse(policy) });
}

export async function listApprovals(_req, res) {
  const approvals = await ensureApprovals();
  return res.json({ approvals: approvals.map(toApprovalResponse) });
}

export async function listApprovalsForUser(req, res) {
  const email = (req.user?.email || "").toLowerCase();
  const conditions = [];
  if (req.user?.id) {
    conditions.push({ requesterId: req.user.id });
  }
  if (email) {
    conditions.push({ requesterEmail: email });
    conditions.push({ requester: email });
  }

  const approvals = conditions.length
    ? await ApprovalRequest.find({ $or: conditions })
        .sort({ createdAt: -1 })
        .exec()
    : [];

  return res.json({ approvals: approvals.map(toApprovalResponse) });
}

export async function updateApprovals(req, res) {
  const { ids, status } = req.body || {};
  if (!Array.isArray(ids) || !ids.length || !status) {
    return res.status(400).json({ message: "Invalid update payload" });
  }

  await ApprovalRequest.updateMany(
    { _id: { $in: ids } },
    { $set: { status } },
  ).exec();

  const approvals = await ApprovalRequest.find({ _id: { $in: ids } }).exec();
  if (status === "approved") {
    await Promise.all(approvals.map(grantBuyingPriceAccess));
  }
  await Promise.all(
    approvals.map(async (approval) => {
      const requester = await resolveRequesterUser(approval);
      if (!requester) return;
      await Notification.create({
        title: "Approval update",
        message: `${approval.title} · ${status}`,
        userId: requester._id.toString(),
        type: "approval",
        sourceId: approval._id.toString(),
      });
    }),
  );
  await createAudit({
    message: `Updated ${ids.length} approval request(s) to ${status}.`,
    actor: req.user,
  });

  return res.json({ approvals: approvals.map(toApprovalResponse) });
}

export async function deleteApprovalRequest(req, res) {
  const { id } = req.params || {};
  if (!id) {
    return res.status(400).json({ message: "Approval id required" });
  }

  const approval = await ApprovalRequest.findByIdAndDelete(id).exec();
  if (!approval) {
    return res.status(404).json({ message: "Approval not found" });
  }

  await createAudit({
    message: `Deleted approval request: ${approval.title}.`,
    actor: req.user,
    category: "approval",
  });

  return res.json({ approval: toApprovalResponse(approval) });
}

export async function listAuditLogs(req, res) {
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const entries = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();
  return res.json({ auditLog: entries.map(toAuditResponse) });
}

export async function createAuditLog(req, res) {
  const { message, category } = req.body || {};
  if (!message) {
    return res.status(400).json({ message: "Message required" });
  }
  await createAudit({ message, actor: req.user, category });
  return res.json({ message: "Logged" });
}

export async function getEmergency(req, res) {
  const emergency = await ensureEmergency();
  return res.json({ emergency: toEmergencyResponse(emergency) });
}

export async function updateEmergency(req, res) {
  const { action } = req.body || {};
  const emergency = await ensureEmergency();

  if (action === "request") {
    const requestedAt = new Date();
    emergency.status = "override_requested";
    emergency.requestedAt = requestedAt;
    emergency.requestedBy = req.user?.id;
    emergency.expiresAt = new Date(requestedAt.getTime() + 60 * 60 * 1000);
  } else if (action === "cancel") {
    emergency.status = "enforced";
    emergency.requestedAt = undefined;
    emergency.requestedBy = undefined;
    emergency.expiresAt = undefined;
  } else {
    return res.status(400).json({ message: "Invalid action" });
  }

  await emergency.save();
  await createAudit({
    message:
      action === "request"
        ? "Requested emergency override."
        : "Canceled emergency override request.",
    actor: req.user,
  });

  return res.json({ emergency: toEmergencyResponse(emergency) });
}
