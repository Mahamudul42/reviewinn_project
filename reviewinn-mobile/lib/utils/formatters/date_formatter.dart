/// Centralized date formatting utilities
class DateFormatter {
  /// Formats a DateTime to relative time (e.g., "2h ago", "3d ago")
  static String timeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 365) {
      return '${(difference.inDays / 365).floor()}y ago';
    } else if (difference.inDays > 30) {
      return '${(difference.inDays / 30).floor()}mo ago';
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  /// Formats a DateTime to full date (e.g., "15/3/2024")
  static String fullDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  /// Formats a DateTime to a user-friendly date based on recency
  /// - Less than 7 days: relative (e.g., "2d ago")
  /// - More than 7 days: full date (e.g., "15/3/2024")
  static String smartDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 7) {
      return fullDate(date);
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}
