import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

const normalizeRole = (role) => (role === "FREELANCER" ? "GUEST" : role);

const toSafeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: normalizeRole(user.role),
  permissions: user.permissions || {},
  isActive: user.isActive !== false,
  updatedBy: user.updatedBy?.toString(),
  phone: user.phone || "",
  address: user.address || "",
  avatarUrl: user.avatarUrl || "",
  language: user.language || "vi",
  timezone: user.timezone || "Asia/Ho_Chi_Minh",
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export async function createUser(req, res) {
  const { email, password, role, name, permissions } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const existing = await User.findOne({ email }).exec();
  if (existing) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name || email.split("@")[0],
    email,
    passwordHash,
    role: normalizeRole(role) || "GUEST",
    permissions: permissions || {},
  });

  return res.status(201).json({ user: toSafeUser(user) });
}

export async function listUsers(_req, res) {
  const users = await User.find().sort({ createdAt: -1 }).exec();
  return res.json({ users: users.map(toSafeUser) });
}

export async function getUser(req, res) {
  if (
    req.user?.role !== "ADMIN" &&
    req.user?.role !== "SUPER_ADMIN" &&
    req.user?.id !== req.params.id
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const user = await User.findById(req.params.id).exec();
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({ user: toSafeUser(user) });
}

export async function updateUser(req, res) {
  if (
    req.user?.role !== "ADMIN" &&
    req.user?.role !== "SUPER_ADMIN" &&
    req.user?.id !== req.params.id
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const payload = { ...req.body };

  if (payload.role) {
    payload.role = normalizeRole(payload.role);
  }

  delete payload.password;
  delete payload.passwordHash;

  if (req.user?.role !== "SUPER_ADMIN") {
    delete payload.role;
    delete payload.email;
    delete payload.permissions;
  }

  payload.updatedBy = req.user?.id;

  const user = await User.findByIdAndUpdate(req.params.id, payload, {
    new: true,
  }).exec();

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ user: toSafeUser(user) });
}

export async function updateUserStatus(req, res) {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { isActive } = req.body || {};
  if (typeof isActive !== "boolean") {
    return res.status(400).json({ message: "isActive required" });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive, updatedBy: req.user?.id },
    { new: true },
  ).exec();

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ user: toSafeUser(user) });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Current and new password required" });
  }

  const user = await User.findById(req.user?.id).exec();
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: "Current password invalid" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  return res.json({ message: "Password updated" });
}

export async function deleteUser(req, res) {
  const user = await User.findByIdAndDelete(req.params.id).exec();
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({ message: "User deleted" });
}
