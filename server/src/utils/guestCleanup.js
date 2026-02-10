import { User } from "../models/User.js";

/**
 * Cleanup old guest users that haven't been active
 * Run this periodically (e.g., via cron job) to keep the database clean
 *
 * @param {number} daysInactive - Number of days of inactivity before deletion (default: 90)
 * @returns {Promise<number>} Number of deleted guest users
 */
export async function cleanupInactiveGuests(daysInactive = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

  try {
    const result = await User.deleteMany({
      isGuest: true,
      lastActiveAt: { $lt: cutoffDate },
    });

    console.log(
      `✅ Cleaned up ${result.deletedCount} inactive guest users (inactive for ${daysInactive}+ days)`,
    );
    return result.deletedCount;
  } catch (error) {
    console.error("❌ Error cleaning up inactive guests:", error);
    throw error;
  }
}

/**
 * Get statistics about guest users
 * @returns {Promise<Object>} Statistics object
 */
export async function getGuestStats() {
  try {
    const totalGuests = await User.countDocuments({ isGuest: true });
    const activeGuests = await User.countDocuments({
      isGuest: true,
      lastActiveAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    });

    return {
      totalGuests,
      activeGuests,
      inactiveGuests: totalGuests - activeGuests,
    };
  } catch (error) {
    console.error("❌ Error getting guest stats:", error);
    throw error;
  }
}
