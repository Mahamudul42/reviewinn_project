import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/bookmark_provider.dart';
import '../config/app_theme.dart';
import '../widgets/beautiful_review_card.dart';
import '../widgets/entity_card.dart';
import 'entity_detail_screen.dart';

class BookmarksScreen extends StatefulWidget {
  const BookmarksScreen({super.key});

  @override
  State<BookmarksScreen> createState() => _BookmarksScreenState();
}

class _BookmarksScreenState extends State<BookmarksScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Bookmarks'),
        backgroundColor: AppTheme.primaryPurple,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white.withOpacity(0.7),
          tabs: [
            Tab(
              icon: Icon(Icons.rate_review),
              text: 'Reviews',
            ),
            Tab(
              icon: Icon(Icons.business),
              text: 'Entities',
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildReviewsTab(),
          _buildEntitiesTab(),
        ],
      ),
    );
  }

  Widget _buildReviewsTab() {
    return Consumer<BookmarkProvider>(
      builder: (context, bookmarkProvider, child) {
        final bookmarkedReviews = bookmarkProvider.bookmarkedReviews;

        if (bookmarkedReviews.isEmpty) {
          return _buildEmptyState(
            icon: Icons.bookmark_border,
            title: 'No Bookmarked Reviews',
            subtitle: 'Save reviews to read them later',
          );
        }

        return ListView.builder(
          padding: EdgeInsets.all(16),
          itemCount: bookmarkedReviews.length,
          itemBuilder: (context, index) {
            final review = bookmarkedReviews[index];
            return Padding(
              padding: EdgeInsets.only(bottom: 16),
              child: BeautifulReviewCard(
                review: review,
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildEntitiesTab() {
    return Consumer<BookmarkProvider>(
      builder: (context, bookmarkProvider, child) {
        final bookmarkedEntities = bookmarkProvider.bookmarkedEntities;

        if (bookmarkedEntities.isEmpty) {
          return _buildEmptyState(
            icon: Icons.bookmark_border,
            title: 'No Bookmarked Entities',
            subtitle: 'Save businesses and places to visit them later',
          );
        }

        return ListView.builder(
          padding: EdgeInsets.all(16),
          itemCount: bookmarkedEntities.length,
          itemBuilder: (context, index) {
            final entity = bookmarkedEntities[index];
            return Padding(
              padding: EdgeInsets.only(bottom: 16),
              child: EntityCard(
                entity: entity,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => EntityDetailScreen(
                        entityId: entity.entityId,
                      ),
                    ),
                  );
                },
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: AppTheme.primaryPurple.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 60,
                color: AppTheme.primaryPurple.withOpacity(0.5),
              ),
            ),
            SizedBox(height: 24),
            Text(
              title,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade800,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 8),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(context);
              },
              icon: Icon(Icons.explore),
              label: Text('Explore Now'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryPurple,
                foregroundColor: Colors.white,
                padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(25),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
