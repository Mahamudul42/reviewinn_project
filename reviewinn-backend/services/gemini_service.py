"""
Gemini AI Service for intelligent category processing and question generation
"""
import os
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
import google.generativeai as genai
from sqlalchemy.orm import Session

from models.unified_category import UnifiedCategory
from models.category_question import CategoryQuestion

logger = logging.getLogger(__name__)


class GeminiService:
    """Service for AI-powered category and question processing using Google Gemini"""
    
    def __init__(self, db: Session):
        self.db = db
        self.api_key = os.getenv("GEMINI_API")
        
        if not self.api_key:
            logger.warning("GEMINI_API environment variable not set")
            self.enabled = False
            return
            
        try:
            genai.configure(api_key=self.api_key)
            # Use the newer model name
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self.enabled = True
            logger.info("Gemini service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini service: {e}")
            self.enabled = False
    
    def is_enabled(self) -> bool:
        """Check if Gemini service is available"""
        return self.enabled
    
    def autocomplete_category(self, user_input: str) -> Dict[str, Any]:
        """
        Autocomplete and correct user-typed category using database-first approach
        AI is used as fallback only to minimize API costs
        
        Args:
            user_input: Raw user input for category
            
        Returns:
            Dictionary with corrected category, suggestions, and confidence
        """
        try:
            # STEP 1: Try exact database match first
            exact_match = self.db.query(UnifiedCategory).filter(
                func.lower(UnifiedCategory.name) == user_input.lower().strip(),
                UnifiedCategory.is_active == True
            ).first()
            
            if exact_match:
                logger.info(f"Found exact database match for '{user_input}': {exact_match.name}")
                return {
                    "corrected_name": exact_match.name,
                    "is_existing": True,
                    "existing_category_id": exact_match.id,
                    "confidence": 100,
                    "reasoning": "Exact match found in database",
                    "alternative_suggestions": [],
                    "source": "database_exact"
                }
            
            # STEP 2: Try fuzzy database search
            fuzzy_matches = self.db.query(UnifiedCategory).filter(
                func.lower(UnifiedCategory.name).contains(user_input.lower().strip()),
                UnifiedCategory.is_active == True
            ).limit(5).all()
            
            if fuzzy_matches:
                best_match = fuzzy_matches[0]
                alternatives = [match.name for match in fuzzy_matches[1:4]]
                
                # Calculate simple confidence based on string similarity
                input_lower = user_input.lower().strip()
                match_lower = best_match.name.lower()
                confidence = 85 if input_lower in match_lower or match_lower in input_lower else 70
                
                logger.info(f"Found fuzzy database match for '{user_input}': {best_match.name}")
                return {
                    "corrected_name": best_match.name,
                    "is_existing": True,
                    "existing_category_id": best_match.id,
                    "confidence": confidence,
                    "reasoning": f"Similar category found in database",
                    "alternative_suggestions": alternatives,
                    "source": "database_fuzzy"
                }
            
            # STEP 3: Try partial word matches
            words = user_input.lower().strip().split()
            if len(words) > 1:
                for word in words:
                    if len(word) >= 3:  # Only search meaningful words
                        word_matches = self.db.query(UnifiedCategory).filter(
                            func.lower(UnifiedCategory.name).contains(word),
                            UnifiedCategory.is_active == True
                        ).limit(3).all()
                        
                        if word_matches:
                            best_match = word_matches[0]
                            alternatives = [match.name for match in word_matches[1:]]
                            
                            logger.info(f"Found word-based match for '{user_input}': {best_match.name}")
                            return {
                                "corrected_name": best_match.name,
                                "is_existing": True,
                                "existing_category_id": best_match.id,
                                "confidence": 60,
                                "reasoning": f"Found category containing '{word}'",
                                "alternative_suggestions": alternatives,
                                "source": "database_partial"
                            }
            
            # STEP 4: Only use AI as fallback if no database matches found
            if self.is_enabled():
                logger.info(f"No database matches for '{user_input}', using AI fallback")
                return self._ai_autocomplete_fallback(user_input)
            else:
                # Final fallback when AI is not available
                logger.info(f"No database matches and AI unavailable for '{user_input}', suggesting manual creation")
                return {
                    "corrected_name": user_input.title().strip(),
                    "is_existing": False,
                    "existing_category_id": None,
                    "suggested_parent_name": "Products",  # Safe default
                    "confidence": 50,
                    "reasoning": "No database matches found, ready for manual creation",
                    "alternative_suggestions": [],
                    "source": "manual_fallback"
                }
                
        except Exception as e:
            logger.error(f"Error in database-first autocomplete for '{user_input}': {e}")
            return {"error": f"Category search failed: {str(e)}"}
    
    def _ai_autocomplete_fallback(self, user_input: str) -> Dict[str, Any]:
        """AI fallback for autocomplete when database search fails"""
        try:
            # Get limited category context for AI (to reduce token costs)
            existing_categories = self.db.query(UnifiedCategory).filter(
                UnifiedCategory.is_active == True,
                UnifiedCategory.level <= 2  # Only include root and first-level categories
            ).limit(30).all()  # Reduced from 50 to save tokens
            
            category_context = []
            for cat in existing_categories:
                category_context.append({
                    "name": cat.name,
                    "level": cat.level,
                    "parent": cat.parent.name if cat.parent else None
                })
            
            prompt = f"""
EXISTING CATEGORIES (limited list):
{json.dumps(category_context, indent=1)}

USER INPUT: "{user_input}"

Quick analysis - return JSON only:
{{
    "corrected_name": "Fixed Name",
    "is_existing": false,
    "suggested_parent_name": "Best Parent",
    "confidence": 75,
    "reasoning": "Brief reason",
    "alternative_suggestions": ["Alt1", "Alt2"]
}}
"""
            
            response = self.model.generate_content(prompt)
            result = json.loads(response.text.strip())
            result["source"] = "ai_fallback"
            
            logger.info(f"AI fallback result for '{user_input}': {result.get('corrected_name', 'Unknown')}")
            return result
            
        except Exception as e:
            logger.error(f"AI fallback failed for '{user_input}': {e}")
            return {
                "corrected_name": user_input.title().strip(),
                "is_existing": False,
                "confidence": 40,
                "reasoning": "AI processing failed, manual creation suggested",
                "alternative_suggestions": [],
                "source": "error_fallback"
            }
    
    def find_hierarchical_placement(self, category_name: str, parent_hint: str = None) -> Dict[str, Any]:
        """
        Determine the best hierarchical placement for a new category
        
        Args:
            category_name: Name of the new category
            parent_hint: Optional hint about parent category from autocomplete
            
        Returns:
            Dictionary with suggested placement in hierarchy
        """
        if not self.is_enabled():
            return {"error": "AI service not available"}
        
        try:
            # Get full category hierarchy for context
            root_categories = self.db.query(UnifiedCategory).filter(
                UnifiedCategory.parent_id.is_(None),
                UnifiedCategory.is_active == True
            ).all()
            
            hierarchy_context = []
            for root in root_categories:
                root_data = {
                    "id": root.id,
                    "name": root.name,
                    "level": 1,
                    "children": []
                }
                
                # Get children (up to 3 levels for context)
                for child in root.children[:10]:  # Limit for prompt size
                    child_data = {
                        "id": child.id,
                        "name": child.name,
                        "level": 2,
                        "children": [
                            {"id": gc.id, "name": gc.name, "level": 3}
                            for gc in child.children[:5]
                        ]
                    }
                    root_data["children"].append(child_data)
                
                hierarchy_context.append(root_data)
            
            prompt = f"""
You are a category hierarchy expert for a review platform with these main categories:
- Professionals (doctors, teachers, lawyers, etc.)
- Companies/Institutions (businesses, schools, hospitals, etc.)  
- Places (restaurants, hotels, tourist spots, etc.)
- Products (electronics, clothing, food items, etc.)

CURRENT HIERARCHY:
{json.dumps(hierarchy_context, indent=2)}

NEW CATEGORY TO PLACE: "{category_name}"
PARENT HINT: "{parent_hint if parent_hint else 'None provided'}"

Determine the best hierarchical placement for this new category:
1. Which root category does it belong to?
2. What should be the immediate parent category?
3. What level should it be placed at?
4. Does it need any intermediate categories created?

Return ONLY a JSON object:
{{
    "root_category_id": 123,
    "root_category_name": "Root Category",
    "parent_category_id": 456,
    "parent_category_name": "Direct Parent",
    "suggested_level": 3,
    "intermediate_categories": [
        {{"name": "Intermediate Category", "level": 2}}
    ],
    "reasoning": "Why this placement makes sense",
    "confidence": 90
}}
"""
            
            response = self.model.generate_content(prompt)
            result = json.loads(response.text.strip())
            
            logger.info(f"AI hierarchical placement for '{category_name}': {result}")
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response for placement '{category_name}': {e}")
            return {"error": "Invalid AI response format"}
        except Exception as e:
            logger.error(f"Error in hierarchical placement for '{category_name}': {e}")
            return {"error": f"AI processing failed: {str(e)}"}
    
    def generate_category_questions(self, category_name: str, category_path: str, parent_category: str = None) -> List[Dict[str, str]]:
        """
        Generate 5 relevant rating questions for a new category
        
        Args:
            category_name: Name of the category
            category_path: Full path of the category
            parent_category: Parent category name for context
            
        Returns:
            List of 5 question dictionaries with key, question, and description
        """
        if not self.is_enabled():
            # Fallback questions if AI is not available
            return self._get_fallback_questions()
        
        try:
            # Get sample questions from similar categories for context
            existing_questions = self.db.query(CategoryQuestion).filter(
                CategoryQuestion.is_active == True
            ).limit(10).all()
            
            example_questions = []
            for cq in existing_questions:
                if cq.questions:
                    example_questions.extend(cq.questions[:2])  # Get 2 questions from each category
            
            prompt = f"""
You are a review platform expert tasked with creating rating questions for user reviews.

CATEGORY DETAILS:
- Category Name: "{category_name}"
- Category Path: "{category_path}"
- Parent Category: "{parent_category if parent_category else 'None'}"

EXAMPLE QUESTIONS FROM OTHER CATEGORIES:
{json.dumps(example_questions[:10], indent=2)}

Create exactly 5 rating questions that users will rate on a 1-5 scale when reviewing entities in the "{category_name}" category.

Requirements:
- Questions should be specific and relevant to this category
- Each question should assess a different aspect (quality, service, value, etc.)
- Questions should be clear and unambiguous
- Each question needs a brief description explaining what to consider

Return ONLY a JSON array with exactly 5 objects:
[
    {{
        "key": "unique_identifier_snake_case",
        "question": "How would you rate...?",
        "description": "Brief explanation of what this rating assesses"
    }}
]
"""
            
            response = self.model.generate_content(prompt)
            questions = json.loads(response.text.strip())
            
            # Validate response format
            if not isinstance(questions, list) or len(questions) != 5:
                raise ValueError("AI did not return exactly 5 questions")
            
            for q in questions:
                if not all(key in q for key in ['key', 'question', 'description']):
                    raise ValueError("Question missing required fields")
            
            logger.info(f"Generated {len(questions)} questions for category '{category_name}'")
            return questions
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI questions for '{category_name}': {e}")
            return self._get_fallback_questions()
        except Exception as e:
            logger.error(f"Error generating questions for '{category_name}': {e}")
            return self._get_fallback_questions()
    
    def _get_fallback_questions(self) -> List[Dict[str, str]]:
        """Fallback questions when AI is not available"""
        return [
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
                "key": "reliability",
                "question": "How reliable and dependable was it?",
                "description": "Consistency and dependability of service/product"
            },
            {
                "key": "user_experience",
                "question": "How was your overall experience?",
                "description": "Ease of use, interaction quality, and satisfaction"
            },
            {
                "key": "recommendation",
                "question": "How likely are you to recommend this?",
                "description": "Likelihood to recommend to others based on experience"
            }
        ]
    
    def process_new_category(self, user_input: str) -> Dict[str, Any]:
        """
        Complete workflow for processing a new user-typed category
        
        Args:
            user_input: Raw user input for category
            
        Returns:
            Complete processing result with category creation info
        """
        result = {
            "success": False,
            "category_id": None,
            "questions_created": False,
            "steps": []
        }
        
        try:
            # Step 1: Autocomplete and correct
            autocomplete_result = self.autocomplete_category(user_input)
            result["steps"].append({"step": "autocomplete", "result": autocomplete_result})
            
            if "error" in autocomplete_result:
                result["error"] = autocomplete_result["error"]
                return result
            
            # If existing category found, return it
            if autocomplete_result.get("is_existing") and autocomplete_result.get("existing_category_id"):
                existing_cat = self.db.query(UnifiedCategory).filter(
                    UnifiedCategory.id == autocomplete_result["existing_category_id"]
                ).first()
                
                if existing_cat:
                    result["success"] = True
                    result["category_id"] = existing_cat.id
                    result["category"] = existing_cat.to_dict()
                    result["message"] = "Found existing category"
                    return result
            
            # Step 2: Find hierarchical placement
            placement_result = self.find_hierarchical_placement(
                autocomplete_result["corrected_name"],
                autocomplete_result.get("suggested_parent_name")
            )
            result["steps"].append({"step": "placement", "result": placement_result})
            
            if "error" in placement_result:
                result["error"] = placement_result["error"]
                return result
            
            # Step 3: Create new category in database
            new_category = self._create_category_in_db(autocomplete_result, placement_result)
            if not new_category:
                result["error"] = "Failed to create category in database"
                return result
            
            result["steps"].append({"step": "category_created", "category_id": new_category.id})
            
            # Step 4: Generate questions
            questions = self.generate_category_questions(
                new_category.name,
                new_category.path or "",
                new_category.parent.name if new_category.parent else None
            )
            
            # Step 5: Save questions to database
            if self._save_questions_to_db(new_category, questions):
                result["questions_created"] = True
                result["steps"].append({"step": "questions_created", "count": len(questions)})
            
            result["success"] = True
            result["category_id"] = new_category.id
            result["category"] = new_category.to_dict()
            result["questions"] = questions
            result["message"] = f"Created new category '{new_category.name}' with {len(questions)} questions"
            
            return result
            
        except Exception as e:
            logger.error(f"Error in complete category processing for '{user_input}': {e}")
            result["error"] = f"Processing failed: {str(e)}"
            return result
    
    def _create_category_in_db(self, autocomplete_result: Dict, placement_result: Dict) -> Optional[UnifiedCategory]:
        """Create new category in database based on AI results"""
        try:
            # Get parent category
            parent_id = placement_result.get("parent_category_id")
            level = placement_result.get("suggested_level", 2)
            
            # Generate slug from name
            name = autocomplete_result["corrected_name"]
            slug = name.lower().replace(" ", "-").replace("&", "and")
            
            # Create path
            path = slug
            if parent_id:
                parent = self.db.query(UnifiedCategory).filter(UnifiedCategory.id == parent_id).first()
                if parent and parent.path:
                    path = f"{parent.path}.{slug}"
            
            new_category = UnifiedCategory(
                name=name,
                slug=slug,
                parent_id=parent_id,
                path=path,
                level=level,
                is_active=True,
                sort_order=999  # Place at end initially
            )
            
            self.db.add(new_category)
            self.db.commit()
            self.db.refresh(new_category)
            
            logger.info(f"Created new category: {new_category.name} (ID: {new_category.id})")
            return new_category
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating category in database: {e}")
            return None
    
    def _save_questions_to_db(self, category: UnifiedCategory, questions: List[Dict[str, str]]) -> bool:
        """Save generated questions to database"""
        try:
            category_question = CategoryQuestion(
                category_path=category.path or category.slug,
                category_name=category.name,
                category_level=category.level,
                is_root_category=(category.level == 1),
                questions=questions,
                created_by=None  # System generated
            )
            
            self.db.add(category_question)
            self.db.commit()
            
            logger.info(f"Saved {len(questions)} questions for category {category.name}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error saving questions for category {category.name}: {e}")
            return False