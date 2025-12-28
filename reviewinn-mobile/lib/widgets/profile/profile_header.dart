import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../config/app_colors.dart';
import '../../providers/theme_provider.dart';
import '../../screens/settings_screen.dart';

/// Profile screen header (SliverAppBar)
/// Displays user name, theme toggle, and settings button
class ProfileHeader extends StatelessWidget {
  final String userName;
  final bool isCurrentUser;
  final VoidCallback? onBack;

  const ProfileHeader({
    super.key,
    required this.userName,
    required this.isCurrentUser,
    this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, _) {
        final isDark = themeProvider.isDarkMode;
        final backgroundColor = isDark ? const Color(0xFF374151) : AppTheme.primaryPurple;
        final textColor = Colors.white;

        return SliverAppBar(
          expandedHeight: 120,
          floating: false,
          pinned: true,
          backgroundColor: backgroundColor,
          automaticallyImplyLeading: !isCurrentUser,
          leading: !isCurrentUser
              ? IconButton(
                  icon: Icon(Icons.arrow_back, color: textColor),
                  onPressed: onBack ?? () => Navigator.pop(context),
                )
              : null,
          actions: [
            // Dark Mode Toggle
            IconButton(
              icon: Icon(
                themeProvider.isDarkMode
                    ? Icons.light_mode_rounded
                    : Icons.dark_mode_rounded,
                color: textColor,
              ),
              onPressed: () {
                themeProvider.toggleTheme();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      themeProvider.isDarkMode
                          ? 'Dark mode enabled'
                          : 'Light mode enabled',
                    ),
                    duration: const Duration(seconds: 1),
                    backgroundColor: AppTheme.successGreen,
                  ),
                );
              },
            ),
            if (isCurrentUser)
              IconButton(
                icon: Icon(Icons.settings_rounded, color: textColor),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const SettingsScreen()),
                  );
                },
              ),
          ],
          flexibleSpace: FlexibleSpaceBar(
            title: Text(
              userName,
              style: TextStyle(
                color: textColor,
                fontWeight: FontWeight.bold,
                fontSize: 20,
              ),
            ),
            centerTitle: false,
          ),
        );
      },
    );
  }
}
