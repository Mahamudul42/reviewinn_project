import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, MessageSquare, Upload, X, Image, Loader2 } from 'lucide-react';
import type { Entity, SubcategoryConfig, ReviewFormData } from '../../types';
import { getSubcategoryConfig, getSubcategoryConfigSync, validateRequiredCriteria, validateRequiredFields, calculateOverallRating } from '../../utils/subcategoryMatcher';
import CategoryBasedRating from '../../features/reviews/components/CategoryBasedRating';
import SectionBasedForm from '../../features/reviews/components/SectionBasedForm';
import ProsConsCollector from '../../features/reviews/components/ProsConsCollector';
import { imgbbService, UploadType } from '../../api/services/imgbbService';
import StarRating from '../atoms/StarRating';
import EntityListCard from '../components/EntityListCard';
import { enhanceEntityWithHierarchicalCategories } from '../utils/entityCategoryEnhancer';

interface ReviewFormProps {
  entity: Entity;
  subcategory?: SubcategoryConfig;
  onBack: () => void;
  onSubmit: (data: ReviewFormData) => void;
  isLoading?: boolean;
}



const ReviewForm: React.FC<ReviewFormProps> = ({
  entity: rawEntity,
  subcategory: providedSubcategory,
  onBack,
  onSubmit,
  isLoading = false
}) => {
  // Enhance entity with hierarchical category data for proper display
  const entity = enhanceEntityWithHierarchicalCategories(rawEntity);
  const [subcategory, setSubcategory] = useState<SubcategoryConfig | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>({
    title: '',
    ratings: {},
    comment: '',
    isAnonymous: false,
    pros: [],
    cons: [],
    images: []
  });
  const [fieldData, setFieldData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    if (providedSubcategory) {
      setSubcategory(providedSubcategory);
      return;
    }
    
    const loadSubcategoryConfig = async () => {
      try {
        console.log(`🎯 Loading review questions for entity: ${entity.name} (ID: ${entity.entity_id || entity.id})`);
        console.log(`📊 Entity category info:`, {
          category: entity.category,
          subcategory: entity.subcategory,
          category_display: entity.category_display,
          final_category_id: entity.final_category_id,
          root_category_id: entity.root_category_id
        });
        
        const config = await getSubcategoryConfig(entity); // Now async
        setSubcategory(config);
        
        console.log(`✅ Loaded ${config.criteria.length} review criteria for ${entity.name}:`, 
          config.criteria.map(c => c.name));
          
      } catch (error) {
        console.error('❌ Error loading subcategory config:', error);
        // Fallback to basic config
        const basicConfig = getSubcategoryConfigSync(entity);
        setSubcategory(basicConfig);
      }
    };
    
    loadSubcategoryConfig();
  }, [entity, providedSubcategory]);

  const handleRatingChange = (criteriaId: string, rating: number) => {
    setFormData(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [criteriaId]: rating
      }
    }));
    
    // Clear error when rating is set
    if (errors[criteriaId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[criteriaId];
        return newErrors;
      });
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFieldData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear field error
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleProsChange = (pros: string[]) => {
    setFormData(prev => ({ ...prev, pros }));
  };

  const handleConsChange = (cons: string[]) => {
    setFormData(prev => ({ ...prev, cons }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + (formData.images?.length || 0) > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    // Validate files before upload
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = imgbbService.validateImageFile(file);
      if (!validation.valid) {
        alert(`${file.name}: ${validation.error}`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return;
    }

    // Check if ImgBB is available
    if (!imgbbService.isAvailable()) {
      alert('Image upload service is not configured. Please contact support.');
      return;
    }

    setUploadingImages(true);
    setUploadProgress({ completed: 0, total: validFiles.length });

    try {
      const uploadedUrls = await imgbbService.uploadMultipleImages(
        validFiles,
        (completed, total) => {
          setUploadProgress({ completed, total });
        },
        UploadType.REVIEW
      );

      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls]
      }));

      // Clear the file input
      e.target.value = '';
    } catch (error) {
      console.error('Image upload failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload images. Please try again.');
    } finally {
      setUploadingImages(false);
      setUploadProgress({ completed: 0, total: 0 });
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }));
  };

  const handleCommentChange = (comment: string) => {
    setFormData(prev => ({ ...prev, comment }));
    
    // Clear comment error when user starts typing
    if (errors.comment && comment.trim().length > 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.comment;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate title
    if (!formData.title.trim()) {
      newErrors.title = 'Please enter a review title';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Title must be maximum 200 characters';
    }
    
    // Validate comment
    if (!formData.comment.trim()) {
      newErrors.comment = 'Please write your review description';
    } else if (formData.comment.trim().length < 10) {
      newErrors.comment = 'Review description must be at least 10 characters long';
    } else if (formData.comment.trim().length > 10000) {
      newErrors.comment = 'Review description must be maximum 10000 characters';
    }
    
    // Validate dynamic fields if subcategory is available
    if (subcategory) {
      const fieldErrors = validateRequiredFields(subcategory, fieldData);
      Object.assign(newErrors, fieldErrors);
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Calculate overall rating from dynamic ratings
      const ratingValues = Object.values(formData.ratings);
      const overallRating = ratingValues.length > 0 
        ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
        : 0;
      
      // Create enhanced form data with overall rating and field data
      const enhancedFormData = {
        ...formData,
        overallRating,
        entityId: entity.id,
        ...fieldData // Include all dynamic field data
      };
      
      console.log('🚀 ReviewForm submitting data:', {
        formData,
        enhancedFormData,
        ratings: formData.ratings,
        fieldData
      });
      
      onSubmit(enhancedFormData);
    }
  };

  const getOverallRating = (): number => {
    if (!subcategory) return 0;
    return calculateOverallRating(subcategory, formData.ratings);
  };

  const isFormValid = (): boolean => {
    // Check basic form requirements
    const titleValid = formData.title.trim().length > 0 && formData.title.trim().length <= 200;
    const commentValid = formData.comment.trim().length >= 10 && formData.comment.trim().length <= 10000;
    
    // Check if we have at least one rating (dynamic ratings are handled by CategoryBasedRating component)
    const hasRatings = Object.keys(formData.ratings).length > 0;
    
    // Check required fields if subcategory is available
    let fieldsValid = true;
    if (subcategory) {
      const requiredFields = subcategory.fields.filter(f => f.required);
      fieldsValid = requiredFields.every(field => fieldData[field.id] && fieldData[field.id].toString().trim() !== '');
    }
    
    return titleValid && commentValid && hasRatings && fieldsValid;
  };

  // Form can now load without subcategory since we're using dynamic category-based rating

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to search</span>
        </button>
        <div className="text-sm text-gray-500">
          Step 2 of 2: Write Review
        </div>
      </div>

      {/* Entity Information Card - Using shared EntityListCard */}
      <div className="mb-4">
        <EntityListCard 
          entity={entity}
          onClick={() => {}} // Prevent navigation since we're already writing a review
          showEngagementMetrics={false} // Don't show metrics in review form to keep it clean
          showActions={false} // Don't show action buttons in review form
          className="w-full"
        />
      </div>

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Review Title */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <h4 className="text-base font-semibold text-gray-900 mb-3">
            Review Title <span className="text-red-500">*</span>
          </h4>
          <div className="space-y-2">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={`Write a title for your review of ${entity.name}...`}
              maxLength={200}
              className={`w-full p-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm ${
                errors.title ? 'border-red-300' : 'border-gray-300 focus:border-blue-500'
              }`}
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Maximum 200 characters ({formData.title.length}/200)
              </div>
              {errors.title && (
                <p className="text-xs text-red-500">{errors.title}</p>
              )}
            </div>
          </div>
        </div>

        {/* Category-Based Dynamic Rating */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <CategoryBasedRating
            entity={entity}
            ratings={formData.ratings}
            onRatingChange={handleRatingChange}
            disabled={isLoading}
          />

          {/* Overall Rating Display */}
          {Object.keys(formData.ratings).length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">Overall Score:</span>
                <div className="flex items-center gap-2">
                  <StarRating
                    rating={Object.values(formData.ratings).reduce((a, b) => a + b, 0) / Object.values(formData.ratings).length}
                    size="sm"
                    showValue={true}
                    interactive={false}
                    className="text-yellow-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Form Fields */}
        {subcategory && subcategory.fields.length > 0 && (
          <SectionBasedForm
            fields={subcategory.fields}
            formData={fieldData}
            onFieldChange={handleFieldChange}
            errors={errors}
            disabled={isLoading}
          />
        )}

        {/* Pros and Cons */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <ProsConsCollector
            pros={formData.pros || []}
            cons={formData.cons || []}
            onProsChange={handleProsChange}
            onConsChange={handleConsChange}
            entityCategory={entity.category}
            disabled={isLoading}
          />
        </div>

        {/* Review Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            Review Description <span className="text-red-500">*</span>
          </h4>
          
          <div className="space-y-2">
            <textarea
              value={formData.comment}
              onChange={(e) => handleCommentChange(e.target.value)}
              placeholder={`Share your detailed experience with ${entity.name}...`}
              rows={4}
              maxLength={10000}
              className={`w-full p-2 border rounded-lg resize-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm ${
                errors.comment ? 'border-red-300' : 'border-gray-300 focus:border-blue-500'
              }`}
            />
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Minimum 10 characters ({formData.comment.length}/10000)
              </div>
              {errors.comment && (
                <p className="text-xs text-red-500">{errors.comment}</p>
              )}
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Image className="h-4 w-4 text-blue-600" />
            Photos (Optional)
          </h4>
          
          <div className="space-y-3">
            {/* Upload Area */}
            {(!formData.images || formData.images.length < 5) && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  Add photos to your review (up to 5 images)
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  JPEG, PNG, JPG • Max 5MB each
                </p>
                <label className={`inline-flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                  uploadingImages || isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                } text-white`}>
                  {uploadingImages ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Uploading ({uploadProgress.completed}/{uploadProgress.total})
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 mr-2" />
                      Choose Images
                    </>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isLoading || uploadingImages}
                  />
                </label>
              </div>
            )}

            {/* Image Previews */}
            {formData.images && formData.images.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">
                  Uploaded Images ({formData.images.length}/5)
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="aspect-video w-full">
                        <img
                          src={image}
                          alt={`Review image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 transform hover:scale-110 shadow-lg"
                          disabled={isLoading}
                          title="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Privacy Settings</h5>
              <p className="text-xs text-gray-500 mt-1">
                Choose how your review appears to others
              </p>
            </div>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-opacity-50"
              />
              <span className="text-sm text-gray-700">Post anonymously</span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-2 pt-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 text-sm"
          >
            Back
          </button>
          
          <button
            type="submit"
            disabled={!isFormValid() || isLoading}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm ${
              isFormValid() && !isLoading
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;