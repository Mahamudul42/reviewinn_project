import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import '../widgets/empty_state_widget.dart';

class ReviewStatsScreen extends StatefulWidget {
  @override
  _ReviewStatsScreenState createState() => _ReviewStatsScreenState();
}

class _ReviewStatsScreenState extends State<ReviewStatsScreen> {
  // Mock data - replace with actual user stats from API
  final int totalReviews = 24;
  final int totalLikes = 156;
  final int totalViews = 892;
  final int helpfulVotes = 134;
  final double averageRating = 4.2;
  final int reviewsThisMonth = 6;
  final int longestStreak = 7;
  final int currentStreak = 3;
  
  final Map<int, int> ratingDistribution = {
    5: 12,
    4: 7,
    3: 3,
    2: 1,
    1: 1,
  };
  
  final List<Map<String, dynamic>> topCategories = [
    {'name': 'Restaurants', 'count': 10, 'icon': Icons.restaurant},
    {'name': 'Hotels', 'count': 6, 'icon': Icons.hotel},
    {'name': 'Cafes', 'count': 4, 'icon': Icons.local_cafe},
    {'name': 'Shopping', 'count': 4, 'icon': Icons.shopping_bag},
  ];

  @override
  Widget build(BuildContext context) {
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
          'Review Statistics',
          style: TextStyle(
            color: AppTheme.textPrimary,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: totalReviews == 0
          ? EmptyStateWidget(
              icon: Icons.bar_chart,
              title: 'No Stats Yet',
              message: 'Start writing reviews to see your statistics',
            )
          : SingleChildScrollView(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Overview Cards
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          'Total Reviews',
                          totalReviews.toString(),
                          Icons.rate_review,
                          AppTheme.primaryColor,
                        ),
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: _buildStatCard(
                          'Total Likes',
                          totalLikes.toString(),
                          Icons.favorite,
                          Colors.red,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          'Total Views',
                          totalViews.toString(),
                          Icons.visibility,
                          Colors.blue,
                        ),
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: _buildStatCard(
                          'Helpful Votes',
                          helpfulVotes.toString(),
                          Icons.thumb_up,
                          Colors.green,
                        ),
                      ),
                    ],
                  ),
                  
                  SizedBox(height: 24),
                  
                  // Rating Analysis
                  _buildSectionTitle('Rating Analysis'),
                  SizedBox(height: 12),
                  Container(
                    padding: EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              averageRating.toStringAsFixed(1),
                              style: TextStyle(
                                fontSize: 48,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                            SizedBox(width: 8),
                            Icon(Icons.star, color: Colors.amber, size: 48),
                          ],
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Average Rating',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                        SizedBox(height: 20),
                        ...ratingDistribution.entries.map((entry) {
                          return _buildRatingBar(entry.key, entry.value);
                        }).toList(),
                      ],
                    ),
                  ),
                  
                  SizedBox(height: 24),
                  
                  // Activity Streak
                  _buildSectionTitle('Activity Streak'),
                  SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildStreakCard(
                          'Current Streak',
                          currentStreak,
                          Icons.local_fire_department,
                          Colors.orange,
                        ),
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: _buildStreakCard(
                          'Longest Streak',
                          longestStreak,
                          Icons.emoji_events,
                          Colors.amber,
                        ),
                      ),
                    ],
                  ),
                  
                  SizedBox(height: 24),
                  
                  // Top Categories
                  _buildSectionTitle('Top Categories'),
                  SizedBox(height: 12),
                  Container(
                    padding: EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      children: topCategories.map((category) {
                        return _buildCategoryItem(
                          category['name'],
                          category['count'],
                          category['icon'],
                        );
                      }).toList(),
                    ),
                  ),
                  
                  SizedBox(height: 24),
                  
                  // This Month Stats
                  _buildSectionTitle('This Month'),
                  SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppTheme.primaryColor, AppTheme.secondaryColor],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.calendar_today, color: Colors.white, size: 40),
                        SizedBox(height: 12),
                        Text(
                          reviewsThisMonth.toString(),
                          style: TextStyle(
                            fontSize: 36,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          'Reviews This Month',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white.withOpacity(0.9),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: AppTheme.textPrimary,
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRatingBar(int stars, int count) {
    final maxCount = ratingDistribution.values.reduce((a, b) => a > b ? a : b);
    final percentage = (count / maxCount * 100).toInt();
    
    return Padding(
      padding: EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Row(
            children: List.generate(
              stars,
              (index) => Icon(Icons.star, color: Colors.amber, size: 16),
            ),
          ),
          SizedBox(width: 8),
          Expanded(
            child: Stack(
              children: [
                Container(
                  height: 8,
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                FractionallySizedBox(
                  widthFactor: percentage / 100,
                  child: Container(
                    height: 8,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: 8),
          Text(
            count.toString(),
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStreakCard(String label, int days, IconData icon, Color color) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 32),
          SizedBox(height: 8),
          Text(
            '$days days',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: AppTheme.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryItem(String name, int count, IconData icon) {
    return Padding(
      padding: EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: AppTheme.primaryColor, size: 20),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              name,
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.textPrimary,
              ),
            ),
          ),
          Text(
            count.toString(),
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryColor,
            ),
          ),
        ],
      ),
    );
  }
}
