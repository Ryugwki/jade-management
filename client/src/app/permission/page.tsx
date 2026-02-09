"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
} from "react";
import { Playfair_Display, Space_Grotesk } from "next/font/google";
import { useRouter } from "next/navigation";
import {
  Crown,
  Shield,
  Lock,
  ShieldCheck,
  FileCheck2,
  Sparkles,
  KeyRound,
  Activity,
  AlertTriangle,
  Settings2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import * as userService from "@/services/userService";
import * as permissionService from "@/services/permissionService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { ActionMenu } from "@/components/ActionMenu";

const display = Playfair_Display({ subsets: ["latin"], weight: ["600"] });
const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

type UserRole = "SUPER_ADMIN" | "ADMIN" | "GUEST";
type UserPermissionLevel = "none" | "limited" | "read" | "manage" | "full";
type RoleCard = {
  title: string;
  subtitle: string;
  badge: string;
  icon: ElementType;
  gradient: string;
  perks: string[];
};
type Guardrail = {
  title: string;
  description: string;
  icon: ElementType;
};
type User = {
  id: string;
  name?: string;
  email?: string;
  role: UserRole;
  permissions?: Record<string, UserPermissionLevel>;
  isActive?: boolean;
  updatedBy?: string;
};

const defaultRoleCards: RoleCard[] = [
  {
    title: "Super Admin",
    subtitle: "Governance",
    badge: "Owner tier",
    icon: Crown,
    gradient: "from-purple-500/10 to-blue-500/10",
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
    icon: Shield,
    gradient: "from-blue-500/10 to-cyan-500/10",
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
    icon: Shield,
    gradient: "from-slate-500/10 to-gray-500/10",
    perks: [
      "Views inventory and certificate details",
      "Submits change requests for approval",
      "No access to buying prices or billing",
    ],
  },
];

const buildPermissionLevels = (t: (key: string) => string) => ({
  full: {
    label: t("permission.level.full"),
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  manage: {
    label: t("permission.level.manage"),
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  read: {
    label: t("permission.level.read"),
    className: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  },
  limited: {
    label: t("permission.level.limited"),
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  none: {
    label: t("permission.level.none"),
    className: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  },
});

type PermissionLevelsMap = ReturnType<typeof buildPermissionLevels>;
type PermissionLevelKey = keyof PermissionLevelsMap;
type PermissionRoleKey = "superAdmin" | "admin" | "guest";
type MatrixRow = {
  area: string;
  description: string;
  superAdmin: PermissionLevelKey;
  admin: PermissionLevelKey;
  guest: PermissionLevelKey;
};

type ApprovalState = "waiting" | "needsSuper" | "approved" | "rejected";
type ApprovalItem = {
  id: string;
  title: string;
  requester: string;
  state: ApprovalState;
};

type AuditEntry = {
  id: string;
  message: string;
  createdAt: string;
  actorEmail?: string;
  actorRole?: string;
  category?: string;
};

type LockStatus = "enforced" | "override_requested";

const permissionOrder: PermissionLevelKey[] = [
  "none",
  "limited",
  "read",
  "manage",
  "full",
];

const normalizePermissionLevel = (value: string): PermissionLevelKey =>
  permissionOrder.includes(value as PermissionLevelKey)
    ? (value as PermissionLevelKey)
    : "none";

const initialPermissionMatrix: MatrixRow[] = [
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
];

const defaultGuardrails: Guardrail[] = [
  {
    title: "MFA required",
    description: "All admins must enable multi-factor authentication.",
    icon: Lock,
  },
  {
    title: "Privileged actions",
    description: "Critical changes require two-person approval.",
    icon: ShieldCheck,
  },
  {
    title: "Certificate integrity",
    description: "Verified certificates cannot be edited by guests.",
    icon: FileCheck2,
  },
];

const initialApprovals: ApprovalItem[] = [];

const buildApprovalMeta = (t: (key: string) => string) => ({
  waiting: {
    label: t("permission.approval.waiting"),
    tone: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  },
  needsSuper: {
    label: t("permission.approval.needsSuper"),
    tone: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  },
  approved: {
    label: t("permission.approval.approved"),
    tone: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  },
  rejected: {
    label: t("permission.approval.rejected"),
    tone: "bg-rose-500/15 text-rose-700 border-rose-500/30",
  },
});

const formatAuditTimestamp = (value?: string, locale = "en-US") =>
  value
    ? new Date(value).toLocaleString(locale, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const roleToPermissionKey = (role: UserRole): PermissionRoleKey => {
  if (role === "SUPER_ADMIN") return "superAdmin";
  if (role === "ADMIN") return "admin";
  return "guest";
};

const mergeRoleCards = (cards: RoleCard[]) =>
  cards.map((card) => {
    const fallback = defaultRoleCards.find((item) => item.title === card.title);
    return {
      ...fallback,
      ...card,
      icon: fallback?.icon || Crown,
      gradient: fallback?.gradient || "from-slate-500/10",
    } as RoleCard;
  });

const mergeGuardrails = (rails: Guardrail[]) =>
  rails.map((rail) => {
    const fallback = defaultGuardrails.find(
      (item) => item.title === rail.title,
    );
    return {
      ...fallback,
      ...rail,
      icon: fallback?.icon || Lock,
    } as Guardrail;
  });

export default function PermissionPage() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const { t, language } = useTranslation();
  const auditLocale = language === "en" ? "en-US" : "vi-VN";
  const permissionLevels = useMemo<PermissionLevelsMap>(
    () => buildPermissionLevels(t),
    [t],
  );
  const approvalMeta = useMemo(() => buildApprovalMeta(t), [t]);
  const [roleCards, setRoleCards] = useState<RoleCard[]>(defaultRoleCards);
  const [selectedRoleTitle, setSelectedRoleTitle] = useState<string | null>(
    null,
  );
  const [guardrails, setGuardrails] = useState<Guardrail[]>(defaultGuardrails);
  const [permissionMatrix, setPermissionMatrix] = useState<MatrixRow[]>(
    initialPermissionMatrix,
  );
  const [approvals, setApprovals] = useState<ApprovalItem[]>(initialApprovals);
  const [selectedApprovals, setSelectedApprovals] = useState<
    Record<string, boolean>
  >({});
  const [savingPermissions, setSavingPermissions] = useState<
    Record<string, boolean>
  >({});
  const [permissionUpdates, setPermissionUpdates] = useState<
    Record<string, boolean>
  >({});
  const updateTimeouts = useRef<Record<string, number>>({});
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editPermissionsOpen, setEditPermissionsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [permissionDraft, setPermissionDraft] = useState<
    Record<string, UserPermissionLevel>
  >({});
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [roleUpdating, setRoleUpdating] = useState<Record<string, boolean>>({});
  const [userStatusOpen, setUserStatusOpen] = useState(false);
  const [userStatusLoading, setUserStatusLoading] = useState(false);
  const [userStatusLoadingId, setUserStatusLoadingId] = useState<string | null>(
    null,
  );
  const [userStatusTarget, setUserStatusTarget] = useState<User | null>(null);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState<User | null>(null);
  const [editPermissionsSaving, setEditPermissionsSaving] = useState(false);
  const [lockStatus, setLockStatus] = useState<LockStatus>("enforced");
  const [overrideExpiresAt, setOverrideExpiresAt] = useState<string | null>(
    null,
  );
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserError, setNewUserError] = useState("");
  const lockStatusLabel =
    lockStatus === "enforced"
      ? t("permission.emergency.status.enforced")
      : t("permission.emergency.status.requested");
  const formatRoleLabel = (roleKey: PermissionRoleKey) => {
    if (roleKey === "superAdmin") return t("role.superAdmin");
    if (roleKey === "admin") return t("role.admin");
    return t("role.guest");
  };
  const auditActorLabel = (entry: AuditEntry) => {
    const role = entry.actorRole ? entry.actorRole.toLowerCase() : "";
    const email = entry.actorEmail || t("permission.audit.unknown");
    return role ? `${role} · ${email}` : email;
  };

  const matrixAreaLabels: Record<string, string> = {
    "Inventory & products": t("permission.area.inventory"),
    Certificates: t("permission.area.certificates"),
    "User management": t("permission.area.users"),
    "Pricing & billing": t("permission.area.pricing"),
    "Security settings": t("permission.area.security"),
    "Audit logs": t("permission.area.audit"),
  };

  const matrixDescriptionLabels: Record<string, string> = {
    "Create, edit, and control pricing": t("permission.desc.inventory"),
    "Verify, issue, and revoke": t("permission.desc.certificates"),
    "Invite, deactivate, and assign roles": t("permission.desc.users"),
    "Buying costs, payouts, and invoices": t("permission.desc.pricing"),
    "SSO, MFA, and policy enforcement": t("permission.desc.security"),
    "Export and monitor activity": t("permission.desc.audit"),
  };

  const formatMatrixArea = (area: string) => matrixAreaLabels[area] || area;
  const formatMatrixDescription = (description: string) =>
    matrixDescriptionLabels[description] || description;

  const guardrailTitles: Record<string, string> = {
    "MFA required": t("permission.guardrail.mfa.title"),
    "Privileged actions": t("permission.guardrail.privileged.title"),
    "Certificate integrity": t("permission.guardrail.integrity.title"),
  };
  const guardrailDescriptions: Record<string, string> = {
    "All admins must enable multi-factor authentication.": t(
      "permission.guardrail.mfa.desc",
    ),
    "Critical changes require two-person approval.": t(
      "permission.guardrail.privileged.desc",
    ),
    "Verified certificates cannot be edited by guests.": t(
      "permission.guardrail.integrity.desc",
    ),
  };
  const formatGuardrailTitle = (title: string) =>
    guardrailTitles[title] || title;
  const formatGuardrailDescription = (description: string) =>
    guardrailDescriptions[description] || description;

  const roleCardTitles: Record<string, string> = {
    "Super Admin": t("permission.role.superAdmin.title"),
    Admin: t("permission.role.admin.title"),
    Guest: t("permission.role.guest.title"),
  };
  const roleCardSubtitles: Record<string, string> = {
    Governance: t("permission.role.superAdmin.subtitle"),
    Operations: t("permission.role.admin.subtitle"),
    Observer: t("permission.role.guest.subtitle"),
  };
  const roleCardBadges: Record<string, string> = {
    "Owner tier": t("permission.role.superAdmin.badge"),
    "Core access": t("permission.role.admin.badge"),
    Limited: t("permission.role.guest.badge"),
  };
  const roleCardPerks: Record<string, string> = {
    "Owns policy decisions and critical locks": t(
      "permission.role.superAdmin.perk1",
    ),
    "Full access to billing, users, and audit trails": t(
      "permission.role.superAdmin.perk2",
    ),
    "Can grant emergency access and revoke instantly": t(
      "permission.role.superAdmin.perk3",
    ),
    "Manages products, certificates, and pricing": t(
      "permission.role.admin.perk1",
    ),
    "Invites guests and assigns tasks": t("permission.role.admin.perk2"),
    "Reviews change requests and approvals": t("permission.role.admin.perk3"),
    "Views inventory and certificate details": t("permission.role.guest.perk1"),
    "Submits change requests for approval": t("permission.role.guest.perk2"),
    "No access to buying prices or billing": t("permission.role.guest.perk3"),
  };
  const formatRoleCardTitle = (title: string) => roleCardTitles[title] || title;
  const formatRoleCardSubtitle = (subtitle: string) =>
    roleCardSubtitles[subtitle] || subtitle;
  const formatRoleCardBadge = (badge: string) => roleCardBadges[badge] || badge;
  const formatRoleCardPerk = (perk: string) => roleCardPerks[perk] || perk;

  const selectedRoleKey = useMemo(() => {
    if (!selectedRoleTitle) return null;
    if (selectedRoleTitle === "Super Admin") return "superAdmin";
    if (selectedRoleTitle === "Admin") return "admin";
    if (selectedRoleTitle === "Guest") return "guest";
    return null;
  }, [selectedRoleTitle]);

  const selectedRoleLabel = selectedRoleTitle
    ? formatRoleCardTitle(selectedRoleTitle)
    : null;

  const hasPendingPermissionUpdates = useMemo(
    () => Object.values(savingPermissions).some(Boolean),
    [savingPermissions],
  );

  const getPermissionKey = (area: string, roleKey: PermissionRoleKey) =>
    `${area}:${roleKey}`;

  const applyPolicy = useCallback(
    (policy: permissionService.PermissionPolicy) => {
      const normalizedMatrix = policy.matrix.map((row) => ({
        ...row,
        superAdmin: normalizePermissionLevel(row.superAdmin),
        admin: normalizePermissionLevel(row.admin),
        guest: normalizePermissionLevel(row.guest),
      }));
      setRoleCards(
        policy.roleCards.length
          ? mergeRoleCards(policy.roleCards as RoleCard[])
          : defaultRoleCards,
      );
      setGuardrails(
        policy.guardrails.length
          ? mergeGuardrails(policy.guardrails as Guardrail[])
          : defaultGuardrails,
      );
      if (!hasPendingPermissionUpdates) {
        setPermissionMatrix(
          policy.matrix.length ? normalizedMatrix : initialPermissionMatrix,
        );
      }
    },
    [hasPendingPermissionUpdates],
  );

  const refreshPolicy = useCallback(async () => {
    setPolicyLoading(true);
    try {
      const policy = await permissionService.getPolicy();
      applyPolicy(policy);
    } finally {
      setPolicyLoading(false);
    }
  }, [applyPolicy]);

  const refreshUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const data = await userService.listUsers();
      setUsers(data);
    } catch {
      setUsersError(t("permission.users.loadFailed"));
    } finally {
      setUsersLoading(false);
    }
  }, [t]);

  const refreshUserAccessAndPolicy = useCallback(async () => {
    await refreshUsers();
  }, [refreshUsers]);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [isReady, user, router]);

  useEffect(() => {
    if (!isReady || user?.role !== "SUPER_ADMIN") return;
    refreshUsers();
  }, [isReady, refreshUsers, user?.role]);

  useEffect(() => {
    if (!isReady || user?.role !== "SUPER_ADMIN") return;

    const loadApprovals = async () => {
      setApprovalsLoading(true);
      try {
        const list = await permissionService.listApprovals();
        setApprovals(list);
      } finally {
        setApprovalsLoading(false);
      }
    };

    const loadEmergency = async () => {
      const emergency = await permissionService.getEmergency();
      setLockStatus(emergency.status);
      setOverrideExpiresAt(
        emergency.expiresAt
          ? formatAuditTimestamp(emergency.expiresAt, auditLocale)
          : null,
      );
    };

    refreshPolicy();
    loadApprovals();
    loadEmergency();
  }, [auditLocale, isReady, refreshPolicy, user?.role]);

  const summary = useMemo(() => {
    const criticalPermissions = permissionMatrix.reduce((total, row) => {
      const superCount = row.superAdmin === "full" ? 1 : 0;
      const adminCount = row.admin === "manage" ? 1 : 0;
      return total + superCount + adminCount;
    }, 0);
    const pendingApprovals = approvals.filter(
      (item) => item.state !== "approved" && item.state !== "rejected",
    ).length;
    return {
      activeRoles: 3,
      criticalPermissions,
      pendingApprovals,
    };
  }, [approvals, permissionMatrix]);

  const highlights = useMemo(
    () => [
      {
        label: t("permission.highlight.roles"),
        value: summary.activeRoles.toString(),
        icon: ShieldCheck,
        tone: "text-emerald-600",
      },
      {
        label: t("permission.highlight.critical"),
        value: summary.criticalPermissions.toString(),
        icon: KeyRound,
        tone: "text-sky-600",
      },
      {
        label: t("permission.highlight.pending"),
        value: summary.pendingApprovals.toString(),
        icon: Activity,
        tone: "text-amber-600",
      },
    ],
    [summary, t],
  );

  const visibleApprovals = useMemo(() => {
    if (showAllRequests) return approvals;
    return approvals.filter(
      (item) => item.state !== "approved" && item.state !== "rejected",
    );
  }, [approvals, showAllRequests]);

  const selectedCount = useMemo(
    () => Object.values(selectedApprovals).filter(Boolean).length,
    [selectedApprovals],
  );

  const loadAuditLog = async () => {
    setAuditLoading(true);
    try {
      const entries = await permissionService.listAuditLogs();
      setAuditLog(entries);
    } finally {
      setAuditLoading(false);
    }
  };

  const logAudit = async (message: string) => {
    try {
      await permissionService.logAudit({ message });
      await loadAuditLog();
    } catch {
      // Keep UI functional even if audit logging fails.
    }
  };

  const buildDefaultPermissions = (role: UserRole) => {
    const roleKey = roleToPermissionKey(role);
    return permissionMatrix.reduce<Record<string, UserPermissionLevel>>(
      (acc, row) => {
        acc[row.area] = row[roleKey] as UserPermissionLevel;
        return acc;
      },
      {},
    );
  };

  const handlePermissionChange = (
    area: string,
    roleKey: PermissionRoleKey,
    nextValue: PermissionLevelKey,
  ) => {
    const key = getPermissionKey(area, roleKey);
    const previousMatrix = permissionMatrix;
    let from: PermissionLevelKey | null = null;
    const nextMatrix = permissionMatrix.map((row) => {
      if (row.area !== area) return row;
      from = row[roleKey];
      return {
        ...row,
        [roleKey]: nextValue,
      };
    });

    setPermissionMatrix(nextMatrix);
    setSavingPermissions((prev) => ({ ...prev, [key]: true }));
    setPermissionUpdates((prev) => ({ ...prev, [key]: false }));

    if (from && from !== nextValue) {
      const roleLabel = formatRoleLabel(roleKey);
      const message = t("permission.audit.permissionChange", {
        role: roleLabel,
        area: formatMatrixArea(area),
        from: permissionLevels[from as PermissionLevelKey].label,
        to: permissionLevels[nextValue].label,
      });
      permissionService
        .updatePolicy({ matrix: nextMatrix })
        .then((policy) => {
          applyPolicy(policy);
          logAudit(message);
          refreshUserAccessAndPolicy();
          setSavingPermissions((prev) => ({ ...prev, [key]: false }));
          setPermissionUpdates((prev) => ({ ...prev, [key]: true }));
          if (updateTimeouts.current[key]) {
            window.clearTimeout(updateTimeouts.current[key]);
          }
          updateTimeouts.current[key] = window.setTimeout(() => {
            setPermissionUpdates((prev) => ({ ...prev, [key]: false }));
          }, 1600);
          toast.success(t("permission.matrix.updated"));
        })
        .catch(() => {
          setPermissionMatrix(previousMatrix);
          setSavingPermissions((prev) => ({ ...prev, [key]: false }));
          toast.error(t("permission.audit.updatePermissionsFailed"));
        });
    }
  };

  const handleReviewChanges = () => {
    loadAuditLog();
    setReviewOpen(true);
  };

  const handleOpenAuditLog = () => {
    loadAuditLog();
    setAuditOpen(true);
  };

  const handleExportPolicy = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      roles: roleCards.map(({ title, subtitle, badge, perks }) => ({
        title: formatRoleCardTitle(title),
        subtitle: formatRoleCardSubtitle(subtitle),
        badge: formatRoleCardBadge(badge),
        perks: perks.map(formatRoleCardPerk),
      })),
      permissionMatrix,
      guardrails: guardrails.map(({ title, description }) => ({
        title: formatGuardrailTitle(title),
        description: formatGuardrailDescription(description),
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "permission-policy.json";
    link.click();
    URL.revokeObjectURL(url);

    logAudit(t("permission.audit.exportedPolicy"));
  };

  const handleSelectApproval = (id: string, checked: boolean) => {
    setSelectedApprovals((prev) => ({
      ...prev,
      [id]: checked,
    }));
  };

  const handleApproveSelected = () => {
    if (!selectedCount) return;
    const ids = Object.keys(selectedApprovals).filter(
      (id) => selectedApprovals[id],
    );

    permissionService
      .updateApprovals({ ids, status: "approved" })
      .then((updated) => {
        const updatedMap = new Map(updated.map((item) => [item.id, item]));
        setApprovals((prev) =>
          prev.map((item) => updatedMap.get(item.id) || item),
        );
        setSelectedApprovals({});
      })
      .catch(() => {
        // Leave state unchanged if the update fails.
      });
  };

  const handleDeleteSelected = async () => {
    if (!selectedCount) return;
    const ids = Object.keys(selectedApprovals).filter(
      (id) => selectedApprovals[id],
    );

    const results = await Promise.allSettled(
      ids.map((id) => permissionService.deleteApprovalRequest(id)),
    );
    const deletedIds = ids.filter(
      (_id, index) => results[index].status === "fulfilled",
    );
    if (!deletedIds.length) return;

    setApprovals((prev) =>
      prev.filter((item) => !deletedIds.includes(item.id)),
    );
    setSelectedApprovals((prev) => {
      const next = { ...prev };
      deletedIds.forEach((id) => {
        delete next[id];
      });
      return next;
    });
  };

  const handleViewRequests = () => {
    setShowAllRequests((prev) => !prev);
  };

  const handleRequestOverride = () => {
    const action = lockStatus === "enforced" ? "request" : "cancel";
    permissionService
      .updateEmergency({ action })
      .then((emergency) => {
        setLockStatus(emergency.status);
        setOverrideExpiresAt(
          emergency.expiresAt
            ? formatAuditTimestamp(emergency.expiresAt, auditLocale)
            : null,
        );
      })
      .catch(() => {
        // Keep current UI state if the update fails.
      });
  };

  const handleOpenAddUser = () => {
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserError("");
    setAddUserOpen(true);
  };

  const handleCreateUser = async () => {
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      setNewUserError(t("permission.users.required"));
      return;
    }
    try {
      const created = await userService.createUser({
        email: newUserEmail.trim(),
        password: newUserPassword.trim(),
      });
      setUsers((prev) => [created, ...prev]);
      setAddUserOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserError("");
      logAudit(
        t("permission.audit.createdUser", {
          name: created.email || created.name,
        }),
      );
    } catch {
      setNewUserError(t("permission.users.createFailed"));
    }
  };

  const handleRoleUpdate = async (userId: string, nextRole: UserRole) => {
    setRoleUpdating((prev) => ({ ...prev, [userId]: true }));
    try {
      const updated = await userService.updateUser(userId, {
        role: nextRole,
      });
      setUsers((prev) =>
        prev.map((item) => (item.id === userId ? updated : item)),
      );
      logAudit(
        t("permission.audit.updatedRole", {
          name: updated.email || updated.name,
        }),
      );
      toast.success(t("permission.users.roleUpdated"));
    } catch {
      logAudit(t("permission.audit.updateRoleFailed"));
      toast.error(t("permission.users.roleFailed"));
    } finally {
      setRoleUpdating((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteUser = (target: User) => {
    if (target.id === user?.id) {
      setUsersError(t("permission.users.cannotDeleteSelf"));
      return;
    }
    setDeleteUserTarget(target);
    setDeleteUserOpen(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteUserTarget) return;
    setUsersError("");
    setDeleteUserLoading(true);
    try {
      await userService.deleteUser(deleteUserTarget.id);
      setUsers((prev) =>
        prev.filter((item) => item.id !== deleteUserTarget.id),
      );
      logAudit(
        t("permission.audit.deletedUser", {
          name:
            deleteUserTarget.email ||
            deleteUserTarget.name ||
            t("permission.users.thisUser"),
        }),
      );
      toast.success(t("permission.users.deleteSuccess"));
    } catch {
      setUsersError(t("permission.users.deleteFailed"));
      toast.error(t("permission.users.deleteFailed"));
    } finally {
      setDeleteUserLoading(false);
      setDeleteUserOpen(false);
      setDeleteUserTarget(null);
    }
  };

  const handleOpenEditPermissions = (target: User) => {
    setEditingUser(target);
    setPermissionDraft(
      target.permissions && Object.keys(target.permissions).length
        ? (target.permissions as Record<string, UserPermissionLevel>)
        : buildDefaultPermissions(target.role),
    );
    setEditPermissionsOpen(true);
  };

  const handlePermissionDraftChange = (
    area: string,
    value: UserPermissionLevel,
  ) => {
    setPermissionDraft((prev) => ({
      ...prev,
      [area]: value,
    }));
  };

  const handleResetPermissions = () => {
    if (!editingUser) return;
    setPermissionDraft(buildDefaultPermissions(editingUser.role));
  };

  const handleSavePermissions = async () => {
    if (!editingUser) return;
    setEditPermissionsSaving(true);
    try {
      const updated = await userService.updateUser(editingUser.id, {
        permissions: permissionDraft,
      });
      setUsers((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      const roleKey = roleToPermissionKey(editingUser.role);
      const nextMatrix = permissionMatrix.map((row) => ({
        ...row,
        [roleKey]: permissionDraft[row.area] || row[roleKey],
      }));
      try {
        const policy = await permissionService.updatePolicy({
          matrix: nextMatrix,
        });
        applyPolicy(policy);
        await refreshUserAccessAndPolicy();
      } catch {
        // Keep the user-level update even if the policy save fails.
      }
      logAudit(
        t("permission.audit.updatedPermissions", {
          name: updated.email || updated.name,
        }),
      );
      toast.success(t("permission.users.permissionsUpdated"));
      setEditPermissionsOpen(false);
    } catch {
      logAudit(t("permission.audit.updatePermissionsFailed"));
      toast.error(t("permission.users.permissionsFailed"));
    } finally {
      setEditPermissionsSaving(false);
    }
  };

  const openUserStatusDialog = (target: User) => {
    setUserStatusTarget(target);
    setUserStatusOpen(true);
  };

  const handleConfirmUserStatus = async () => {
    if (!userStatusTarget) return;
    const nextIsActive = userStatusTarget.isActive === false;
    setUserStatusLoading(true);
    setUserStatusLoadingId(userStatusTarget.id);
    try {
      const updated = await userService.updateUserStatus(
        userStatusTarget.id,
        nextIsActive,
      );
      setUsers((prev) =>
        prev.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
      toast.success(t("status.updateSuccess"));
    } catch {
      toast.error(t("status.updateFailed"));
    } finally {
      setUserStatusLoading(false);
      setUserStatusLoadingId(null);
      setUserStatusOpen(false);
      setUserStatusTarget(null);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-muted-foreground">
        {t("permission.loading")}
      </div>
    );
  }

  if (!user || user.role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-muted-foreground">
        {t("permission.restricted")}
      </div>
    );
  }

  return (
    <div
      className={`${body.className} mx-auto w-full max-w-6xl space-y-8 pb-12`}
    >
      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="space-y-3">
            <Badge className="w-fit bg-primary/10 text-primary border border-primary/20">
              <Sparkles size={14} /> {t("permission.header.badge")}
            </Badge>
            <div>
              <h1 className={`${display.className} text-3xl md:text-4xl`}>
                {t("permission.header.title")}
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                {t("permission.header.subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{t("permission.header.policy")}</Badge>
              <Badge variant="outline">{t("permission.header.review")}</Badge>
              <Badge variant="outline">{t("permission.header.audit")}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3 md:ml-auto">
            <Button
              className="bg-primary text-primary-foreground hover:bg-(--jade-600)"
              onClick={handleReviewChanges}
            >
              {t("permission.action.review")}
            </Button>
            <Button variant="outline" onClick={handleExportPolicy}>
              {t("permission.action.export")}
            </Button>
          </div>
        </div>
      </section>

      <section className="w-full space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("permission.section.overview.title")}
            </p>
            <h2 className="text-lg font-semibold text-foreground">
              {t("permission.section.overview.subtitle")}
            </h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3 items-start">
          {highlights.map((item) => (
            <Card
              key={item.label}
              className="border-border/60 shadow-sm bg-card"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <item.icon size={16} className={item.tone} /> {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {item.value}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

  <section className="w-full space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("permission.section.roles.title")}
            </p>
            <h2 className="text-lg font-semibold text-foreground">
              {t("permission.section.roles.subtitle")}
            </h2>
          </div>
        </div>
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>{t("permission.section.roles.cardTitle")}</CardTitle>
            <CardDescription>
              {t("permission.section.roles.cardSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {roleCards.map((role) => (
              <button
                key={role.title}
                type="button"
                onClick={() => setSelectedRoleTitle(role.title)}
                className={cn(
                  `w-full text-left rounded-2xl border border-border/70 bg-linear-to-br ${role.gradient} p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background`,
                  selectedRoleTitle === role.title
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "hover:border-primary/30",
                )}
                data-selected={selectedRoleTitle === role.title}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <role.icon size={18} />
                    <div className="font-semibold">
                      {formatRoleCardTitle(role.title)}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[11px]">
                    {formatRoleCardBadge(role.badge)}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatRoleCardSubtitle(role.subtitle)}
                </div>
                <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                  {role.perks.map((perk) => (
                    <li key={perk} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/60" />
                      <span>{formatRoleCardPerk(perk)}</span>
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("permission.section.policy.title")}
            </p>
            <h2 className="text-lg font-semibold text-foreground">
              {t("permission.section.policy.subtitle")}
            </h2>
          </div>
        </div>
        <div className="w-full space-y-4">
          <Card className="w-full border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>{t("permission.guardrails.title")}</CardTitle>
              <CardDescription>
                {t("permission.guardrails.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {guardrails.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/40 p-3"
                >
                  <div className="mt-1 rounded-lg bg-background p-2 shadow-sm">
                    <item.icon size={16} className="text-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {formatGuardrailTitle(item.title)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatGuardrailDescription(item.description)}
                    </div>
                  </div>
                </div>
              ))}
              <div className="rounded-xl border border-dashed border-border/70 p-3 text-xs text-muted-foreground">
                {t("permission.guardrails.nextAudit")}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-amber-500/30 bg-amber-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" />
                {t("permission.emergency.title")}
              </CardTitle>
              <CardDescription>
                {t("permission.emergency.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                {t("permission.emergency.note")}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="bg-amber-500 text-white hover:bg-amber-600"
                  onClick={handleRequestOverride}
                >
                  {lockStatus === "enforced"
                    ? t("permission.emergency.request")
                    : t("permission.emergency.cancel")}
                </Button>
                <Button variant="outline" onClick={handleOpenAuditLog}>
                  {t("permission.emergency.viewAudit")}
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Settings2 size={14} /> {t("permission.emergency.status")}:{" "}
                {lockStatusLabel}
              </div>
              {overrideExpiresAt ? (
                <div className="text-xs text-muted-foreground">
                  {t("permission.emergency.expires")}: {overrideExpiresAt}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("permission.section.access.title")}
            </p>
            <h2 className="text-lg font-semibold text-foreground">
              {t("permission.section.access.subtitle")}
            </h2>
          </div>
        </div>
        <div className="w-full">
          <Card className="w-full border-border/60 shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{t("permission.access.title")}</CardTitle>
                <CardDescription>
                  {t("permission.access.subtitle")}
                </CardDescription>
              </div>
              <Button
                onClick={handleOpenAddUser}
                className="bg-primary text-primary-foreground hover:bg-(--jade-600)"
              >
                {t("permission.users.add")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                {t("permission.access.helper")}
              </div>
              {usersError ? (
                <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">
                  {usersError}
                </div>
              ) : null}
              <div className="space-y-2">
                {usersLoading ? (
                  <div className="text-xs text-muted-foreground">
                    {t("permission.users.loading")}
                  </div>
                ) : users.length ? (
                  users.map((entry) => {
                    const isActive = entry.isActive !== false;
                    const isRoleUpdating = Boolean(roleUpdating[entry.id]);
                    const isStatusLoading = userStatusLoadingId === entry.id;
                    const isRowBusy = isRoleUpdating || isStatusLoading;
                    return (
                      <div
                        key={entry.id}
                        className={cn(
                          "rounded-lg border border-border/70 bg-muted/40 p-4 shadow-sm",
                          !isActive && "opacity-70 grayscale",
                        )}
                      >
                        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-medium">
                                {entry.name ||
                                  t("permission.users.fallbackName")}
                              </div>
                              <StatusBadge isActive={isActive} />
                              <Badge
                                variant="secondary"
                                className="border-border/60"
                              >
                                {entry.role === "SUPER_ADMIN"
                                  ? t("role.superAdmin")
                                  : entry.role === "ADMIN"
                                    ? t("role.admin")
                                    : t("role.guest")}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {entry.email || t("permission.users.noEmail")}
                            </div>
                          </div>
                          <div className="flex w-full flex-wrap items-center gap-3 sm:justify-end">
                            <div className="flex min-w-37.5 flex-col gap-1">
                              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                {t("permission.users.changeRole")}
                              </Label>
                              <Select
                                value={entry.role}
                                disabled={!isActive || isRoleUpdating}
                                onValueChange={(value) =>
                                  handleRoleUpdate(entry.id, value as UserRole)
                                }
                              >
                                <SelectTrigger className="h-8 min-w-32.5">
                                  <SelectValue
                                    placeholder={t(
                                      "permission.users.selectRole",
                                    )}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="SUPER_ADMIN">
                                    {t("role.superAdmin")}
                                  </SelectItem>
                                  <SelectItem value="ADMIN">
                                    {t("role.admin")}
                                  </SelectItem>
                                  <SelectItem value="GUEST">
                                    {t("role.guest")}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleOpenEditPermissions(entry)}
                                disabled={!isActive || isRowBusy}
                              >
                                {t("permission.users.editPermissions")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openUserStatusDialog(entry)}
                                disabled={userStatusLoading || isStatusLoading}
                              >
                                {isStatusLoading
                                  ? t("common.loading")
                                  : isActive
                                    ? t("status.deactivate")
                                    : t("status.activate")}
                              </Button>
                              <ActionMenu
                                items={[
                                  {
                                    label: t("permission.users.delete"),
                                    onClick: () => handleDeleteUser(entry),
                                    disabled:
                                      entry.id === user?.id ||
                                      deleteUserLoading ||
                                      isRowBusy,
                                    destructive: true,
                                  },
                                ]}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-muted-foreground">
                    {t("permission.users.empty")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>{t("permission.matrix.title")}</CardTitle>
            <CardDescription>{t("permission.matrix.subtitle")}</CardDescription>
            {policyLoading ? (
              <div className="text-xs text-muted-foreground">
                {t("permission.matrix.syncing")}
              </div>
            ) : null}
            {selectedRoleLabel ? (
              <div className="text-xs text-muted-foreground">
                {t("permission.section.roles.subtitle")}: {selectedRoleLabel}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                {t("permission.section.roles.cardSubtitle")}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "rounded-xl border border-border/60 bg-background/80 transition",
                selectedRoleKey ? "" : "opacity-80",
              )}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("permission.matrix.area")}</TableHead>
                    <TableHead>{t("permission.matrix.description")}</TableHead>
                    <TableHead>{t("role.superAdmin")}</TableHead>
                    <TableHead>{t("role.admin")}</TableHead>
                    <TableHead>{t("role.guest")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionMatrix.map((row) => {
                    const superKey = getPermissionKey(row.area, "superAdmin");
                    const adminKey = getPermissionKey(row.area, "admin");
                    const guestKey = getPermissionKey(row.area, "guest");
                    const superSaving = Boolean(savingPermissions[superKey]);
                    const adminSaving = Boolean(savingPermissions[adminKey]);
                    const guestSaving = Boolean(savingPermissions[guestKey]);
                    return (
                      <TableRow key={row.area} className="align-middle">
                        <TableCell className="font-medium align-middle">
                          {formatMatrixArea(row.area)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs align-middle">
                          {formatMatrixDescription(row.description)}
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Select
                                value={row.superAdmin}
                                disabled={superSaving}
                                onValueChange={(value) =>
                                  handlePermissionChange(
                                    row.area,
                                    "superAdmin",
                                    value as PermissionLevelKey,
                                  )
                                }
                              >
                                <SelectTrigger
                                  className={cn(
                                    permissionLevels[
                                      row.superAdmin as keyof typeof permissionLevels
                                    ].className,
                                    "h-9 min-w-110px pr-8 text-xs leading-none whitespace-nowrap",
                                  )}
                                >
                                  <SelectValue
                                    placeholder={t("common.select")}
                                  />
                                  {superSaving && (
                                    <span className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-primary" />
                                  )}
                                </SelectTrigger>
                                <SelectContent>
                                  {permissionOrder.map((level) => (
                                    <SelectItem key={level} value={level}>
                                      {permissionLevels[level].label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <span
                              className={cn(
                                "text-[11px] text-muted-foreground min-w-14 transition-opacity",
                                permissionUpdates[superKey]
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            >
                              {t("permission.matrix.updated")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Select
                                value={row.admin}
                                disabled={adminSaving}
                                onValueChange={(value) =>
                                  handlePermissionChange(
                                    row.area,
                                    "admin",
                                    value as PermissionLevelKey,
                                  )
                                }
                              >
                                <SelectTrigger
                                  className={cn(
                                    permissionLevels[
                                      row.admin as keyof typeof permissionLevels
                                    ].className,
                                    "h-9 min-w-110px pr-8 text-xs leading-none whitespace-nowrap",
                                  )}
                                >
                                  <SelectValue
                                    placeholder={t("common.select")}
                                  />
                                  {adminSaving && (
                                    <span className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-primary" />
                                  )}
                                </SelectTrigger>
                                <SelectContent>
                                  {permissionOrder.map((level) => (
                                    <SelectItem key={level} value={level}>
                                      {permissionLevels[level].label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <span
                              className={cn(
                                "text-[11px] text-muted-foreground min-w-14 transition-opacity",
                                permissionUpdates[adminKey]
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            >
                              {t("permission.matrix.updated")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Select
                                value={row.guest}
                                disabled={guestSaving}
                                onValueChange={(value) =>
                                  handlePermissionChange(
                                    row.area,
                                    "guest",
                                    value as PermissionLevelKey,
                                  )
                                }
                              >
                                <SelectTrigger
                                  className={cn(
                                    permissionLevels[
                                      row.guest as keyof typeof permissionLevels
                                    ].className,
                                    "h-9 min-w-110px pr-8 text-xs leading-none whitespace-nowrap",
                                  )}
                                >
                                  <SelectValue
                                    placeholder={t("common.select")}
                                  />
                                  {guestSaving && (
                                    <span className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-primary" />
                                  )}
                                </SelectTrigger>
                                <SelectContent>
                                  {permissionOrder.map((level) => (
                                    <SelectItem key={level} value={level}>
                                      {permissionLevels[level].label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <span
                              className={cn(
                                "text-[11px] text-muted-foreground min-w-14 transition-opacity",
                                permissionUpdates[guestKey]
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            >
                              {t("permission.matrix.updated")}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("permission.section.governance.title")}
            </p>
            <h2 className="text-lg font-semibold text-foreground">
              {t("permission.section.governance.subtitle")}
            </h2>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>{t("permission.approvals.title")}</CardTitle>
              <CardDescription>
                {t("permission.approvals.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {approvalsLoading ? (
                <div className="text-xs text-muted-foreground">
                  {t("permission.approvals.loading")}
                </div>
              ) : visibleApprovals.length ? (
                visibleApprovals.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={Boolean(selectedApprovals[item.id])}
                        onCheckedChange={(checked) =>
                          handleSelectApproval(item.id, Boolean(checked))
                        }
                        disabled={item.state === "approved"}
                      />
                      <div>
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {t("permission.approvals.requestedBy", {
                            name: item.requester,
                          })}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={approvalMeta[item.state].tone}
                    >
                      {approvalMeta[item.state].label}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">
                  {t("permission.approvals.empty")}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewRequests}
                >
                  {showAllRequests
                    ? t("permission.approvals.showPending")
                    : t("permission.approvals.viewAll")}
                </Button>
                <Button
                  size="sm"
                  className="bg-sky-500 text-white hover:bg-sky-600"
                  onClick={handleApproveSelected}
                  disabled={!selectedCount}
                >
                  {t("permission.approvals.approve")}
                  {selectedCount ? ` (${selectedCount})` : ""}
                </Button>
              </div>
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
                <div className="text-xs font-semibold text-rose-700">
                  {t("permission.approvals.delete")}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-rose-500 text-white hover:bg-rose-600"
                    onClick={handleDeleteSelected}
                    disabled={!selectedCount}
                  >
                    {t("permission.approvals.delete")}
                    {selectedCount ? ` (${selectedCount})` : ""}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>
                {t("permission.section.governance.auditTitle")}
              </CardTitle>
              <CardDescription>
                {t("permission.section.governance.auditSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
                {t("permission.section.governance.auditNote")}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReviewChanges}
                >
                  {t("permission.action.review")}
                </Button>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-(--jade-600)"
                  onClick={handleOpenAuditLog}
                >
                  {t("permission.section.governance.openAudit")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("permission.review.title")}</DialogTitle>
            <DialogDescription>
              {t("permission.review.subtitle")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-72 overflow-auto">
            {auditLoading ? (
              <div className="text-sm text-muted-foreground">
                {t("permission.audit.loading")}
              </div>
            ) : auditLog.length ? (
              auditLog.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-border/70 bg-muted/40 p-3"
                >
                  <div className="text-sm font-medium">{entry.message}</div>
                  <div className="text-xs text-muted-foreground">
                    {auditActorLabel(entry)} ·{" "}
                    {formatAuditTimestamp(entry.createdAt, auditLocale)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                {t("permission.audit.emptyChanges")}
              </div>
            )}
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("permission.audit.title")}</DialogTitle>
            <DialogDescription>
              {t("permission.audit.subtitle")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-72 overflow-auto">
            {auditLoading ? (
              <div className="text-sm text-muted-foreground">
                {t("permission.audit.loading")}
              </div>
            ) : auditLog.length ? (
              auditLog.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-border/70 bg-muted/40 p-3"
                >
                  <div className="text-sm font-medium">{entry.message}</div>
                  <div className="text-xs text-muted-foreground">
                    {auditActorLabel(entry)} ·{" "}
                    {formatAuditTimestamp(entry.createdAt, auditLocale)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                {t("permission.audit.empty")}
              </div>
            )}
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("permission.users.add")}</DialogTitle>
            <DialogDescription>
              {t("permission.users.addSubtitle")}
            </DialogDescription>
          </DialogHeader>
          {newUserError ? (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">
              {newUserError}
            </div>
          ) : null}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-user-email">{t("common.email")}</Label>
              <Input
                id="new-user-email"
                type="email"
                placeholder={t("permission.users.emailPlaceholder")}
                value={newUserEmail}
                onChange={(event) => setNewUserEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-password">{t("common.password")}</Label>
              <Input
                id="new-user-password"
                type="password"
                placeholder={t("permission.users.passwordPlaceholder")}
                value={newUserPassword}
                onChange={(event) => setNewUserPassword(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              className="bg-sky-500 text-white hover:bg-sky-600"
              onClick={handleCreateUser}
            >
              {t("permission.users.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editPermissionsOpen} onOpenChange={setEditPermissionsOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("permission.edit.title")}</DialogTitle>
            <DialogDescription>
              {t("permission.edit.subtitle", {
                name: editingUser?.email || t("permission.users.thisUser"),
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-auto">
            {permissionMatrix.map((row) => (
              <div
                key={row.area}
                className="flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/40 p-3"
              >
                <div className="text-sm font-medium">
                  {formatMatrixArea(row.area)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatMatrixDescription(row.description)}
                </div>
                <Select
                  value={permissionDraft[row.area] || "none"}
                  onValueChange={(value) =>
                    handlePermissionDraftChange(
                      row.area,
                      value as UserPermissionLevel,
                    )
                  }
                >
                  <SelectTrigger className="h-8 min-w-140px">
                    <SelectValue
                      placeholder={t("permission.edit.selectLevel")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {permissionOrder.map((level) => (
                      <SelectItem key={level} value={level}>
                        {permissionLevels[level].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleResetPermissions}>
              {t("permission.edit.reset")}
            </Button>
            <Button
              className="bg-sky-500 text-white hover:bg-sky-600"
              onClick={handleSavePermissions}
              disabled={editPermissionsSaving}
            >
              {editPermissionsSaving
                ? t("common.loading")
                : t("permission.edit.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={userStatusOpen} onOpenChange={setUserStatusOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("status.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  {t("status.confirmUser", {
                    action:
                      userStatusTarget?.isActive === false
                        ? t("status.activate")
                        : t("status.deactivate"),
                    name:
                      userStatusTarget?.email ||
                      userStatusTarget?.name ||
                      t("permission.users.thisUser"),
                  })}
                </p>
                <p>
                  {userStatusTarget?.isActive === false
                    ? t("permission.users.activateHelp")
                    : t("permission.users.deactivateHelp")}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUserStatus}
              disabled={userStatusLoading}
            >
              {userStatusLoading
                ? t("common.loading")
                : userStatusTarget?.isActive === false
                  ? t("status.activate")
                  : t("status.deactivate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteUserOpen} onOpenChange={setDeleteUserOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("permission.users.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  {t("permission.users.deleteConfirm", {
                    name:
                      deleteUserTarget?.email ||
                      deleteUserTarget?.name ||
                      t("permission.users.thisUser"),
                  })}
                </p>
                <p>{t("permission.users.deleteDescription")}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteUser}
              disabled={deleteUserLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserLoading
                ? t("common.loading")
                : t("permission.users.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
