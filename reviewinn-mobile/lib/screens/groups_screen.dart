import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../providers/auth_provider.dart';
import 'create_group_screen.dart';
import 'login_screen.dart';
import 'group_detail_screen.dart';

class GroupsScreen extends StatefulWidget {
  const GroupsScreen({super.key});

  @override
  State<GroupsScreen> createState() => _GroupsScreenState();
}

class _GroupsScreenState extends State<GroupsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  final List<Group> _mockGroups = [
    Group(
      id: 1,
      name: 'Tech Enthusiasts Bangladesh',
      description: 'A community for tech lovers, developers, and innovators in Bangladesh',
      memberCount: 12500,
      postCount: 3420,
      avatar: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=400',
      category: 'Technology',
      isJoined: true,
    ),
    Group(
      id: 2,
      name: 'University Reviews & Admissions',
      description: 'Share and discover reviews about universities in Bangladesh',
      memberCount: 8900,
      postCount: 2150,
      avatar: 'https://images.unsplash.com/photo-1523050854058-8df90110c9d1?q=80&w=400',
      category: 'Education',
      isJoined: true,
    ),
    Group(
      id: 3,
      name: 'Product Reviews BD',
      description: 'Honest reviews and discussions about products available in Bangladesh',
      memberCount: 15200,
      postCount: 5680,
      avatar: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400',
      category: 'Products',
      isJoined: false,
    ),
    Group(
      id: 4,
      name: 'Food Lovers Dhaka',
      description: 'Discover and review the best restaurants and food in Dhaka',
      memberCount: 21000,
      postCount: 8900,
      avatar: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400',
      category: 'Food & Dining',
      isJoined: false,
    ),
    Group(
      id: 5,
      name: 'Startup Community Bangladesh',
      description: 'Connect with entrepreneurs and discuss startup ideas',
      memberCount: 6700,
      postCount: 1890,
      avatar: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=400',
      category: 'Business',
      isJoined: true,
    ),
  ];

  String _selectedTab = 'My Groups';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Group> _filterGroups(List<Group> groups) {
    if (_searchQuery.isEmpty) return groups;
    return groups.where((group) {
      return group.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
             group.description.toLowerCase().contains(_searchQuery.toLowerCase()) ||
             group.category.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final myGroups = _filterGroups(_mockGroups.where((g) => g.isJoined).toList());
    final discoverGroups = _filterGroups(_mockGroups.where((g) => !g.isJoined).toList());

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // App Bar
            SliverAppBar(
              floating: true,
              snap: true,
              backgroundColor: Colors.white,
              elevation: 0,
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.successGreen.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.groups_rounded,
                      color: AppTheme.successGreen,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Groups',
                    style: AppTheme.headingMedium.copyWith(
                      fontSize: 22,
                    ),
                  ),
                ],
              ),
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(1),
                child: Container(
                  color: AppTheme.borderLight,
                  height: 1,
                ),
              ),
            ),

            // Search bar
            SliverToBoxAdapter(
              child: Container(
                color: Colors.white,
                padding: const EdgeInsets.fromLTRB(
                  AppTheme.spaceL,
                  AppTheme.spaceM,
                  AppTheme.spaceL,
                  0,
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: (value) {
                    setState(() {
                      _searchQuery = value;
                    });
                  },
                  decoration: InputDecoration(
                    hintText: 'Search groups...',
                    prefixIcon: Icon(
                      Icons.search,
                      color: AppTheme.textTertiary,
                    ),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: Icon(
                              Icons.clear,
                              color: AppTheme.textTertiary,
                            ),
                            onPressed: () {
                              setState(() {
                                _searchController.clear();
                                _searchQuery = '';
                              });
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: AppTheme.backgroundLight,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: AppTheme.spaceL,
                      vertical: AppTheme.spaceM,
                    ),
                  ),
                ),
              ),
            ),

            // Tab selector
            SliverToBoxAdapter(
              child: Container(
                color: Colors.white,
                padding: const EdgeInsets.fromLTRB(
                  AppTheme.spaceL,
                  AppTheme.spaceM,
                  AppTheme.spaceL,
                  AppTheme.spaceM,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: _buildTab('My Groups', myGroups.length),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildTab('Discover', discoverGroups.length),
                    ),
                  ],
                ),
              ),
            ),

            // Groups List
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(
                AppTheme.spaceL,
                AppTheme.spaceM,
                AppTheme.spaceL,
                AppTheme.spaceL,
              ),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final groups = _selectedTab == 'My Groups' ? myGroups : discoverGroups;
                    if (groups.isEmpty) {
                      return _buildEmptyState();
                    }
                    final group = groups[index];
                    return _GroupCard(
                      group: group,
                      onTap: () {
                        // Navigate to group detail
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => GroupDetailScreen(
                              groupId: group.id,
                              groupName: group.name,
                              groupDescription: group.description,
                              groupAvatar: group.avatar,
                              groupCategory: group.category,
                              memberCount: group.memberCount,
                              postCount: group.postCount,
                            ),
                          ),
                        );
                      },
                      onJoinToggle: () {
                        setState(() {
                          group.isJoined = !group.isJoined;
                        });
                      },
                    );
                  },
                  childCount: _selectedTab == 'My Groups'
                      ? (myGroups.isEmpty ? 1 : myGroups.length)
                      : (discoverGroups.isEmpty ? 1 : discoverGroups.length),
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          final authProvider = Provider.of<AuthProvider>(context, listen: false);
          if (!authProvider.isAuthenticated) {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const LoginScreen()),
            );
            return;
          }

          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const CreateGroupScreen(),
            ),
          );
        },
        backgroundColor: AppTheme.successGreen,
        foregroundColor: Colors.white,
        icon: Icon(Icons.add),
        label: Text(
          'Create Group',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 15,
          ),
        ),
        elevation: 4,
      ),
    );
  }

  Widget _buildTab(String label, int count) {
    final isSelected = _selectedTab == label;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedTab = label;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(
          vertical: 12,
          horizontal: 16,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.successGreen.withOpacity(0.15)
              : AppTheme.backgroundLight,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? AppTheme.successGreen.withOpacity(0.3)
                : Colors.transparent,
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label,
              style: AppTheme.labelMedium.copyWith(
                color: isSelected ? AppTheme.successGreen : AppTheme.textSecondary,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppTheme.successGreen
                    : AppTheme.textTertiary.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: isSelected ? Colors.white : AppTheme.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spaceXXL),
        child: Column(
          children: [
            const SizedBox(height: 40),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.successGreen.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _selectedTab == 'My Groups'
                    ? Icons.groups_outlined
                    : Icons.explore_outlined,
                size: 64,
                color: AppTheme.successGreen.withOpacity(0.6),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              _selectedTab == 'My Groups'
                  ? 'No groups yet'
                  : 'Discover new groups',
              style: AppTheme.headingMedium,
            ),
            const SizedBox(height: 8),
            Text(
              _selectedTab == 'My Groups'
                  ? 'Join groups to connect with communities'
                  : 'Explore groups that match your interests',
              style: AppTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _GroupCard extends StatefulWidget {
  final Group group;
  final VoidCallback onTap;
  final VoidCallback onJoinToggle;

  const _GroupCard({
    required this.group,
    required this.onTap,
    required this.onJoinToggle,
  });

  @override
  State<_GroupCard> createState() => _GroupCardState();
}

class _GroupCardState extends State<_GroupCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: AppTheme.spaceL),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.white,
              _isHovered ? Colors.grey.shade50 : Colors.white,
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: _isHovered
                ? AppTheme.successGreen.withOpacity(0.4)
                : AppTheme.successGreen.withOpacity(0.15),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: AppTheme.successGreen.withOpacity(_isHovered ? 0.12 : 0.06),
              blurRadius: _isHovered ? 20 : 12,
              offset: Offset(0, _isHovered ? 8 : 4),
              spreadRadius: 0,
            ),
            BoxShadow(
              color: Colors.black.withOpacity(_isHovered ? 0.06 : 0.03),
              blurRadius: _isHovered ? 12 : 8,
              offset: Offset(0, _isHovered ? 4 : 2),
              spreadRadius: 0,
            ),
          ],
        ),
        child: InkWell(
          onTap: widget.onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(AppTheme.spaceL),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    // Group Image
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: CachedNetworkImage(
                          imageUrl: widget.group.avatar,
                          width: 80,
                          height: 80,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(
                            width: 80,
                            height: 80,
                            color: AppTheme.backgroundLight,
                            child: Center(
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppTheme.successGreen,
                              ),
                            ),
                          ),
                          errorWidget: (context, url, error) => Container(
                            width: 80,
                            height: 80,
                            color: AppTheme.backgroundLight,
                            child: Icon(
                              Icons.groups_rounded,
                              size: 40,
                              color: AppTheme.textTertiary,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: AppTheme.spaceL),

                    // Group Info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.group.name,
                            style: AppTheme.headingSmall.copyWith(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.successGreen.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              widget.group.category,
                              style: AppTheme.labelSmall.copyWith(
                                color: AppTheme.successGreen,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Join Button
                    Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: widget.onJoinToggle,
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: widget.group.isJoined
                                ? AppTheme.backgroundLight
                                : AppTheme.successGreen,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: widget.group.isJoined
                                  ? AppTheme.borderLight
                                  : AppTheme.successGreen,
                              width: 1,
                            ),
                          ),
                          child: Text(
                            widget.group.isJoined ? 'Joined' : 'Join',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: widget.group.isJoined
                                  ? AppTheme.textSecondary
                                  : Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: AppTheme.spaceM),

                // Description
                Text(
                  widget.group.description,
                  style: AppTheme.bodyMedium.copyWith(
                    color: AppTheme.textSecondary,
                    height: 1.4,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),

                const SizedBox(height: AppTheme.spaceM),

                // Stats
                Row(
                  children: [
                    _buildStat(
                      Icons.people_outline,
                      '${_formatNumber(widget.group.memberCount)} members',
                    ),
                    const SizedBox(width: AppTheme.spaceL),
                    _buildStat(
                      Icons.article_outlined,
                      '${_formatNumber(widget.group.postCount)} posts',
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStat(IconData icon, String text) {
    return Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: AppTheme.textTertiary,
        ),
        const SizedBox(width: 4),
        Text(
          text,
          style: AppTheme.bodySmall.copyWith(
            color: AppTheme.textSecondary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}k';
    }
    return number.toString();
  }
}

class Group {
  final int id;
  final String name;
  final String description;
  final int memberCount;
  final int postCount;
  final String avatar;
  final String category;
  bool isJoined;

  Group({
    required this.id,
    required this.name,
    required this.description,
    required this.memberCount,
    required this.postCount,
    required this.avatar,
    required this.category,
    required this.isJoined,
  });
}
