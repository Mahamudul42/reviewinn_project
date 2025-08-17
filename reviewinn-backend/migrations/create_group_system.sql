-- Group Management System Migration
-- Creates all necessary tables for the group-based review system

-- 1. Create review_groups table
CREATE TABLE IF NOT EXISTS review_groups (
    group_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    group_type VARCHAR(50) DEFAULT 'interest_based', -- 'university', 'company', 'location', 'interest_based'
    visibility VARCHAR(20) DEFAULT 'public', -- 'public', 'private', 'invite_only'
    avatar_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    
    -- Group settings
    allow_public_reviews BOOLEAN DEFAULT true,
    require_approval_for_reviews BOOLEAN DEFAULT false,
    max_members INTEGER DEFAULT 1000,
    
    -- Creator and ownership
    created_by INTEGER REFERENCES core_users(user_id) ON DELETE SET NULL,
    
    -- Group metadata
    group_metadata JSONB DEFAULT '{}', -- Tags, specializations, etc.
    rules_and_guidelines TEXT,
    external_links JSONB DEFAULT '[]', -- Website, social links
    
    -- Engagement metrics (cached for performance)
    member_count INTEGER DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    active_members_count INTEGER DEFAULT 0, -- Members active in last 30 days
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create group_memberships table
CREATE TABLE IF NOT EXISTS group_memberships (
    membership_id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES review_groups(group_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES core_users(user_id) ON DELETE CASCADE,
    
    -- Membership details
    role VARCHAR(30) DEFAULT 'member', -- 'owner', 'admin', 'moderator', 'member'
    membership_status VARCHAR(20) DEFAULT 'active', -- 'active', 'pending', 'banned', 'left'
    
    -- Permissions
    can_post_reviews BOOLEAN DEFAULT true,
    can_moderate_content BOOLEAN DEFAULT false,
    can_invite_members BOOLEAN DEFAULT false,
    can_manage_group BOOLEAN DEFAULT false,
    
    -- Engagement tracking
    reviews_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    contribution_score FLOAT DEFAULT 0, -- Based on reviews, reactions, comments
    
    -- Join details
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by INTEGER REFERENCES core_users(user_id) ON DELETE SET NULL,
    join_reason TEXT, -- Why they joined or were invited
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(group_id, user_id)
);

-- 3. Create group_invitations table
CREATE TABLE IF NOT EXISTS group_invitations (
    invitation_id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES review_groups(group_id) ON DELETE CASCADE,
    inviter_id INTEGER REFERENCES core_users(user_id) ON DELETE CASCADE,
    invitee_id INTEGER REFERENCES core_users(user_id) ON DELETE CASCADE,
    
    -- Invitation details
    invitation_message TEXT,
    suggested_role VARCHAR(30) DEFAULT 'member',
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
    response_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    UNIQUE(group_id, invitee_id, status) -- Prevent duplicate pending invitations
);

-- 4. Create group_categories table
CREATE TABLE IF NOT EXISTS group_categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100), -- Icon identifier
    color_code VARCHAR(7), -- Hex color
    parent_category_id INTEGER REFERENCES group_categories(category_id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create group_category_mappings table (junction table)
CREATE TABLE IF NOT EXISTS group_category_mappings (
    group_id INTEGER REFERENCES review_groups(group_id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES group_categories(category_id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, category_id)
);

-- 6. Enhance existing review_main table with group columns
ALTER TABLE review_main 
ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES review_groups(group_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS review_scope VARCHAR(20) DEFAULT 'public', -- 'public', 'group_only', 'mixed'
ADD COLUMN IF NOT EXISTS group_context JSONB DEFAULT '{}', -- Group-specific context
ADD COLUMN IF NOT EXISTS visibility_settings JSONB DEFAULT '{"public": true, "group_members": true}';

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_review_groups_name ON review_groups(name);
CREATE INDEX IF NOT EXISTS idx_review_groups_type ON review_groups(group_type);
CREATE INDEX IF NOT EXISTS idx_review_groups_visibility ON review_groups(visibility);
CREATE INDEX IF NOT EXISTS idx_review_groups_active ON review_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_review_groups_created_by ON review_groups(created_by);

CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_role ON group_memberships(role);
CREATE INDEX IF NOT EXISTS idx_group_memberships_status ON group_memberships(membership_status);
CREATE INDEX IF NOT EXISTS idx_group_memberships_activity ON group_memberships(last_activity_at);

CREATE INDEX IF NOT EXISTS idx_group_invitations_group_id ON group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_invitee_id ON group_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON group_invitations(status);
CREATE INDEX IF NOT EXISTS idx_group_invitations_expires ON group_invitations(expires_at);

CREATE INDEX IF NOT EXISTS idx_review_main_group_id ON review_main(group_id);
CREATE INDEX IF NOT EXISTS idx_review_main_scope ON review_main(review_scope);
CREATE INDEX IF NOT EXISTS idx_review_main_group_scope ON review_main(group_id, review_scope) WHERE group_id IS NOT NULL;

-- Insert default group categories
INSERT INTO group_categories (name, description, icon, color_code, sort_order) VALUES
    ('Education', 'Universities, schools, and educational institutions', 'graduation-cap', '#3B82F6', 1),
    ('Technology', 'Tech companies, startups, and IT organizations', 'cpu', '#8B5CF6', 2),
    ('Healthcare', 'Hospitals, clinics, and medical organizations', 'heart', '#EF4444', 3),
    ('Business', 'Companies, corporations, and professional services', 'briefcase', '#F59E0B', 4),
    ('Location', 'City, neighborhood, and regional groups', 'map-pin', '#10B981', 5),
    ('Interest', 'Hobby, interest, and community groups', 'users', '#EC4899', 6),
    ('Sports', 'Sports teams, clubs, and athletic organizations', 'trophy', '#F97316', 7),
    ('Arts & Culture', 'Museums, galleries, and cultural institutions', 'palette', '#6366F1', 8)
ON CONFLICT DO NOTHING;

-- Create trigger to update group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE review_groups 
        SET member_count = member_count + 1,
            updated_at = NOW()
        WHERE group_id = NEW.group_id AND NEW.membership_status = 'active';
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.membership_status != NEW.membership_status THEN
            IF OLD.membership_status = 'active' AND NEW.membership_status != 'active' THEN
                UPDATE review_groups 
                SET member_count = member_count - 1,
                    updated_at = NOW()
                WHERE group_id = NEW.group_id;
            ELSIF OLD.membership_status != 'active' AND NEW.membership_status = 'active' THEN
                UPDATE review_groups 
                SET member_count = member_count + 1,
                    updated_at = NOW()
                WHERE group_id = NEW.group_id;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE review_groups 
        SET member_count = member_count - 1,
            updated_at = NOW()
        WHERE group_id = OLD.group_id AND OLD.membership_status = 'active';
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_group_member_count ON group_memberships;
CREATE TRIGGER trigger_update_group_member_count
    AFTER INSERT OR UPDATE OR DELETE ON group_memberships
    FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Create trigger to update group review count
CREATE OR REPLACE FUNCTION update_group_review_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE review_groups 
        SET review_count = review_count + 1,
            updated_at = NOW()
        WHERE group_id = NEW.group_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE review_groups 
        SET review_count = review_count - 1,
            updated_at = NOW()
        WHERE group_id = OLD.group_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_group_review_count ON review_main;
CREATE TRIGGER trigger_update_group_review_count
    AFTER INSERT OR DELETE ON review_main
    FOR EACH ROW EXECUTE FUNCTION update_group_review_count();

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON review_groups TO reviewinn_user;
GRANT ALL PRIVILEGES ON group_memberships TO reviewinn_user;
GRANT ALL PRIVILEGES ON group_invitations TO reviewinn_user;
GRANT ALL PRIVILEGES ON group_categories TO reviewinn_user;
GRANT ALL PRIVILEGES ON group_category_mappings TO reviewinn_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO reviewinn_user;