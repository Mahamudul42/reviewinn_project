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
      // POST WITH REVIEW LINK - Test the review preview feature
      CommunityPost(
        postId: 1,
        title: 'Amazing Italian experience! You have to try this place',
        content:
            'Just had the most incredible dinner at Trattoria Bella! Their pasta is homemade and the tiramisu is to die for. I wrote a detailed review about my experience: reviewinn.com/review/1\n\nSeriously, if you love authentic Italian food, this is your spot!',
        userId: 101,
        username: 'foodieexplorer',
        userAvatar: 'https://i.pravatar.cc/150?img=1',
        tags: ['italian', 'restaurant', 'recommendation'],
        likesCount: 45,
        commentsCount: 18,
        viewCount: 234,
        isLiked: true,
        isPinned: false,
        postType: PostType.general,
        createdAt: DateTime.now().subtract(Duration(hours: 2)),
      ),
      // ANOTHER POST WITH REVIEW LINK
      CommunityPost(
        postId: 15,
        title: 'Best tech store in the city - hands down!',
        content:
            'Someone asked about where to buy laptops yesterday. I just shared my experience at TechHub Store here: /review/5\n\nTheir customer service is incredible and prices are competitive. Check out my full review!',
        userId: 109,
        username: 'techreviewer',
        userAvatar: 'https://i.pravatar.cc/150?img=18',
        tags: ['tech', 'electronics', 'shopping'],
        likesCount: 32,
        commentsCount: 14,
        viewCount: 187,
        isLiked: false,
        isPinned: false,
        postType: PostType.general,
        createdAt: DateTime.now().subtract(Duration(hours: 4)),
      ),
      // Regular post without review link
      CommunityPost(
        postId: 16,
        title: 'Best coffee shops for studying in the city?',
        content:
            'Looking for recommendations for quiet coffee shops with good WiFi and plenty of seating. Bonus points if they have great pastries!',
        userId: 110,
        username: 'coffeeaddict',
        userAvatar: 'https://i.pravatar.cc/150?img=2',
        tags: ['coffee', 'study', 'recommendations'],
        likesCount: 24,
        commentsCount: 12,
        viewCount: 156,
        isLiked: false,
        isPinned: false,
        postType: PostType.general,
        createdAt: DateTime.now().subtract(Duration(hours: 6)),
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
      // Entity Q&A post for TechHub
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

      // ===== ENTITY DISCUSSION POSTS FOR COMMON ENTITIES =====
      // Entity discussion for entityId: 34 - University of Dhaka
      CommunityPost(
        postId: 17,
        title: 'Best time to visit the campus to avoid crowds?',
        content:
            'Planning to visit DU campus soon. What time of day is usually less busy? Weekday vs weekend?',
        userId: 301,
        username: 'quietvisitor',
        userAvatar: 'https://i.pravatar.cc/150?img=25',
        tags: ['question', 'timing', 'campus-visit'],
        likesCount: 15,
        commentsCount: 8,
        viewCount: 67,
        isLiked: false,
        isPinned: false,
        postType: PostType.entity,
        entityId: 34,
        entityName: 'University of Dhaka',
        entityAvatar: 'https://images.unsplash.com/photo-1523050854058-8df90110c9d1?q=80&w=400',
        createdAt: DateTime.now().subtract(Duration(hours: 5)),
      ),
      CommunityPost(
        postId: 18,
        title: 'Is parking available on campus?',
        content:
            'Visiting University of Dhaka for the first time this weekend. Anyone know about parking situation? Any visitor parking lots?',
        userId: 302,
        username: 'driverJoe',
        userAvatar: 'https://i.pravatar.cc/150?img=26',
        tags: ['parking', 'campus', 'logistics'],
        likesCount: 12,
        commentsCount: 6,
        viewCount: 54,
        isLiked: false,
        isPinned: false,
        postType: PostType.entity,
        entityId: 34,
        entityName: 'University of Dhaka',
        entityAvatar: 'https://images.unsplash.com/photo-1523050854058-8df90110c9d1?q=80&w=400',
        createdAt: DateTime.now().subtract(Duration(days: 1)),
      ),

      // Entity discussion for entityId: 35 - BUET
      CommunityPost(
        postId: 19,
        title: 'Do they accept credit cards?',
        content:
            'Quick question - do they take cards or cash only? Want to be prepared before I visit.',
        userId: 303,
        username: 'carduser',
        userAvatar: 'https://i.pravatar.cc/150?img=27',
        tags: ['payment', 'question'],
        likesCount: 8,
        commentsCount: 4,
        viewCount: 42,
        isLiked: false,
        isPinned: false,
        postType: PostType.entity,
        entityId: 35,
        entityName: 'BUET',
        entityAvatar: 'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=400',
        createdAt: DateTime.now().subtract(Duration(hours: 8)),
      ),
      CommunityPost(
        postId: 20,
        title: 'Family-friendly environment?',
        content:
            'Thinking of bringing my kids (ages 6 and 9). Is this place welcoming for families with children?',
        userId: 304,
        username: 'familydad',
        userAvatar: 'https://i.pravatar.cc/150?img=28',
        tags: ['family', 'kids-friendly'],
        likesCount: 18,
        commentsCount: 11,
        viewCount: 89,
        isLiked: true,
        isPinned: false,
        postType: PostType.entity,
        entityId: 35,
        entityName: 'BUET',
        entityAvatar: 'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=400',
        createdAt: DateTime.now().subtract(Duration(days: 2)),
      ),

      // Entity discussion for entityId: 36 - North South University
      CommunityPost(
        postId: 21,
        title: 'Wheelchair accessible?',
        content:
            'My grandma uses a wheelchair. Does anyone know if this location is accessible?',
        userId: 305,
        username: 'caringgrandson',
        userAvatar: 'https://i.pravatar.cc/150?img=29',
        tags: ['accessibility', 'wheelchair'],
        likesCount: 22,
        commentsCount: 9,
        viewCount: 76,
        isLiked: true,
        isPinned: false,
        postType: PostType.entity,
        entityId: 36,
        entityName: 'North South University',
        entityAvatar: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?q=80&w=400',
        createdAt: DateTime.now().subtract(Duration(hours: 12)),
      ),

      // Entity discussion for entityId: 37 - BRAC University
      CommunityPost(
        postId: 22,
        title: 'Group reservations - how far in advance?',
        content:
            'Planning a birthday party for 15 people. How many days ahead should I book? Any recommendations?',
        userId: 306,
        username: 'partyplanner',
        userAvatar: 'https://i.pravatar.cc/150?img=30',
        tags: ['reservation', 'group', 'party'],
        likesCount: 14,
        commentsCount: 7,
        viewCount: 61,
        isLiked: false,
        isPinned: false,
        postType: PostType.entity,
        entityId: 37,
        entityName: 'BRAC University',
        entityAvatar: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?q=80&w=400',
        createdAt: DateTime.now().subtract(Duration(hours: 16)),
      ),

      // Entity discussion for entityId: 38 - Grameenphone
      CommunityPost(
        postId: 23,
        title: 'Worth the price?',
        content:
            'Been seeing mixed reviews about value for money. People who\'ve been recently, what do you think? Is it worth it?',
        userId: 307,
        username: 'budgetconscious',
        userAvatar: 'https://i.pravatar.cc/150?img=31',
        tags: ['value', 'pricing', 'opinion'],
        likesCount: 25,
        commentsCount: 15,
        viewCount: 134,
        isLiked: true,
        isPinned: false,
        postType: PostType.entity,
        entityId: 38,
        entityName: 'Grameenphone',
        entityAvatar: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400',
        createdAt: DateTime.now().subtract(Duration(hours: 20)),
      ),
      CommunityPost(
        postId: 24,
        title: 'Any dietary options available?',
        content:
            'I\'m vegetarian and my friend has gluten allergy. Do they accommodate special dietary needs?',
        userId: 308,
        username: 'healthyeater2',
        userAvatar: 'https://i.pravatar.cc/150?img=32',
        tags: ['dietary', 'vegetarian', 'gluten-free'],
        likesCount: 19,
        commentsCount: 10,
        viewCount: 92,
        isLiked: false,
        isPinned: false,
        postType: PostType.entity,
        entityId: 38,
        entityName: 'Grameenphone',
        entityAvatar: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400',
        createdAt: DateTime.now().subtract(Duration(days: 1, hours: 4)),
      ),

      // Entity discussion for entityId: 39 - Robi Axiata Limited
      CommunityPost(
        postId: 25,
        title: 'Customer service experience?',
        content:
            'How\'s the staff here? Friendly and helpful? I value good customer service.',
        userId: 309,
        username: 'servicematters',
        userAvatar: 'https://i.pravatar.cc/150?img=33',
        tags: ['service', 'staff', 'customer-experience'],
        likesCount: 17,
        commentsCount: 12,
        viewCount: 78,
        isLiked: false,
        isPinned: false,
        postType: PostType.entity,
        entityId: 39,
        entityName: 'Robi Axiata Limited',
        entityAvatar: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400',
        createdAt: DateTime.now().subtract(Duration(hours: 7)),
      ),

      // Entity discussion for entityId: 40 - Square Pharmaceuticals
      CommunityPost(
        postId: 26,
        title: 'Dog-friendly?',
        content:
            'I have a small dog and would love to bring him along. Does anyone know if pets are allowed?',
        userId: 310,
        username: 'doglover88',
        userAvatar: 'https://i.pravatar.cc/150?img=34',
        tags: ['pets', 'dog-friendly'],
        likesCount: 13,
        commentsCount: 5,
        viewCount: 56,
        isLiked: false,
        isPinned: false,
        postType: PostType.entity,
        entityId: 40,
        entityName: 'Square Pharmaceuticals',
        entityAvatar: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=400',
        createdAt: DateTime.now().subtract(Duration(hours: 15)),
      ),

      // Entity discussion for entityId: 41 - ACI Limited
      CommunityPost(
        postId: 27,
        title: 'WiFi available for remote work?',
        content:
            'Looking for a good spot to work remotely. Do they have reliable WiFi? Outlets for charging?',
        userId: 311,
        username: 'remoteworker',
        userAvatar: 'https://i.pravatar.cc/150?img=35',
        tags: ['wifi', 'remote-work', 'workspace'],
        likesCount: 21,
        commentsCount: 8,
        viewCount: 103,
        isLiked: true,
        isPinned: false,
        postType: PostType.entity,
        entityId: 41,
        entityName: 'ACI Limited',
        entityAvatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400',
        createdAt: DateTime.now().subtract(Duration(days: 2)),
      ),

      // Entity discussion for entityId: 42 - Kasturi Restaurant
      CommunityPost(
        postId: 28,
        title: 'Outdoor seating available?',
        content:
            'Weather is getting nice! Does this place have outdoor seating? Patio or terrace?',
        userId: 312,
        username: 'outdoorsdiner',
        userAvatar: 'https://i.pravatar.cc/150?img=36',
        tags: ['outdoor', 'seating', 'patio'],
        likesCount: 16,
        commentsCount: 9,
        viewCount: 71,
        isLiked: false,
        isPinned: false,
        postType: PostType.entity,
        entityId: 42,
        entityName: 'Kasturi Restaurant',
        entityAvatar: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?q=80&w=400',
        createdAt: DateTime.now().subtract(Duration(hours: 11)),
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
