import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../providers/theme_provider.dart';

class SettingsScreen extends StatefulWidget {
  @override
  _SettingsScreenState createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _pushNotifications = true;
  bool _emailNotifications = false;
  bool _reviewReminders = true;
  bool _groupUpdates = true;
  bool _profilePrivate = false;
  bool _showEmail = false;
  bool _autoplayVideos = true;
  String _language = 'English';

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppTheme.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: AppTheme.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Settings',
          style: TextStyle(
            color: AppTheme.textPrimary,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: ListView(
        children: [
          // Account Section
          _buildSectionHeader('Account'),
          _buildListTile(
            icon: Icons.person,
            title: 'Edit Profile',
            onTap: () {
              // TODO: Navigate to edit profile
            },
          ),
          _buildListTile(
            icon: Icons.lock,
            title: 'Change Password',
            onTap: () {
              // TODO: Navigate to change password
            },
          ),
          _buildListTile(
            icon: Icons.email,
            title: 'Email Preferences',
            onTap: () {
              // TODO: Navigate to email preferences
            },
          ),
          
          Divider(height: 32),
          
          // Appearance Section
          _buildSectionHeader('Appearance'),
          _buildSwitchTile(
            icon: Icons.dark_mode,
            title: 'Dark Mode',
            value: themeProvider.isDarkMode,
            onChanged: (value) {
              themeProvider.toggleTheme();
            },
          ),
          _buildListTile(
            icon: Icons.language,
            title: 'Language',
            subtitle: _language,
            onTap: () {
              _showLanguageDialog();
            },
          ),
          
          Divider(height: 32),
          
          // Notifications Section
          _buildSectionHeader('Notifications'),
          _buildSwitchTile(
            icon: Icons.notifications,
            title: 'Push Notifications',
            subtitle: 'Receive push notifications on this device',
            value: _pushNotifications,
            onChanged: (value) {
              setState(() => _pushNotifications = value);
            },
          ),
          _buildSwitchTile(
            icon: Icons.email,
            title: 'Email Notifications',
            subtitle: 'Receive notifications via email',
            value: _emailNotifications,
            onChanged: (value) {
              setState(() => _emailNotifications = value);
            },
          ),
          _buildSwitchTile(
            icon: Icons.rate_review,
            title: 'Review Reminders',
            subtitle: 'Get reminded to review places you visited',
            value: _reviewReminders,
            onChanged: (value) {
              setState(() => _reviewReminders = value);
            },
          ),
          _buildSwitchTile(
            icon: Icons.group,
            title: 'Group Updates',
            subtitle: 'Notifications about your groups',
            value: _groupUpdates,
            onChanged: (value) {
              setState(() => _groupUpdates = value);
            },
          ),
          
          Divider(height: 32),
          
          // Privacy Section
          _buildSectionHeader('Privacy'),
          _buildSwitchTile(
            icon: Icons.lock,
            title: 'Private Profile',
            subtitle: 'Only you can see your reviews',
            value: _profilePrivate,
            onChanged: (value) {
              setState(() => _profilePrivate = value);
            },
          ),
          _buildSwitchTile(
            icon: Icons.visibility,
            title: 'Show Email',
            subtitle: 'Display email on your profile',
            value: _showEmail,
            onChanged: (value) {
              setState(() => _showEmail = value);
            },
          ),
          _buildListTile(
            icon: Icons.block,
            title: 'Blocked Users',
            onTap: () {
              // TODO: Navigate to blocked users
            },
          ),
          
          Divider(height: 32),
          
          // Data & Storage Section
          _buildSectionHeader('Data & Storage'),
          _buildSwitchTile(
            icon: Icons.play_circle,
            title: 'Autoplay Videos',
            subtitle: 'Videos play automatically in feed',
            value: _autoplayVideos,
            onChanged: (value) {
              setState(() => _autoplayVideos = value);
            },
          ),
          _buildListTile(
            icon: Icons.cached,
            title: 'Clear Cache',
            subtitle: 'Free up storage space',
            onTap: () {
              _showClearCacheDialog();
            },
          ),
          _buildListTile(
            icon: Icons.download,
            title: 'Download Data',
            subtitle: 'Export your reviews and data',
            onTap: () {
              // TODO: Implement data export
            },
          ),
          
          Divider(height: 32),
          
          // Support Section
          _buildSectionHeader('Support'),
          _buildListTile(
            icon: Icons.help,
            title: 'Help & FAQ',
            onTap: () {
              // TODO: Navigate to help
            },
          ),
          _buildListTile(
            icon: Icons.feedback,
            title: 'Send Feedback',
            onTap: () {
              // TODO: Navigate to feedback
            },
          ),
          _buildListTile(
            icon: Icons.bug_report,
            title: 'Report a Bug',
            onTap: () {
              // TODO: Navigate to bug report
            },
          ),
          
          Divider(height: 32),
          
          // About Section
          _buildSectionHeader('About'),
          _buildListTile(
            icon: Icons.info,
            title: 'About ReviewInn',
            subtitle: 'Version 1.0.0',
            onTap: () {
              _showAboutDialog();
            },
          ),
          _buildListTile(
            icon: Icons.gavel,
            title: 'Legal & Policies',
            subtitle: 'Terms, Privacy, and more',
            onTap: () {
              Navigator.pushNamed(context, '/legal');
            },
          ),
          
          Divider(height: 32),
          
          // Logout
          Padding(
            padding: EdgeInsets.all(16),
            child: ElevatedButton(
              onPressed: () {
                _showLogoutDialog();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                padding: EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                'Logout',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          
          SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: AppTheme.primaryPurple,
          letterSpacing: 1,
        ),
      ),
    );
  }

  Widget _buildListTile({
    required IconData icon,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        padding: EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppTheme.primaryPurple.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: AppTheme.primaryPurple, size: 20),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 16,
          color: AppTheme.textPrimary,
        ),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: TextStyle(
                fontSize: 12,
                color: AppTheme.textSecondary,
              ),
            )
          : null,
      trailing: Icon(Icons.chevron_right, color: AppTheme.textSecondary),
      onTap: onTap,
    );
  }

  Widget _buildSwitchTile({
    required IconData icon,
    required String title,
    String? subtitle,
    required bool value,
    required Function(bool) onChanged,
  }) {
    return ListTile(
      leading: Container(
        padding: EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppTheme.primaryPurple.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: AppTheme.primaryPurple, size: 20),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 16,
          color: AppTheme.textPrimary,
        ),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: TextStyle(
                fontSize: 12,
                color: AppTheme.textSecondary,
              ),
            )
          : null,
      trailing: Switch(
        value: value,
        onChanged: onChanged,
        activeColor: AppTheme.primaryPurple,
      ),
    );
  }

  void _showLanguageDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Select Language', style: TextStyle(color: AppTheme.textPrimary)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildLanguageOption('English'),
            _buildLanguageOption('Spanish'),
            _buildLanguageOption('French'),
            _buildLanguageOption('German'),
            _buildLanguageOption('Arabic'),
          ],
        ),
      ),
    );
  }

  Widget _buildLanguageOption(String language) {
    return RadioListTile<String>(
      title: Text(language, style: TextStyle(color: AppTheme.textPrimary)),
      value: language,
      groupValue: _language,
      onChanged: (value) {
        setState(() => _language = value!);
        Navigator.pop(context);
      },
      activeColor: AppTheme.primaryPurple,
    );
  }

  void _showClearCacheDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Clear Cache', style: TextStyle(color: AppTheme.textPrimary)),
        content: Text(
          'This will free up storage space but may slow down the app temporarily.',
          style: TextStyle(color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: TextStyle(color: AppTheme.textSecondary)),
          ),
          TextButton(
            onPressed: () {
              // TODO: Implement cache clearing
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Cache cleared successfully')),
              );
            },
            child: Text('Clear', style: TextStyle(color: AppTheme.primaryPurple)),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('About ReviewInn', style: TextStyle(color: AppTheme.textPrimary)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Version 1.0.0', style: TextStyle(color: AppTheme.textSecondary)),
            SizedBox(height: 16),
            Text(
              'ReviewInn is your go-to platform for discovering and sharing reviews about places you love.',
              style: TextStyle(color: AppTheme.textSecondary),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Close', style: TextStyle(color: AppTheme.primaryPurple)),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Logout', style: TextStyle(color: AppTheme.textPrimary)),
        content: Text(
          'Are you sure you want to logout?',
          style: TextStyle(color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: TextStyle(color: AppTheme.textSecondary)),
          ),
          TextButton(
            onPressed: () {
              // TODO: Implement logout
              Navigator.pop(context);
              Navigator.pop(context); // Return to previous screen
            },
            child: Text('Logout', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
