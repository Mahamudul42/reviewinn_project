/**
 * CategoryBasedRating Component
 * 
 * Attempts to fetch category-specific review questions from the backend API.
 * Currently, the backend endpoints (/api/v1/category-questions/*) are not implemented,
 * so this component gracefully falls back to hardcoded questions based on entity category.
 * 
 * Expected behavior in development:
 * - 404 errors for API endpoints are normal and expected
 * - Component will use hardcoded questions as fallback
 * - No functionality is lost - users can still write reviews with appropriate questions
 */

import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { Entity } from '../../../types';
import StarRating from '../../../shared/atoms/StarRating';

interface Question {
  key: string;
  question: string;
  description: string;
}

interface QuestionsData {
  questions: Question[];
  category_name: string;
  category_path: string;
  is_fallback?: boolean;
  source?: string;
  fallback_reason?: string;
}

interface CategoryBasedRatingProps {
  entity: Entity;
  ratings: Record<string, number>;
  onRatingChange: (questionKey: string, rating: number) => void;
  disabled?: boolean;
}

export const CategoryBasedRating: React.FC<CategoryBasedRatingProps> = ({
  entity,
  ratings,
  onRatingChange,
  disabled = false
}) => {
  const [questionsData, setQuestionsData] = useState<QuestionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First try the entity-specific endpoint (expected to fail in development)
        let response = await fetch(`/api/v1/category-questions/entity/${entity.id}`);
        
        if (!response.ok) {
          // Entity-specific endpoint doesn't exist - this is expected, try category fallback
          if (response.status !== 404) {
            console.warn(`Entity ${entity.id} endpoint failed with status ${response.status}, attempting category fallback`);
          }
          
          // Determine category from entity.category field
          let fallbackCategory = 'other'; // default fallback
          
          if (entity.category) {
            const category = entity.category.toLowerCase();
            if (category.includes('professional') || category.includes('doctor') || category.includes('teacher')) {
              fallbackCategory = 'professionals';
            } else if (category.includes('company') || category.includes('institution') || category.includes('university') || category.includes('school')) {
              fallbackCategory = 'companiesinstitutes';
            } else if (category.includes('place') || category.includes('location') || category.includes('restaurant')) {
              fallbackCategory = 'places';
            } else if (category.includes('product')) {
              fallbackCategory = 'products';
            }
          }
          
          // Try the category-based endpoint (also expected to fail in development)
          response = await fetch(`/api/v1/category-questions/category/${fallbackCategory}`);
          
          if (!response.ok) {
            // Category endpoint doesn't exist either - this is expected, use hardcoded questions
            if (response.status !== 404) {
              console.warn(`Category endpoint failed with status ${response.status}, using hardcoded questions for ${fallbackCategory}`);
            }
            
            const hardcodedQuestions = getHardcodedQuestions(fallbackCategory, entity.category);
            console.info(`💡 Using hardcoded ${fallbackCategory} questions for entity ${entity.id} (${hardcodedQuestions.length} questions)`);
            setQuestionsData({
              questions: hardcodedQuestions,
              category_name: fallbackCategory.charAt(0).toUpperCase() + fallbackCategory.slice(1),
              category_path: fallbackCategory,
              is_fallback: true,
              source: 'hardcoded',
              fallback_reason: `Backend API unavailable, using default ${fallbackCategory} questions`
            });
            return;
          }
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setQuestionsData(result.data);
        } else {
          // Final fallback to hardcoded questions
          const category = entity.category ? entity.category.toLowerCase() : 'other';
          let fallbackCategory = 'other';
          
          if (category.includes('professional') || category.includes('doctor') || category.includes('teacher')) {
            fallbackCategory = 'professionals';
          } else if (category.includes('company') || category.includes('institution') || category.includes('university') || category.includes('school')) {
            fallbackCategory = 'companiesinstitutes';
          } else if (category.includes('place') || category.includes('location') || category.includes('restaurant')) {
            fallbackCategory = 'places';
          } else if (category.includes('product')) {
            fallbackCategory = 'products';
          }
          
          const hardcodedQuestions = getHardcodedQuestions(fallbackCategory, entity.category);
          console.info(`💡 API returned no data, using hardcoded ${fallbackCategory} questions for entity ${entity.id} (${hardcodedQuestions.length} questions)`);
          setQuestionsData({
            questions: hardcodedQuestions,
            category_name: fallbackCategory.charAt(0).toUpperCase() + fallbackCategory.slice(1),
            category_path: fallbackCategory,
            is_fallback: true,
            source: 'hardcoded',
            fallback_reason: `API returned no data, using default ${fallbackCategory} questions`
          });
        }
      } catch (err) {
        console.error('Error fetching category questions:', err);
        
        // Even if there's an error, provide hardcoded questions as last resort
        const category = entity.category ? entity.category.toLowerCase() : 'other';
        let fallbackCategory = 'other';
        
        if (category.includes('professional') || category.includes('doctor') || category.includes('teacher')) {
          fallbackCategory = 'professionals';
        } else if (category.includes('company') || category.includes('institution') || category.includes('university') || category.includes('school')) {
          fallbackCategory = 'companiesinstitutes';
        } else if (category.includes('place') || category.includes('location') || category.includes('restaurant')) {
          fallbackCategory = 'places';
        } else if (category.includes('product')) {
          fallbackCategory = 'products';
        }
        
        const hardcodedQuestions = getHardcodedQuestions(fallbackCategory, entity.category);
        console.info(`💡 Error occurred, using hardcoded ${fallbackCategory} questions for entity ${entity.id} (${hardcodedQuestions.length} questions)`);
        setQuestionsData({
          questions: hardcodedQuestions,
          category_name: fallbackCategory.charAt(0).toUpperCase() + fallbackCategory.slice(1),
          category_path: fallbackCategory,
          is_fallback: true,
          source: 'hardcoded-error',
          fallback_reason: `Error loading questions: ${err instanceof Error ? err.message : 'Unknown error'}`
        });
      } finally {
        setLoading(false);
      }
    };

    if (entity.id) {
      fetchQuestions();
    }
  }, [entity.id]);

  // Hardcoded fallback questions for when API is unavailable
  const getHardcodedQuestions = (category: string, entityCategory?: string): Question[] => {
    switch (category) {
      case 'professionals':
        return [
          {
            key: "expertise",
            question: "How would you rate their expertise and knowledge?",
            description: "Professional competence and subject matter expertise (1-5 scale)"
          },
          {
            key: "professionalism", 
            question: "How professional was their conduct and communication?",
            description: "Professional behavior, punctuality, and communication skills (1-5 scale)"
          },
          {
            key: "reliability",
            question: "How reliable and dependable were they?",
            description: "Consistency in delivery and meeting commitments (1-5 scale)"
          },
          {
            key: "value_for_money",
            question: "How would you rate the value for money?",
            description: "Quality of service relative to cost (1-5 scale)"
          },
          {
            key: "recommendation",
            question: "How likely are you to recommend them to others?",
            description: "Overall satisfaction and likelihood to recommend (1-5 scale)"
          }
        ];
      
      case 'companiesinstitutes':
        return [
          {
            key: "service_quality",
            question: "How would you rate the overall service quality?",
            description: "Quality of products or services provided (1-5 scale)"
          },
          {
            key: "customer_service",
            question: "How was the customer service experience?",
            description: "Staff helpfulness, responsiveness, and support (1-5 scale)"
          },
          {
            key: "facilities",
            question: "How would you rate their facilities and resources?",
            description: "Physical infrastructure, equipment, and resources (1-5 scale)"
          },
          {
            key: "value_for_money",
            question: "How would you rate the value for money?",
            description: "Quality relative to price or cost (1-5 scale)"
          },
          {
            key: "reputation",
            question: "How would you rate their reputation and credibility?",
            description: "Trustworthiness and standing in the industry (1-5 scale)"
          }
        ];
      
      case 'places':
        return [
          {
            key: "atmosphere",
            question: "How would you rate the atmosphere and ambiance?",
            description: "Overall feel, mood, and environment of the place (1-5 scale)"
          },
          {
            key: "cleanliness",
            question: "How clean and well-maintained was the place?",
            description: "Hygiene standards and maintenance quality (1-5 scale)"
          },
          {
            key: "accessibility",
            question: "How accessible and convenient was the location?",
            description: "Ease of access, parking, and transportation (1-5 scale)"
          },
          {
            key: "staff_service",
            question: "How was the service from staff members?",
            description: "Staff friendliness, helpfulness, and efficiency (1-5 scale)"
          },
          {
            key: "value_for_money",
            question: "How would you rate the value for money?",
            description: "Experience quality relative to cost (1-5 scale)"
          }
        ];
      
      case 'products':
        return [
          {
            key: "quality",
            question: "How would you rate the overall product quality?",
            description: "Build quality, materials, and craftsmanship (1-5 scale)"
          },
          {
            key: "functionality",
            question: "How well does the product function as expected?",
            description: "Performance and reliability in intended use (1-5 scale)"
          },
          {
            key: "design",
            question: "How would you rate the design and aesthetics?",
            description: "Visual appeal, ergonomics, and user experience (1-5 scale)"
          },
          {
            key: "durability",
            question: "How durable and long-lasting is the product?",
            description: "Expected lifespan and resistance to wear (1-5 scale)"
          },
          {
            key: "value_for_money",
            question: "How would you rate the value for money?",
            description: "Product quality relative to price paid (1-5 scale)"
          }
        ];
      
      default: // 'other'
        return [
          {
            key: "overall_satisfaction",
            question: "How satisfied are you with this entity overall?",
            description: "General satisfaction with the experience (1-5 scale)"
          },
          {
            key: "quality",
            question: "How would you rate the overall quality?",
            description: "General quality assessment (1-5 scale)"
          },
          {
            key: "reliability",
            question: "How reliable was this entity?",
            description: "Consistency and dependability (1-5 scale)"
          },
          {
            key: "uniqueness",
            question: "How unique or distinctive is this entity?",
            description: "What makes it stand out from alternatives (1-5 scale)"
          },
          {
            key: "recommendation",
            question: "How likely are you to recommend this to others?",
            description: "Likelihood to recommend based on experience (1-5 scale)"
          }
        ];
    }
  };

  const renderStars = (questionKey: string, currentRating: number) => {
    return (
      <div className="flex items-center gap-2">
        <StarRating
          rating={currentRating}
          maxRating={5}
          size="md"
          showValue={true}
          style="golden"
          onRatingChange={(rating) => !disabled && onRatingChange(questionKey, rating)}
          disabled={disabled}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600">Loading rating questions...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-800">Unable to load rating questions</span>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!questionsData || !questionsData.questions || questionsData.questions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">No rating questions available</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Rating questions are not configured for this category yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="text-base font-semibold text-gray-900">
          Rate Your Experience
        </h3>
        {questionsData.is_fallback && (
          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            {questionsData.fallback_reason ? questionsData.fallback_reason : `Using ${questionsData.category_name} questions`}
          </div>
        )}
      </div>
      
      {questionsData.questions.map((question) => (
        <div key={question.key} className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {question.question}
                <span className="text-red-500 ml-1">*</span>
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                {question.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {renderStars(
              question.key,
              ratings[question.key] || 0
            )}
          </div>
          
          {!ratings[question.key] && (
            <p className="text-xs text-red-500">This rating is required</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default CategoryBasedRating;