import 'package:flutter/material.dart';
import '../config/app_theme.dart';

enum ReviewSortOption {
  newest,
  oldest,
  mostHelpful,
  highestRating,
  lowestRating,
}

enum ReviewFilterRating {
  all,
  fiveStar,
  fourStar,
  threeStar,
  twoStar,
  oneStar,
}

class FilterSortBottomSheet extends StatefulWidget {
  final ReviewSortOption currentSort;
  final ReviewFilterRating currentFilter;
  final bool showVerifiedOnly;
  final bool showWithPhotosOnly;

  FilterSortBottomSheet({
    required this.currentSort,
    required this.currentFilter,
    this.showVerifiedOnly = false,
    this.showWithPhotosOnly = false,
  });

  @override
  _FilterSortBottomSheetState createState() => _FilterSortBottomSheetState();
}

class _FilterSortBottomSheetState extends State<FilterSortBottomSheet> {
  late ReviewSortOption _selectedSort;
  late ReviewFilterRating _selectedFilter;
  late bool _showVerifiedOnly;
  late bool _showWithPhotosOnly;

  @override
  void initState() {
    super.initState();
    _selectedSort = widget.currentSort;
    _selectedFilter = widget.currentFilter;
    _showVerifiedOnly = widget.showVerifiedOnly;
    _showWithPhotosOnly = widget.showWithPhotosOnly;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.backgroundLight,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Filter & Sort',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              TextButton(
                onPressed: () {
                  setState(() {
                    _selectedSort = ReviewSortOption.newest;
                    _selectedFilter = ReviewFilterRating.all;
                    _showVerifiedOnly = false;
                    _showWithPhotosOnly = false;
                  });
                },
                child: Text('Reset', style: TextStyle(color: AppTheme.primaryPurple)),
              ),
            ],
          ),
          SizedBox(height: 20),
          
          // Sort Options
          Text(
            'Sort By',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          SizedBox(height: 12),
          _buildSortOption('Newest First', ReviewSortOption.newest, Icons.access_time),
          _buildSortOption('Oldest First', ReviewSortOption.oldest, Icons.history),
          _buildSortOption('Most Helpful', ReviewSortOption.mostHelpful, Icons.thumb_up),
          _buildSortOption('Highest Rating', ReviewSortOption.highestRating, Icons.star),
          _buildSortOption('Lowest Rating', ReviewSortOption.lowestRating, Icons.star_border),
          
          SizedBox(height: 20),
          Divider(),
          SizedBox(height: 20),
          
          // Filter by Rating
          Text(
            'Filter by Rating',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          SizedBox(height: 12),
          _buildFilterOption('All Ratings', ReviewFilterRating.all, null),
          _buildFilterOption('5 Stars', ReviewFilterRating.fiveStar, 5),
          _buildFilterOption('4 Stars', ReviewFilterRating.fourStar, 4),
          _buildFilterOption('3 Stars', ReviewFilterRating.threeStar, 3),
          _buildFilterOption('2 Stars', ReviewFilterRating.twoStar, 2),
          _buildFilterOption('1 Star', ReviewFilterRating.oneStar, 1),
          
          SizedBox(height: 20),
          Divider(),
          SizedBox(height: 20),
          
          // Additional Filters
          Text(
            'Additional Filters',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          SizedBox(height: 12),
          _buildCheckboxOption(
            'Verified Purchases Only',
            _showVerifiedOnly,
            (value) => setState(() => _showVerifiedOnly = value!),
          ),
          _buildCheckboxOption(
            'With Photos Only',
            _showWithPhotosOnly,
            (value) => setState(() => _showWithPhotosOnly = value!),
          ),
          
          SizedBox(height: 20),
          
          // Apply Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context, {
                  'sort': _selectedSort,
                  'filter': _selectedFilter,
                  'verifiedOnly': _showVerifiedOnly,
                  'photosOnly': _showWithPhotosOnly,
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryPurple,
                padding: EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                'Apply Filters',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSortOption(String label, ReviewSortOption option, IconData icon) {
    final isSelected = _selectedSort == option;
    return InkWell(
      onTap: () => setState(() => _selectedSort = option),
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        margin: EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
        color: isSelected ? AppTheme.primaryPurple.withOpacity(0.1) : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isSelected ? AppTheme.primaryPurple : Colors.grey[300]!,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: isSelected ? AppTheme.primaryPurple : AppTheme.textSecondary, size: 20),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  color: isSelected ? AppTheme.primaryPurple : AppTheme.textPrimary,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
            if (isSelected)
              Icon(Icons.check_circle, color: AppTheme.primaryPurple, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterOption(String label, ReviewFilterRating filter, int? stars) {
    final isSelected = _selectedFilter == filter;
    return InkWell(
      onTap: () => setState(() => _selectedFilter = filter),
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        margin: EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryPurple.withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? AppTheme.primaryPurple : Colors.grey[300]!,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            if (stars != null) ...[
              ...List.generate(
                stars,
                (index) => Icon(Icons.star, color: Colors.amber, size: 16),
              ),
              SizedBox(width: 8),
            ],
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  color: isSelected ? AppTheme.primaryPurple : AppTheme.textPrimary,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
            if (isSelected)
              Icon(Icons.check_circle, color: AppTheme.primaryPurple, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildCheckboxOption(String label, bool value, Function(bool?) onChanged) {
    return CheckboxListTile(
      title: Text(
        label,
        style: TextStyle(
          fontSize: 14,
          color: AppTheme.textPrimary,
        ),
      ),
      value: value,
      onChanged: onChanged,
      activeColor: AppTheme.primaryPurple,
      contentPadding: EdgeInsets.zero,
      controlAffinity: ListTileControlAffinity.leading,
    );
  }
}
