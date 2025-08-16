// Example API endpoints for badge system
// These should be implemented in your backend

// GET /api/badges - Get all available badges
app.get('/api/badges', async (req, res) => {
  try {
    const badges = await db.query(`
      SELECT * FROM game_badges 
      WHERE is_active = true 
      ORDER BY category, rarity, name
    `);
    res.json(badges.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// GET /api/badges/user/:userId - Get user's badges
app.get('/api/badges/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userBadges = await db.query(`
      SELECT 
        ub.*,
        b.name,
        b.description,
        b.icon,
        b.color,
        b.category,
        b.rarity,
        b.requirements
      FROM game_user_badges ub
      JOIN game_badges b ON ub.badge_id = b.id
      WHERE ub.user_id = $1
      ORDER BY ub.unlocked_at DESC
    `, [userId]);
    
    res.json(userBadges.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user badges' });
  }
});

// GET /api/badges/user/:userId/progress - Get user's badge progress
app.get('/api/badges/user/:userId/progress', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const progress = await db.query(`
      SELECT 
        bp.*,
        b.name,
        b.description,
        b.icon,
        b.color,
        b.category,
        b.rarity,
        b.requirements,
        CASE WHEN ub.id IS NOT NULL THEN true ELSE false END as is_unlocked
      FROM game_badge_progress bp
      JOIN game_badges b ON bp.badge_id = b.id
      LEFT JOIN game_user_badges ub ON bp.user_id = ub.user_id AND bp.badge_id = ub.badge_id
      WHERE bp.user_id = $1
      ORDER BY bp.percentage DESC, b.category, b.rarity
    `, [userId]);
    
    res.json(progress.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch badge progress' });
  }
});

// GET /api/badges/user/:userId/stats - Get user's badge statistics
app.get('/api/badges/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM game_badges WHERE is_active = true) as total_badges,
        (SELECT COUNT(*) FROM game_user_badges WHERE user_id = $1) as unlocked_badges,
        (SELECT COUNT(*) FROM game_user_badges ub 
         JOIN game_badges b ON ub.badge_id = b.id 
         WHERE ub.user_id = $1 AND b.rarity = 'common') as common_badges,
        (SELECT COUNT(*) FROM game_user_badges ub 
         JOIN game_badges b ON ub.badge_id = b.id 
         WHERE ub.user_id = $1 AND b.rarity IN ('rare', 'epic', 'legendary')) as rare_badges,
        (SELECT COUNT(*) FROM game_user_badges ub 
         JOIN game_badges b ON ub.badge_id = b.id 
         WHERE ub.user_id = $1 AND b.rarity = 'legendary') as legendary_badges
    `, [userId]);
    
    const row = stats.rows[0];
    const completionPercentage = row.total_badges > 0 
      ? (row.unlocked_badges / row.total_badges) * 100 
      : 0;
    
    res.json({
      ...row,
      completion_percentage: Math.round(completionPercentage * 100) / 100
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch badge stats' });
  }
});

// POST /api/badges/user/:userId/check - Check for new badges
app.post('/api/badges/user/:userId/check', async (req, res) => {
  try {
    const { userId } = req.params;
    const { actionType } = req.body;
    
    // Get user's current stats (this would need to be implemented based on your data)
    const userStats = await getUserStats(userId);
    
    // Get all badges the user hasn't unlocked yet
    const availableBadges = await db.query(`
      SELECT b.* FROM game_badges b
      WHERE b.is_active = true
      AND b.id NOT IN (
        SELECT badge_id FROM game_user_badges WHERE user_id = $1
      )
    `, [userId]);
    
    const newBadges = [];
    
    // Check each badge against user stats
    for (const badge of availableBadges.rows) {
      if (checkBadgeRequirement(userStats, badge.requirements)) {
        // Unlock the badge
        await db.query(`
          INSERT INTO game_user_badges (user_id, badge_id, unlocked_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (user_id, badge_id) DO NOTHING
        `, [userId, badge.id]);
        
        newBadges.push(badge);
      }
    }
    
    res.json(newBadges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check for new badges' });
  }
});

// POST /api/badges/user/:userId/registration - Unlock registration badge
app.post('/api/badges/user/:userId/registration', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find the welcome badge
    const welcomeBadge = await db.query(`
      SELECT * FROM game_badges 
      WHERE requirements->>'type' = 'registration' 
      AND is_active = true
      LIMIT 1
    `);
    
    if (welcomeBadge.rows.length === 0) {
      return res.status(404).json({ error: 'Welcome badge not found' });
    }
    
    // Unlock it for the user
    const result = await db.query(`
      INSERT INTO game_user_badges (user_id, badge_id, unlocked_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id, badge_id) DO NOTHING
      RETURNING *
    `, [userId, welcomeBadge.rows[0].id]);
    
    if (result.rows.length > 0) {
      res.json({
        ...result.rows[0],
        badge: welcomeBadge.rows[0]
      });
    } else {
      res.status(409).json({ error: 'Badge already unlocked' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to unlock registration badge' });
  }
});

// PUT /api/badges/user/:userId/display - Update badge display preference
app.put('/api/badges/user/:userId/display', async (req, res) => {
  try {
    const { userId } = req.params;
    const { badgeId, isDisplayed } = req.body;
    
    await db.query(`
      UPDATE game_user_badges 
      SET is_displayed = $1 
      WHERE user_id = $2 AND badge_id = $3
    `, [isDisplayed, userId, badgeId]);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update badge display' });
  }
});

// Helper function to check badge requirements
function checkBadgeRequirement(userStats, requirements) {
  const { type, value } = requirements;
  
  switch (type) {
    case 'registration':
      return userStats.isRegistered;
    case 'reviews_count':
      return userStats.reviewsCount >= value;
    case 'comments_count':
      return userStats.commentsCount >= value;
    case 'helpful_votes':
      return userStats.helpfulVotes >= value;
    case 'reactions_received':
      return userStats.reactionsReceived >= value;
    case 'entities_reviewed':
      return userStats.entitiesReviewed >= value;
    case 'consecutive_days':
      return userStats.currentStreak >= value;
    case 'account_age':
      return userStats.accountAgeDays >= value;
    case 'circle_members':
      return userStats.circleMembers >= value;
    default:
      return false;
  }
}

// Helper function to get user stats (implement based on your data structure)
async function getUserStats(userId) {
  // This would aggregate data from your various tables
  // Example implementation:
  
  const stats = await db.query(`
    SELECT 
      true as is_registered,
      (SELECT COUNT(*) FROM reviews WHERE user_id = $1) as reviews_count,
      (SELECT COUNT(*) FROM comments WHERE user_id = $1) as comments_count,
      (SELECT COALESCE(SUM(helpful_votes), 0) FROM reviews WHERE user_id = $1) as helpful_votes,
      (SELECT COUNT(*) FROM reactions WHERE target_user_id = $1) as reactions_received,
      (SELECT COUNT(DISTINCT entity_id) FROM reviews WHERE user_id = $1) as entities_reviewed,
      (SELECT COALESCE(current_streak, 0) FROM user_streaks WHERE user_id = $1) as current_streak,
      (SELECT EXTRACT(DAY FROM NOW() - created_at) FROM users WHERE id = $1) as account_age_days,
      (SELECT COUNT(*) FROM circle_members WHERE circle_owner_id = $1) as circle_members
  `, [userId]);
  
  return stats.rows[0];
}