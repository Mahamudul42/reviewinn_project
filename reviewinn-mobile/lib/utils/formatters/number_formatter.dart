/// Centralized number formatting utilities
class NumberFormatter {
  /// Formats large numbers with K/M/B suffixes
  /// Examples: 1234 -> "1.2K", 1500000 -> "1.5M"
  static String compact(int number, {int decimals = 1}) {
    if (number >= 1000000000) {
      return '${(number / 1000000000).toStringAsFixed(decimals)}B';
    } else if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(decimals)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(decimals)}K';
    }
    return number.toString();
  }

  /// Formats a number with thousand separators
  /// Example: 1234567 -> "1,234,567"
  static String withSeparator(int number, {String separator = ','}) {
    return number.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match match) => '${match[1]}$separator',
        );
  }

  /// Formats a percentage with specified decimal places
  /// Example: 0.8567 -> "85.7%"
  static String percentage(double value, {int decimals = 1}) {
    return '${(value * 100).toStringAsFixed(decimals)}%';
  }
}
