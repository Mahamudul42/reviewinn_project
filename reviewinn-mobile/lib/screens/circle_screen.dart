import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../providers/auth_provider.dart';
import '../models/circle_models.dart';
import '../services/mock_circle_service.dart';
import '../widgets/user_display.dart';
import '../widgets/common/empty_state.dart';
import '../widgets/common/loading_indicator.dart';
import '../widgets/common/error_view.dart';
import '../utils/formatters/date_formatter.dart';

class CircleScreen extends StatefulWidget {
  const CircleScreen({super.key});

  @override
  State<CircleScreen> createState() => _CircleScreenState();
}

class _CircleScreenState extends State<CircleScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final MockCircleService _circleService = MockCircleService();

  // Data

  List<CircleMember> _members = [];
  List<CircleInvite> _invites = [];
  List<CircleRequest> _sentRequests = [];
  List<CircleSuggestion> _suggestions = [];

  // Search controllers
  final TextEditingController _memberSearchController = TextEditingController();
  String _memberSearchQuery = '';
  final TextEditingController _suggestionSearchController = TextEditingController();
  String _suggestionSearchQuery = '';

  bool _isLoading = true;
  String? _error;

  // Menu states
  final Map<String, bool> _openMenus = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _memberSearchController.dispose();
    _suggestionSearchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      // Using mock service - no token needed
      final results = await Future.wait([
        _circleService.getMembers('mock_token'),
        _circleService.getInvites('mock_token'),
        _circleService.getSentRequests('mock_token'),
        _circleService.getSuggestions('mock_token'),
      ]);

      setState(() {
        _members = results[0] as List<CircleMember>;
        _invites = results[1] as List<CircleInvite>;
        _sentRequests = results[2] as List<CircleRequest>;
        _suggestions = results[3] as List<CircleSuggestion>;
        _isLoading = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Failed to load circle data';
      });
    }
  }

  void _toggleMenu(String id) {
    setState(() {
      if (_openMenus[id] == true) {
        _openMenus.remove(id);
      } else {
        _openMenus.clear();
        _openMenus[id] = true;
      }
    });
  }

  Future<void> _updateTrustLevel(
    String connectionId,
    TrustLevel trustLevel,
    String userName,
  ) async {
    final success = await _circleService.updateTrustLevel(
        'mock_token', connectionId, trustLevel);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Updated trust level for $userName'),
          backgroundColor: AppTheme.successGreen,
        ),
      );
      _loadData();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to update trust level'),
          backgroundColor: AppTheme.errorRed,
        ),
      );
    }
  }

  Future<void> _removeMember(String connectionId, String userName) async {
    final success = await _circleService.removeMember('mock_token', connectionId);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Removed $userName from circle'),
          backgroundColor: AppTheme.successGreen,
        ),
      );
      _loadData();
    }
  }

  Future<void> _blockUser(String userId, String userName) async {
    final success = await _circleService.blockUser('mock_token', userId);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Blocked $userName'),
          backgroundColor: AppTheme.successGreen,
        ),
      );
      _loadData();
    }
  }

  Future<void> _acceptInvite(CircleInvite invite) async {
    final success = await _circleService.acceptInvite('mock_token', invite.inviteId);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Accepted invite from ${invite.sender.name}'),
          backgroundColor: AppTheme.successGreen,
        ),
      );
      _loadData();
    }
  }

  Future<void> _rejectInvite(CircleInvite invite) async {
    final success = await _circleService.rejectInvite('mock_token', invite.inviteId);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Rejected invite from ${invite.sender.name}'),
        ),
      );
      _loadData();
    }
  }

  Future<void> _cancelRequest(CircleRequest request) async {
    final success = await _circleService.cancelRequest('mock_token', request.requestId);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Cancelled request to ${request.user.name}'),
        ),
      );
      _loadData();
    }
  }

  Future<void> _sendRequest(CircleSuggestion suggestion) async {
    final success = await _circleService.sendRequest(
      'mock_token',
      suggestion.user.id,
      'I would like to connect!',
    );

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Sent request to ${suggestion.user.name}'),
          backgroundColor: AppTheme.successGreen,
        ),
      );
      _loadData();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFF9F7FF),
              Color(0xFFFFFFFF),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              _buildHeader(),

              // Tab Bar
              _buildTabBar(),

              // Content
              Expanded(
                child: _isLoading
                    ? const LoadingIndicator()
                    : _error != null
                        ? ErrorView(message: _error, onRetry: _loadData)
                        : TabBarView(
                            controller: _tabController,
                            children: [
                              _buildMembersTab(),
                              _buildInvitesTab(),
                              _buildSentRequestsTab(),
                              _buildSuggestionsTab(),
                            ],
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spaceL),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(
            color: AppTheme.primaryPurple.withOpacity(0.1),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppTheme.primaryPurple,
                  AppTheme.primaryPurple.withOpacity(0.8),
                ],
              ),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryPurple.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(
              Icons.people_rounded,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Circle Dashboard',
                  style: AppTheme.headingMedium.copyWith(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.primaryPurple,
                  ),
                ),
                Text(
                  'Manage your review connections',
                  style: AppTheme.bodySmall.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(
            color: AppTheme.borderLight,
            width: 1,
          ),
        ),
      ),
      child: TabBar(
        controller: _tabController,
        labelColor: AppTheme.primaryPurple,
        unselectedLabelColor: AppTheme.textSecondary,
        indicatorColor: AppTheme.primaryPurple,
        indicatorWeight: 3,
        labelStyle: AppTheme.labelMedium.copyWith(
          fontWeight: FontWeight.w700,
          fontSize: 13,
        ),
        unselectedLabelStyle: AppTheme.labelMedium.copyWith(
          fontSize: 13,
        ),
        tabs: [
          Tab(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Members'),
                if (_members.isNotEmpty) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryPurple.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '${_members.length}',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryPurple,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          Tab(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Invites'),
                if (_invites.isNotEmpty) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.errorRed.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '${_invites.length}',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.errorRed,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          Tab(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Sent'),
                if (_sentRequests.isNotEmpty) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.accentYellow.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '${_sentRequests.length}',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.accentYellowDark,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const Tab(text: 'Suggestions'),
        ],
      ),
    );
  }

  Widget _buildMembersTab() {
    final filteredMembers = _memberSearchQuery.isEmpty
        ? _members
        : _members.where((m) => m.user.name.toLowerCase().contains(_memberSearchQuery.toLowerCase())).toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
          child: TextField(
            controller: _memberSearchController,
            onChanged: (value) => setState(() => _memberSearchQuery = value),
            decoration: InputDecoration(
              hintText: 'Search friends...',
              prefixIcon: Icon(Icons.search, color: AppTheme.primaryPurple),
              filled: true,
              fillColor: AppTheme.primaryPurple.withOpacity(0.06),
              contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(30),
                borderSide: BorderSide.none,
              ),
            ),
          ),
        ),
        Expanded(
          child: filteredMembers.isEmpty
              ? const EmptyState(
                  icon: Icons.people_outline,
                  title: 'No Circle Members Yet',
                  description: 'Your review circle is ready to grow! Start building your trusted network.',
                )
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(AppTheme.spaceL),
                    itemCount: filteredMembers.length,
                    itemBuilder: (context, index) {
                      final member = filteredMembers[index];
                      return _buildMemberCard(member);
                    },
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildMemberCard(CircleMember member) {
    final isMenuOpen = _openMenus[member.connectionId] == true;

    return Container(
      margin: const EdgeInsets.only(bottom: AppTheme.spaceM),
      padding: const EdgeInsets.all(AppTheme.spaceM),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white,
            AppTheme.primaryPurple.withOpacity(0.02),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.primaryPurple.withOpacity(0.15),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryPurple.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          UserDisplay(
            user: member.user,
            avatarSize: 48,
            badge: _buildTrustLevelBadge(member.trustLevel),
            actions: IconButton(
              onPressed: () => _toggleMenu(member.connectionId),
              icon: Icon(
                Icons.more_vert,
                color: AppTheme.primaryPurple,
              ),
              style: IconButton.styleFrom(
                backgroundColor: AppTheme.primaryPurple.withOpacity(0.1),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildMetric(
                '${member.tasteMatchScore.toStringAsFixed(1)}%',
                'Taste Match',
                _getTasteMatchColor(member.tasteMatchScore),
              ),
              const SizedBox(width: 16),
              _buildMetric(
                '${member.interactionCount}',
                'Interactions',
                AppTheme.infoBlue,
              ),
            ],
          ),
          if (isMenuOpen) ...[
            const SizedBox(height: 12),
            _buildMemberMenu(member),
          ],
        ],
      ),
    );
  }

  Widget _buildTrustLevelBadge(TrustLevel trustLevel) {
    Color color;
    switch (trustLevel) {
      case TrustLevel.reviewer:
        color = AppTheme.infoBlue;
        break;
      case TrustLevel.trustedReviewer:
        color = AppTheme.successGreen;
        break;
      case TrustLevel.reviewAlly:
        color = AppTheme.primaryPurple;
        break;
      case TrustLevel.reviewMentor:
        color = AppTheme.accentYellow;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Text(
        trustLevel.displayName,
        style: AppTheme.labelSmall.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 11,
        ),
      ),
    );
  }

  Widget _buildMetric(String value, String label, Color color) {
    return Row(
      children: [
        Text(
          value,
          style: AppTheme.labelMedium.copyWith(
            color: color,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: AppTheme.bodySmall.copyWith(
            color: AppTheme.textSecondary,
          ),
        ),
      ],
    );
  }

  Color _getTasteMatchColor(double score) {
    if (score >= 80) return AppTheme.successGreen;
    if (score >= 60) return AppTheme.infoBlue;
    if (score >= 40) return AppTheme.accentYellow;
    return AppTheme.textTertiary;
  }

  Widget _buildMemberMenu(CircleMember member) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.backgroundLight.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppTheme.borderLight,
          width: 1,
        ),
      ),
      child: Column(
        children: [
          _buildMenuSection('Trust Level'),
          _buildMenuItem(
            'Reviewer',
            Icons.visibility,
            () => _updateTrustLevel(
              member.connectionId,
              TrustLevel.reviewer,
              member.user.name,
            ),
            member.trustLevel == TrustLevel.reviewer,
          ),
          _buildMenuItem(
            'Trusted Reviewer',
            Icons.shield,
            () => _updateTrustLevel(
              member.connectionId,
              TrustLevel.trustedReviewer,
              member.user.name,
            ),
            member.trustLevel == TrustLevel.trustedReviewer,
          ),
          _buildMenuItem(
            'Review Ally',
            Icons.people,
            () => _updateTrustLevel(
              member.connectionId,
              TrustLevel.reviewAlly,
              member.user.name,
            ),
            member.trustLevel == TrustLevel.reviewAlly,
          ),
          _buildMenuItem(
            'Review Mentor',
            Icons.trending_up,
            () => _updateTrustLevel(
              member.connectionId,
              TrustLevel.reviewMentor,
              member.user.name,
            ),
            member.trustLevel == TrustLevel.reviewMentor,
          ),
          Divider(color: AppTheme.borderLight, height: 1),
          _buildMenuSection('Actions'),
          _buildMenuItem(
            'Remove from Circle',
            Icons.person_remove,
            () => _removeMember(member.connectionId, member.user.name),
            false,
            color: AppTheme.errorRed,
          ),
          _buildMenuItem(
            'Block User',
            Icons.block,
            () => _blockUser(member.user.id, member.user.name),
            false,
            color: AppTheme.errorRed,
          ),
        ],
      ),
    );
  }

  Widget _buildMenuSection(String title) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      width: double.infinity,
      child: Text(
        title,
        style: AppTheme.labelSmall.copyWith(
          color: AppTheme.primaryPurple,
          fontWeight: FontWeight.w700,
          fontSize: 10,
        ),
      ),
    );
  }

  Widget _buildMenuItem(
    String label,
    IconData icon,
    VoidCallback onTap,
    bool isSelected, {
    Color? color,
  }) {
    final itemColor = color ?? AppTheme.textPrimary;

    return InkWell(
      onTap: () {
        onTap();
        setState(() => _openMenus.clear());
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        color: isSelected
            ? AppTheme.primaryPurple.withOpacity(0.1)
            : Colors.transparent,
        child: Row(
          children: [
            Icon(icon, size: 16, color: itemColor),
            const SizedBox(width: 8),
            Text(
              label,
              style: AppTheme.bodyMedium.copyWith(
                color: itemColor,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInvitesTab() {
    if (_invites.isEmpty) {
      return const EmptyState(
        icon: Icons.mail_outline,
        title: 'No Pending Invites',
        description: 'You don\'t have any circle invitations at the moment.',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.all(AppTheme.spaceL),
        itemCount: _invites.length,
        itemBuilder: (context, index) {
          final invite = _invites[index];
          return _buildInviteCard(invite);
        },
      ),
    );
  }

  Widget _buildInviteCard(CircleInvite invite) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppTheme.spaceM),
      padding: const EdgeInsets.all(AppTheme.spaceM),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.primaryPurple.withOpacity(0.15),
          width: 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          UserDisplay(
            user: invite.sender,
            subtitle: DateFormatter.smartDate(invite.createdAt),
            avatarSize: 48,
          ),
          if (invite.message.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.backgroundLight,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                invite.message,
                style: AppTheme.bodyMedium.copyWith(
                  color: AppTheme.textSecondary,
                ),
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () => _acceptInvite(invite),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.successGreen,
                    foregroundColor: Colors.white,
                  ),
                  child: Text('Accept'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _rejectInvite(invite),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.errorRed,
                    side: BorderSide(color: AppTheme.errorRed),
                  ),
                  child: Text('Decline'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSentRequestsTab() {
    if (_sentRequests.isEmpty) {
      return const EmptyState(
        icon: Icons.send_outlined,
        title: 'No Sent Requests',
        description: 'You haven\'t sent any connection requests yet.',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.all(AppTheme.spaceL),
        itemCount: _sentRequests.length,
        itemBuilder: (context, index) {
          final request = _sentRequests[index];
          return _buildRequestCard(request);
        },
      ),
    );
  }

  Widget _buildRequestCard(CircleRequest request) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppTheme.spaceM),
      padding: const EdgeInsets.all(AppTheme.spaceM),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.primaryPurple.withOpacity(0.15),
          width: 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          UserDisplay(
            user: request.user,
            subtitle: DateFormatter.smartDate(request.createdAt),
            badge: _buildStatusBadge(request.status),
            avatarSize: 48,
          ),
          if (request.status == RequestStatus.pending) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => _cancelRequest(request),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.errorRed,
                  side: BorderSide(color: AppTheme.errorRed),
                ),
                child: Text('Cancel Request'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatusBadge(RequestStatus status) {
    Color color;
    String label;

    switch (status) {
      case RequestStatus.pending:
        color = AppTheme.accentYellow;
        label = 'Pending';
        break;
      case RequestStatus.accepted:
        color = AppTheme.successGreen;
        label = 'Accepted';
        break;
      case RequestStatus.rejected:
        color = AppTheme.errorRed;
        label = 'Rejected';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: AppTheme.labelSmall.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildSuggestionsTab() {
    final filteredSuggestions = _suggestionSearchQuery.isEmpty
        ? _suggestions
        : _suggestions.where((s) =>
            s.user.name.toLowerCase().contains(_suggestionSearchQuery.toLowerCase()) ||
            s.reason.toLowerCase().contains(_suggestionSearchQuery.toLowerCase())
          ).toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
          child: TextField(
            controller: _suggestionSearchController,
            onChanged: (value) => setState(() => _suggestionSearchQuery = value),
            decoration: InputDecoration(
              hintText: 'Search suggestions...',
              prefixIcon: Icon(Icons.search, color: AppTheme.successGreen),
              filled: true,
              fillColor: AppTheme.successGreen.withOpacity(0.07),
              contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(30),
                borderSide: BorderSide.none,
              ),
            ),
          ),
        ),
        Expanded(
          child: filteredSuggestions.isEmpty
              ? const EmptyState(
                  icon: Icons.lightbulb_outline,
                  title: 'No Suggestions',
                  description: 'We\'ll suggest people you might want to connect with.',
                )
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(AppTheme.spaceL),
                    itemCount: filteredSuggestions.length,
                    itemBuilder: (context, index) {
                      final suggestion = filteredSuggestions[index];
                      return _buildSuggestionCard(suggestion);
                    },
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildSuggestionCard(CircleSuggestion suggestion) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppTheme.spaceM),
      padding: const EdgeInsets.all(AppTheme.spaceM),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white,
            AppTheme.successGreen.withOpacity(0.02),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.successGreen.withOpacity(0.15),
          width: 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          UserDisplay(
            user: suggestion.user,
            subtitle: suggestion.reason,
            avatarSize: 48,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              if (suggestion.mutualFriends > 0)
                _buildMetric(
                  '${suggestion.mutualFriends}',
                  'Mutual',
                  AppTheme.primaryPurple,
                ),
              const SizedBox(width: 16),
              _buildMetric(
                '${suggestion.tasteMatchScore.toStringAsFixed(1)}%',
                'Match',
                _getTasteMatchColor(suggestion.tasteMatchScore),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => _sendRequest(suggestion),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryPurple,
                foregroundColor: Colors.white,
              ),
              child: Text('Send Request'),
            ),
          ),
        ],
      ),
    );
  }

}
