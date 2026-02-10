const levelOrder = ["none", "limited", "read", "manage", "full"];

const getLevelRank = (level) => (level ? levelOrder.indexOf(level) : -1);

const defaultLevelForRole = (role, area) => {
  if (role === "SUPER_ADMIN") return "full";
  if (role === "ADMIN") {
    if (area === "Inventory & products" || area === "Pricing & billing") {
      return "manage";
    }
    return "none";
  }
  if (role === "GUEST") {
    if (area === "Inventory & products") return "read";
    return "none";
  }
  return "none";
};

const resolvePermissionLevel = (user, area) => {
  if (!user) return "none";
  if (user.role === "SUPER_ADMIN") return "full";
  return user.permissions?.[area] || defaultLevelForRole(user.role, area);
};

export function requirePermission(area, minLevel) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const currentLevel = resolvePermissionLevel(user, area);
    if (getLevelRank(currentLevel) < getLevelRank(minLevel)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}
