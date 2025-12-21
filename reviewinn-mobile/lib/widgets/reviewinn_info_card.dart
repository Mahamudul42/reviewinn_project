import 'package:flutter/material.dart';

class ReviewInnInfoCard extends StatelessWidget {
  const ReviewInnInfoCard({super.key});

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
              // Header with Logo Effect
              Column(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.blue.shade500, Colors.purple.shade600],
                      ),
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.blue.withOpacity(0.3),
                          blurRadius: 15,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        '🌟',
                        style: TextStyle(fontSize: 28),
                      ),
                    ),
                  ),
                  SizedBox(height: 12),
                  ShaderMask(
                    shaderCallback: (bounds) => LinearGradient(
                      colors: [
                        Colors.blue.shade600,
                        Colors.purple.shade600,
                        Colors.blue.shade800,
                      ],
                    ).createShader(bounds),
                    child: Text(
                      'ReviewInn',
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
                        colors: [Colors.blue.shade400, Colors.purple.shade500],
                      ),
                      borderRadius: BorderRadius.circular(1),
                    ),
                  ),
                ],
              ),
              
              SizedBox(height: 16),

              // Description
              RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  style: TextStyle(
                    color: Colors.grey.shade700,
                    fontSize: 13,
                    height: 1.4,
                    fontWeight: FontWeight.w500,
                  ),
                  children: [
                    TextSpan(text: 'Your trusted platform for '),
                    TextSpan(
                      text: 'authentic reviews',
                      style: TextStyle(
                        color: Colors.blue.shade600,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextSpan(text: ' and comparisons. Share your experiences and help others make '),
                    TextSpan(
                      text: 'informed decisions',
                      style: TextStyle(
                        color: Colors.purple.shade600,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextSpan(text: '.'),
                  ],
                ),
              ),

              SizedBox(height: 16),

              // Feature Cards
              _buildFeatureItem(
                emoji: '🌟',
                title: 'Trusted by thousands',
                subtitle: 'Growing community of reviewers',
                gradientColors: [Colors.blue.shade400, Colors.blue.shade600],
                bgColors: [Colors.blue.shade50, Colors.blue.shade100],
                borderColor: Colors.blue.shade200,
                textColor: Colors.blue.shade800,
                subtitleColor: Colors.blue.shade600,
              ),
              SizedBox(height: 8),
              _buildFeatureItem(
                emoji: '🔒',
                title: 'Secure & Private',
                subtitle: 'Your data is protected',
                gradientColors: [Colors.green.shade400, Colors.teal.shade600],
                bgColors: [Colors.green.shade50, Colors.teal.shade100],
                borderColor: Colors.green.shade200,
                textColor: Colors.green.shade800,
                subtitleColor: Colors.green.shade600,
              ),
              SizedBox(height: 8),
              _buildFeatureItem(
                emoji: '⚡',
                title: 'Fast & Reliable',
                subtitle: 'Lightning fast performance',
                gradientColors: [Colors.purple.shade400, Colors.deepPurple.shade600],
                bgColors: [Colors.purple.shade50, Colors.deepPurple.shade100],
                borderColor: Colors.purple.shade200,
                textColor: Colors.purple.shade800,
                subtitleColor: Colors.purple.shade600,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureItem({
    required String emoji,
    required String title,
    required String subtitle,
    required List<Color> gradientColors,
    required List<Color> bgColors,
    required Color borderColor,
    required Color textColor,
    required Color subtitleColor,
  }) {
    return Container(
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
        ],
      ),
    );
  }
}
