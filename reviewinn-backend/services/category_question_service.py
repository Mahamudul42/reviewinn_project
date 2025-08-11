"""
Category Question Service
Handles dynamic rating questions for different categories with fallback logic
"""
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
import logging

from models.category_question import CategoryQuestion
from models.unified_category import UnifiedCategory

logger = logging.getLogger(__name__)


class CategoryQuestionService:
    """Service for managing dynamic category-based rating questions"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_questions_for_category(self, category_path: str) -> Optional[Dict[str, Any]]:
        """
        Get rating questions for a specific category path with fallback logic
        
        Args:
            category_path: Category path like "products.electronics.smartphones" or "professionals"
            
        Returns:
            Dictionary with questions array and metadata, or None if not found
        """
        try:
            logger.debug(f"Looking for questions with category path: '{category_path}'")
            
            # Normalize the path and try different formats
            normalized_paths = self._normalize_category_path(category_path)
            logger.debug(f"Normalized paths to try: {normalized_paths}")
            
            specific_questions = None
            matched_path = None
            
            # Try each normalized path format
            for test_path in normalized_paths:
                specific_questions = self.db.query(CategoryQuestion).filter(
                    CategoryQuestion.category_path == test_path,
                    CategoryQuestion.is_active == True
                ).first()
                
                if specific_questions:
                    matched_path = test_path
                    logger.info(f"Found questions using path format: '{test_path}' (original: '{category_path}')")
                    break
                else:
                    logger.debug(f"No questions found for path format: '{test_path}'")
            
            if specific_questions:
                # Update usage tracking
                specific_questions.usage_count += 1
                specific_questions.last_used_at = func.now()
                self.db.commit()
                
                logger.info(f"Found specific questions for category: {category_path} (matched: {matched_path})")
                return {
                    "questions": specific_questions.questions,
                    "category_name": specific_questions.category_name,
                    "category_path": specific_questions.category_path,
                    "is_fallback": False,
                    "source": "specific",
                    "matched_path": matched_path
                }
            
            # If no specific questions found, use fallback to root category
            root_category_path = self._get_root_category_path(category_path)
            
            if root_category_path and root_category_path != category_path:
                root_questions = self.db.query(CategoryQuestion).filter(
                    CategoryQuestion.category_path == root_category_path,
                    CategoryQuestion.is_root_category == True,
                    CategoryQuestion.is_active == True
                ).first()
                
                if root_questions:
                    # Update usage tracking for fallback
                    root_questions.usage_count += 1
                    root_questions.last_used_at = func.now()
                    self.db.commit()
                    
                    logger.info(f"Using fallback questions from {root_category_path} for category: {category_path}")
                    return {
                        "questions": root_questions.questions,
                        "category_name": root_questions.category_name,
                        "category_path": category_path,  # Keep original path
                        "fallback_from": root_category_path,
                        "is_fallback": True,
                        "source": "fallback"
                    }
            
            # Log all available question paths for debugging
            all_paths = self.db.query(CategoryQuestion.category_path).filter(
                CategoryQuestion.is_active == True
            ).all()
            available_paths = [path[0] for path in all_paths]
            logger.warning(f"No questions found for category: {category_path}")
            logger.debug(f"Available question paths: {available_paths}")
            
            # If still no questions, try to auto-create questions for this new category
            return self._auto_create_questions_for_new_category(category_path)
            
        except Exception as e:
            logger.error(f"Error getting questions for category {category_path}: {e}")
            return None
    
    def get_questions_for_entity(self, entity_id: int) -> Optional[Dict[str, Any]]:
        """
        Get rating questions for an entity using hierarchical fallback
        
        Fallback logic:
        1. Try final_category_id (specific subcategory)
        2. Try parent categories up the hierarchy
        3. Try root_category_id (root level)
        4. Finally use "other" category as last resort
        
        Args:
            entity_id: The entity ID
            
        Returns:
            Dictionary with questions and metadata, or None if not found
        """
        try:
            # Get entity's category information
            from models.entity import Entity
            entity = self.db.query(Entity).filter(Entity.entity_id == entity_id).first()
            
            if not entity:
                logger.warning(f"Entity {entity_id} not found")
                return None
            
            logger.debug(f"Entity {entity_id} ({entity.name}) - root_category_id: {getattr(entity, 'root_category_id', None)}, final_category_id: {getattr(entity, 'final_category_id', None)}, unified_category_id: {entity.unified_category_id}")
            
            # Try final category first (most specific) - handle gracefully if column doesn't exist
            final_category_id = getattr(entity, 'final_category_id', None)
            if final_category_id:
                final_category = self.db.query(UnifiedCategory).filter(
                    UnifiedCategory.id == final_category_id
                ).first()
                
                if final_category:
                    logger.debug(f"Final category found: {final_category.name} (path: '{final_category.path}')")
                    # Try to get questions for the final category
                    questions = self.get_questions_for_category(final_category.path)
                    if questions:
                        logger.info(f"Found specific questions for entity {entity_id} using final category: {final_category.path}")
                        return questions
                    
                    # Try parent categories in hierarchy (walk up the tree)
                    current_category = final_category
                    while current_category.parent_id:
                        parent_category = self.db.query(UnifiedCategory).filter(
                            UnifiedCategory.id == current_category.parent_id
                        ).first()
                        
                        if parent_category:
                            questions = self.get_questions_for_category(parent_category.path)
                            if questions:
                                logger.info(f"Found parent category questions for entity {entity_id} using: {parent_category.path}")
                                questions["is_fallback"] = True
                                questions["fallback_reason"] = f"Using questions from parent category: {parent_category.name}"
                                questions["source"] = "parent_fallback"
                                return questions
                            current_category = parent_category
                        else:
                            break
            
            # Try root category fallback - handle gracefully if column doesn't exist
            root_category_id = getattr(entity, 'root_category_id', None)
            if root_category_id:
                root_category = self.db.query(UnifiedCategory).filter(
                    UnifiedCategory.id == root_category_id
                ).first()
                
                if root_category:
                    logger.debug(f"Root category found: {root_category.name} (path: '{root_category.path}')")
                    questions = self.get_questions_for_category(root_category.path)
                    if questions:
                        logger.info(f"Found root category questions for entity {entity_id} using: {root_category.path}")
                        questions["is_fallback"] = True
                        questions["fallback_reason"] = f"Using questions from root category: {root_category.name}"
                        questions["source"] = "root_fallback"
                        return questions
            
            # Try legacy unified_category_id for backward compatibility
            if entity.unified_category_id and not final_category_id:
                unified_category = self.db.query(UnifiedCategory).filter(
                    UnifiedCategory.id == entity.unified_category_id
                ).first()
                
                if unified_category:
                    questions = self.get_questions_for_category(unified_category.path)
                    if questions:
                        logger.info(f"Found legacy category questions for entity {entity_id} using: {unified_category.path}")
                        return questions
            
            # Final fallback to "other" category
            logger.info(f"Entity {entity_id} has no questions in hierarchy, using 'other' category as final fallback")
            fallback_questions = self.get_questions_for_category("other")
            if fallback_questions:
                fallback_questions["is_fallback"] = True
                fallback_questions["fallback_reason"] = "No questions found in category hierarchy, using generic questions"
                fallback_questions["source"] = "final_fallback"
            return fallback_questions
            
        except Exception as e:
            logger.error(f"Error getting questions for entity {entity_id}: {e}")
            return None
    
    def _normalize_category_path(self, category_path: str) -> List[str]:
        """
        Generate different normalized versions of the category path to handle
        inconsistencies between dot-separated and slash-separated paths
        
        Args:
            category_path: Original category path
            
        Returns:
            List of normalized path variations to try
        """
        if not category_path:
            return []
        
        paths_to_try = [category_path]  # Always try the original first
        
        # Convert dots to slashes
        if '.' in category_path:
            slash_version = category_path.replace('.', '/')
            if slash_version not in paths_to_try:
                paths_to_try.append(slash_version)
        
        # Convert slashes to dots  
        if '/' in category_path:
            dot_version = category_path.replace('/', '.')
            if dot_version not in paths_to_try:
                paths_to_try.append(dot_version)
        
        # Remove any empty paths
        paths_to_try = [path for path in paths_to_try if path.strip()]
        
        return paths_to_try
    
    def get_available_question_paths(self) -> List[str]:
        """
        Get all available question paths for debugging purposes
        
        Returns:
            List of all active category paths that have questions
        """
        try:
            paths = self.db.query(CategoryQuestion.category_path).filter(
                CategoryQuestion.is_active == True
            ).all()
            return [path[0] for path in paths]
        except Exception as e:
            logger.error(f"Error getting available question paths: {e}")
            return []
    
    def _get_root_category_path(self, category_path: str) -> Optional[str]:
        """
        Extract root category path from a full category path
        
        Args:
            category_path: Full path like "products.electronics.smartphones"
            
        Returns:
            Root path like "products" or None if invalid
        """
        if not category_path:
            return None
        
        # Split path and get first component
        path_parts = category_path.split('.')
        if not path_parts:
            return None
        
        root_path = path_parts[0]
        
        # Validate it's a known root category
        known_roots = ['professionals', 'companiesinstitutes', 'places', 'products', 'other']
        if root_path in known_roots:
            return root_path
        
        return None
    
    def create_questions_for_category(
        self, 
        category_path: str, 
        category_name: str, 
        questions: List[Dict[str, str]], 
        created_by: Optional[int] = None
    ) -> Optional[CategoryQuestion]:
        """
        Create new questions for a category
        
        Args:
            category_path: Category path
            category_name: Human readable category name
            questions: List of question dictionaries
            created_by: User ID who created these questions
            
        Returns:
            Created CategoryQuestion object or None if failed
        """
        try:
            # Determine category level and if it's root
            path_parts = category_path.split('.')
            category_level = len(path_parts)
            is_root_category = category_level == 1
            
            category_question = CategoryQuestion(
                category_path=category_path,
                category_name=category_name,
                category_level=category_level,
                is_root_category=is_root_category,
                questions=questions,
                created_by=created_by
            )
            
            self.db.add(category_question)
            self.db.commit()
            self.db.refresh(category_question)
            
            logger.info(f"Created questions for category: {category_path}")
            return category_question
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating questions for category {category_path}: {e}")
            return None
    
    def get_all_categories_with_questions(self) -> List[Dict[str, Any]]:
        """
        Get all categories that have questions defined
        
        Returns:
            List of category information with question counts
        """
        try:
            categories = self.db.query(CategoryQuestion).filter(
                CategoryQuestion.is_active == True
            ).order_by(
                CategoryQuestion.is_root_category.desc(),
                CategoryQuestion.category_path
            ).all()
            
            result = []
            for cat in categories:
                result.append({
                    "category_path": cat.category_path,
                    "category_name": cat.category_name,
                    "category_level": cat.category_level,
                    "is_root_category": cat.is_root_category,
                    "question_count": len(cat.questions) if cat.questions else 0,
                    "usage_count": cat.usage_count,
                    "last_used_at": cat.last_used_at
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting categories with questions: {e}")
            return []
    
    def _auto_create_questions_for_new_category(self, category_path: str) -> Optional[Dict[str, Any]]:
        """
        Auto-create questions for a new category that doesn't have questions yet.
        
        Logic:
        1. For new root categories: Use hardcoded basic questions
        2. For new categories at other levels: Use root category questions as template
        
        Args:
            category_path: Category path like "professionals.new-business.new-service"
            
        Returns:
            Dictionary with auto-created questions or None if failed
        """
        try:
            # Get the actual category from the database to understand its structure
            from models.unified_category import UnifiedCategory
            
            # Parse the path to find the category
            path_parts = category_path.split('.')
            if not path_parts:
                return None
                
            # Try to find the category in the database
            category = None
            if len(path_parts) == 1:
                # Root level category
                category = self.db.query(UnifiedCategory).filter(
                    UnifiedCategory.slug == path_parts[0],
                    UnifiedCategory.level == 1
                ).first()
            elif len(path_parts) == 2:
                # Level 2 category
                root_cat = self.db.query(UnifiedCategory).filter(
                    UnifiedCategory.slug == path_parts[0],
                    UnifiedCategory.level == 1
                ).first()
                if root_cat:
                    category = self.db.query(UnifiedCategory).filter(
                        UnifiedCategory.slug == path_parts[1],
                        UnifiedCategory.parent_id == root_cat.id,
                        UnifiedCategory.level == 2
                    ).first()
            elif len(path_parts) == 3:
                # Level 3 category
                root_cat = self.db.query(UnifiedCategory).filter(
                    UnifiedCategory.slug == path_parts[0],
                    UnifiedCategory.level == 1
                ).first()
                if root_cat:
                    parent_cat = self.db.query(UnifiedCategory).filter(
                        UnifiedCategory.slug == path_parts[1],
                        UnifiedCategory.parent_id == root_cat.id,
                        UnifiedCategory.level == 2
                    ).first()
                    if parent_cat:
                        category = self.db.query(UnifiedCategory).filter(
                            UnifiedCategory.slug == path_parts[2],
                            UnifiedCategory.parent_id == parent_cat.id,
                            UnifiedCategory.level == 3
                        ).first()
            
            if not category:
                logger.warning(f"Could not find category in database for path: {category_path}")
                return None
            
            # Determine what type of questions to create based on the category level and root
            root_category_path = path_parts[0]
            
            # Check if we have root category questions to use as template
            root_questions = self.db.query(CategoryQuestion).filter(
                CategoryQuestion.category_path == root_category_path,
                CategoryQuestion.is_root_category == True,
                CategoryQuestion.is_active == True
            ).first()
            
            if root_questions and category.level > 1:
                # Use root category questions as template for new non-root categories
                logger.info(f"Auto-creating questions for new category {category_path} using root template: {root_category_path}")
                
                # Create questions for the new category based on root template
                new_questions = self._generate_questions_from_template(category, root_questions.questions)
                
                created_question = self.create_questions_for_category(
                    category_path=category_path,
                    category_name=category.name,
                    questions=new_questions
                )
                
                if created_question:
                    logger.info(f"Successfully auto-created questions for category: {category_path}")
                    return {
                        "questions": created_question.questions,
                        "category_name": created_question.category_name,
                        "category_path": created_question.category_path,
                        "is_fallback": True,
                        "source": "auto_created",
                        "template_from": root_category_path
                    }
            
            elif category.level == 1:
                # For new root categories, create basic default questions
                logger.info(f"Auto-creating default questions for new root category: {category_path}")
                
                default_questions = self._generate_default_root_questions(category.name)
                
                created_question = self.create_questions_for_category(
                    category_path=category_path,
                    category_name=category.name,
                    questions=default_questions
                )
                
                if created_question:
                    logger.info(f"Successfully auto-created default questions for root category: {category_path}")
                    return {
                        "questions": created_question.questions,
                        "category_name": created_question.category_name,
                        "category_path": created_question.category_path,
                        "is_fallback": True,
                        "source": "auto_created",
                        "template_from": "default_root"
                    }
            
            # If we can't create questions, return the root questions directly as fallback
            if root_questions:
                logger.info(f"Using root questions as direct fallback for category: {category_path}")
                return {
                    "questions": root_questions.questions,
                    "category_name": root_questions.category_name,
                    "category_path": category_path,  # Keep original path
                    "fallback_from": root_category_path,
                    "is_fallback": True,
                    "source": "root_fallback"
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error auto-creating questions for category {category_path}: {e}")
            return None
    
    def _generate_questions_from_template(self, category: 'UnifiedCategory', template_questions: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """
        Generate questions for a new category based on template questions from root category.
        
        Args:
            category: The UnifiedCategory object for the new category
            template_questions: Questions from the root category to use as template
            
        Returns:
            List of customized questions for the new category
        """
        customized_questions = []
        category_name = category.name.lower()
        
        for q in template_questions:
            customized_q = q.copy()
            
            # Customize questions based on category type and name
            if category.level == 3:  # Final categories get most specific questions
                # Replace generic terms with category-specific ones
                question = customized_q.get('question', '')
                description = customized_q.get('description', '')
                
                # Example customizations
                if 'professional' in question.lower() or 'service' in question.lower():
                    question = question.replace('their professional', f'their {category_name}')
                    question = question.replace('their service', f'their {category_name} service')
                
                if 'product' in question.lower():
                    question = question.replace('the product', f'the {category_name}')
                    question = question.replace('product', category_name)
                
                if 'place' in question.lower() or 'location' in question.lower():
                    question = question.replace('this place', f'this {category_name}')
                    question = question.replace('the location', f'the {category_name} location')
                
                customized_q['question'] = question
                customized_q['description'] = description.replace('(1-5 scale)', f'for {category_name} (1-5 scale)')
            
            customized_questions.append(customized_q)
        
        return customized_questions
    
    def _generate_default_root_questions(self, category_name: str) -> List[Dict[str, str]]:
        """
        Generate default questions for a new root category.
        
        Args:
            category_name: Name of the root category
            
        Returns:
            List of default questions suitable for any category
        """
        return [
            {
                "key": "quality",
                "question": f"How would you rate the overall quality of this {category_name.lower()}?",
                "description": "General quality and standards (1-5 scale)"
            },
            {
                "key": "service",
                "question": "How good is the service provided?",
                "description": "Service quality and customer experience (1-5 scale)"
            },
            {
                "key": "reliability",
                "question": "How reliable are they?",
                "description": "Consistency and dependability (1-5 scale)"
            },
            {
                "key": "satisfaction",
                "question": "How satisfied are you overall?",
                "description": "General satisfaction with the experience (1-5 scale)"
            },
            {
                "key": "value",
                "question": "How would you rate the value for money?",
                "description": "Cost-effectiveness and worth (1-5 scale)"
            }
        ]