import '../models/entity_model.dart';
import '../models/review_model.dart';
import '../models/community_post_model.dart';
import '../models/comment_model.dart';
import '../models/entity_question_model.dart';
import '../models/entity_answer_model.dart';
import 'real_database_mock.dart';

class MockData {
  static List<Entity> getMockEntities() {
    // Return real data from your PostgreSQL database
    return RealDatabaseMock.getRealEntities();
  }

  static List<Review> getMockReviews(int entityId) {
    // Return real reviews from your PostgreSQL database
    final allReviews = RealDatabaseMock.getRealReviews();
    // Filter reviews for specific entity, or return all if entityId is 0
    if (entityId == 0) {
      return allReviews;
    }
    return allReviews.where((review) => review.entityId == entityId).toList();
  }

  // Community Posts Mock Data (Aggregated from all sources)
  static List<CommunityPost> getMockCommunityPosts() {
    return [
      // General community post
      CommunityPost(
        postId: 1,
        title: 'Best coffee shops for studying in the city?',
        content:
            'Looking for recommendations for quiet coffee shops with good WiFi and plenty of seating. Bonus points if they have great pastries!',
        userId: 101,
        username: 'coffeeaddict',
        userAvatar: 'https://i.pravatar.cc/150?img=1',
        tags: ['coffee', 'study', 'recommendations'],
        likesCount: 24,
        commentsCount: 12,
        viewCount: 156,
        isLiked: false,
        isPinned: false,
        postType: PostType.general,
        createdAt: DateTime.now().subtract(Duration(hours: 2)),
      ),
      // General community post (pinned)
      CommunityPost(
        postId: 2,
        title: 'New restaurant review policy - What do you think?',
        content:
            'The platform is considering requiring photo verification for all restaurant reviews. This would help prevent fake reviews but might reduce participation. Thoughts?',
        userId: 102,
        username: 'foodcritic99',
        userAvatar: 'https://i.pravatar.cc/150?img=3',
        tags: ['policy', 'discussion', 'restaurants'],
        likesCount: 45,
        commentsCount: 28,
        viewCount: 320,
        isLiked: true,
        isPinned: true,
        postType: PostType.general,
        createdAt: DateTime.now().subtract(Duration(days: 1)),
      ),
      // Entity Q&A post
      CommunityPost(
        postId: 9,
        title: 'Does Trattoria Bella accept reservations?',
        content:
            'Planning to visit this weekend with a group of 8. Do they take reservations or is it first-come, first-served?',
        userId: 201,
        username: 'dinnerplanner',
        userAvatar: 'https://i.pravatar.cc/150?img=21',
        tags: ['question', 'reservations'],
        likesCount: 12,
        commentsCount: 5,
        viewCount: 89,
        isLiked: false,
        isPinned: false,
        postType: PostType.entity,
        entityId: 42,
        entityName: 'Trattoria Bella',
        entityAvatar: 'https://i.pravatar.cc/150?img=20',
        createdAt: DateTime.now().subtract(Duration(hours: 6)),
      ),
      // Group discussion post
      CommunityPost(
        postId: 10,
        title: 'Best pizza spots in downtown? 🍕',
        content:
            'Our foodie group is doing a pizza crawl next month. Drop your favorite spots! Authentic Neapolitan style preferred.',
        userId: 202,
        username: 'pizzalover',
        userAvatar: 'https://i.pravatar.cc/150?img=22',
        tags: ['pizza', 'downtown', 'group-activity'],
        likesCount: 38,
        commentsCount: 24,
        viewCount: 178,
        isLiked: true,
        isPinned: false,
        postType: PostType.group,
        groupId: 5,
        groupName: 'Downtown Foodies',
        groupAvatar: 'https://i.pravatar.cc/150?img=30',
        createdAt: DateTime.now().subtract(Duration(hours: 10)),
      ),
      // Entity-linked general post
      CommunityPost(
        postId: 3,
        title: 'Just discovered this hidden gem!',
        content:
            'Found an amazing Italian place in the west side. Family-owned, authentic recipes, incredible pasta. Sharing the love!',
        userId: 103,
        username: 'italianfoodie',
        userAvatar: 'https://i.pravatar.cc/150?img=5',
        entityId: 42,
        entityName: 'Trattoria Bella',
        entityAvatar: 'https://i.pravatar.cc/150?img=20',
        tags: ['italian', 'restaurants', 'hidden-gem'],
        likesCount: 67,
        commentsCount: 19,
        viewCount: 412,
        isLiked: false,
        isPinned: false,
        postType: PostType.general,
        createdAt: DateTime.now().subtract(Duration(hours: 8)),
      ),
      // Entity Q&A post
      CommunityPost(
        postId: 11,
        title: 'What are the operating hours for TechHub Store?',
        content:
            'I need to pick up a laptop adapter tomorrow morning. Anyone know if they open early on weekdays?',
        userId: 203,
        username: 'earlybird',
        userAvatar: 'https://i.pravatar.cc/150?img=23',
        tags: ['question', 'hours'],
        likesCount: 8,
        commentsCount: 3,
        viewCount: 45,
        isLiked: false,
        isPinned: false,
        postType: PostType.entity,
        entityId: 15,
        entityName: 'TechHub Store',
        entityAvatar: 'https://i.pravatar.cc/150?img=31',
        createdAt: DateTime.now().subtract(Duration(hours: 3)),
      ),
      // General community post
      CommunityPost(
        postId: 4,
        title: 'Looking for budget-friendly smartphones',
        content:
            'Need suggestions for a good smartphone under \$300. Main priorities are camera quality and battery life. Any recommendations?',
        userId: 104,
        username: 'techsavvy',
        userAvatar: 'https://i.pravatar.cc/150?img=7',
        tags: ['smartphones', 'budget', 'recommendations'],
        likesCount: 18,
        commentsCount: 34,
        viewCount: 201,
        isLiked: false,
        isPinned: false,
        postType: PostType.general,
        createdAt: DateTime.now().subtract(Duration(hours: 5)),
      ),
      // Group discussion post
      CommunityPost(
        postId: 12,
        title: 'Tech Enthusiasts Meetup - March 15th',
        content:
            'Our monthly tech meetup is coming up! This time we\'re discussing AI trends and doing hands-on workshops with new gadgets. RSVP in comments!',
        userId: 204,
        username: 'techorganizer',
        userAvatar: 'https://i.pravatar.cc/150?img=24',
        tags: ['meetup', 'tech', 'event'],
        likesCount: 56,
        commentsCount: 42,
        viewCount: 289,
        isLiked: true,
        isPinned: false,
        postType: PostType.group,
        groupId: 12,
        groupName: 'Tech Enthusiasts',
        groupAvatar: 'https://i.pravatar.cc/150?img=32',
        createdAt: DateTime.now().subtract(Duration(hours: 12)),
      ),
      // General community post
      CommunityPost(
        postId: 5,
        title: 'Share your favorite local bookstores!',
        content:
            'Independent bookstores are the best! What are your go-to spots for finding unique reads and supporting local businesses?',
        userId: 105,
        username: 'bookworm',
        userAvatar: 'https://i.pravatar.cc/150?img=9',
        tags: ['books', 'local-business', 'community'],
        likesCount: 52,
        commentsCount: 41,
        viewCount: 298,
        isLiked: true,
        isPinned: false,
        postType: PostType.general,
        createdAt: DateTime.now().subtract(Duration(days: 2)),
      ),
      // Group discussion post
      CommunityPost(
        postId: 13,
        title: 'Weekend Hike Planning - Trail Recommendations Needed',
        content:
            'Our hiking group is planning next weekend\'s adventure. Looking for moderate trails with great views. Drop your suggestions below!',
        userId: 106,
        username: 'outdoorexplorer',
        userAvatar: 'https://i.pravatar.cc/150?img=11',
        tags: ['hiking', 'outdoors', 'weekend'],
        likesCount: 31,
        commentsCount: 22,
        viewCount: 167,
        isLiked: false,
        isPinned: false,
        postType: PostType.group,
        groupId: 8,
        groupName: 'Weekend Hikers',
        groupAvatar: 'https://i.pravatar.cc/150?img=33',
        createdAt: DateTime.now().subtract(Duration(hours: 14)),
      ),
      // General community post
      CommunityPost(
        postId: 7,
        title: 'Vegan restaurants worth trying?',
        content:
            'Not vegan myself but trying to eat healthier. What are some delicious vegan spots that even meat-eaters would enjoy?',
        userId: 107,
        username: 'healthyeater',
        userAvatar: 'https://i.pravatar.cc/150?img=13',
        tags: ['vegan', 'restaurants', 'healthy'],
        likesCount: 44,
        commentsCount: 26,
        viewCount: 234,
        isLiked: true,
        isPinned: false,
        postType: PostType.general,
        createdAt: DateTime.now().subtract(Duration(hours: 20)),
      ),
      // General community post
      CommunityPost(
        postId: 8,
        title: 'Gaming laptop recommendations 2025?',
        content:
            'Looking to upgrade my setup. Budget around \$1500. Main games: Cyberpunk, Elden Ring, latest AAA titles. What should I get?',
        userId: 108,
        username: 'gamer4life',
        userAvatar: 'https://i.pravatar.cc/150?img=15',
        tags: ['gaming', 'laptop', 'tech'],
        likesCount: 29,
        commentsCount: 38,
        viewCount: 412,
        isLiked: false,
        isPinned: false,
        postType: PostType.general,
        createdAt: DateTime.now().subtract(Duration(days: 3)),
      ),
    ];
  }

  // Comments Mock Data
  static List<Comment> getMockComments(int postId) {
    return [
      Comment(
        commentId: 1,
        content:
            'Great question! I would also recommend Java Junction on 5th street.',
        userId: 401,
        username: 'studybuddy',
        userAvatar: 'https://i.pravatar.cc/150?img=14',
        likesCount: 5,
        isLiked: false,
        createdAt: DateTime.now().subtract(Duration(hours: 1)),
      ),
      Comment(
        commentId: 2,
        content: 'Starbucks Reserve has amazing ambiance for studying!',
        userId: 402,
        username: 'coffeeexpert',
        userAvatar: 'https://i.pravatar.cc/150?img=15',
        likesCount: 3,
        isLiked: true,
        createdAt: DateTime.now().subtract(Duration(minutes: 45)),
      ),
      Comment(
        commentId: 3,
        content:
            'Check out The Reading Room. Super cozy and they have excellent WiFi.',
        userId: 403,
        username: 'localexpert',
        userAvatar: 'https://i.pravatar.cc/150?img=16',
        likesCount: 7,
        isLiked: false,
        createdAt: DateTime.now().subtract(Duration(minutes: 30)),
      ),
    ];
  }

  // Entity Questions Mock Data
  static List<EntityQuestion> getMockEntityQuestions(int entityId) {
    return [
      EntityQuestion(
        questionId: 1,
        title: 'Do you offer gluten-free options?',
        description:
            'I have celiac disease and need to know if you have dedicated gluten-free menu items and preparation areas.',
        entityId: entityId,
        userId: 201,
        username: 'healthyeater',
        userAvatar: 'https://i.pravatar.cc/150?img=10',
        answersCount: 3,
        viewCount: 45,
        hasOfficialAnswer: true,
        createdAt: DateTime.now().subtract(Duration(days: 2)),
      ),
      EntityQuestion(
        questionId: 2,
        title: 'What are your peak hours?',
        description: null,
        entityId: entityId,
        userId: 202,
        username: 'planahead',
        userAvatar: 'https://i.pravatar.cc/150?img=11',
        answersCount: 5,
        viewCount: 89,
        hasOfficialAnswer: false,
        createdAt: DateTime.now().subtract(Duration(days: 5)),
      ),
      EntityQuestion(
        questionId: 3,
        title: 'Is there parking available?',
        description:
            'Planning to visit this weekend. Do you have your own parking lot or should I use street parking?',
        entityId: entityId,
        userId: 203,
        username: 'driver123',
        userAvatar: 'https://i.pravatar.cc/150?img=12',
        answersCount: 2,
        viewCount: 34,
        hasOfficialAnswer: true,
        createdAt: DateTime.now().subtract(Duration(hours: 12)),
      ),
      EntityQuestion(
        questionId: 4,
        title: 'Do you take reservations?',
        description: 'Planning a dinner for 8 people next Friday.',
        entityId: entityId,
        userId: 204,
        username: 'partyplanner',
        userAvatar: 'https://i.pravatar.cc/150?img=13',
        answersCount: 1,
        viewCount: 22,
        hasOfficialAnswer: true,
        createdAt: DateTime.now().subtract(Duration(hours: 6)),
      ),
      EntityQuestion(
        questionId: 5,
        title: 'Are pets allowed?',
        description: null,
        entityId: entityId,
        userId: 205,
        username: 'doglover',
        userAvatar: 'https://i.pravatar.cc/150?img=14',
        answersCount: 4,
        viewCount: 67,
        hasOfficialAnswer: false,
        createdAt: DateTime.now().subtract(Duration(days: 1)),
      ),
    ];
  }

  // Entity Answers Mock Data
  static List<EntityAnswer> getMockEntityAnswers(int questionId) {
    if (questionId == 1) {
      return [
        EntityAnswer(
          answerId: 1,
          questionId: 1,
          content:
              'Yes! We have a dedicated gluten-free menu with pasta, pizza, and dessert options. Our kitchen staff is trained in cross-contamination prevention and we use separate preparation areas.',
          userId: 301,
          username: 'Trattoria Bella',
          userAvatar: 'https://i.pravatar.cc/150?img=20',
          isOfficial: true,
          officialRole: 'Owner',
          upvotes: 23,
          downvotes: 1,
          voteStatus: VoteStatus.none,
          createdAt: DateTime.now().subtract(Duration(days: 1)),
        ),
        EntityAnswer(
          answerId: 2,
          questionId: 1,
          content:
              'I visited last week and tried their gluten-free pasta. It was delicious! They take allergies very seriously.',
          userId: 302,
          username: 'celiacfriend',
          userAvatar: 'https://i.pravatar.cc/150?img=13',
          isOfficial: false,
          upvotes: 12,
          downvotes: 0,
          voteStatus: VoteStatus.upvoted,
          createdAt: DateTime.now().subtract(Duration(hours: 18)),
        ),
        EntityAnswer(
          answerId: 3,
          questionId: 1,
          content:
              'The chef personally came out to discuss my dietary restrictions. Very accommodating!',
          userId: 303,
          username: 'safeeater',
          userAvatar: 'https://i.pravatar.cc/150?img=14',
          isOfficial: false,
          upvotes: 8,
          downvotes: 0,
          voteStatus: VoteStatus.none,
          createdAt: DateTime.now().subtract(Duration(hours: 12)),
        ),
      ];
    } else if (questionId == 3) {
      return [
        EntityAnswer(
          answerId: 4,
          questionId: 3,
          content:
              'We have a small parking lot behind the restaurant with 12 spaces, available on a first-come basis. Street parking is also available on weekdays.',
          userId: 301,
          username: 'Trattoria Bella',
          userAvatar: 'https://i.pravatar.cc/150?img=20',
          isOfficial: true,
          officialRole: 'Manager',
          upvotes: 15,
          downvotes: 0,
          voteStatus: VoteStatus.upvoted,
          createdAt: DateTime.now().subtract(Duration(hours: 10)),
        ),
        EntityAnswer(
          answerId: 5,
          questionId: 3,
          content:
              'Pro tip: The public parking garage two blocks east is free after 6 PM on weekends!',
          userId: 304,
          username: 'localguide',
          userAvatar: 'https://i.pravatar.cc/150?img=15',
          isOfficial: false,
          upvotes: 9,
          downvotes: 0,
          voteStatus: VoteStatus.none,
          createdAt: DateTime.now().subtract(Duration(hours: 8)),
        ),
      ];
    } else if (questionId == 4) {
      return [
        EntityAnswer(
          answerId: 6,
          questionId: 4,
          content:
              'Yes, we accept reservations for parties of 6 or more. Please call us at least 24 hours in advance.',
          userId: 301,
          username: 'Trattoria Bella',
          userAvatar: 'https://i.pravatar.cc/150?img=20',
          isOfficial: true,
          officialRole: 'Staff',
          upvotes: 7,
          downvotes: 0,
          voteStatus: VoteStatus.none,
          createdAt: DateTime.now().subtract(Duration(hours: 4)),
        ),
      ];
    }
    return [];
  }
}
