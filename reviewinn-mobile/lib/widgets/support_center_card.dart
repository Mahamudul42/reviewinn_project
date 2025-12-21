import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/app_theme.dart';

class SupportCenterCard extends StatelessWidget {
  const SupportCenterCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.yellow.shade50,
              Colors.white,
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Colors.yellow.shade300,
            width: 1,
          ),
        ),
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            children: [
              // Header with Support Icon
              Column(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.purple.shade500, Colors.pink.shade600],
                      ),
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.purple.withOpacity(0.3),
                          blurRadius: 15,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        '🆘',
                        style: TextStyle(fontSize: 28),
                      ),
                    ),
                  ),
                  SizedBox(height: 12),
                  ShaderMask(
                    shaderCallback: (bounds) => LinearGradient(
                      colors: [
                        Colors.purple.shade600,
                        Colors.pink.shade600,
                        Colors.purple.shade800,
                      ],
                    ).createShader(bounds),
                    child: Text(
                      'Support Center',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  SizedBox(height: 8),
                  Container(
                    width: 40,
                    height: 2,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.purple.shade400, Colors.pink.shade500],
                      ),
                      borderRadius: BorderRadius.circular(1),
                    ),
                  ),
                ],
              ),
              
              SizedBox(height: 16),

              // Support Options
              _buildSupportButton(
                context,
                emoji: '📞',
                title: 'Contact Us',
                subtitle: 'Get in touch with our team',
                gradientColors: [Colors.blue.shade500, Colors.cyan.shade600],
                bgColors: [Colors.blue.shade50, Colors.cyan.shade50],
                borderColor: Colors.blue.shade200,
                textColor: Colors.blue.shade800,
                subtitleColor: Colors.blue.shade600,
                onTap: () => _showContactUsDialog(context),
              ),
              SizedBox(height: 8),
              _buildSupportButton(
                context,
                emoji: '❓',
                title: 'Help Center',
                subtitle: 'Find answers and guides',
                gradientColors: [Colors.green.shade500, Colors.teal.shade600],
                bgColors: [Colors.green.shade50, Colors.teal.shade50],
                borderColor: Colors.green.shade200,
                textColor: Colors.green.shade800,
                subtitleColor: Colors.green.shade600,
                onTap: () => _showHelpCenterDialog(context),
              ),
              SizedBox(height: 8),
              _buildSupportButton(
                context,
                emoji: '⚠️',
                title: 'Report Abuse',
                subtitle: 'Report inappropriate content',
                gradientColors: [Colors.red.shade500, Colors.pink.shade600],
                bgColors: [Colors.red.shade50, Colors.pink.shade50],
                borderColor: Colors.red.shade200,
                textColor: Colors.red.shade800,
                subtitleColor: Colors.red.shade600,
                onTap: () => _showReportAbuseDialog(context),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSupportButton(
    BuildContext context, {
    required String emoji,
    required String title,
    required String subtitle,
    required List<Color> gradientColors,
    required List<Color> bgColors,
    required Color borderColor,
    required Color textColor,
    required Color subtitleColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: EdgeInsets.all(10),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
            colors: bgColors,
          ),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor, width: 1),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: gradientColors),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Text(emoji, style: TextStyle(fontSize: 16)),
              ),
            ),
            SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: textColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: subtitleColor,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: textColor.withOpacity(0.5),
            ),
          ],
        ),
      ),
    );
  }

  void _showContactUsDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Text('📞', style: TextStyle(fontSize: 24)),
            SizedBox(width: 8),
            Text('Contact Us'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Get in touch with our support team',
              style: TextStyle(color: Colors.grey.shade600),
            ),
            SizedBox(height: 16),
            _buildContactOption(
              context,
              icon: Icons.email,
              label: 'Email',
              value: 'support@reviewinn.com',
              onTap: () => _launchEmail('support@reviewinn.com'),
            ),
            SizedBox(height: 12),
            _buildContactOption(
              context,
              icon: Icons.phone,
              label: 'Phone',
              value: '+1-800-REVIEW-INN',
              onTap: () => _launchPhone('+18007384394466'),
            ),
            SizedBox(height: 12),
            _buildContactOption(
              context,
              icon: Icons.chat,
              label: 'Live Chat',
              value: 'Available 24/7',
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Live chat coming soon!')),
                );
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showHelpCenterDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Text('❓', style: TextStyle(fontSize: 24)),
            SizedBox(width: 8),
            Text('Help Center'),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Find answers to common questions',
                style: TextStyle(color: Colors.grey.shade600),
              ),
              SizedBox(height: 16),
              _buildHelpTopic(
                context,
                emoji: '📝',
                title: 'How to write a review',
                subtitle: 'Learn best practices',
              ),
              _buildHelpTopic(
                context,
                emoji: '🔍',
                title: 'Search and filter',
                subtitle: 'Find what you need',
              ),
              _buildHelpTopic(
                context,
                emoji: '👥',
                title: 'Join groups',
                subtitle: 'Connect with others',
              ),
              _buildHelpTopic(
                context,
                emoji: '⭐',
                title: 'Earn badges',
                subtitle: 'Level up your profile',
              ),
              _buildHelpTopic(
                context,
                emoji: '🔐',
                title: 'Account security',
                subtitle: 'Keep your account safe',
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showReportAbuseDialog(BuildContext context) {
    final _reportController = TextEditingController();
    String _selectedReason = 'Spam';

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              Text('⚠️', style: TextStyle(fontSize: 24)),
              SizedBox(width: 8),
              Text('Report Abuse'),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Help us keep ReviewInn safe',
                  style: TextStyle(color: Colors.grey.shade600),
                ),
                SizedBox(height: 16),
                Text(
                  'Reason for report',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _selectedReason,
                  decoration: InputDecoration(
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  items: [
                    'Spam',
                    'Harassment',
                    'Hate Speech',
                    'False Information',
                    'Inappropriate Content',
                    'Other',
                  ].map((reason) => DropdownMenuItem(
                    value: reason,
                    child: Text(reason, style: TextStyle(fontSize: 14)),
                  )).toList(),
                  onChanged: (value) {
                    setState(() => _selectedReason = value!);
                  },
                ),
                SizedBox(height: 16),
                Text(
                  'Additional details',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                SizedBox(height: 8),
                TextField(
                  controller: _reportController,
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: 'Provide more information...',
                    hintStyle: TextStyle(fontSize: 14),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: EdgeInsets.all(12),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Report submitted. We\'ll review it soon.'),
                    backgroundColor: Colors.green,
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: Text('Submit Report'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactOption(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppTheme.primaryPurple, size: 20),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                  Text(
                    value,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildHelpTopic(
    BuildContext context, {
    required String emoji,
    required String title,
    required String subtitle,
  }) {
    return InkWell(
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Opening: $title')),
        );
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: EdgeInsets.all(12),
        margin: EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Row(
          children: [
            Text(emoji, style: TextStyle(fontSize: 20)),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Future<void> _launchEmail(String email) async {
    final Uri emailUri = Uri(
      scheme: 'mailto',
      path: email,
      query: 'subject=ReviewInn Support Request',
    );
    if (await canLaunchUrl(emailUri)) {
      await launchUrl(emailUri);
    }
  }

  Future<void> _launchPhone(String phone) async {
    final Uri phoneUri = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(phoneUri)) {
      await launchUrl(phoneUri);
    }
  }
}
