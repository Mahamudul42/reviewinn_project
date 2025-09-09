import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Eye, 
  Building2,
  Users,
  MapPin,
  Package2,
  Star,
  CheckCircle,
  AlertCircle,
  Info,
  Upload,
  Camera,
  Image as ImageIcon,
  ChevronRight
} from 'lucide-react';
import { EntityCategory } from '../../../types';
import type { SubcategoryConfig, EntityFormData, EntityContext } from '../../../types';
import type { FormField } from '../../../types/ui';
import type { LegacySubcategory } from '../../../types';
import { Card, Button, Badge } from '../../../shared/ui';
import { getCategoryIcon, getCategoryColor } from '../../../shared/utils/categoryUtils';

interface DynamicEntityFormProps {
  category: EntityCategory;
  subcategory: SubcategoryConfig;
  subcategoryData: LegacySubcategory;
  onBack: () => void;
  onSubmit: (data: EntityFormData) => void;
  initialData?: Partial<EntityFormData>;
  isLoading?: boolean;
}

const DynamicEntityForm: React.FC<DynamicEntityFormProps> = ({
  category,
  subcategory,
  subcategoryData,
  onBack,
  onSubmit,
  initialData,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<EntityFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category,
    subcategory: subcategory.id,
    context: initialData?.context || {
      role: '',
      organization: '',
      department: '',
      location: '',
      isCurrent: true
    },
    additionalContexts: initialData?.additionalContexts || [],
    fields: initialData?.fields || {},
    customFields: initialData?.customFields || {}
  });

  const [showPreview, setShowPreview] = useState(false);
  const [entityImage, setEntityImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Get category icon and color scheme
  const CategoryIcon = getCategoryIcon(category);
  const categoryColor = getCategoryColor(category);

  // Enhanced color schemes per category (matching homepage)
  const colorSchemes = {
    [EntityCategory.PROFESSIONALS]: {
      primary: 'from-purple-500 to-violet-600',
      secondary: 'from-purple-100 to-violet-100',
      accent: 'purple-600',
      bg: 'purple-50',
      text: 'purple-900',
      light: 'purple-100',
      icon: 'text-white',
    },
    [EntityCategory.COMPANIES]: {
      primary: 'from-emerald-500 to-teal-600',
      secondary: 'from-emerald-100 to-teal-100',
      accent: 'emerald-600',
      bg: 'emerald-50',
      text: 'emerald-900',
      light: 'emerald-100',
      icon: 'text-white',
    },
    [EntityCategory.PLACES]: {
      primary: 'from-rose-500 to-pink-600',
      secondary: 'from-rose-100 to-pink-100',
      accent: 'rose-600',
      bg: 'rose-50',
      text: 'rose-900',
      light: 'rose-100',
      icon: 'text-white',
    },
    [EntityCategory.PRODUCTS]: {
      primary: 'from-amber-500 to-orange-600',
      secondary: 'from-amber-100 to-orange-100',
      accent: 'amber-600',
      bg: 'amber-50',
      text: 'amber-900',
      light: 'amber-100',
      icon: 'text-white',
    },
  };

  const scheme = colorSchemes[category];

  // Handle field updates
  const updateField = (fieldId: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      customFields: { ...prev.customFields, [fieldId]: value }
    }));
  };

  // Add context (for professionals)
  const addContext = () => {
    const newContext: EntityContext = {
      role: '',
      organization: '',
      department: '',
      location: '',
      startDate: undefined,
      endDate: undefined,
      isCurrent: false
    };
    
    setFormData(prev => ({
      ...prev,
      additionalContexts: [...(prev.additionalContexts || []), newContext]
    }));
  };

  // Remove context
  const removeContext = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalContexts: prev.additionalContexts?.filter((_, i) => i !== index) || []
    }));
  };

  // Update context
  const updateContext = (index: number, field: keyof EntityContext, value: string | Date | boolean | undefined) => {
    setFormData(prev => ({
      ...prev,
      additionalContexts: prev.additionalContexts?.map((context, i) => 
        i === index ? { ...context, [field]: value } : context
      ) || []
    }));
  };

  // Handle image upload (local preview only for now)
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setImageFile(file);
    setImageUploading(true);

    try {
      // Create preview URL for local display
      const previewUrl = URL.createObjectURL(file);
      setEntityImage(previewUrl);
      
      // Simulate upload process
      setTimeout(() => {
        setImageUploading(false);
      }, 800);
      
    } catch (error) {
      console.error('Error processing image:', error);
      setImageUploading(false);
      alert('Error processing image. Please try again.');
    }
  };

  // Remove image
  const removeImage = () => {
    if (entityImage) {
      URL.revokeObjectURL(entityImage);
    }
    setEntityImage(null);
    setImageFile(null);
  };

  // Form validation
  const isFormValid = useMemo(() => {
    // Check basic required fields (name and description)
    const hasName = formData.name.trim() !== '';
    const hasDescription = formData.description?.trim() !== '';
    
    // Check category-specific required fields (excluding name and description which are handled above)
    const categorySpecificRequiredFields = subcategory.fields.filter(f => 
      f.required && !['name', 'description'].includes(f.id)
    );
    
    const hasRequiredCategoryFields = categorySpecificRequiredFields.every(field => {
      const value = formData.customFields?.[field.id];
      return value && value.toString().trim() !== '';
    });
    
    // For professionals, require at least one context with role and organization
    const hasValidContexts = formData.category !== EntityCategory.PROFESSIONALS || 
      (formData.context && formData.context.role && formData.context.organization) ||
      (formData.additionalContexts && formData.additionalContexts.length > 0);
    
    const result = hasName && hasDescription && hasRequiredCategoryFields && hasValidContexts;
    
    // Debug logging (only in development)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('Form validation:', { 
        hasName, hasDescription, hasRequiredCategoryFields, hasValidContexts, result,
        categorySpecificRequiredFields: categorySpecificRequiredFields.map(f => ({ 
          id: f.id, 
          name: f.name, 
          value: formData.customFields?.[f.id] 
        }))
      });
    }
    
    return result;
  }, [formData, subcategory.fields]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isFormValid) {
      // Create submission data including image data for review step
      const submitData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        context: formData.context,
        additionalContexts: formData.additionalContexts,
        fields: formData.fields,
        customFields: formData.customFields,
        // Include image data for review step display
        entityImage: entityImage,
        imageFile: imageFile
      };
      
      console.log('Submitting entity form data:', submitData.name, 'with image:', !!entityImage);
      onSubmit(submitData);
    } else {
      // Show specific validation errors
      const errors = [];
      if (!formData.name.trim()) errors.push('Entity name');
      if (!formData.description?.trim()) errors.push('Entity description');
      
      const requiredFields = subcategory.fields.filter(f => f.required && !['name', 'description'].includes(f.id));
      requiredFields.forEach(field => {
        if (!formData.customFields?.[field.id] || !formData.customFields?.[field.id]?.toString().trim()) {
          errors.push(field.name);
        }
      });
      
      if (formData.category === EntityCategory.PROFESSIONALS && 
          (!formData.context?.role || !formData.context?.organization) &&
          (!formData.additionalContexts || formData.additionalContexts.length === 0)) {
        errors.push('Professional role and organization');
      }
      
      alert(`Please fill in the following required fields:\n• ${errors.join('\n• ')}`);
    }
  };

  // Render field based on type
  const renderField = (field: FormField) => {
    const fieldId = field.id;
    const value = formData.customFields?.[fieldId] || '';

    const fieldClasses = `w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-${scheme.accent} focus:ring-2 focus:ring-${scheme.accent}/20 transition-all duration-200 bg-white/80 backdrop-blur-sm`;

    switch (field.type) {
      case 'select':
        return (
          <select
            className={fieldClasses}
            value={value}
            onChange={(e) => updateField(fieldId, e.target.value)}
            required={field.required}
          >
            <option value="">Select {field.name.toLowerCase()}</option>
            {field.options?.map(option => {
              if (typeof option === 'string') {
                return <option key={option} value={option}>{option}</option>;
              } else {
                return <option key={option.value} value={option.value}>{option.label}</option>;
              }
            })}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            className={fieldClasses}
            value={value}
            onChange={(e) => updateField(fieldId, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            className={fieldClasses}
            value={value}
            onChange={(e) => updateField(fieldId, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            className={fieldClasses}
            value={value}
            onChange={(e) => updateField(fieldId, e.target.value)}
            required={field.required}
          />
        );

      case 'url':
        return (
          <input
            type="url"
            className={fieldClasses}
            value={value}
            onChange={(e) => updateField(fieldId, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case 'tel':
        return (
          <input
            type="tel"
            className={fieldClasses}
            value={value}
            onChange={(e) => updateField(fieldId, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      default:
        return (
          <input
            type="text"
            className={fieldClasses}
            value={value}
            onChange={(e) => updateField(fieldId, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
    }
  };

  // Preview card component (similar to homepage entity cards)
  const EntityPreviewCard = () => (
    <Card variant="elevated" className="overflow-hidden">
      {/* Header with gradient background */}
      <div className={`bg-gradient-to-r ${scheme.primary} p-6 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6"></div>
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden`}>
              {entityImage ? (
                <img 
                  src={entityImage} 
                  alt={formData.name || 'Entity'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <CategoryIcon className="h-8 w-8 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold">{formData.name || 'Entity Name'}</h3>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 mt-1">
                {subcategoryData.name}
              </Badge>
            </div>
          </div>
          <p className="text-white/90 text-sm leading-relaxed">
            {formData.description || 'Entity description will appear here...'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} className={`h-4 w-4 text-${scheme.accent} fill-current`} />
              ))}
            </div>
            <p className="text-sm text-gray-600">Not yet rated</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-600">Reviews</p>
          </div>
        </div>

        {/* Dynamic context info */}
        {category === EntityCategory.PROFESSIONALS && formData.context?.organization && (
          <div className={`p-3 bg-gradient-to-r ${scheme.secondary} rounded-lg mb-4`}>
            <p className={`text-sm font-medium text-${scheme.text}`}>
              {formData.context.role} at {formData.context.organization}
            </p>
          </div>
        )}

        {/* Key details */}
        <div className="space-y-2">
          {Object.entries(formData.customFields || {})
            .filter(([_, value]) => value)
            .slice(0, 3)
            .map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-600 capitalize">{key.replace('_', ' ')}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))
          }
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="w-full max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            size="lg"
            onClick={onBack}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            className="mb-6"
          >
            Back to Selection
          </Button>

          {/* Category Header */}
          <Card variant="elevated" className="overflow-hidden mb-6">
            <div className={`bg-gradient-to-r ${scheme.primary} p-6 text-white relative`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <CategoryIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">Create {category.replace('_', ' ')}</h1>
                  <p className="text-white/90">Fill in the details for your {subcategoryData.name.toLowerCase()}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card variant="elevated" padding="lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${scheme.primary} flex items-center justify-center`}>
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Basic Information</h3>
                    <p className="text-gray-600">Essential details about the entity</p>
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Entity Image
                  </label>
                  
                  {entityImage ? (
                    <div className="relative">
                      <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                        <img
                          src={entityImage}
                          alt="Entity preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="mt-2 flex flex-col gap-2">
                        <label className={`cursor-pointer inline-flex items-center gap-2 px-3 py-2 border-2 border-${scheme.accent}/30 text-${scheme.accent} rounded-lg hover:bg-${scheme.bg} transition-all duration-200 text-sm`}>
                          <Camera className="h-4 w-4" />
                          Change Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-amber-600 px-2 py-1 bg-amber-50 rounded text-center">
                          Preview only - not saved yet
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-r ${scheme.primary} flex items-center justify-center`}>
                        {imageUploading ? (
                          <div className="animate-spin">
                            <Upload className="h-8 w-8 text-white" />
                          </div>
                        ) : (
                          <ImageIcon className="h-8 w-8 text-white" />
                        )}
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Add Entity Image (Preview)</h4>
                      <p className="text-gray-600 mb-2">Upload a photo or logo to represent this entity</p>
                      <p className="text-xs text-amber-600 mb-4 px-3 py-1 bg-amber-50 rounded-full inline-block">
                        Note: Images are for preview only and won't be saved yet
                      </p>
                      <label className={`cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${scheme.primary} text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium`}>
                        <Upload className="h-5 w-5" />
                        {imageUploading ? 'Processing...' : 'Choose Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={imageUploading}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-${scheme.accent} focus:ring-2 focus:ring-${scheme.accent}/20 transition-all duration-200 bg-white/80 backdrop-blur-sm`}
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={`Enter ${category.replace('_', ' ').toLowerCase()} name`}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-${scheme.accent} focus:ring-2 focus:ring-${scheme.accent}/20 transition-all duration-200 bg-white/80 backdrop-blur-sm`}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={`Provide a detailed description of this ${category.replace('_', ' ').toLowerCase()}`}
                      rows={4}
                      required
                    />
                  </div>
                </div>
              </Card>

              {/* Category-specific fields */}
              <Card variant="elevated" padding="lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${scheme.primary} flex items-center justify-center`}>
                    <CategoryIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{category.replace('_', ' ')} Details</h3>
                    <p className="text-gray-600">Specific information for this category</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {subcategory.fields
                    .filter(field => !['name', 'description'].includes(field.id))
                    .map((field) => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.name} {field.required && '*'}
                        </label>
                        {renderField(field)}
                      </div>
                    ))}
                </div>
              </Card>

              {/* Professional Contexts (if applicable) */}
              {category === EntityCategory.PROFESSIONALS && (
                <Card variant="elevated" padding="lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${scheme.primary} flex items-center justify-center`}>
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Professional Context</h3>
                        <p className="text-gray-600">Work experience and roles</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Primary Context */}
                  <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 border-2 border-purple-200 rounded-2xl relative overflow-hidden">
                    {/* Decorative background */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200/30 to-violet-200/30 rounded-full transform translate-x-8 -translate-y-8"></div>
                    
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-md">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                          Primary Professional Role
                        </h4>
                        <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-violet-600 text-white text-xs font-bold rounded-full shadow-sm">
                          CURRENT
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-purple-700">Position/Role Title *</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white/90 backdrop-blur-sm shadow-sm"
                            value={formData.context?.role || ''}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              context: { 
                                ...prev.context!, 
                                role: e.target.value 
                              }
                            }))}
                            placeholder="e.g., Software Engineer, Professor"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-purple-700">Institution/Organization *</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white/90 backdrop-blur-sm shadow-sm"
                            value={formData.context?.organization || ''}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              context: { 
                                ...prev.context!, 
                                organization: e.target.value 
                              }
                            }))}
                            placeholder="e.g., Technology Company, University"
                            required
                          />
                        </div>
                      </div>

                      {/* Additional Professional Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-purple-700">Department/Division</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white/90 backdrop-blur-sm shadow-sm"
                            value={formData.context?.department || ''}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              context: { 
                                ...prev.context!, 
                                department: e.target.value 
                              }
                            }))}
                            placeholder="e.g., Computer Science, Engineering, Marketing"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-purple-700">Location</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white/90 backdrop-blur-sm shadow-sm"
                            value={formData.context?.location || ''}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              context: { 
                                ...prev.context!, 
                                location: e.target.value 
                              }
                            }))}
                            placeholder="e.g., San Francisco, CA; Cambridge, MA"
                          />
                        </div>
                      </div>

                      {/* Specialization and Experience */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-purple-700">Area of Expertise/Specialization</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white/90 backdrop-blur-sm shadow-sm"
                            value={formData.customFields?.specialization || ''}
                            onChange={(e) => updateField('specialization', e.target.value)}
                            placeholder="e.g., Machine Learning, Cardiac Surgery, Digital Marketing"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-purple-700">Years of Experience</label>
                          <input
                            type="number"
                            className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white/90 backdrop-blur-sm shadow-sm"
                            value={formData.customFields?.experience_years || ''}
                            onChange={(e) => updateField('experience_years', e.target.value)}
                            placeholder="e.g., 5"
                            min="0"
                            max="50"
                          />
                        </div>
                      </div>

                      {/* Time Period Section */}
                      <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-md flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-sm font-bold text-indigo-700">Time Period</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-indigo-600">Start Date</label>
                            <input
                              type="month"
                              className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-all duration-200 bg-white text-sm"
                              value={formData.context?.startDate ? formData.context.startDate.toISOString().substring(0, 7) : ''}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                context: { 
                                  ...prev.context!, 
                                  startDate: e.target.value ? new Date(e.target.value + '-01') : undefined
                                }
                              }))}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-indigo-600">End Date</label>
                            <input
                              type="month"
                              className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-all duration-200 bg-white text-sm disabled:bg-gray-100"
                              value={formData.context?.endDate ? formData.context.endDate.toISOString().substring(0, 7) : ''}
                              disabled={formData.context?.isCurrent}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                context: { 
                                  ...prev.context!, 
                                  endDate: e.target.value ? new Date(e.target.value + '-01') : undefined
                                }
                              }))}
                            />
                          </div>
                          
                          <div className="flex items-center justify-center">
                            <label className="flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={formData.context?.isCurrent || false}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  context: { 
                                    ...prev.context!, 
                                    isCurrent: e.target.checked,
                                    endDate: e.target.checked ? undefined : prev.context?.endDate
                                  }
                                }))}
                              />
                              <div className={`w-4 h-4 rounded border-2 border-white flex items-center justify-center ${formData.context?.isCurrent ? 'bg-white' : 'bg-transparent'}`}>
                                {formData.context?.isCurrent && (
                                  <svg className="w-2.5 h-2.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-xs font-bold">Current Role</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Contexts */}
                  {formData.additionalContexts?.map((context, index) => (
                    <div key={index} className="mb-6 p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200 rounded-2xl relative overflow-hidden shadow-sm">
                      {/* Decorative background */}
                      <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full transform -translate-x-4 -translate-y-4"></div>
                      
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                              <span className="text-white font-bold text-sm">{index + 1}</span>
                            </div>
                            <h4 className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                              Additional Professional Role
                            </h4>
                            {context.isCurrent && (
                              <div className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                                CURRENT
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeContext(index)}
                            className="w-8 h-8 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-amber-700">Position/Role Title *</label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 bg-white/90 backdrop-blur-sm shadow-sm"
                              value={context.role || ''}
                              onChange={(e) => updateContext(index, 'role', e.target.value)}
                              placeholder="e.g., Research Assistant, Consultant"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-amber-700">Institution/Organization *</label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 bg-white/90 backdrop-blur-sm shadow-sm"
                              value={context.organization || ''}
                              onChange={(e) => updateContext(index, 'organization', e.target.value)}
                              placeholder="e.g., University, Research Institute"
                              required
                            />
                          </div>
                        </div>

                        {/* Additional Details for Additional Context */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-amber-700">Department/Division</label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 bg-white/90 backdrop-blur-sm shadow-sm"
                              value={context.department || ''}
                              onChange={(e) => updateContext(index, 'department', e.target.value)}
                              placeholder="e.g., Computer Science, Biology, Physics"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-amber-700">Location</label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 bg-white/90 backdrop-blur-sm shadow-sm"
                              value={context.location || ''}
                              onChange={(e) => updateContext(index, 'location', e.target.value)}
                              placeholder="e.g., Cambridge, MA; Palo Alto, CA"
                            />
                          </div>
                        </div>

                        {/* Time Period Section for Additional Context */}
                        <div className="mt-4 p-4 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-gradient-to-r from-rose-500 to-pink-600 rounded-md flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="text-sm font-bold text-rose-700">Duration</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <label className="block text-xs font-bold text-rose-600">Start Date</label>
                              <input
                                type="month"
                                className="w-full px-3 py-2 border-2 border-rose-200 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-200 transition-all duration-200 bg-white text-sm"
                                value={context.startDate ? context.startDate.toISOString().substring(0, 7) : ''}
                                onChange={(e) => updateContext(index, 'startDate', e.target.value ? new Date(e.target.value + '-01') : undefined)}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="block text-xs font-bold text-rose-600">End Date</label>
                              <input
                                type="month"
                                className="w-full px-3 py-2 border-2 border-rose-200 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-200 transition-all duration-200 bg-white text-sm disabled:bg-gray-100"
                                value={context.endDate ? context.endDate.toISOString().substring(0, 7) : ''}
                                disabled={context.isCurrent}
                                onChange={(e) => updateContext(index, 'endDate', e.target.value ? new Date(e.target.value + '-01') : undefined)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-center">
                              <label className="flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={context.isCurrent || false}
                                  onChange={(e) => {
                                    const updatedContext = {
                                      ...context,
                                      isCurrent: e.target.checked,
                                      endDate: e.target.checked ? undefined : context.endDate
                                    };
                                    setFormData(prev => ({
                                      ...prev,
                                      additionalContexts: prev.additionalContexts?.map((ctx, i) => 
                                        i === index ? updatedContext : ctx
                                      ) || []
                                    }));
                                  }}
                                />
                                <div className={`w-4 h-4 rounded border-2 border-white flex items-center justify-center ${context.isCurrent ? 'bg-white' : 'bg-transparent'}`}>
                                  {context.isCurrent && (
                                    <svg className="w-2.5 h-2.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-xs font-bold">Current Role</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addContext}
                      leftIcon={<Plus className="h-5 w-5" />}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-bold"
                    >
                      Add Another Professional Role
                    </Button>
                    <p className="text-sm text-gray-600 mt-2">Add concurrent roles, previous positions, or multiple affiliations</p>
                  </div>
                </Card>
              )}

              {/* Enhanced Submit Actions */}
              <Card variant="elevated" padding="lg" className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-3">
                    {isFormValid ? (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-lg animate-pulse">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                        <AlertCircle className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${isFormValid ? 'text-green-800' : 'text-amber-800'}`}>
                    {isFormValid ? 'Ready to Continue!' : 'Form Incomplete'}
                  </h3>
                  <p className={`text-sm ${isFormValid ? 'text-green-700' : 'text-amber-700'}`}>
                    {isFormValid 
                      ? 'All required information has been provided. Click below to review your entity details.' 
                      : 'Please fill in all required fields to continue.'}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={onBack}
                    className="px-8 border-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                    disabled={isLoading}
                  >
                    ← Back to Selection
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={!isFormValid}
                    isLoading={isLoading}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSubmit(e);
                    }}
                    className={`px-12 py-4 font-bold text-lg ${isFormValid 
                      ? `bg-gradient-to-r ${scheme.primary} hover:shadow-2xl transform hover:scale-105 text-white` 
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    } rounded-xl shadow-xl transition-all duration-300 min-w-[200px]`}
                    rightIcon={!isLoading ? <ChevronRight className="h-6 w-6" /> : undefined}
                  >
                    {isLoading ? 'Processing...' : '🚀 Continue to Review'}
                  </Button>
                </div>
                
                {/* Alternative Submit Button for Extra Visibility */}
                {isFormValid && (
                  <div className="mt-4 text-center">
                    <button
                      type="submit"
                      disabled={isLoading}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSubmit(e);
                      }}
                      className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      ✨ Ready? Continue to Review ✨
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {!isFormValid && (
                  <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded-lg">
                    <h4 className="font-medium text-amber-800 mb-2">Required Fields:</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      {!formData.name.trim() && <li>• Entity name</li>}
                      {!formData.description?.trim() && <li>• Entity description</li>}
                      {subcategory.fields
                        .filter(f => f.required && !['name', 'description'].includes(f.id))
                        .map(field => 
                          !formData.customFields?.[field.id] && (
                            <li key={field.id}>• {field.name}</li>
                          )
                        )
                      }
                      {category === EntityCategory.PROFESSIONALS && 
                       (!formData.context?.role || !formData.context?.organization) && 
                       <li>• Professional role and organization</li>
                      }
                    </ul>
                  </div>
                )}
              </Card>
            </form>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Preview</h3>
                <span className="text-xs text-gray-500">How it will appear</span>
              </div>
              
              <EntityPreviewCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicEntityForm;