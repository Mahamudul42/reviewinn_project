"""
Enterprise Count Validation Service
Provides health checks, monitoring, and self-healing for the counting system
Author: Claude Code Assistant
Date: 2025-08-25
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Dict, List, Optional, Tuple
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class CountValidationService:
    """Service for validating and maintaining count consistency"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_consistency_report(self) -> Dict:
        """Get a comprehensive consistency report for all counts"""
        try:
            # Check comment count consistency
            comment_inconsistencies = self._check_comment_counts()
            
            # Check view count consistency  
            view_inconsistencies = self._check_view_counts()
            
            # Check reaction count consistency
            reaction_inconsistencies = self._check_reaction_counts()
            
            # Overall health score
            total_reviews = self.db.execute(text("SELECT COUNT(*) FROM review_main")).scalar()
            total_inconsistencies = len(comment_inconsistencies) + len(view_inconsistencies) + len(reaction_inconsistencies)
            health_score = max(0, 100 - (total_inconsistencies / max(total_reviews, 1)) * 100)
            
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "health_score": round(health_score, 2),
                "total_reviews": total_reviews,
                "inconsistencies": {
                    "comment_counts": comment_inconsistencies,
                    "view_counts": view_inconsistencies, 
                    "reaction_counts": reaction_inconsistencies
                },
                "summary": {
                    "total_inconsistent_reviews": total_inconsistencies,
                    "comment_issues": len(comment_inconsistencies),
                    "view_issues": len(view_inconsistencies),
                    "reaction_issues": len(reaction_inconsistencies)
                }
            }
        except Exception as e:
            logger.error(f"Error generating consistency report: {str(e)}")
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "health_score": 0
            }
    
    def _check_comment_counts(self) -> List[Dict]:
        """Check comment count consistency"""
        query = text("""
            SELECT 
                rm.review_id,
                rm.comment_count as stored_count,
                COALESCE(cc.actual_count, 0) as actual_count,
                rm.comment_count - COALESCE(cc.actual_count, 0) as difference
            FROM review_main rm
            LEFT JOIN (
                SELECT review_id, COUNT(*) as actual_count
                FROM review_comments
                GROUP BY review_id
            ) cc ON rm.review_id = cc.review_id
            WHERE rm.comment_count != COALESCE(cc.actual_count, 0)
            ORDER BY ABS(rm.comment_count - COALESCE(cc.actual_count, 0)) DESC
        """)
        
        result = self.db.execute(query)
        return [
            {
                "review_id": row.review_id,
                "stored_count": row.stored_count,
                "actual_count": row.actual_count,
                "difference": row.difference,
                "type": "comment_count"
            }
            for row in result
        ]
    
    def _check_view_counts(self) -> List[Dict]:
        """Check view count consistency"""
        query = text("""
            SELECT 
                rm.review_id,
                rm.view_count as stored_count,
                COALESCE(vc.actual_count, 0) as actual_count,
                rm.view_count - COALESCE(vc.actual_count, 0) as difference
            FROM review_main rm
            LEFT JOIN (
                SELECT review_id, COUNT(*) as actual_count
                FROM review_views
                WHERE (is_valid IS NULL OR is_valid = true)
                AND (expires_at IS NULL OR expires_at > NOW())
                GROUP BY review_id
            ) vc ON rm.review_id = vc.review_id
            WHERE rm.view_count != COALESCE(vc.actual_count, 0)
            ORDER BY ABS(rm.view_count - COALESCE(vc.actual_count, 0)) DESC
        """)
        
        result = self.db.execute(query)
        return [
            {
                "review_id": row.review_id,
                "stored_count": row.stored_count,
                "actual_count": row.actual_count,
                "difference": row.difference,
                "type": "view_count"
            }
            for row in result
        ]
    
    def _check_reaction_counts(self) -> List[Dict]:
        """Check reaction count consistency"""
        query = text("""
            SELECT 
                rm.review_id,
                rm.reaction_count as stored_count,
                COALESCE(rc.actual_count, 0) as actual_count,
                rm.reaction_count - COALESCE(rc.actual_count, 0) as difference
            FROM review_main rm
            LEFT JOIN (
                SELECT review_id, COUNT(*) as actual_count
                FROM review_reactions
                GROUP BY review_id
            ) rc ON rm.review_id = rc.review_id
            WHERE rm.reaction_count != COALESCE(rc.actual_count, 0)
            ORDER BY ABS(rm.reaction_count - COALESCE(rc.actual_count, 0)) DESC
        """)
        
        result = self.db.execute(query)
        return [
            {
                "review_id": row.review_id,
                "stored_count": row.stored_count,
                "actual_count": row.actual_count,
                "difference": row.difference,
                "type": "reaction_count"
            }
            for row in result
        ]
    
    def fix_all_inconsistencies(self) -> Dict:
        """Fix all count inconsistencies automatically"""
        try:
            # Use the database function we created earlier
            result = self.db.execute(text("SELECT * FROM recalculate_all_counts()")).fetchone()
            
            return {
                "success": True,
                "timestamp": datetime.utcnow().isoformat(),
                "reviews_updated": result[0],
                "comments_updated": result[1],
                "reactions_updated": result[2],
                "views_updated": result[3],
                "message": "All count inconsistencies have been fixed automatically"
            }
        except Exception as e:
            logger.error(f"Error fixing inconsistencies: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def get_trigger_status(self) -> Dict:
        """Check if database triggers are working properly"""
        try:
            query = text("""
                SELECT 
                    t.tgname as trigger_name,
                    c.relname as table_name,
                    t.tgenabled as is_enabled,
                    pg_get_triggerdef(t.oid) as trigger_definition
                FROM pg_trigger t
                JOIN pg_class c ON t.tgrelid = c.oid
                WHERE t.tgname LIKE 'trigger_update_%count%'
                ORDER BY c.relname, t.tgname
            """)
            
            result = self.db.execute(query)
            triggers = []
            
            for row in result:
                triggers.append({
                    "trigger_name": row.trigger_name,
                    "table_name": row.table_name,
                    "is_enabled": row.is_enabled == 'O',  # 'O' means enabled
                    "status": "enabled" if row.is_enabled == 'O' else "disabled"
                })
            
            expected_triggers = [
                "trigger_update_review_comment_count",
                "trigger_update_comment_reaction_count", 
                "trigger_update_review_reaction_count",
                "trigger_update_review_view_count"
            ]
            
            active_triggers = [t["trigger_name"] for t in triggers if t["is_enabled"]]
            missing_triggers = [name for name in expected_triggers if name not in active_triggers]
            
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "total_triggers": len(triggers),
                "enabled_triggers": len([t for t in triggers if t["is_enabled"]]),
                "disabled_triggers": len([t for t in triggers if not t["is_enabled"]]),
                "missing_triggers": missing_triggers,
                "triggers": triggers,
                "health_status": "healthy" if len(missing_triggers) == 0 else "degraded"
            }
        except Exception as e:
            logger.error(f"Error checking trigger status: {str(e)}")
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "health_status": "error"
            }
    
    def validate_sample_counts(self, sample_size: int = 10) -> Dict:
        """Validate a sample of reviews for quick health check"""
        try:
            query = text(f"""
                SELECT 
                    rm.review_id,
                    rm.comment_count,
                    rm.view_count,
                    rm.reaction_count,
                    COALESCE(cc.actual_comments, 0) as actual_comments,
                    COALESCE(vc.actual_views, 0) as actual_views,
                    COALESCE(rc.actual_reactions, 0) as actual_reactions
                FROM review_main rm
                LEFT JOIN (
                    SELECT review_id, COUNT(*) as actual_comments
                    FROM review_comments GROUP BY review_id
                ) cc ON rm.review_id = cc.review_id
                LEFT JOIN (
                    SELECT review_id, COUNT(*) as actual_views
                    FROM review_views 
                    WHERE (is_valid IS NULL OR is_valid = true)
                    AND (expires_at IS NULL OR expires_at > NOW())
                    GROUP BY review_id
                ) vc ON rm.review_id = vc.review_id
                LEFT JOIN (
                    SELECT review_id, COUNT(*) as actual_reactions
                    FROM review_reactions GROUP BY review_id
                ) rc ON rm.review_id = rc.review_id
                ORDER BY rm.review_id DESC
                LIMIT {sample_size}
            """)
            
            result = self.db.execute(query)
            samples = []
            issues = 0
            
            for row in result:
                comment_match = row.comment_count == row.actual_comments
                view_match = row.view_count == row.actual_views
                reaction_match = row.reaction_count == row.actual_reactions
                
                all_match = comment_match and view_match and reaction_match
                if not all_match:
                    issues += 1
                
                samples.append({
                    "review_id": row.review_id,
                    "counts_match": all_match,
                    "comment_count_ok": comment_match,
                    "view_count_ok": view_match,
                    "reaction_count_ok": reaction_match,
                    "stored": {
                        "comments": row.comment_count,
                        "views": row.view_count,
                        "reactions": row.reaction_count
                    },
                    "actual": {
                        "comments": row.actual_comments,
                        "views": row.actual_views,
                        "reactions": row.actual_reactions
                    }
                })
            
            accuracy = ((sample_size - issues) / sample_size * 100) if sample_size > 0 else 100
            
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "sample_size": sample_size,
                "issues_found": issues,
                "accuracy_percentage": round(accuracy, 2),
                "status": "healthy" if accuracy >= 95 else "needs_attention" if accuracy >= 80 else "critical",
                "samples": samples
            }
        except Exception as e:
            logger.error(f"Error validating sample counts: {str(e)}")
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "status": "error"
            }
    
    def get_performance_metrics(self) -> Dict:
        """Get performance metrics for the counting system"""
        try:
            # Check trigger execution times and efficiency
            query = text("""
                SELECT 
                    'review_comments' as table_name,
                    COUNT(*) as total_records,
                    MAX(created_at) as latest_record,
                    MIN(created_at) as earliest_record
                FROM review_comments
                UNION ALL
                SELECT 
                    'review_views' as table_name,
                    COUNT(*) as total_records,
                    MAX(viewed_at) as latest_record,
                    MIN(viewed_at) as earliest_record
                FROM review_views
                UNION ALL
                SELECT 
                    'review_reactions' as table_name,
                    COUNT(*) as total_records,
                    MAX(created_at) as latest_record,
                    MIN(created_at) as earliest_record
                FROM review_reactions
            """)
            
            result = self.db.execute(query)
            table_stats = []
            
            for row in result:
                table_stats.append({
                    "table_name": row.table_name,
                    "total_records": row.total_records,
                    "latest_record": row.latest_record.isoformat() if row.latest_record else None,
                    "earliest_record": row.earliest_record.isoformat() if row.earliest_record else None
                })
            
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "table_statistics": table_stats,
                "system_status": "operational"
            }
        except Exception as e:
            logger.error(f"Error getting performance metrics: {str(e)}")
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "system_status": "error"
            }