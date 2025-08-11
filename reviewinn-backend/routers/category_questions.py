"""
Category Questions API Router
Provides endpoints for fetching dynamic rating questions based on categories
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import logging

from database import get_db
from services.category_question_service import CategoryQuestionService
from core.auth_dependencies import AuthDependencies

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/category/{category_path:path}")
async def get_questions_by_category_path(
    category_path: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get rating questions for a specific category path
    
    Args:
        category_path: Category path like "products.electronics.smartphones"
    
    Returns:
        Dictionary with questions array and metadata
    """
    try:
        service = CategoryQuestionService(db)
        questions_data = service.get_questions_for_category(category_path)
        
        if not questions_data:
            raise HTTPException(
                status_code=404, 
                detail=f"No questions found for category path: {category_path}"
            )
        
        return {
            "success": True,
            "data": questions_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching questions for category {category_path}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/entity/{entity_id}")
async def get_questions_by_entity_id(
    entity_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get rating questions for a specific entity based on its category
    
    Args:
        entity_id: The entity ID
    
    Returns:
        Dictionary with questions array and metadata
    """
    try:
        service = CategoryQuestionService(db)
        questions_data = service.get_questions_for_entity(entity_id)
        
        if not questions_data:
            raise HTTPException(
                status_code=404, 
                detail=f"No questions found for entity ID: {entity_id}"
            )
        
        return {
            "success": True,
            "data": questions_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching questions for entity {entity_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/")
async def get_all_categories_with_questions(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get all categories that have questions defined
    
    Returns:
        List of categories with question metadata
    """
    try:
        service = CategoryQuestionService(db)
        categories = service.get_all_categories_with_questions()
        
        return {
            "success": True,
            "data": categories,
            "total_count": len(categories)
        }
        
    except Exception as e:
        logger.error(f"Error fetching all categories with questions: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/create")
async def create_category_questions(
    category_path: str,
    category_name: str,
    questions: List[Dict[str, str]],
    db: Session = Depends(get_db),
    current_user = Depends(AuthDependencies.get_current_user)
) -> Dict[str, Any]:
    """
    Create new questions for a category (admin only)
    
    Args:
        category_path: Category path like "products.electronics.laptops"
        category_name: Human readable name like "Laptops"
        questions: List of question objects with keys: key, question, description
    
    Returns:
        Created category question information
    """
    try:
        # Validate question structure
        for question in questions:
            required_fields = ['key', 'question', 'description']
            if not all(field in question for field in required_fields):
                raise HTTPException(
                    status_code=400,
                    detail=f"Each question must have fields: {required_fields}"
                )
        
        service = CategoryQuestionService(db)
        created_question = service.create_questions_for_category(
            category_path=category_path,
            category_name=category_name,
            questions=questions,
            created_by=current_user.user_id
        )
        
        if not created_question:
            raise HTTPException(
                status_code=400,
                detail="Failed to create category questions"
            )
        
        return {
            "success": True,
            "data": {
                "id": created_question.id,
                "category_path": created_question.category_path,
                "category_name": created_question.category_name,
                "question_count": len(created_question.questions)
            },
            "message": "Category questions created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating category questions: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/test/{entity_id}")
async def test_question_retrieval(
    entity_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Test endpoint to see how question retrieval works for an entity
    Shows the fallback logic in action
    """
    try:
        from models.entity import Entity
        from models.unified_category import UnifiedCategory
        
        # Get entity details
        entity = db.query(Entity).filter(Entity.entity_id == entity_id).first()
        if not entity:
            raise HTTPException(status_code=404, detail="Entity not found")
        
        # Get category details
        category = None
        if entity.unified_category_id:
            category = db.query(UnifiedCategory).filter(
                UnifiedCategory.id == entity.unified_category_id
            ).first()
        
        # Get questions
        service = CategoryQuestionService(db)
        questions_data = service.get_questions_for_entity(entity_id)
        
        # Get available question paths for debugging
        available_paths = service.get_available_question_paths()
        
        return {
            "success": True,
            "entity": {
                "id": entity.entity_id,
                "name": entity.name,
                "category_id": entity.unified_category_id,
                "root_category_id": getattr(entity, 'root_category_id', None),
                "final_category_id": getattr(entity, 'final_category_id', None)
            },
            "category": {
                "id": category.id if category else None,
                "name": category.name if category else None,
                "path": category.path if category else None,
                "level": category.level if category else None
            } if category else None,
            "questions": questions_data,
            "explanation": {
                "fallback_used": questions_data.get("is_fallback", False) if questions_data else None,
                "source": questions_data.get("source") if questions_data else None,
                "matched_path": questions_data.get("matched_path") if questions_data else None
            },
            "debug_info": {
                "available_question_paths": available_paths,
                "total_question_sets": len(available_paths)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in test endpoint for entity {entity_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")