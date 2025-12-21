import 'package:flutter/material.dart';
import '../config/app_theme.dart';

class LegalInformationScreen extends StatelessWidget {
  const LegalInformationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Legal & Policies'),
        backgroundColor: AppTheme.primaryPurple,
        foregroundColor: Colors.white,
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppTheme.primaryPurple.withOpacity(0.05),
              Colors.grey.shade50,
            ],
          ),
        ),
        child: ListView(
          padding: EdgeInsets.all(AppTheme.spaceL),
          children: [
            _LegalInformationCard(),
            SizedBox(height: AppTheme.spaceL),
            _PlatformPoliciesCard(),
          ],
        ),
      ),
    );
  }
}

// Legal Information Card
class _LegalInformationCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.blue.shade50,
              Colors.white,
              Colors.indigo.shade50,
            ],
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        padding: EdgeInsets.all(AppTheme.spaceL),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.blue.shade500, Colors.indigo.shade600],
                    ),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.blue.withOpacity(0.3),
                        blurRadius: 8,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      '⚖️',
                      style: TextStyle(fontSize: 24),
                    ),
                  ),
                ),
                SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Legal Information',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        foreground: Paint()
                          ..shader = LinearGradient(
                            colors: [Colors.blue.shade700, Colors.indigo.shade800],
                          ).createShader(Rect.fromLTWH(0, 0, 200, 70)),
                      ),
                    ),
                    Container(
                      width: 40,
                      height: 2,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.blue.shade400, Colors.indigo.shade500],
                        ),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            SizedBox(height: AppTheme.spaceL),
            
            // Legal Items
            _buildLegalItem(
              context,
              icon: '📋',
              title: 'About Us',
              subtitle: 'Learn our story',
              colors: [Colors.blue.shade500, Colors.indigo.shade600],
              bgColors: [Colors.blue.shade50, Colors.indigo.shade50],
              borderColor: Colors.blue.shade200,
              onTap: () => _showAboutUsModal(context),
            ),
            SizedBox(height: 8),
            _buildLegalItem(
              context,
              icon: '🔒',
              title: 'Privacy Policy',
              subtitle: 'Data protection',
              colors: [Colors.cyan.shade500, Colors.blue.shade600],
              bgColors: [Colors.cyan.shade50, Colors.blue.shade50],
              borderColor: Colors.cyan.shade200,
              onTap: () => _showPrivacyPolicyModal(context),
            ),
            SizedBox(height: 8),
            _buildLegalItem(
              context,
              icon: '📜',
              title: 'Terms of Service',
              subtitle: 'Usage agreement',
              colors: [Colors.indigo.shade500, Colors.purple.shade600],
              bgColors: [Colors.indigo.shade50, Colors.purple.shade50],
              borderColor: Colors.indigo.shade200,
              onTap: () => _showTermsOfServiceModal(context),
            ),
            SizedBox(height: 8),
            _buildLegalItem(
              context,
              icon: '🏥',
              title: 'Health Privacy',
              subtitle: 'Consumer protection',
              colors: [Colors.teal.shade500, Colors.cyan.shade600],
              bgColors: [Colors.teal.shade50, Colors.cyan.shade50],
              borderColor: Colors.teal.shade200,
              onTap: () => _showHealthPrivacyModal(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegalItem(
    BuildContext context, {
    required String icon,
    required String title,
    required String subtitle,
    required List<Color> colors,
    required List<Color> bgColors,
    required Color borderColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: bgColors,
          ),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor, width: 1),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: colors),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Text(icon, style: TextStyle(fontSize: 18)),
              ),
            ),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: colors[0].withOpacity(0.9),
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: colors[0].withOpacity(0.7),
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: colors[0].withOpacity(0.5),
            ),
          ],
        ),
      ),
    );
  }
}

// Platform Policies Card
class _PlatformPoliciesCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.green.shade50,
              Colors.white,
              Colors.teal.shade50,
            ],
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        padding: EdgeInsets.all(AppTheme.spaceL),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.green.shade500, Colors.teal.shade600],
                    ),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.green.withOpacity(0.3),
                        blurRadius: 8,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      '📋',
                      style: TextStyle(fontSize: 24),
                    ),
                  ),
                ),
                SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Platform Policies',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        foreground: Paint()
                          ..shader = LinearGradient(
                            colors: [Colors.green.shade700, Colors.teal.shade800],
                          ).createShader(Rect.fromLTWH(0, 0, 200, 70)),
                      ),
                    ),
                    Container(
                      width: 40,
                      height: 2,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.green.shade400, Colors.teal.shade500],
                        ),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            SizedBox(height: AppTheme.spaceL),
            
            // Policy Items
            _buildPolicyItem(
              context,
              icon: '🍪',
              title: 'Cookies Policy',
              subtitle: 'Website preferences',
              colors: [Colors.orange.shade500, Colors.amber.shade600],
              bgColors: [Colors.orange.shade50, Colors.amber.shade50],
              borderColor: Colors.orange.shade200,
              onTap: () => _showCookiesPolicyModal(context),
            ),
            SizedBox(height: 8),
            _buildPolicyItem(
              context,
              icon: '♿',
              title: 'Accessibility',
              subtitle: 'Inclusive design',
              colors: [Colors.deepPurple.shade500, Colors.purple.shade600],
              bgColors: [Colors.deepPurple.shade50, Colors.purple.shade50],
              borderColor: Colors.deepPurple.shade200,
              onTap: () => _showAccessibilityModal(context),
            ),
            SizedBox(height: 8),
            _buildPolicyItem(
              context,
              icon: '🛡️',
              title: 'Data Protection',
              subtitle: 'GDPR compliance',
              colors: [Colors.teal.shade500, Colors.teal.shade600],
              bgColors: [Colors.teal.shade50, Colors.teal.shade50],
              borderColor: Colors.teal.shade200,
              onTap: () => _showDataProtectionModal(context),
            ),
            SizedBox(height: 8),
            _buildPolicyItem(
              context,
              icon: '📝',
              title: 'Content Guidelines',
              subtitle: 'Community standards',
              colors: [Colors.pink.shade500, Colors.red.shade600],
              bgColors: [Colors.pink.shade50, Colors.red.shade50],
              borderColor: Colors.pink.shade200,
              onTap: () => _showContentGuidelinesModal(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPolicyItem(
    BuildContext context, {
    required String icon,
    required String title,
    required String subtitle,
    required List<Color> colors,
    required List<Color> bgColors,
    required Color borderColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: bgColors,
          ),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor, width: 1),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: colors),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Text(icon, style: TextStyle(fontSize: 18)),
              ),
            ),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: colors[0].withOpacity(0.9),
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: colors[0].withOpacity(0.7),
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: colors[0].withOpacity(0.5),
            ),
          ],
        ),
      ),
    );
  }
}

// Modal Functions
void _showAboutUsModal(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _buildModalContent(
      context,
      title: 'About Us',
      icon: '📋',
      content: '''
Welcome to ReviewInn - Your Trusted Review Platform

Founded with a mission to create a transparent and honest review ecosystem, ReviewInn connects users with authentic experiences and valuable insights.

Our Vision:
To be the world's most trusted platform for sharing and discovering genuine reviews across all aspects of life.

Our Mission:
• Empower users with authentic information
• Foster a community built on trust and transparency
• Provide a platform for honest feedback
• Connect people with quality experiences

What We Do:
ReviewInn enables users to share their experiences about professors, courses, restaurants, products, services, and much more. We believe in the power of community-driven content to help others make informed decisions.

Our Values:
✓ Transparency
✓ Authenticity
✓ Community
✓ Innovation
✓ User Privacy

Join thousands of users who trust ReviewInn for their decision-making needs!
      ''',
      color: Colors.blue,
    ),
  );
}

void _showPrivacyPolicyModal(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _buildModalContent(
      context,
      title: 'Privacy Policy',
      icon: '🔒',
      content: '''
Privacy Policy for ReviewInn

Last Updated: December 2025

1. Information We Collect
• Account information (name, email, username)
• Profile data and preferences
• Reviews and ratings you submit
• Usage data and analytics
• Device information

2. How We Use Your Information
• To provide and improve our services
• To personalize your experience
• To communicate with you
• To ensure platform security
• To comply with legal obligations

3. Information Sharing
We do NOT sell your personal information. We may share data with:
• Service providers (hosting, analytics)
• Legal authorities when required
• Other users (public profile information)

4. Your Rights
You have the right to:
• Access your personal data
• Correct inaccurate information
• Delete your account
• Export your data
• Opt-out of marketing communications

5. Data Security
We implement industry-standard security measures including:
• Encryption of sensitive data
• Regular security audits
• Secure data storage
• Access controls

6. Cookies
We use cookies to enhance your experience. You can manage cookie preferences in your browser settings.

7. Children's Privacy
Our service is not intended for users under 13 years of age.

8. Changes to Privacy Policy
We may update this policy and will notify users of significant changes.

Contact: privacy@reviewinn.com
      ''',
      color: Colors.cyan,
    ),
  );
}

void _showTermsOfServiceModal(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _buildModalContent(
      context,
      title: 'Terms of Service',
      icon: '📜',
      content: '''
Terms of Service

Last Updated: December 2025

1. Acceptance of Terms
By accessing ReviewInn, you agree to these Terms of Service and our Privacy Policy.

2. User Accounts
• You must be 13+ years old to use our service
• Provide accurate registration information
• Maintain account security
• One account per person

3. User Conduct
You agree NOT to:
• Post false or misleading reviews
• Harass or abuse other users
• Violate intellectual property rights
• Share inappropriate content
• Spam or engage in commercial solicitation
• Manipulate ratings or reviews

4. Content Guidelines
• Reviews must be based on genuine experiences
• No hate speech or discriminatory content
• No personal attacks or defamation
• Respect privacy of others
• No copyrighted content without permission

5. Intellectual Property
• You retain rights to your content
• Grant us license to display your reviews
• Respect others' intellectual property
• Report copyright violations

6. Reviews and Ratings
• Reviews represent personal opinions
• We may moderate but don't endorse content
• You're responsible for your reviews
• Reviews may be removed if they violate policies

7. Disclaimer
ReviewInn is provided "as is" without warranties. We don't guarantee:
• Accuracy of reviews
• Continuous service availability
• Error-free operation

8. Liability Limitation
We're not liable for:
• User-generated content
• Third-party actions
• Service interruptions
• Indirect or consequential damages

9. Termination
We may suspend or terminate accounts for:
• Terms violation
• Fraudulent activity
• Extended inactivity
• Legal requirements

10. Changes to Terms
We reserve the right to modify these terms. Continued use constitutes acceptance.

Contact: legal@reviewinn.com
      ''',
      color: Colors.indigo,
    ),
  );
}

void _showHealthPrivacyModal(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _buildModalContent(
      context,
      title: 'Health Privacy Notice',
      icon: '🏥',
      content: '''
Health Privacy Notice (Consumer Protection)

HIPAA Compliance & Health Information Protection

1. Health Information We May Collect
When reviewing healthcare-related entities, you may share:
• General health experiences
• Treatment satisfaction
• Facility cleanliness
• Staff professionalism

IMPORTANT: Do NOT share:
✗ Specific medical diagnoses
✗ Personal health records
✗ Prescription details
✗ Protected health information (PHI)

2. HIPAA Compliance
We comply with the Health Insurance Portability and Accountability Act (HIPAA):
• We are not a covered entity under HIPAA
• We do not request or store protected health information
• Healthcare reviews should remain general and anonymous
• We cannot provide medical advice

3. De-Identification
To protect your privacy:
• Keep health reviews general
• Don't include identifiable information
• Focus on experience quality, not medical details
• Avoid dates, names, or specific procedures

4. Your Health Privacy Rights
• Control what you share
• Delete health-related reviews anytime
• Request removal of sensitive information
• Report inappropriate health information disclosure

5. Healthcare Provider Reviews Guidelines
When reviewing healthcare providers:
✓ DO: Share overall experience
✓ DO: Comment on facility quality
✓ DO: Discuss customer service
✗ DON'T: Share medical information
✗ DON'T: Disclose treatment details
✗ DON'T: Include personal health data

6. Consumer Protection
We protect healthcare consumers by:
• Monitoring for inappropriate health disclosures
• Removing prohibited health information
• Educating users on privacy best practices
• Providing secure review platform

7. Mental Health Considerations
Special care for mental health reviews:
• General experience only
• No therapy session details
• No medication information
• Maintain complete anonymity

8. Reporting Health Privacy Violations
If you see inappropriate health information:
• Report immediately
• We'll review within 24 hours
• Content will be removed if necessary

9. Third-Party Healthcare Services
We're not responsible for:
• Healthcare provider actions
• Medical advice from reviews
• Third-party health services
• Medical outcomes

10. Contact for Health Privacy
For health privacy concerns:
Email: healthprivacy@reviewinn.com
Response time: 24-48 hours

Remember: ReviewInn is for sharing experiences, not medical information. Always consult healthcare professionals for medical advice.
      ''',
      color: Colors.teal,
    ),
  );
}

void _showCookiesPolicyModal(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _buildModalContent(
      context,
      title: 'Cookies Policy',
      icon: '🍪',
      content: '''
Cookies Policy

Last Updated: December 2025

1. What Are Cookies?
Cookies are small text files stored on your device when you visit websites or use apps. They help us provide a better user experience.

2. Types of Cookies We Use

Essential Cookies:
• Authentication and session management
• Security features
• Basic functionality
• Cannot be disabled

Performance Cookies:
• Analytics and usage tracking
• Error monitoring
• Performance optimization
• Can be disabled in settings

Functional Cookies:
• User preferences
• Language settings
• Theme preferences
• Personalization features

Marketing Cookies:
• Ad targeting and measurement
• Social media integration
• Campaign tracking
• Can be disabled

3. How We Use Cookies
• Maintain user sessions
• Remember your preferences
• Analyze platform usage
• Improve user experience
• Provide personalized content
• Ensure security

4. Third-Party Cookies
We may use cookies from:
• Google Analytics (usage statistics)
• Social media platforms (sharing features)
• Advertising partners (relevant ads)
• Payment processors (transactions)

5. Managing Cookies

Mobile App:
• Go to Settings → Privacy → Cookies
• Enable/disable non-essential cookies
• Clear cookie data

Web Browser:
• Browser settings → Privacy
• Block or delete cookies
• Set cookie preferences

6. Cookie Duration
• Session cookies: Expire when you close the app
• Persistent cookies: Stored for up to 1 year
• Third-party cookies: Vary by provider

7. Cookie Consent
By using ReviewInn, you consent to our use of essential cookies. You can opt-out of non-essential cookies anytime.

8. Do Not Track (DNT)
We respect DNT browser signals where technically possible.

9. Updates to Cookie Policy
We may update this policy to reflect changes in technology or regulations.

10. Contact
For cookie-related questions:
Email: cookies@reviewinn.com

Your Privacy Choices:
You can manage cookie preferences in the Settings section of the app.
      ''',
      color: Colors.orange,
    ),
  );
}

void _showAccessibilityModal(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _buildModalContent(
      context,
      title: 'Accessibility Statement',
      icon: '♿',
      content: '''
Accessibility Statement

ReviewInn's Commitment to Inclusive Design

1. Our Commitment
We're committed to ensuring digital accessibility for people of all abilities. We continuously work to enhance accessibility and usability of our platform.

2. Standards Compliance
We strive to conform to:
• WCAG 2.1 Level AA guidelines
• ADA (Americans with Disabilities Act)
• Section 508 compliance
• Mobile accessibility best practices

3. Accessibility Features

Visual Accessibility:
✓ High contrast mode
✓ Adjustable font sizes
✓ Screen reader compatibility
✓ Clear color indicators (not color-only)
✓ Sufficient color contrast ratios
✓ Alt text for images

Motor Accessibility:
✓ Keyboard navigation support
✓ Large touch targets (minimum 44x44 pixels)
✓ Voice control compatibility
✓ No time-sensitive actions required
✓ Easy-to-use gestures

Auditory Accessibility:
✓ Text alternatives for audio
✓ Visual notifications
✓ Closed captions (when applicable)
✓ No audio-only content

Cognitive Accessibility:
✓ Clear, simple language
✓ Consistent navigation
✓ Helpful error messages
✓ Adequate reading time
✓ Predictable interface

4. Assistive Technology Support
Compatible with:
• Screen readers (TalkBack, VoiceOver)
• Voice recognition software
• Screen magnifiers
• Alternative input devices
• Braille displays

5. Font & Display Options
• Adjustable font sizes (S, M, L, XL)
• System font support
• High contrast themes
• Dark mode option
• Dyslexia-friendly fonts available

6. Navigation Assistance
• Skip navigation links
• Clear heading structure
• Breadcrumb navigation
• Search functionality
• Consistent page layouts

7. Content Guidelines
We ensure:
• Clear content hierarchy
• Descriptive link text
• Simple language
• Proper heading structure
• Meaningful page titles

8. Testing & Monitoring
We regularly:
• Test with assistive technologies
• Conduct accessibility audits
• Gather user feedback
• Update based on standards
• Train our team

9. Known Limitations
We're actively working on:
• Some third-party content
• Legacy features
• Video accessibility
• Complex data tables

10. Feedback & Support
We welcome accessibility feedback!

Report Issues:
Email: accessibility@reviewinn.com
Phone: 1-800-REVIEW-INN
Response time: 48 hours

Request Accommodations:
We'll work with you to provide:
• Alternative formats
• Accessible communication
• Personalized assistance

11. Continuous Improvement
Our commitment:
• Regular accessibility audits
• User testing with diverse abilities
• Staff training programs
• Technology updates
• Community engagement

12. Resources
• Accessibility help guide
• Keyboard shortcuts reference
• Screen reader tips
• FAQs for assistive technology users

We believe everyone should have equal access to information and features. If you experience any accessibility barriers, please let us know immediately.

Together, we can make ReviewInn accessible to all!
      ''',
      color: Colors.deepPurple,
    ),
  );
}

void _showDataProtectionModal(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _buildModalContent(
      context,
      title: 'Data Protection (GDPR)',
      icon: '🛡️',
      content: '''
Data Protection Policy - GDPR Compliance

General Data Protection Regulation (GDPR) Compliance

1. Introduction
ReviewInn is committed to protecting your personal data in compliance with GDPR and other data protection regulations worldwide.

2. Legal Basis for Processing
We process your data based on:
• Consent (when you sign up)
• Contract performance (providing services)
• Legitimate interests (platform improvement)
• Legal obligations (compliance requirements)

3. Data Controller
ReviewInn, Inc.
Address: [Your Address]
DPO: dataprotection@reviewinn.com
EU Representative: [If applicable]

4. Your GDPR Rights

Right to Access:
• Request copy of your data
• See what we've collected
• Understand data usage
• Free of charge (first request)

Right to Rectification:
• Correct inaccurate data
• Update incomplete information
• Maintain data accuracy

Right to Erasure ("Right to be Forgotten"):
• Delete your account
• Remove your data
• Exceptions: legal obligations

Right to Restrict Processing:
• Limit how we use your data
• Pause processing activities
• While verifying data accuracy

Right to Data Portability:
• Export your data
• Machine-readable format
• Transfer to another service

Right to Object:
• Marketing communications
• Automated decision-making
• Profiling activities

Right to Withdraw Consent:
• Opt-out anytime
• Revoke permissions
• No penalties

5. Data We Collect
• Identity data (name, username)
• Contact data (email, phone)
• Profile data (preferences, reviews)
• Usage data (analytics, behavior)
• Technical data (IP, device, browser)
• Marketing data (communication preferences)

6. How We Use Your Data
• Service provision
• Communication
• Platform improvement
• Security and fraud prevention
• Legal compliance
• Marketing (with consent)

7. Data Sharing
We share data with:
• Service providers (hosting, analytics)
• Payment processors (transactions)
• Legal authorities (when required)
• Other users (public profile only)

We NEVER sell your personal data!

8. International Transfers
If transferring data outside EU/EEA:
• Standard Contractual Clauses (SCCs)
• Adequacy decisions
• Appropriate safeguards
• Your consent

9. Data Retention
• Active accounts: Duration of use + 30 days
• Deleted accounts: 30 days (recovery period)
• Legal obligations: As required by law
• Anonymized data: Indefinitely

10. Security Measures
• Encryption (in transit and at rest)
• Access controls
• Regular security audits
• Incident response procedures
• Staff training
• Secure data centers

11. Children's Data
• Not for users under 13
• Parental consent required (13-16)
• Limited data collection
• Enhanced protections

12. Automated Decision-Making
We may use automation for:
• Content moderation
• Fraud detection
• Personalization

You have the right to:
• Request human review
• Challenge decisions
• Understand logic used

13. Data Breach Notification
If a breach occurs:
• Notify supervisory authority (within 72 hours)
• Inform affected users
• Detail breach nature
• Outline remedial actions

14. Cookies & Tracking
• See our Cookies Policy
• Manage preferences
• Opt-out options
• Third-party cookies

15. How to Exercise Your Rights

Email: dataprotection@reviewinn.com
Subject: "GDPR Request - [Your Right]"
Include: Account details, specific request

Response time: 30 days (may extend to 60 days)

16. Complaints
Unsatisfied with our response?

File a complaint with:
• Your local supervisory authority
• EU Data Protection Board
• ICO (UK): ico.org.uk
• National data protection authorities

17. Updates to Policy
• Notify users of significant changes
• Posted on website/app
• Email notification
• Continued use implies acceptance

18. Contact Information

Data Protection Officer:
Email: dpo@reviewinn.com
Address: [Physical Address]

EU Representative:
[If applicable for UK/EU operations]

19. Specific Country Rights

California (CCPA/CPRA):
• Additional disclosure rights
• Opt-out of sale
• Non-discrimination

UK (UK-GDPR):
• Similar to EU GDPR
• ICO oversight
• Post-Brexit provisions

Other Regions:
• Comply with local laws
• Respect local rights
• Additional protections

Your data, your rights. We're here to protect both.

Last Updated: December 2025
Version: 2.0
      ''',
      color: Colors.teal,
    ),
  );
}

void _showContentGuidelinesModal(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _buildModalContent(
      context,
      title: 'Content Guidelines',
      icon: '📝',
      content: '''
Content Guidelines & Community Standards

Building a Respectful Review Community

1. Purpose
These guidelines ensure ReviewInn remains a safe, respectful, and valuable platform for all users.

2. Core Principles

✓ Be Honest: Share genuine experiences
✓ Be Respectful: Treat others with dignity
✓ Be Helpful: Provide constructive feedback
✓ Be Fair: Base reviews on facts
✓ Be Responsible: Consider impact of your words

3. Acceptable Content

Reviews Should:
• Be based on personal experience
• Focus on the entity being reviewed
• Include specific, relevant details
• Use respectful language
• Help others make informed decisions
• Be timely and current

You May:
• Express opinions (marked as such)
• Share both positive and negative experiences
• Provide constructive criticism
• Ask questions
• Update your reviews
• Respond to comments

4. Prohibited Content

Never Post:
✗ False or misleading information
✗ Hate speech or discrimination
✗ Harassment or bullying
✗ Personal attacks
✗ Threats or violence
✗ Sexual content or nudity
✗ Spam or advertisements
✗ Copyrighted material without permission
✗ Private information (doxxing)
✗ Illegal activities
✗ Manipulated reviews
✗ Coordinated fake reviews
✗ Revenge or malicious posts

5. Review Authenticity

Ensure Your Reviews:
• Are based on actual experiences
• Are your own original content
• Disclose conflicts of interest
• Don't include bribes or payments
• Aren't posted on behalf of others

Prohibited:
• Fake reviews
• Review bombing
• Competitor sabotage
• Paid reviews (without disclosure)
• Review exchanges

6. Respectful Communication

Language Guidelines:
✓ Professional tone
✓ Constructive criticism
✓ Specific examples
✗ Profanity or slurs
✗ ALL CAPS (shouting)
✗ Personal insults
✗ Inflammatory language

7. Privacy & Confidentiality

Protect Privacy:
• Don't share personal information
• No photos of people without consent
• Respect confidential information
• No medical or health details
• Protect children's privacy

8. Intellectual Property

Respect Copyright:
• Don't copy others' reviews
• No unauthorized images
• Credit sources properly
• Respect trademarks
• Link to original content

9. Business & Owner Responses

Businesses May:
• Respond to reviews professionally
• Provide factual corrections
• Thank reviewers
• Address concerns

Businesses Cannot:
• Post fake positive reviews
• Attack reviewers
• Offer bribes for good reviews
• Remove legitimate negative reviews

10. Conflicts of Interest

Disclose if You:
• Work for the entity
• Are affiliated with competitors
• Received compensation
• Have personal relationships
• Have financial interests

11. Category-Specific Guidelines

Professors/Education:
• Focus on teaching quality
• Course structure and materials
• Professionalism
• No personal life comments

Restaurants/Food:
• Food quality and taste
• Service experience
• Cleanliness and ambiance
• Value for money

Healthcare:
• General experience only
• No medical details (see Health Privacy)
• Facility quality
• Staff professionalism

Products:
• Quality and performance
• Value and durability
• Honest pros and cons
• Specific use cases

12. Moderation

We May:
• Review flagged content
• Remove violating content
• Edit for clarity (with disclosure)
• Warn users
• Suspend accounts
• Permanently ban repeat offenders

Review Process:
• User reports
• Automated detection
• Manual review
• Decision within 24-48 hours
• Appeal process available

13. Reporting Violations

Report Content That:
• Violates guidelines
• Contains abuse
• Is fake or fraudulent
• Infringes rights
• Threatens safety

How to Report:
• Click "Report" button
• Select violation type
• Provide details
• Submit report
• Track status

14. Consequences

First Violation:
• Warning message
• Content removal
• Educational resources

Repeat Violations:
• Temporary suspension (7-30 days)
• Content restrictions
• Review privileges limited

Serious/Repeated:
• Permanent account ban
• Legal action (if necessary)
• Law enforcement notification

15. Appeals Process

Disagree with Moderation?
• Submit appeal within 30 days
• Explain your case
• Provide additional context
• Decision within 7 days
• Final determination by senior team

Appeal Form: appeals@reviewinn.com

16. Community Guidelines Updates

We May Update Guidelines:
• New content types
• Community feedback
• Legal requirements
• Platform evolution

Changes:
• Announced on platform
• Email notification
• Effective immediately
• Users notified

17. Best Practices

Writing Great Reviews:
1. Be specific and detailed
2. Include timeline
3. Provide context
4. Balance positive and negative
5. Update if situation changes
6. Proofread before posting
7. Use proper formatting
8. Add photos (if relevant)

Engaging with Others:
• Read full reviews
• Ask clarifying questions
• Thank helpful reviewers
• Vote on helpful reviews
• Report violations
• Be part of the solution

18. Platform Features Misuse

Don't Abuse:
• Voting system
• Reporting system
• Messaging features
• Follow/block functions
• Profile settings
• Search functionality

19. Commercial Activity

Prohibited:
• Unsolicited advertising
• Affiliate links without disclosure
• Selling products/services
• Promotional campaigns
• MLM recruitment

Allowed (with disclosure):
• Affiliate links (marked clearly)
• Sponsored content (labeled)
• Business partnerships (disclosed)

20. Get Help

Questions about Guidelines:
Email: community@reviewinn.com
Response: 24-48 hours

Report Urgent Issues:
Email: urgent@reviewinn.com
Response: Immediate

Community Forum:
• Ask questions
• Share feedback
• Connect with moderators
• Learn best practices

Remember: Your reviews help millions make better decisions. Use this power responsibly!

Together, we build a trustworthy review community.

Last Updated: December 2025
      ''',
      color: Colors.pink,
    ),
  );
}

// Reusable Modal Builder
Widget _buildModalContent(
  BuildContext context, {
  required String title,
  required String icon,
  required String content,
  required MaterialColor color,
}) {
  return DraggableScrollableSheet(
    initialChildSize: 0.9,
    minChildSize: 0.5,
    maxChildSize: 0.95,
    builder: (_, controller) => Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: EdgeInsets.symmetric(vertical: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Container(
            padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [color.shade50, Colors.white],
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [color.shade400, color.shade600],
                    ),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: color.withOpacity(0.3),
                        blurRadius: 8,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(icon, style: TextStyle(fontSize: 24)),
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: Text(
                    title,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: color.shade800,
                    ),
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          
          Divider(height: 1),
          
          // Content
          Expanded(
            child: SingleChildScrollView(
              controller: controller,
              padding: EdgeInsets.all(20),
              child: Text(
                content,
                style: TextStyle(
                  fontSize: 14,
                  height: 1.6,
                  color: Colors.grey[800],
                ),
              ),
            ),
          ),
        ],
      ),
    ),
  );
}
