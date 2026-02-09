import api from "@/lib/api/axiosInstance";

export type NotificationItem = {
  id: string;
  title: string;
  message?: string;
  type?: string;
  sourceId?: string;
  role?: string;
  userId?: string;
  readAt?: string;
  createdAt: string;
};

export async function listNotifications(limit?: number): Promise<{
  notifications: NotificationItem[];
  unreadCount: number;
}> {
  const response = await api.get("/notifications", {
    params: limit ? { limit } : undefined,
  });
  return {
    notifications: response.data.notifications as NotificationItem[],
    unreadCount: response.data.unreadCount as number,
  };
}

export async function markNotificationRead(
  id: string,
): Promise<NotificationItem> {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data.notification as NotificationItem;
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch("/notifications/read-all");
}
