"""
Group Service - Handles all group-related business logic.
"""
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func
from fastapi import HTTPException, status
from datetime import datetime, timedelta

from models.group import (
    Group, GroupMembership, GroupInvitation, GroupCategory, GroupCategoryMapping,
    GroupType, GroupVisibility, MembershipRole, MembershipStatus, InvitationStatus
)
from models.review import Review, ReviewScope
from models.user import User
from schemas.group import (
    GroupCreateRequest, GroupUpdateRequest, GroupResponse, GroupListParams,
    GroupMembershipResponse, GroupInvitationRequest, GroupInvitationResponse,
    GroupMemberListParams, ReviewScopeRequest, GroupAnalyticsResponse
)
from schemas.common import PaginatedAPIResponse, PaginationSchema
class GroupService:
    """Service for managing groups, memberships, and group-related operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Group CRUD Operations
    
    def create_group(self, group_data: GroupCreateRequest, creator_id: int) -> GroupResponse:
        """Create a new group."""
        try:
            # Validate creator exists
            creator = self.db.query(User).filter(User.user_id == creator_id).first()
            if not creator:
                raise HTTPException(status_code=404, detail="Creator not found")
            
            # Check if group name is unique
            existing_group = self.db.query(Group).filter(Group.name == group_data.name).first()
            if existing_group:
                raise HTTPException(status_code=400, detail="Group name already exists")
            
            # Create group
            group = Group(
                name=group_data.name,
                description=group_data.description,
                group_type=group_data.group_type.value,
                visibility=group_data.visibility.value,
                avatar_url=group_data.avatar_url,
                cover_image_url=group_data.cover_image_url,
                allow_public_reviews=group_data.allow_public_reviews,
                require_approval_for_reviews=group_data.require_approval_for_reviews,
                max_members=group_data.max_members,
                created_by=creator_id,
                rules_and_guidelines=group_data.rules_and_guidelines,
                external_links=group_data.external_links or [],
                group_metadata=group_data.group_metadata or {}
            )
            
            self.db.add(group)
            self.db.flush()  # Get the group_id
            
            # Add creator as owner
            owner_membership = GroupMembership(
                group_id=group.group_id,
                user_id=creator_id,
                role=MembershipRole.OWNER.value,
                membership_status=MembershipStatus.ACTIVE.value,
                can_post_reviews=True,
                can_moderate_content=True,
                can_invite_members=True,
                can_manage_group=True,
                join_reason="Group creator"
            )
            
            self.db.add(owner_membership)
            
            # Add category mappings
            if group_data.category_ids:
                for category_id in group_data.category_ids:
                    category_mapping = GroupCategoryMapping(
                        group_id=group.group_id,
                        category_id=category_id
                    )
                    self.db.add(category_mapping)
            
            self.db.commit()
            
            return self._build_group_response(group, creator_id)
            
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to create group: {str(e)}")
    
    def get_group(self, group_id: int, user_id: Optional[int] = None) -> GroupResponse:
        """Get group details."""
        group = self.db.query(Group).filter(
            Group.group_id == group_id,
            Group.is_active == True
        ).first()
        
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        # Check visibility permissions
        if group.visibility == GroupVisibility.PRIVATE.value and user_id:
            membership = self.get_user_membership(group_id, user_id)
            if not membership:
                raise HTTPException(status_code=403, detail="Access denied to private group")
        
        return self._build_group_response(group, user_id)
    
    def get_groups(self, params: GroupListParams, user_id: Optional[int] = None) -> PaginatedAPIResponse[GroupResponse]:
        """Get paginated list of groups with filters."""
        query = self.db.query(Group).filter(Group.is_active == True)
        
        # Apply filters
        if params.group_type:
            query = query.filter(Group.group_type == params.group_type.value)
        
        if params.visibility:
            query = query.filter(Group.visibility == params.visibility.value)
        else:
            # By default, only show public groups unless user_groups_only is True
            if not params.user_groups_only:
                query = query.filter(Group.visibility == GroupVisibility.PUBLIC.value)
        
        if params.category_id:
            query = query.join(GroupCategoryMapping).filter(
                GroupCategoryMapping.category_id == params.category_id
            )
        
        if params.search:
            search_term = f"%{params.search}%"
            query = query.filter(
                or_(
                    Group.name.ilike(search_term),
                    Group.description.ilike(search_term)
                )
            )
        
        if params.user_groups_only and user_id:
            query = query.join(GroupMembership).filter(
                GroupMembership.user_id == user_id,
                GroupMembership.membership_status == MembershipStatus.ACTIVE.value
            )
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination and ordering
        groups = query.order_by(desc(Group.member_count), desc(Group.created_at)).offset(
            (params.page - 1) * params.size
        ).limit(params.size).all()
        
        # Build responses
        group_responses = [self._build_group_response(group, user_id) for group in groups]
        
        # Calculate pagination info
        pages = (total_count + params.size - 1) // params.size if params.size > 0 else 0
        has_next = (params.page * params.size) < total_count
        has_prev = params.page > 1
        
        return PaginatedAPIResponse(
            data=group_responses,
            pagination=PaginationSchema(
                total=total_count,
                page=params.page,
                per_page=params.size,
                pages=pages,
                has_next=has_next,
                has_prev=has_prev
            )
        )
    
    def update_group(self, group_id: int, group_data: GroupUpdateRequest, user_id: int) -> GroupResponse:
        """Update group information."""
        group = self.db.query(Group).filter(Group.group_id == group_id).first()
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        # Check permissions
        membership = self.get_user_membership(group_id, user_id)
        if not membership or membership.role not in [MembershipRole.OWNER.value, MembershipRole.ADMIN.value]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Update fields
        update_data = group_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == "category_ids":
                continue  # Handle separately
            if hasattr(group, field):
                setattr(group, field, value)
        
        # Handle category updates
        if group_data.category_ids is not None:
            # Remove existing mappings
            self.db.query(GroupCategoryMapping).filter(
                GroupCategoryMapping.group_id == group_id
            ).delete()
            
            # Add new mappings
            for category_id in group_data.category_ids:
                category_mapping = GroupCategoryMapping(
                    group_id=group_id,
                    category_id=category_id
                )
                self.db.add(category_mapping)
        
        group.updated_at = datetime.utcnow()
        self.db.commit()
        
        return self._build_group_response(group, user_id)
    
    # Membership Management
    
    def join_group(self, group_id: int, user_id: int, join_reason: Optional[str] = None) -> GroupMembershipResponse:
        """Join a group or request to join."""
        group = self.db.query(Group).filter(Group.group_id == group_id).first()
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        # Check if already a member
        existing_membership = self.get_user_membership(group_id, user_id)
        if existing_membership:
            if existing_membership.membership_status == MembershipStatus.ACTIVE.value:
                raise HTTPException(status_code=400, detail="Already a member of this group")
            elif existing_membership.membership_status == MembershipStatus.PENDING.value:
                raise HTTPException(status_code=400, detail="Membership request already pending")
        
        # Check group capacity
        if group.member_count >= group.max_members:
            raise HTTPException(status_code=400, detail="Group has reached maximum capacity")
        
        # Determine membership status based on group visibility
        if group.visibility == GroupVisibility.PUBLIC.value:
            membership_status = MembershipStatus.ACTIVE.value
        else:
            membership_status = MembershipStatus.PENDING.value
        
        # Create membership
        membership = GroupMembership(
            group_id=group_id,
            user_id=user_id,
            role=MembershipRole.MEMBER.value,
            membership_status=membership_status,
            join_reason=join_reason
        )
        
        self.db.add(membership)
        self.db.commit()
        
        return self._build_membership_response(membership)
    
    def leave_group(self, group_id: int, user_id: int) -> Dict[str, str]:
        """Leave a group."""
        membership = self.get_user_membership(group_id, user_id)
        if not membership:
            raise HTTPException(status_code=404, detail="Not a member of this group")
        
        if membership.role == MembershipRole.OWNER.value:
            raise HTTPException(status_code=400, detail="Owner cannot leave group. Transfer ownership first.")
        
        # Update membership status
        membership.membership_status = MembershipStatus.LEFT.value
        membership.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        return {"message": "Successfully left the group"}
    
    def get_group_members(self, group_id: int, params: GroupMemberListParams, requesting_user_id: Optional[int] = None) -> PaginatedAPIResponse[GroupMembershipResponse]:
        """Get paginated list of group members."""
        # Verify group exists and user has access
        group = self.db.query(Group).filter(Group.group_id == group_id).first()
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        query = self.db.query(GroupMembership).filter(
            GroupMembership.group_id == group_id
        ).options(joinedload(GroupMembership.user))
        
        # Apply filters
        if params.role:
            query = query.filter(GroupMembership.role == params.role.value)
        
        if params.status:
            query = query.filter(GroupMembership.membership_status == params.status.value)
        
        if params.search:
            search_term = f"%{params.search}%"
            query = query.join(User).filter(
                or_(
                    User.username.ilike(search_term),
                    User.display_name.ilike(search_term),
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term)
                )
            )
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination and ordering
        memberships = query.order_by(
            GroupMembership.role,
            desc(GroupMembership.joined_at)
        ).offset((params.page - 1) * params.size).limit(params.size).all()
        
        # Build responses
        membership_responses = [self._build_membership_response(m) for m in memberships]
        
        # Calculate pagination info
        pages = (total_count + params.size - 1) // params.size if params.size > 0 else 0
        has_next = (params.page * params.size) < total_count
        has_prev = params.page > 1
        
        return PaginatedAPIResponse(
            data=membership_responses,
            pagination=PaginationSchema(
                total=total_count,
                page=params.page,
                per_page=params.size,
                pages=pages,
                has_next=has_next,
                has_prev=has_prev
            )
        )
    
    # Invitation Management
    
    def invite_user(self, group_id: int, inviter_id: int, invitation_data: GroupInvitationRequest) -> GroupInvitationResponse:
        """Invite a user to join a group."""
        group = self.db.query(Group).filter(Group.group_id == group_id).first()
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        # Check inviter permissions
        inviter_membership = self.get_user_membership(group_id, inviter_id)
        if not inviter_membership or not inviter_membership.can_invite_members:
            raise HTTPException(status_code=403, detail="No permission to invite users")
        
        # Check if user exists
        invitee = self.db.query(User).filter(User.user_id == invitation_data.invitee_id).first()
        if not invitee:
            raise HTTPException(status_code=404, detail="User to invite not found")
        
        # Check if already a member or has pending invitation
        existing_membership = self.get_user_membership(group_id, invitation_data.invitee_id)
        if existing_membership:
            raise HTTPException(status_code=400, detail="User is already a member")
        
        existing_invitation = self.db.query(GroupInvitation).filter(
            GroupInvitation.group_id == group_id,
            GroupInvitation.invitee_id == invitation_data.invitee_id,
            GroupInvitation.status == InvitationStatus.PENDING.value
        ).first()
        if existing_invitation:
            raise HTTPException(status_code=400, detail="Invitation already pending")
        
        # Create invitation
        invitation = GroupInvitation(
            group_id=group_id,
            inviter_id=inviter_id,
            invitee_id=invitation_data.invitee_id,
            invitation_message=invitation_data.invitation_message,
            suggested_role=invitation_data.suggested_role.value,
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        
        self.db.add(invitation)
        self.db.commit()
        
        return self._build_invitation_response(invitation)
    
    def respond_to_invitation(self, invitation_id: int, user_id: int, action: str, response_message: Optional[str] = None) -> Dict[str, str]:
        """Respond to a group invitation."""
        invitation = self.db.query(GroupInvitation).filter(
            GroupInvitation.invitation_id == invitation_id,
            GroupInvitation.invitee_id == user_id,
            GroupInvitation.status == InvitationStatus.PENDING.value
        ).first()
        
        if not invitation:
            raise HTTPException(status_code=404, detail="Invitation not found")
        
        # Check if invitation has expired
        if invitation.expires_at and invitation.expires_at < datetime.utcnow():
            invitation.status = InvitationStatus.EXPIRED.value
            self.db.commit()
            raise HTTPException(status_code=400, detail="Invitation has expired")
        
        if action == "accept":
            # Create membership
            membership = GroupMembership(
                group_id=invitation.group_id,
                user_id=user_id,
                role=invitation.suggested_role,
                membership_status=MembershipStatus.ACTIVE.value,
                invited_by=invitation.inviter_id,
                join_reason="Accepted invitation"
            )
            self.db.add(membership)
            invitation.status = InvitationStatus.ACCEPTED.value
            message = "Invitation accepted successfully"
        
        elif action == "decline":
            invitation.status = InvitationStatus.DECLINED.value
            message = "Invitation declined"
        
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
        
        invitation.response_message = response_message
        invitation.responded_at = datetime.utcnow()
        
        self.db.commit()
        
        return {"message": message}
    
    # Review Integration
    
    def get_group_reviews(self, group_id: int, page: int = 1, size: int = 20, user_id: Optional[int] = None) -> List[Dict]:
        """Get reviews posted in a specific group."""
        group = self.db.query(Group).filter(Group.group_id == group_id).first()
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        query = self.db.query(Review).filter(Review.group_id == group_id)
        
        # Apply visibility filters
        if user_id and self.is_user_member(group_id, user_id):
            # Group member can see all reviews posted in group
            query = query.filter(
                Review.review_scope.in_([ReviewScope.GROUP_ONLY.value, ReviewScope.MIXED.value, ReviewScope.PUBLIC.value])
            )
        else:
            # Non-members can only see public and mixed reviews
            query = query.filter(
                Review.review_scope.in_([ReviewScope.PUBLIC.value, ReviewScope.MIXED.value])
            )
        
        # Get reviews with pagination
        reviews = query.order_by(desc(Review.created_at)).offset(
            (page - 1) * size
        ).limit(size).all()
        
        return [review.to_dict() for review in reviews]
    
    def update_review_scope(self, review_id: int, user_id: int, scope_data: ReviewScopeRequest) -> Dict[str, str]:
        """Update review visibility scope."""
        review = self.db.query(Review).filter(
            Review.review_id == review_id,
            Review.user_id == user_id
        ).first()
        
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        # Update review scope and settings
        review.review_scope = scope_data.review_scope.value
        review.group_context = scope_data.group_context
        review.visibility_settings = scope_data.visibility_settings
        review.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        return {"message": "Review scope updated successfully"}
    
    # Helper Methods
    
    def get_user_membership(self, group_id: int, user_id: int) -> Optional[GroupMembership]:
        """Get user's membership in a group."""
        return self.db.query(GroupMembership).filter(
            GroupMembership.group_id == group_id,
            GroupMembership.user_id == user_id
        ).first()
    
    def is_user_member(self, group_id: int, user_id: int) -> bool:
        """Check if user is an active member of a group."""
        membership = self.get_user_membership(group_id, user_id)
        return membership and membership.membership_status == MembershipStatus.ACTIVE.value
    
    def _build_group_response(self, group: Group, user_id: Optional[int] = None) -> GroupResponse:
        """Build a complete group response with related data."""
        # Get categories
        categories = self.db.query(GroupCategory).join(GroupCategoryMapping).filter(
            GroupCategoryMapping.group_id == group.group_id
        ).all()
        
        # Get creator
        creator = None
        if group.created_by:
            creator_user = self.db.query(User).filter(User.user_id == group.created_by).first()
            if creator_user:
                creator = {
                    "user_id": creator_user.user_id,
                    "username": creator_user.username,
                    "display_name": creator_user.display_name,
                    "avatar_url": getattr(creator_user, 'avatar_url', None)
                }
        
        # Get user membership if user_id provided
        user_membership = None
        if user_id:
            membership = self.get_user_membership(group.group_id, user_id)
            if membership:
                user_membership = self._build_membership_response(membership)
        
        return GroupResponse(
            group_id=group.group_id,
            name=group.name,
            description=group.description,
            group_type=GroupType(group.group_type),
            visibility=GroupVisibility(group.visibility),
            avatar_url=group.avatar_url,
            cover_image_url=group.cover_image_url,
            allow_public_reviews=group.allow_public_reviews,
            require_approval_for_reviews=group.require_approval_for_reviews,
            max_members=group.max_members,
            created_by=group.created_by,
            member_count=group.member_count,
            review_count=group.review_count,
            active_members_count=group.active_members_count,
            is_active=group.is_active,
            is_verified=group.is_verified,
            rules_and_guidelines=group.rules_and_guidelines,
            external_links=group.external_links or [],
            group_metadata=group.group_metadata or {},
            categories=[{
                "category_id": cat.category_id,
                "name": cat.name,
                "description": cat.description,
                "icon": cat.icon,
                "color_code": cat.color_code,
                "parent_category_id": cat.parent_category_id,
                "sort_order": cat.sort_order
            } for cat in categories],
            creator=creator,
            user_membership=user_membership,
            created_at=group.created_at,
            updated_at=group.updated_at
        )
    
    def _build_membership_response(self, membership: GroupMembership) -> GroupMembershipResponse:
        """Build membership response with user data."""
        user_data = None
        if membership.user:
            user_data = {
                "user_id": membership.user.user_id,
                "username": membership.user.username,
                "display_name": membership.user.display_name,
                "first_name": membership.user.first_name,
                "last_name": membership.user.last_name,
                "avatar_url": getattr(membership.user, 'avatar_url', None)
            }
        
        return GroupMembershipResponse(
            membership_id=membership.membership_id,
            group_id=membership.group_id,
            user_id=membership.user_id,
            role=MembershipRole(membership.role),
            membership_status=MembershipStatus(membership.membership_status),
            can_post_reviews=membership.can_post_reviews,
            can_moderate_content=membership.can_moderate_content,
            can_invite_members=membership.can_invite_members,
            can_manage_group=membership.can_manage_group,
            reviews_count=membership.reviews_count,
            last_activity_at=membership.last_activity_at,
            contribution_score=membership.contribution_score,
            joined_at=membership.joined_at,
            invited_by=membership.invited_by,
            join_reason=membership.join_reason,
            user=user_data,
            created_at=membership.created_at,
            updated_at=membership.updated_at
        )
    
    def _build_invitation_response(self, invitation: GroupInvitation) -> GroupInvitationResponse:
        """Build invitation response with related data."""
        return GroupInvitationResponse(
            invitation_id=invitation.invitation_id,
            group_id=invitation.group_id,
            inviter_id=invitation.inviter_id,
            invitee_id=invitation.invitee_id,
            invitation_message=invitation.invitation_message,
            suggested_role=MembershipRole(invitation.suggested_role),
            status=InvitationStatus(invitation.status),
            response_message=invitation.response_message,
            created_at=invitation.created_at,
            responded_at=invitation.responded_at,
            expires_at=invitation.expires_at
        )