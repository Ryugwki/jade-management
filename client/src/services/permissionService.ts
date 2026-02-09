import api from "@/lib/api/axiosInstance";

export type PermissionPolicy = {
  id: string;
  roleCards: {
    title: string;
    subtitle: string;
    badge: string;
    perks: string[];
  }[];
  guardrails: {
    title: string;
    description: string;
  }[];
  matrix: {
    area: string;
    description: string;
    superAdmin: string;
    admin: string;
    guest: string;
  }[];
  updatedAt?: string;
};

export type ApprovalRequest = {
  id: string;
  title: string;
  requester: string;
  state: "waiting" | "needsSuper" | "approved" | "rejected";
  createdAt?: string;
  updatedAt?: string;
};

export type AuditEntry = {
  id: string;
  message: string;
  category?: string;
  actorEmail?: string;
  actorRole?: string;
  createdAt: string;
};

export type EmergencyAccess = {
  id: string;
  status: "enforced" | "override_requested";
  requestedBy?: string;
  requestedAt?: string;
  expiresAt?: string;
};

export async function getPolicy(): Promise<PermissionPolicy> {
  const response = await api.get("/permissions/policy");
  return response.data.policy as PermissionPolicy;
}

export async function updatePolicy(payload: {
  roleCards?: PermissionPolicy["roleCards"];
  guardrails?: PermissionPolicy["guardrails"];
  matrix?: PermissionPolicy["matrix"];
}): Promise<PermissionPolicy> {
  const response = await api.put("/permissions/policy", payload);
  return response.data.policy as PermissionPolicy;
}

export async function listApprovals(): Promise<ApprovalRequest[]> {
  const response = await api.get("/permissions/approvals");
  return response.data.approvals as ApprovalRequest[];
}

export async function listApprovalsForMe(): Promise<ApprovalRequest[]> {
  const response = await api.get("/permissions/approvals/me");
  return response.data.approvals as ApprovalRequest[];
}

export async function updateApprovals(payload: {
  ids: string[];
  status: ApprovalRequest["state"];
}): Promise<ApprovalRequest[]> {
  const response = await api.patch("/permissions/approvals", payload);
  return response.data.approvals as ApprovalRequest[];
}

export async function requestApproval(payload: {
  title: string;
  status?: ApprovalRequest["state"];
  area?: string;
}): Promise<ApprovalRequest> {
  const response = await api.post("/permissions/approvals/request", payload);
  return response.data.approval as ApprovalRequest;
}

export async function deleteApprovalRequest(
  id: string,
): Promise<ApprovalRequest> {
  const response = await api.delete(`/permissions/approvals/${id}`);
  return response.data.approval as ApprovalRequest;
}

export async function listAuditLogs(limit?: number): Promise<AuditEntry[]> {
  const response = await api.get("/permissions/audit", {
    params: limit ? { limit } : undefined,
  });
  return response.data.auditLog as AuditEntry[];
}

export async function logAudit(payload: {
  message: string;
  category?: string;
}): Promise<void> {
  await api.post("/permissions/audit", payload);
}

export async function getEmergency(): Promise<EmergencyAccess> {
  const response = await api.get("/permissions/emergency");
  return response.data.emergency as EmergencyAccess;
}

export async function updateEmergency(payload: {
  action: "request" | "cancel";
}): Promise<EmergencyAccess> {
  const response = await api.post("/permissions/emergency", payload);
  return response.data.emergency as EmergencyAccess;
}
