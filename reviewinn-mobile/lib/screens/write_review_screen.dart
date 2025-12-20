import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../config/app_theme.dart';
import '../models/entity_model.dart';
import '../providers/auth_provider.dart';
import '../providers/entity_provider.dart';
import '../services/api_service.dart';
import '../widgets/entity_card.dart';

class WriteReviewScreen extends StatefulWidget {
  final Entity? preselectedEntity;

  const WriteReviewScreen({
    super.key,
    this.preselectedEntity,
  });

  @override
  State<WriteReviewScreen> createState() => _WriteReviewScreenState();
}

class _WriteReviewScreenState extends State<WriteReviewScreen> {
  Entity? _selectedEntity;
  bool _showReviewForm = false;
  final TextEditingController _searchController = TextEditingController();
  List<Entity> _searchResults = [];
  List<Entity> _popularEntities = [];
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    if (widget.preselectedEntity != null) {
      _selectedEntity = widget.preselectedEntity;
      _showReviewForm = true;
    } else {
      _loadPopularEntities();
    }
  }

  Future<void> _loadPopularEntities() async {
    // Load some popular entities to show initially
    final entityProvider = Provider.of<EntityProvider>(context, listen: false);
    final entities = await entityProvider.searchEntities(''); // Empty query returns all
    setState(() {
      _popularEntities = entities.take(10).toList(); // Show first 10
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _performSearch(String query) async {
    if (query.trim().isEmpty) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    setState(() => _isSearching = true);

    final entityProvider = Provider.of<EntityProvider>(context, listen: false);
    final results = await entityProvider.searchEntities(query);

    setState(() {
      _searchResults = results;
      _isSearching = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppTheme.primaryPurple,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Write a Review',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: _showReviewForm && _selectedEntity != null
          ? ReviewFormWidget(
              entity: _selectedEntity!,
              onBack: () {
                if (widget.preselectedEntity != null) {
                  Navigator.pop(context);
                } else {
                  setState(() {
                    _showReviewForm = false;
                    _selectedEntity = null;
                  });
                }
              },
              onSubmitted: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Review submitted successfully!'),
                    backgroundColor: AppTheme.successGreen,
                  ),
                );
              },
            )
          : _buildEntitySearch(),
    );
  }

  Widget _buildEntitySearch() {
    return Column(
      children: [
        // Header Section
        Container(
          padding: const EdgeInsets.all(AppTheme.spaceXL),
          child: Column(
            children: [
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.primaryPurple.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.rate_review_rounded,
                  size: 48,
                  color: AppTheme.primaryPurple,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Who or what do you want to review?',
                style: AppTheme.headingMedium.copyWith(
                  color: AppTheme.textPrimary,
                  fontSize: 20,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              
              // Search Bar
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: (value) {
                    _performSearch(value);
                  },
                  decoration: InputDecoration(
                    hintText: 'Type a name, company, product, or place...',
                    hintStyle: AppTheme.bodyMedium.copyWith(
                      color: AppTheme.textTertiary,
                    ),
                    prefixIcon: Icon(
                      Icons.search,
                      color: AppTheme.primaryPurple,
                    ),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: Icon(
                              Icons.clear,
                              color: AppTheme.textTertiary,
                            ),
                            onPressed: () {
                              _searchController.clear();
                              _performSearch('');
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 16,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        // Search Results
        Expanded(
          child: _buildSearchResults(),
        ),
      ],
    );
  }

  Widget _buildSearchResults() {
    if (_isSearching) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              color: AppTheme.primaryPurple,
            ),
            const SizedBox(height: 16),
            Text(
              'Searching...',
              style: AppTheme.bodyMedium.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      );
    }

    if (_searchController.text.isEmpty) {
      // Show popular entities when search is empty
      if (_popularEntities.isEmpty) {
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(
                color: AppTheme.primaryPurple,
              ),
              const SizedBox(height: 16),
              Text(
                'Loading popular entities...',
                style: AppTheme.bodyMedium.copyWith(
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
          ),
        );
      }

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppTheme.spaceL,
              AppTheme.spaceM,
              AppTheme.spaceL,
              AppTheme.spaceS,
            ),
            child: Text(
              'Popular Entities',
              style: AppTheme.labelMedium.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(
                horizontal: AppTheme.spaceL,
                vertical: AppTheme.spaceM,
              ),
              itemCount: _popularEntities.length,
              itemBuilder: (context, index) {
                final entity = _popularEntities[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: AppTheme.spaceM),
                  child: EntityCard(
                    entity: entity,
                    onTap: () {
                      setState(() {
                        _selectedEntity = entity;
                        _showReviewForm = true;
                      });
                    },
                  ),
                );
              },
            ),
          ),
        ],
      );
    }

    if (_searchResults.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 64,
              color: AppTheme.textTertiary.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'No results found',
              style: AppTheme.bodyLarge.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try a different search term',
              style: AppTheme.bodyMedium.copyWith(
                color: AppTheme.textTertiary,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spaceL,
        vertical: AppTheme.spaceM,
      ),
      itemCount: _searchResults.length,
      itemBuilder: (context, index) {
        final entity = _searchResults[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: AppTheme.spaceM),
          child: EntityCard(
            entity: entity,
            onTap: () {
              setState(() {
                _selectedEntity = entity;
                _showReviewForm = true;
              });
            },
          ),
        );
      },
    );
  }
}

class ReviewFormWidget extends StatefulWidget {
  final Entity entity;
  final VoidCallback onBack;
  final VoidCallback onSubmitted;

  const ReviewFormWidget({
    super.key,
    required this.entity,
    required this.onBack,
    required this.onSubmitted,
  });

  @override
  State<ReviewFormWidget> createState() => _ReviewFormWidgetState();
}

class _ReviewFormWidgetState extends State<ReviewFormWidget> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  
  double _overallRating = 5.0;
  double _qualityRating = 5.0;
  double _reliabilityRating = 5.0;
  double _valueRating = 5.0;
  double _experienceRating = 5.0;
  double _integrityRating = 5.0;
  
  final List<String> _pros = [];
  final List<String> _cons = [];
  final TextEditingController _proController = TextEditingController();
  final TextEditingController _conController = TextEditingController();
  
  final List<File> _selectedImages = [];
  final ImagePicker _imagePicker = ImagePicker();
  static const int _maxImages = 5;
  
  bool _isAnonymous = false;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    _proController.dispose();
    _conController.dispose();
    super.dispose();
  }

  Future<void> _submitReview() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_contentController.text.trim().length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Review must be at least 10 characters'),
          backgroundColor: AppTheme.errorRed,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final apiService = ApiService();

      final reviewData = {
        'entity_id': widget.entity.entityId,
        'title': _titleController.text.trim(),
        'content': _contentController.text.trim(),
        'overall_rating': _overallRating,
        'quality_rating': _qualityRating,
        'reliability_rating': _reliabilityRating,
        'value_rating': _valueRating,
        'experience_rating': _experienceRating,
        'integrity_rating': _integrityRating,
        'pros': _pros,
        'cons': _cons,
        'is_anonymous': _isAnonymous,
        'ratings': {
          'quality': _qualityRating,
          'reliability': _reliabilityRating,
          'value': _valueRating,
          'experience': _experienceRating,
          'integrity': _integrityRating,
        },
      };

      await apiService.post(
        '/reviews/create',
        body: reviewData,
      );

      if (mounted) {
        widget.onSubmitted();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to submit review: $e'),
            backgroundColor: AppTheme.errorRed,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    
    return SingleChildScrollView(
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Entity Info Card
            Container(
              margin: const EdgeInsets.all(AppTheme.spaceL),
              padding: const EdgeInsets.all(AppTheme.spaceL),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: AppTheme.cardShadow,
              ),
              child: Row(
                children: [
                  if (widget.entity.avatar != null)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        widget.entity.avatar!,
                        width: 60,
                        height: 60,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            width: 60,
                            height: 60,
                            color: AppTheme.primaryPurple.withOpacity(0.1),
                            child: Icon(
                              Icons.business,
                              color: AppTheme.primaryPurple,
                            ),
                          );
                        },
                      ),
                    ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.entity.name,
                          style: AppTheme.labelMedium.copyWith(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (widget.entity.categoryName != null || 
                            widget.entity.finalCategoryName != null ||
                            widget.entity.rootCategoryName != null)
                          Text(
                            widget.entity.categoryName ?? 
                            widget.entity.finalCategoryName ?? 
                            widget.entity.rootCategoryName ?? '',
                            style: AppTheme.bodySmall.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                          ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: widget.onBack,
                  ),
                ],
              ),
            ),

            // User Info
            Container(
              margin: const EdgeInsets.symmetric(horizontal: AppTheme.spaceL),
              padding: const EdgeInsets.all(AppTheme.spaceM),
              decoration: BoxDecoration(
                color: AppTheme.primaryPurple.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundImage: authProvider.user?.avatar != null
                        ? NetworkImage(authProvider.user!.avatar!)
                        : null,
                    child: authProvider.user?.avatar == null
                        ? const Icon(Icons.person, size: 16)
                        : null,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    authProvider.user?.username ?? 'User',
                    style: AppTheme.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Review Title
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppTheme.spaceL),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Review Title',
                    style: AppTheme.labelMedium.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _titleController,
                    decoration: InputDecoration(
                      hintText: 'Summarize your experience',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: AppTheme.borderLight),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: AppTheme.borderLight),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: AppTheme.primaryPurple, width: 2),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Please enter a title';
                      }
                      return null;
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Overall Rating
            _buildRatingSection(
              'Overall Rating',
              _overallRating,
              (rating) => setState(() => _overallRating = rating),
              true,
            ),

            const SizedBox(height: 16),

            // Detailed Ratings
            _buildRatingSection(
              'Quality',
              _qualityRating,
              (rating) => setState(() => _qualityRating = rating),
              false,
            ),
            
            _buildRatingSection(
              'Reliability',
              _reliabilityRating,
              (rating) => setState(() => _reliabilityRating = rating),
              false,
            ),
            
            _buildRatingSection(
              'Value',
              _valueRating,
              (rating) => setState(() => _valueRating = rating),
              false,
            ),
            
            _buildRatingSection(
              'Experience',
              _experienceRating,
              (rating) => setState(() => _experienceRating = rating),
              false,
            ),
            
            _buildRatingSection(
              'Integrity',
              _integrityRating,
              (rating) => setState(() => _integrityRating = rating),
              false,
            ),

            const SizedBox(height: 24),

            // Review Content
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppTheme.spaceL),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Your Review',
                    style: AppTheme.labelMedium.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _contentController,
                    maxLines: 6,
                    decoration: InputDecoration(
                      hintText: 'Share your experience in detail...',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: AppTheme.borderLight),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: AppTheme.borderLight),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: AppTheme.primaryPurple, width: 2),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Please enter your review';
                      }
                      if (value.trim().length < 10) {
                        return 'Review must be at least 10 characters';
                      }
                      return null;
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Image Upload Section
            _buildImageSection(),

            const SizedBox(height: 24),

            // Pros
            _buildProsConsSection(
              'Pros',
              _pros,
              _proController,
              Icons.add_circle_outline,
              AppTheme.successGreen,
            ),

            const SizedBox(height: 16),

            // Cons
            _buildProsConsSection(
              'Cons',
              _cons,
              _conController,
              Icons.remove_circle_outline,
              AppTheme.errorRed,
            ),

            const SizedBox(height: 24),

            // Anonymous Toggle
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppTheme.spaceL),
              child: Container(
                padding: const EdgeInsets.all(AppTheme.spaceM),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.visibility_off_outlined,
                      color: AppTheme.textSecondary,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Post Anonymously',
                            style: AppTheme.labelMedium.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            'Your identity will be hidden',
                            style: AppTheme.bodySmall.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Switch(
                      value: _isAnonymous,
                      onChanged: (value) => setState(() => _isAnonymous = value),
                      activeColor: AppTheme.primaryPurple,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 32),

            // Submit Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppTheme.spaceL),
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitReview,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryPurple,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 2,
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Submit Review',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildRatingSection(
    String label,
    double rating,
    ValueChanged<double> onChanged,
    bool isLarge,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppTheme.spaceL),
      child: Container(
        padding: const EdgeInsets.all(AppTheme.spaceL),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isLarge ? AppTheme.primaryPurple : AppTheme.borderLight,
            width: isLarge ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: AppTheme.labelMedium.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: isLarge ? 18 : 16,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: List.generate(5, (index) {
                    return GestureDetector(
                      onTap: () => onChanged((index + 1).toDouble()),
                      child: Padding(
                        padding: const EdgeInsets.only(right: 4),
                        child: Icon(
                          index < rating.floor()
                              ? Icons.star_rounded
                              : Icons.star_border_rounded,
                          color: AppTheme.accentYellow,
                          size: isLarge ? 36 : 28,
                        ),
                      ),
                    );
                  }),
                ),
                Text(
                  '${rating.toStringAsFixed(1)}/5.0',
                  style: AppTheme.labelMedium.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryPurple,
                    fontSize: isLarge ? 18 : 16,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProsConsSection(
    String label,
    List<String> items,
    TextEditingController controller,
    IconData icon,
    Color color,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppTheme.spaceL),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: AppTheme.labelMedium.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(AppTheme.spaceM),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.borderLight),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: controller,
                        decoration: InputDecoration(
                          hintText: 'Add a ${label.toLowerCase()}...',
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.zero,
                        ),
                        onSubmitted: (value) {
                          if (value.trim().isNotEmpty) {
                            setState(() {
                              items.add(value.trim());
                              controller.clear();
                            });
                          }
                        },
                      ),
                    ),
                    IconButton(
                      icon: Icon(icon, color: color),
                      onPressed: () {
                        if (controller.text.trim().isNotEmpty) {
                          setState(() {
                            items.add(controller.text.trim());
                            controller.clear();
                          });
                        }
                      },
                    ),
                  ],
                ),
                if (items.isNotEmpty) ...[
                  const Divider(),
                  ...items.asMap().entries.map((entry) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          Icon(
                            Icons.check_circle,
                            size: 16,
                            color: color,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              entry.value,
                              style: AppTheme.bodyMedium,
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close, size: 18),
                            onPressed: () {
                              setState(() => items.removeAt(entry.key));
                            },
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _pickImages() async {
    if (_selectedImages.length >= _maxImages) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Maximum $_maxImages images allowed'),
          backgroundColor: AppTheme.errorRed,
        ),
      );
      return;
    }

    try {
      final List<XFile> images = await _imagePicker.pickMultiImage(
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );

      if (images.isNotEmpty) {
        final int availableSlots = _maxImages - _selectedImages.length;
        final List<XFile> imagesToAdd = images.take(availableSlots).toList();
        
        setState(() {
          _selectedImages.addAll(imagesToAdd.map((xfile) => File(xfile.path)));
        });

        if (images.length > availableSlots) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Only $availableSlots images added (maximum $_maxImages allowed)'),
              backgroundColor: AppTheme.warningOrange,
            ),
          );
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error picking images: $e'),
          backgroundColor: AppTheme.errorRed,
        ),
      );
    }
  }

  void _removeImage(int index) {
    setState(() {
      _selectedImages.removeAt(index);
    });
  }

  Widget _buildImageSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppTheme.spaceL),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.add_photo_alternate_outlined,
                color: AppTheme.primaryPurple,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Add Photos',
                style: AppTheme.labelMedium.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.primaryPurpleLight.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${_selectedImages.length}/$_maxImages',
                  style: AppTheme.bodySmall.copyWith(
                    color: AppTheme.primaryPurple,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Add up to $_maxImages photos to your review',
            style: AppTheme.bodySmall.copyWith(
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(AppTheme.spaceM),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.borderLight),
            ),
            child: Column(
              children: [
                // Add Photo Button
                if (_selectedImages.length < _maxImages)
                  InkWell(
                    onTap: _pickImages,
                    child: Container(
                      height: 120,
                      decoration: BoxDecoration(
                        color: AppTheme.primaryPurpleLight.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: AppTheme.primaryPurple.withOpacity(0.3),
                          width: 2,
                          style: BorderStyle.solid,
                        ),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.add_a_photo_outlined,
                              size: 40,
                              color: AppTheme.primaryPurple,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Tap to add photos',
                              style: AppTheme.bodyMedium.copyWith(
                                color: AppTheme.primaryPurple,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              '${_maxImages - _selectedImages.length} remaining',
                              style: AppTheme.bodySmall.copyWith(
                                color: AppTheme.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                
                // Selected Images Grid
                if (_selectedImages.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                      childAspectRatio: 1,
                    ),
                    itemCount: _selectedImages.length,
                    itemBuilder: (context, index) {
                      return Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.file(
                              _selectedImages[index],
                              fit: BoxFit.cover,
                              width: double.infinity,
                              height: double.infinity,
                            ),
                          ),
                          Positioned(
                            top: 4,
                            right: 4,
                            child: GestureDetector(
                              onTap: () => _removeImage(index),
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.6),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.close,
                                  size: 16,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
