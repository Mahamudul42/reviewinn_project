import 'package:flutter/material.dart';

enum BadgeType {
  topReviewer,
  earlyAdopter,
  verified,
  photoExpert,
  helpfulContributor,
  entityCreator,
  consistentReviewer,
  trendsetter,
}

class BadgeModel {
  final BadgeType type;
  final String title;
  final String description;
  final IconData icon;
  final List<Color> gradientColors;
  final DateTime? earnedDate;

  const BadgeModel({
    required this.type,
    required this.title,
    required this.description,
    required this.icon,
    required this.gradientColors,
    this.earnedDate,
  });

  static BadgeModel fromType(BadgeType type, {DateTime? earnedDate}) {
    switch (type) {
      case BadgeType.topReviewer:
        return BadgeModel(
          type: type,
          title: 'Top Reviewer',
          description: 'Wrote 50+ high-quality reviews',
          icon: Icons.star_rounded,
          gradientColors: const [Color(0xFFFFD700), Color(0xFFFFA500)], // Gold
          earnedDate: earnedDate,
        );
      case BadgeType.earlyAdopter:
        return BadgeModel(
          type: type,
          title: 'Early Adopter',
          description: 'One of our first users',
          icon: Icons.emoji_events_rounded,
          gradientColors: const [Color(0xFF9C27B0), Color(0xFF673AB7)], // Purple
          earnedDate: earnedDate,
        );
      case BadgeType.verified:
        return BadgeModel(
          type: type,
          title: 'Verified User',
          description: 'Email and identity verified',
          icon: Icons.verified_rounded,
          gradientColors: const [Color(0xFF2196F3), Color(0xFF1976D2)], // Blue
          earnedDate: earnedDate,
        );
      case BadgeType.photoExpert:
        return BadgeModel(
          type: type,
          title: 'Photo Expert',
          description: 'Added photos to 25+ reviews',
          icon: Icons.camera_alt_rounded,
          gradientColors: const [Color(0xFFE91E63), Color(0xFFC2185B)], // Pink
          earnedDate: earnedDate,
        );
      case BadgeType.helpfulContributor:
        return BadgeModel(
          type: type,
          title: 'Helpful Contributor',
          description: 'Received 100+ helpful votes',
          icon: Icons.thumb_up_rounded,
          gradientColors: const [Color(0xFF4CAF50), Color(0xFF388E3C)], // Green
          earnedDate: earnedDate,
        );
      case BadgeType.entityCreator:
        return BadgeModel(
          type: type,
          title: 'Entity Creator',
          description: 'Added 10+ new entities',
          icon: Icons.add_business_rounded,
          gradientColors: const [Color(0xFFFF9800), Color(0xFFF57C00)], // Orange
          earnedDate: earnedDate,
        );
      case BadgeType.consistentReviewer:
        return BadgeModel(
          type: type,
          title: 'Consistent Reviewer',
          description: 'Posted reviews for 30 days straight',
          icon: Icons.calendar_today_rounded,
          gradientColors: const [Color(0xFF00BCD4), Color(0xFF0097A7)], // Cyan
          earnedDate: earnedDate,
        );
      case BadgeType.trendsetter:
        return BadgeModel(
          type: type,
          title: 'Trendsetter',
          description: 'First to review 10 trending items',
          icon: Icons.trending_up_rounded,
          gradientColors: const [Color(0xFFFF5722), Color(0xFFE64A19)], // Deep Orange
          earnedDate: earnedDate,
        );
    }
  }

  factory BadgeModel.fromJson(Map<String, dynamic> json) {
    final typeString = json['type'] as String;
    final type = BadgeType.values.firstWhere(
      (e) => e.toString() == 'BadgeType.$typeString',
      orElse: () => BadgeType.verified,
    );

    return BadgeModel.fromType(
      type,
      earnedDate: json['earnedDate'] != null
          ? DateTime.parse(json['earnedDate'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type.toString().split('.').last,
      'title': title,
      'description': description,
      'earnedDate': earnedDate?.toIso8601String(),
    };
  }
}
