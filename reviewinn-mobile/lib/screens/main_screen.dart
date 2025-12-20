import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../config/app_theme.dart';
import '../widgets/premium_bottom_nav.dart';
import 'home_feed_screen.dart';
import 'entities_screen.dart';
import 'circle_screen.dart';
import 'groups_screen.dart';
import 'messages_screen.dart';
import 'user_profile_screen.dart';
import 'login_screen.dart';
import 'write_review_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> with TickerProviderStateMixin {
  int _selectedIndex = 0;
  late AnimationController _fabAnimationController;
  late Animation<double> _fabScaleAnimation;
  late Animation<double> _fabRotationAnimation;

  final List<Widget> _screens = [
    const HomeFeedScreen(),
    const EntitiesScreen(),
    const GroupsScreen(),
    const CircleScreen(),
    const MessagesScreen(),
    const UserProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _fabAnimationController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );

    _fabScaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _fabAnimationController,
        curve: Curves.elasticOut,
      ),
    );

    _fabRotationAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _fabAnimationController,
        curve: Curves.easeInOut,
      ),
    );

    _fabAnimationController.forward();
  }

  @override
  void dispose() {
    _fabAnimationController.dispose();
    super.dispose();
  }

  void _onItemTapped(int index) {
    // Check if user is trying to access protected screens
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    if (index >= 2 && !authProvider.isAuthenticated) {
      // Show login for Circle, Messages, and Profile
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
      return;
    }

    setState(() {
      _selectedIndex = index;
    });

    // Restart FAB animation on tab change
    _fabAnimationController.reset();
    _fabAnimationController.forward();
  }

  void _handleFabPressed() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (!authProvider.isAuthenticated) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
      return;
    }

    // Navigate to write review screen
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const WriteReviewScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: PremiumBottomNav(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
      ),
      floatingActionButton: _selectedIndex == 0
          ? AnimatedBuilder(
              animation: _fabAnimationController,
              builder: (context, child) {
                return Transform.scale(
                  scale: _fabScaleAnimation.value,
                  child: Transform.rotate(
                    angle: _fabRotationAnimation.value * 0.5,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: AppTheme.purpleGradient,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primaryPurple.withOpacity(0.5),
                            blurRadius: 20,
                            spreadRadius: 5,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: FloatingActionButton(
                        onPressed: _handleFabPressed,
                        backgroundColor: Colors.transparent,
                        elevation: 0,
                        child: Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            gradient: AppTheme.purpleGradient,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.edit_rounded,
                            color: Colors.white,
                            size: 28,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            )
          : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }
}
