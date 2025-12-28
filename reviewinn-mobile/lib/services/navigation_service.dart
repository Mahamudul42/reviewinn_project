import 'package:flutter/material.dart';

/// Centralized navigation service for better testability and reusability
/// Usage: NavigationService.instance.navigateTo(context, '/route')
class NavigationService {
  // Singleton instance
  static final NavigationService _instance = NavigationService._internal();
  static NavigationService get instance => _instance;

  NavigationService._internal();

  // Global navigator key for navigation without context
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  /// Navigate to a route by pushing it onto the navigation stack
  Future<T?> navigateTo<T>(BuildContext context, Widget screen) {
    return Navigator.push<T>(
      context,
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  /// Navigate and replace current route
  Future<T?> navigateAndReplace<T>(BuildContext context, Widget screen) {
    return Navigator.pushReplacement<T, void>(
      context,
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  /// Navigate and remove all previous routes
  Future<T?> navigateAndRemoveUntil<T>(BuildContext context, Widget screen) {
    return Navigator.pushAndRemoveUntil<T>(
      context,
      MaterialPageRoute(builder: (_) => screen),
      (route) => false,
    );
  }

  /// Pop current route
  void goBack<T>(BuildContext context, [T? result]) {
    if (Navigator.canPop(context)) {
      Navigator.pop<T>(context, result);
    }
  }

  /// Pop until a specific route
  void popUntil(BuildContext context, bool Function(Route<dynamic>) predicate) {
    Navigator.popUntil(context, predicate);
  }

  /// Navigate without context (using global navigator key)
  Future<T?> navigateToWithoutContext<T>(Widget screen) {
    final context = navigatorKey.currentContext;
    if (context == null) {
      throw Exception('Navigator context is null. Make sure navigatorKey is set in MaterialApp');
    }
    return Navigator.push<T>(
      context,
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  /// Go back without context
  void goBackWithoutContext<T>([T? result]) {
    final context = navigatorKey.currentContext;
    if (context == null) return;
    if (Navigator.canPop(context)) {
      Navigator.pop<T>(context, result);
    }
  }

  /// Show bottom sheet
  Future<T?> showBottomSheet<T>({
    required BuildContext context,
    required Widget child,
    bool isDismissible = true,
    bool enableDrag = true,
    Color? backgroundColor,
  }) {
    return showModalBottomSheet<T>(
      context: context,
      isDismissible: isDismissible,
      enableDrag: enableDrag,
      backgroundColor: backgroundColor ?? Colors.transparent,
      isScrollControlled: true,
      builder: (_) => child,
    );
  }

  /// Show dialog
  Future<T?> showDialogBox<T>({
    required BuildContext context,
    required Widget child,
    bool barrierDismissible = true,
  }) {
    return showDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: (_) => child,
    );
  }

  /// Show snackbar
  void showSnackBar(
    BuildContext context,
    String message, {
    Duration duration = const Duration(seconds: 3),
    SnackBarAction? action,
    Color? backgroundColor,
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: duration,
        action: action,
        backgroundColor: backgroundColor,
      ),
    );
  }
}
