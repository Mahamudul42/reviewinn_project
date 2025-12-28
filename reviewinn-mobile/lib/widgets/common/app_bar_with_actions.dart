import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../config/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../screens/messages_screen.dart';
import '../../screens/login_screen.dart';

/// Reusable app bar with Messages and Notifications icons
class AppBarWithActions extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final bool showBackButton;
  final List<Widget>? additionalActions;

  const AppBarWithActions({
    super.key,
    required this.title,
    this.showBackButton = false,
    this.additionalActions,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final authProvider = Provider.of<AuthProvider>(context);

    return AppBar(
      title: Text(
        title,
        style: AppTheme.headingMedium.copyWith(
          color: colors.textPrimary,
          fontWeight: FontWeight.bold,
        ),
      ),
      backgroundColor: colors.background,
      elevation: 0,
      automaticallyImplyLeading: showBackButton,
      leading: showBackButton
          ? IconButton(
              icon: Icon(Icons.arrow_back, color: colors.iconPrimary),
              onPressed: () => Navigator.pop(context),
            )
          : null,
      actions: [
        // Notifications icon (placeholder for future implementation)
        IconButton(
          icon: Stack(
            children: [
              Icon(Icons.notifications_outlined, color: colors.iconPrimary),
              // Red dot for unread notifications (placeholder)
              Positioned(
                right: 2,
                top: 2,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: AppTheme.errorRed,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
          onPressed: () {
            // TODO: Navigate to notifications screen
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Text('Notifications feature coming soon!'),
                backgroundColor: AppTheme.primaryPurple,
                duration: const Duration(seconds: 2),
              ),
            );
          },
        ),

        // Messages icon
        IconButton(
          icon: Stack(
            children: [
              Icon(Icons.forum_outlined, color: colors.iconPrimary),
              // Red dot for unread messages (placeholder)
              if (authProvider.isAuthenticated)
                Positioned(
                  right: 2,
                  top: 2,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: AppTheme.errorRed,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
          onPressed: () {
            if (!authProvider.isAuthenticated) {
              // Redirect to login
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const LoginScreen()),
              );
              return;
            }

            // Navigate to messages screen
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const MessagesScreen()),
            );
          },
        ),

        // Additional actions
        if (additionalActions != null) ...additionalActions!,

        const SizedBox(width: 8),
      ],
    );
  }
}
