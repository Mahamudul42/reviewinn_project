"""
View Tracking Service - Industry Standard Implementation
Rate-limited, fraud-resistant view counting system
"""
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, or_
from datetime import datetime, timedelta
from fastapi import Request
from models.view_tracking import ReviewView, EntityView, ViewAnalytics
from models.user import User
from models.review import Review
from models.entity import Entity
import hashlib
import json

class ViewTrackingService:
    """Service for tracking and managing view counts with industry best practices"""
    
    def __init__(self, db: Session):
        self.db = db
        self.rate_limit_hours = 24  # One view per user per content per 24 hours
        self.session_timeout_hours = 4  # Session-based rate limiting
        
    async def track_review_view(
        self, 
        review_id: int, 
        request: Request, 
        user: Optional[User] = None
    ) -> Dict[str, Any]:
        """
        Track a review view with industry-standard rate limiting and fraud prevention
        
        Returns:
        - tracked: bool - Whether the view was tracked
        - reason: str - Reason if not tracked
        - view_count: int - Updated view count
        """
        # Get client information
        ip_address = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        session_id = self._generate_session_id(ip_address, user_agent)
        
        # Check if review exists
        review = self.db.query(Review).filter(Review.review_id == review_id).first()
        if not review:
            return {"tracked": False, "reason": "Review not found", "view_count": 0}
        
        # Industry best practice: Track views for both authenticated and anonymous users
        # Anonymous users: tracked by IP + session with shorter rate limit
        # Authenticated users: tracked by user ID with longer rate limit
        if not user:
            # Anonymous user tracking (by IP + session)
            rate_limit_hours = 1  # 1 hour for anonymous users
            rate_limit_cutoff = datetime.now() - timedelta(hours=rate_limit_hours)
            
            # Check if this IP/session already viewed this review recently
            existing_anonymous_view = self.db.query(ReviewView).filter(
                and_(
                    ReviewView.review_id == review_id,
                    ReviewView.ip_address == ip_address,
                    ReviewView.session_id == session_id,
                    ReviewView.viewed_at > rate_limit_cutoff,
                    ReviewView.is_valid == True
                )
            ).first()
            
            if existing_anonymous_view:
                return {
                    "tracked": False,
                    "reason": f"IP rate limited - please wait {rate_limit_hours} hour(s) between views",
                    "view_count": review.view_count or 0
                }
            
            # Create anonymous view record
            view_record = ReviewView(
                review_id=review_id,
                user_id=None,  # Anonymous
                ip_address=ip_address,
                user_agent=user_agent[:500],
                session_id=session_id,
                expires_at=datetime.now() + timedelta(hours=rate_limit_hours),
                is_unique_user=False,  # Anonymous views don't count as unique users
                is_unique_session=True,  # But do count as unique sessions
                is_valid=True
            )
            
            self.db.add(view_record)
            
            try:
                # Update review view count (atomic operation)
                self.db.query(Review).filter(Review.review_id == review_id).update({
                    "view_count": func.coalesce(Review.view_count, 0) + 1
                })
                
                self.db.flush()
                self.db.commit()
            except Exception as e:
                self.db.rollback()
                raise Exception(f"Failed to update view count: {str(e)}")
            
            # Get updated count
            updated_review = self.db.query(Review).filter(Review.review_id == review_id).first()
            
            return {
                "tracked": True,
                "reason": "Anonymous view tracked by IP",
                "view_count": updated_review.view_count,
                "is_unique_user": False,
                "is_unique_session": True
            }
        
        # Authenticated user tracking with enhanced duplicate prevention
        # Check rate limiting (24-hour window per user)
        rate_limit_cutoff = datetime.now() - timedelta(hours=self.rate_limit_hours)
        existing_view = self.db.query(ReviewView).filter(
            and_(
                ReviewView.review_id == review_id,
                ReviewView.user_id == user.user_id,
                ReviewView.viewed_at > rate_limit_cutoff,
                ReviewView.is_valid == True
            )
        ).first()
        
        if existing_view:
            return {
                "tracked": False,
                "reason": f"Rate limited - please wait {self.rate_limit_hours} hours between views",
                "view_count": review.view_count or 0
            }
        
        # Additional check for very recent views (prevent rapid double-clicking)
        recent_cutoff = datetime.now() - timedelta(seconds=30)  # 30 seconds prevention window
        very_recent_view = self.db.query(ReviewView).filter(
            and_(
                ReviewView.review_id == review_id,
                ReviewView.user_id == user.user_id,
                ReviewView.viewed_at > recent_cutoff,
                ReviewView.is_valid == True
            )
        ).first()
        
        if very_recent_view:
            return {
                "tracked": False,
                "reason": "Duplicate request - view already processed",
                "view_count": review.view_count or 0
            }
        
        # Additional fraud prevention: Check for suspicious patterns
        if await self._is_suspicious_activity(review_id, user.user_id, ip_address, session_id):
            return {
                "tracked": False,
                "reason": "Suspicious activity detected",
                "view_count": review.view_count or 0
            }
        
        # Check if this is a unique user view
        is_unique_user = not self.db.query(ReviewView).filter(
            and_(
                ReviewView.review_id == review_id,
                ReviewView.user_id == user.user_id,
                ReviewView.is_valid == True
            )
        ).first()
        
        # Check if this is a unique session view
        is_unique_session = not self.db.query(ReviewView).filter(
            and_(
                ReviewView.review_id == review_id,
                ReviewView.session_id == session_id,
                ReviewView.viewed_at > datetime.now() - timedelta(hours=self.session_timeout_hours)
            )
        ).first()
        
        # Create view record
        view_record = ReviewView(
            review_id=review_id,
            user_id=user.user_id,
            ip_address=ip_address,
            user_agent=user_agent[:500],  # Truncate long user agents
            session_id=session_id,
            expires_at=datetime.now() + timedelta(hours=self.rate_limit_hours),
            is_unique_user=is_unique_user,
            is_unique_session=is_unique_session,
            is_valid=True
        )
        
        self.db.add(view_record)
        
        try:
            # Update review view count (atomic operation)
            self.db.query(Review).filter(Review.review_id == review_id).update({
                "view_count": func.coalesce(Review.view_count, 0) + 1
            })
            
            # Add view record first
            self.db.flush()  # Ensure view record is persisted before analytics
            
            # Update analytics asynchronously (in background)
            await self._update_review_analytics(review_id, is_unique_user, is_unique_session)
            
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Failed to update view count: {str(e)}")
        
        # Get updated count
        updated_review = self.db.query(Review).filter(Review.review_id == review_id).first()
        
        return {
            "tracked": True,
            "reason": "View tracked successfully",
            "view_count": updated_review.view_count,
            "is_unique_user": is_unique_user,
            "is_unique_session": is_unique_session
        }
    
    async def track_entity_view(
        self, 
        entity_id: int, 
        request: Request, 
        user: Optional[User] = None
    ) -> Dict[str, Any]:
        """Track entity view with same industry standards as review views"""
        
        # Get client information
        ip_address = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        session_id = self._generate_session_id(ip_address, user_agent)
        
        # Check if entity exists
        entity = self.db.query(Entity).filter(Entity.entity_id == entity_id).first()
        if not entity:
            return {"tracked": False, "reason": "Entity not found", "view_count": 0}
        
        # Track views for both authenticated and anonymous users
        if not user:
            # Anonymous user tracking (by IP + session)
            rate_limit_hours = 1  # 1 hour for anonymous users
            rate_limit_cutoff = datetime.now() - timedelta(hours=rate_limit_hours)
            
            # Check if this IP/session already viewed this entity recently
            existing_anonymous_view = self.db.query(EntityView).filter(
                and_(
                    EntityView.entity_id == entity_id,
                    EntityView.ip_address == ip_address,
                    EntityView.session_id == session_id,
                    EntityView.viewed_at > rate_limit_cutoff,
                    EntityView.is_valid == True
                )
            ).first()
            
            if existing_anonymous_view:
                return {
                    "tracked": False,
                    "reason": f"IP rate limited - please wait {rate_limit_hours} hour(s) between views",
                    "view_count": getattr(entity, 'view_count', 0)
                }
            
            # Create anonymous view record
            view_record = EntityView(
                entity_id=entity_id,
                user_id=None,  # Anonymous
                ip_address=ip_address,
                user_agent=user_agent[:500],
                session_id=session_id,
                expires_at=datetime.now() + timedelta(hours=rate_limit_hours),
                is_unique_user=False,  # Anonymous views don't count as unique users
                is_valid=True
            )
            
            self.db.add(view_record)
            
            try:
                # Update entity view count if column exists
                try:
                    self.db.query(Entity).filter(Entity.entity_id == entity_id).update({
                        "view_count": func.coalesce(Entity.view_count, 0) + 1
                    })
                except Exception as entity_error:
                    print(f"Entity view_count column might not exist: {entity_error}")
                
                self.db.flush()
                self.db.commit()
            except Exception as e:
                self.db.rollback()
                raise Exception(f"Failed to update entity view count: {str(e)}")
            
            # Get updated entity to return current view count
            updated_entity = self.db.query(Entity).filter(Entity.entity_id == entity_id).first()
            
            return {
                "tracked": True,
                "reason": "Anonymous view tracked by IP",
                "view_count": getattr(updated_entity, 'view_count', 1) if updated_entity else 1,
                "is_unique_user": False
            }
        
        # Authenticated user tracking with enhanced duplicate prevention
        # Check rate limiting (24-hour window per user)
        rate_limit_cutoff = datetime.now() - timedelta(hours=self.rate_limit_hours)
        existing_view = self.db.query(EntityView).filter(
            and_(
                EntityView.entity_id == entity_id,
                EntityView.user_id == user.user_id,
                EntityView.viewed_at > rate_limit_cutoff,
                EntityView.is_valid == True
            )
        ).first()
        
        if existing_view:
            return {
                "tracked": False,
                "reason": f"Rate limited - please wait {self.rate_limit_hours} hours between views",
                "view_count": getattr(entity, 'view_count', 0)
            }
        
        # Additional check for very recent views (prevent rapid double-clicking)
        recent_cutoff = datetime.now() - timedelta(seconds=30)  # 30 seconds prevention window
        very_recent_view = self.db.query(EntityView).filter(
            and_(
                EntityView.entity_id == entity_id,
                EntityView.user_id == user.user_id,
                EntityView.viewed_at > recent_cutoff,
                EntityView.is_valid == True
            )
        ).first()
        
        if very_recent_view:
            return {
                "tracked": False,
                "reason": "Duplicate request - view already processed",
                "view_count": getattr(entity, 'view_count', 0)
            }
        
        # Create view record
        is_unique_user = not self.db.query(EntityView).filter(
            and_(
                EntityView.entity_id == entity_id,
                EntityView.user_id == user.user_id,
                EntityView.is_valid == True
            )
        ).first()
        
        view_record = EntityView(
            entity_id=entity_id,
            user_id=user.user_id,
            ip_address=ip_address,
            user_agent=user_agent[:500],
            session_id=session_id,
            expires_at=datetime.now() + timedelta(hours=self.rate_limit_hours),
            is_unique_user=is_unique_user,
            is_valid=True
        )
        
        self.db.add(view_record)
        
        try:
            # Update entity view count if column exists
            try:
                self.db.query(Entity).filter(Entity.entity_id == entity_id).update({
                    "view_count": func.coalesce(Entity.view_count, 0) + 1
                })
            except Exception as entity_error:
                # Column might not exist yet, log the error but continue
                print(f"Entity view_count column might not exist: {entity_error}")
            
            # Flush to ensure view record is persisted
            self.db.flush()
            
            await self._update_entity_analytics(entity_id, is_unique_user)
            
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Failed to update entity view count: {str(e)}")
        
        # Get updated entity to return current view count
        updated_entity = self.db.query(Entity).filter(Entity.entity_id == entity_id).first()
        
        return {
            "tracked": True,
            "reason": "View tracked successfully",
            "view_count": getattr(updated_entity, 'view_count', 1) if updated_entity else 1,
            "is_unique_user": is_unique_user
        }
    
    async def _is_suspicious_activity(
        self, 
        content_id: int, 
        user_id: int, 
        ip_address: str, 
        session_id: str
    ) -> bool:
        """Detect suspicious viewing patterns"""
        
        # Check for rapid-fire views from same IP in short time window
        recent_cutoff = datetime.now() - timedelta(minutes=5)
        recent_views_from_ip = self.db.query(ReviewView).filter(
            and_(
                ReviewView.ip_address == ip_address,
                ReviewView.viewed_at > recent_cutoff
            )
        ).count()
        
        # More than 10 views from same IP in 5 minutes is suspicious
        if recent_views_from_ip > 10:
            return True
        
        # Check for user viewing same content multiple times rapidly
        user_recent_views = self.db.query(ReviewView).filter(
            and_(
                ReviewView.review_id == content_id,
                ReviewView.user_id == user_id,
                ReviewView.viewed_at > recent_cutoff
            )
        ).count()
        
        if user_recent_views > 3:
            return True
        
        return False
    
    async def _update_review_analytics(
        self, 
        review_id: int, 
        is_unique_user: bool, 
        is_unique_session: bool
    ):
        """Update aggregated analytics for review"""
        
        analytics = self.db.query(ViewAnalytics).filter(
            and_(
                ViewAnalytics.content_type == 'review',
                ViewAnalytics.content_id == review_id
            )
        ).first()
        
        if not analytics:
            analytics = ViewAnalytics(
                content_type='review',
                content_id=review_id,
                total_views=1,
                unique_users=1 if is_unique_user else 0,
                unique_sessions=1 if is_unique_session else 0,
                valid_views=1,
                views_today=1,
                views_this_week=1,
                views_this_month=1,
                last_view_at=datetime.now()
            )
            self.db.add(analytics)
        else:
            # Update existing analytics
            analytics.total_views += 1
            analytics.valid_views += 1
            if is_unique_user:
                analytics.unique_users += 1
            if is_unique_session:
                analytics.unique_sessions += 1
            analytics.last_view_at = datetime.now()
            
            # Update time-based counts (would need more sophisticated logic in production)
            analytics.views_today += 1
            analytics.views_this_week += 1
            analytics.views_this_month += 1
    
    async def _update_entity_analytics(self, entity_id: int, is_unique_user: bool):
        """Update aggregated analytics for entity"""
        
        analytics = self.db.query(ViewAnalytics).filter(
            and_(
                ViewAnalytics.content_type == 'entity',
                ViewAnalytics.content_id == entity_id
            )
        ).first()
        
        if not analytics:
            analytics = ViewAnalytics(
                content_type='entity',
                content_id=entity_id,
                total_views=1,
                unique_users=1 if is_unique_user else 0,
                valid_views=1,
                last_view_at=datetime.now()
            )
            self.db.add(analytics)
        else:
            analytics.total_views += 1
            analytics.valid_views += 1
            if is_unique_user:
                analytics.unique_users += 1
            analytics.last_view_at = datetime.now()
    
    async def get_review_analytics(
        self, 
        review_id: int, 
        requesting_user: User
    ) -> Dict[str, Any]:
        """
        Get comprehensive analytics for a review.
        
        Includes permission checking to ensure only authorized users
        can access analytics (review author, admins, or entity owners).
        
        Args:
            review_id: The ID of the review
            requesting_user: The user requesting analytics
            
        Returns:
            Dictionary with comprehensive analytics data
            
        Raises:
            PermissionError: If user doesn't have permission to view analytics
        """
        # Get the review to check permissions
        review = self.db.query(Review).filter(Review.review_id == review_id).first()
        if not review:
            raise ValueError("Review not found")
        
        # Check permissions
        # Users can view analytics for their own reviews
        # Admins can view all analytics
        # Entity owners can view analytics for reviews on their entities
        has_permission = (
            review.user_id == requesting_user.user_id or  # Review author
            requesting_user.is_admin or  # Admin user
            self._user_owns_entity(requesting_user.user_id, review.entity_id)  # Entity owner
        )
        
        if not has_permission:
            raise PermissionError("You don't have permission to view analytics for this review")
        
        # Get analytics using the existing method
        analytics = self.get_content_analytics("review", review_id)
        
        if not analytics:
            # Return default analytics if none exist yet
            analytics = {
                "total_views": review.view_count or 0,
                "unique_users": 0,
                "unique_sessions": 0,
                "valid_views": 0,
                "views_today": 0,
                "views_this_week": 0,
                "views_this_month": 0,
                "last_view_at": None
            }
        
        # Add additional review-specific metrics
        analytics.update({
            "review_id": review_id,
            "review_title": review.title,
            "review_rating": review.overall_rating,
            "entity_id": review.entity_id,
            "created_at": review.created_at.isoformat() if review.created_at else None
        })
        
        return analytics
    
    def _user_owns_entity(self, user_id: int, entity_id: int) -> bool:
        """Check if a user owns/manages an entity"""
        # This would need to be implemented based on your entity ownership model
        # For now, return False (only review authors and admins can see analytics)
        return False

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address with proxy support"""
        # Check for real IP in headers (common with load balancers/proxies)
        forwarded_ips = request.headers.get("x-forwarded-for")
        if forwarded_ips:
            return forwarded_ips.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fallback to direct client IP
        return request.client.host if request.client else "unknown"
    
    def _generate_session_id(self, ip_address: str, user_agent: str) -> str:
        """Generate a session ID based on IP and user agent"""
        session_data = f"{ip_address}:{user_agent}:{datetime.now().strftime('%Y-%m-%d-%H')}"
        return hashlib.md5(session_data.encode()).hexdigest()[:32]
    
    def get_content_analytics(self, content_type: str, content_id: int) -> Optional[Dict[str, Any]]:
        """Get comprehensive analytics for content"""
        
        analytics = self.db.query(ViewAnalytics).filter(
            and_(
                ViewAnalytics.content_type == content_type,
                ViewAnalytics.content_id == content_id
            )
        ).first()
        
        if analytics:
            return {
                "total_views": analytics.total_views,
                "unique_users": analytics.unique_users,
                "unique_sessions": analytics.unique_sessions,
                "valid_views": analytics.valid_views,
                "views_today": analytics.views_today,
                "views_this_week": analytics.views_this_week,
                "views_this_month": analytics.views_this_month,
                "last_view_at": analytics.last_view_at.isoformat() if analytics.last_view_at else None
            }
        
        return None
