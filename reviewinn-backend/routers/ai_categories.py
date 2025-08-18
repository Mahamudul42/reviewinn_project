"""
AI-Powered Category Processing API Router
Handles intelligent category autocomplete, correction, and creation
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import logging

from database import get_db
from services.gemini_service import GeminiService
from auth.production_dependencies import CurrentUser, RequiredUser

logger = logging.getLogger(__name__)
router = APIRouter()


class CategoryAutocompleteRequest(BaseModel):
    user_input: str
    context: Optional[str] = None


class CreateCategoryRequest(BaseModel):
    user_input: str
    force_create: Optional[bool] = False


@router.post("/autocomplete")
async def autocomplete_category(
    request: CategoryAutocompleteRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Autocomplete and correct user-typed category using AI
    
    Args:
        request: Contains user input and optional context
    
    Returns:
        Corrected category with suggestions and existing matches
    """
    try:
        if not request.user_input or not request.user_input.strip():
            raise HTTPException(status_code=400, detail="User input cannot be empty")
        
        gemini_service = GeminiService(db)
        
        if not gemini_service.is_enabled():
            # Fallback to simple text matching when AI is not available
            return await _fallback_autocomplete(request.user_input, db)
        
        result = gemini_service.autocomplete_category(request.user_input.strip())
        
        if "error" in result:
            logger.warning(f"AI autocomplete failed for '{request.user_input}': {result['error']}")
            return await _fallback_autocomplete(request.user_input, db)
        
        return {
            "success": True,
            "data": result,
            "source": "ai"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in category autocomplete for '{request.user_input}': {e}")
        return await _fallback_autocomplete(request.user_input, db)


@router.post("/create")
async def create_new_category(
    request: CreateCategoryRequest,
    db: Session = Depends(get_db),
    current_user = RequiredUser
) -> Dict[str, Any]:
    """
    Create a new category with AI-powered processing
    
    Args:
        request: Contains user input and creation options
        current_user: Current authenticated user
    
    Returns:
        Created category with generated questions
    """
    try:
        if not request.user_input or not request.user_input.strip():
            raise HTTPException(status_code=400, detail="Category name cannot be empty")
        
        gemini_service = GeminiService(db)
        
        if not gemini_service.is_enabled():
            return await _fallback_create_category(request.user_input, current_user, db)
        
        # Process the complete category creation workflow
        result = gemini_service.process_new_category(request.user_input.strip())
        
        if not result.get("success"):
            error_msg = result.get("error", "Failed to process category")
            raise HTTPException(status_code=400, detail=error_msg)
        
        return {
            "success": True,
            "data": {
                "category_id": result["category_id"],
                "category": result["category"],
                "questions": result.get("questions", []),
                "questions_created": result.get("questions_created", False),
                "processing_steps": result.get("steps", [])
            },
            "message": result.get("message", "Category created successfully"),
            "source": "ai"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating category for '{request.user_input}': {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create category: {str(e)}")


@router.get("/suggestions/{query}")
async def get_category_suggestions(
    query: str,
    limit: int = Query(default=10, le=20),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get AI-powered category suggestions based on query
    
    Args:
        query: Search query for categories
        limit: Maximum number of suggestions to return
    
    Returns:
        List of category suggestions with relevance scores
    """
    try:
        if not query or len(query.strip()) < 2:
            raise HTTPException(status_code=400, detail="Query must be at least 2 characters")
        
        gemini_service = GeminiService(db)
        
        # Get basic text-based suggestions first
        from models.unified_category import UnifiedCategory
        from sqlalchemy import func
        
        existing_matches = db.query(UnifiedCategory).filter(
            func.lower(UnifiedCategory.name).contains(query.lower()),
            UnifiedCategory.is_active == True
        ).limit(limit).all()
        
        suggestions = []
        for category in existing_matches:
            suggestions.append({
                "id": category.id,
                "name": category.name,
                "path": category.path,
                "level": category.level,
                "is_existing": True,
                "relevance_score": 90,  # High score for exact matches
                "breadcrumb": category.get_breadcrumb()
            })
        
        # If AI is available and we have fewer results, enhance with AI suggestions
        if gemini_service.is_enabled() and len(suggestions) < limit:
            autocomplete_result = gemini_service.autocomplete_category(query)
            
            if "error" not in autocomplete_result:
                # Add AI-suggested alternatives
                for alt in autocomplete_result.get("alternative_suggestions", [])[:3]:
                    if alt and alt not in [s["name"] for s in suggestions]:
                        suggestions.append({
                            "id": None,
                            "name": alt,
                            "path": None,
                            "level": None,
                            "is_existing": False,
                            "relevance_score": autocomplete_result.get("confidence", 75),
                            "source": "ai_suggestion"
                        })
        
        return {
            "success": True,
            "data": suggestions[:limit],
            "total": len(suggestions),
            "query": query
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting category suggestions for '{query}': {e}")
        raise HTTPException(status_code=500, detail="Failed to get suggestions")


@router.get("/hierarchy/placement/{category_name}")
async def get_hierarchy_placement(
    category_name: str,
    parent_hint: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get AI-suggested hierarchical placement for a category
    
    Args:
        category_name: Name of the category to place
        parent_hint: Optional hint about parent category
    
    Returns:
        Suggested placement in category hierarchy
    """
    try:
        if not category_name or not category_name.strip():
            raise HTTPException(status_code=400, detail="Category name cannot be empty")
        
        gemini_service = GeminiService(db)
        
        if not gemini_service.is_enabled():
            raise HTTPException(status_code=503, detail="AI service not available")
        
        result = gemini_service.find_hierarchical_placement(category_name.strip(), parent_hint)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting hierarchy placement for '{category_name}': {e}")
        raise HTTPException(status_code=500, detail="Failed to determine placement")


@router.post("/questions/generate")
async def generate_category_questions(
    category_name: str,
    category_path: Optional[str] = None,
    parent_category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = RequiredUser
) -> Dict[str, Any]:
    """
    Generate rating questions for a category using AI
    
    Args:
        category_name: Name of the category
        category_path: Full path of the category
        parent_category: Parent category name for context
    
    Returns:
        Generated rating questions
    """
    try:
        if not category_name or not category_name.strip():
            raise HTTPException(status_code=400, detail="Category name cannot be empty")
        
        gemini_service = GeminiService(db)
        
        questions = gemini_service.generate_category_questions(
            category_name.strip(),
            category_path or "",
            parent_category
        )
        
        return {
            "success": True,
            "data": {
                "questions": questions,
                "category_name": category_name,
                "category_path": category_path,
                "count": len(questions)
            },
            "source": "ai" if gemini_service.is_enabled() else "fallback"
        }
        
    except Exception as e:
        logger.error(f"Error generating questions for '{category_name}': {e}")
        raise HTTPException(status_code=500, detail="Failed to generate questions")


async def _fallback_autocomplete(user_input: str, db: Session) -> Dict[str, Any]:
    """Fallback autocomplete when AI is not available"""
    try:
        from models.unified_category import UnifiedCategory
        from sqlalchemy import func
        
        # Simple text matching
        matches = db.query(UnifiedCategory).filter(
            func.lower(UnifiedCategory.name).contains(user_input.lower()),
            UnifiedCategory.is_active == True
        ).limit(5).all()
        
        if matches:
            best_match = matches[0]
            return {
                "success": True,
                "data": {
                    "corrected_name": best_match.name,
                    "is_existing": True,
                    "existing_category_id": best_match.id,
                    "confidence": 80,
                    "reasoning": "Simple text matching (AI not available)",
                    "alternative_suggestions": [m.name for m in matches[1:4]]
                },
                "source": "fallback"
            }
        else:
            return {
                "success": True,
                "data": {
                    "corrected_name": user_input.title(),
                    "is_existing": False,
                    "existing_category_id": None,
                    "suggested_parent_name": "Products",  # Default fallback
                    "confidence": 50,
                    "reasoning": "No matches found, suggest manual creation",
                    "alternative_suggestions": []
                },
                "source": "fallback"
            }
            
    except Exception as e:
        logger.error(f"Error in fallback autocomplete: {e}")
        raise HTTPException(status_code=500, detail="Autocomplete failed")


async def _fallback_create_category(user_input: str, current_user, db: Session) -> Dict[str, Any]:
    """Fallback category creation when AI is not available"""
    try:
        from models.unified_category import UnifiedCategory
        from models.category_question import CategoryQuestion
        
        # Create basic category under "Products" as default
        products_root = db.query(UnifiedCategory).filter(
            UnifiedCategory.name == "Products",
            UnifiedCategory.level == 1
        ).first()
        
        if not products_root:
            raise HTTPException(status_code=400, detail="Default parent category not found")
        
        # Generate slug and path
        name = user_input.strip().title()
        slug = name.lower().replace(" ", "-").replace("&", "and")
        path = f"{products_root.path}.{slug}" if products_root.path else slug
        
        new_category = UnifiedCategory(
            name=name,
            slug=slug,
            parent_id=products_root.id,
            path=path,
            level=2,
            is_active=True,
            sort_order=999
        )
        
        db.add(new_category)
        db.commit()
        db.refresh(new_category)
        
        # Create basic questions
        basic_questions = [
            {
                "key": "overall_quality",
                "question": "How would you rate the overall quality?",
                "description": "General assessment of quality and satisfaction"
            },
            {
                "key": "value_for_money", 
                "question": "How would you rate the value for money?",
                "description": "Worth relative to cost or price paid"
            },
            {
                "key": "functionality",
                "question": "How well does it function as expected?",
                "description": "Performance and reliability in intended use"
            },
            {
                "key": "user_experience",
                "question": "How was your overall experience?",
                "description": "Ease of use and satisfaction"
            },
            {
                "key": "recommendation",
                "question": "How likely are you to recommend this?",
                "description": "Likelihood to recommend based on experience"
            }
        ]
        
        category_question = CategoryQuestion(
            category_path=new_category.path,
            category_name=new_category.name,
            category_level=new_category.level,
            is_root_category=False,
            questions=basic_questions,
            created_by=current_user.user_id
        )
        
        db.add(category_question)
        db.commit()
        
        return {
            "success": True,
            "data": {
                "category_id": new_category.id,
                "category": new_category.to_dict(),
                "questions": basic_questions,
                "questions_created": True
            },
            "message": f"Created category '{name}' with basic questions (AI not available)",
            "source": "fallback"
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error in fallback category creation: {e}")
        raise HTTPException(status_code=500, detail="Failed to create category")