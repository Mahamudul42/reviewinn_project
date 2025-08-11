import React, { useState, useEffect, useMemo } from 'react';
import { EntityCategory } from '../../../types/index';
import type { UnifiedCategory, SubcategoryConfig, EntityFormData } from '../../../types/index';
import type { FormField } from '../../../types/ui';
// import { getCategoryConfig } from '../../../config/enhanced-categories'; // Temporarily disabled - using simplified form
import DynamicEntityForm from './DynamicEntityForm';

interface DynamicEntityFormAdapterProps {
  category: UnifiedCategory; // Root category
  finalCategory: UnifiedCategory; // Final selected category for the entity
  onBack: () => void;
  onSubmit: (data: EntityFormData) => void;
  initialData?: Partial<EntityFormData>;
}

/**
 * Dynamic EntityFormAdapter that generates contextual forms based on:
 * 1. Category configuration (frontend)
 * 2. Database subcategory structure
 * 3. Entity context field requirements
 */
const DynamicEntityFormAdapter: React.FC<DynamicEntityFormAdapterProps> = ({
  category,
  finalCategory,
  onBack,
  onSubmit,
  initialData
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Convert unified category to legacy EntityCategory for existing config
  const getLegacyEntityCategory = (unifiedCategory: UnifiedCategory): EntityCategory => {
    const slug = unifiedCategory.slug.toLowerCase();
    if (slug.includes('professional')) return EntityCategory.PROFESSIONALS;
    if (slug.includes('compan')) return EntityCategory.COMPANIES;
    if (slug.includes('place')) return EntityCategory.PLACES;
    if (slug.includes('product')) return EntityCategory.PRODUCTS;
    return EntityCategory.PROFESSIONALS; // default
  };

  const legacyCategory = getLegacyEntityCategory(category);
  
  // Get category configuration for predefined fields
  // const categoryConfig = getCategoryConfig(legacyCategory); // Temporarily disabled
  const categoryConfig = { fields: [], criteria: [] }; // Simplified for now
  
  // Generate dynamic field configuration based on category and subcategory
  const dynamicConfig = useMemo((): SubcategoryConfig => {
    const baseFields: FormField[] = [
      {
        id: 'name',
        name: 'Name',
        type: 'text',
        required: true,
        placeholder: `Enter ${finalCategory.name.toLowerCase()} name`
      },
      {
        id: 'description',
        name: 'Description',
        type: 'textarea',
        required: true,
        placeholder: `Provide a detailed description of this ${finalCategory.name.toLowerCase()}`
      }
    ];

    // Category-specific fields based on database schema and business logic
    const categorySpecificFields: FormField[] = (() => {
      switch (legacyCategory) {
        case EntityCategory.PROFESSIONALS:
          // For professionals, we'll use the professional context section instead of category-specific fields
          // to avoid duplication. Professional details will be managed in the Professional Context section.
          return [
            {
              id: 'bio',
              name: 'Professional Bio',
              type: 'textarea',
              required: false,
              placeholder: 'Brief professional biography highlighting key achievements, expertise, and career highlights'
            },
            {
              id: 'website',
              name: 'Professional Website/Portfolio',
              type: 'url',
              required: false,
              placeholder: 'https://yourwebsite.com'
            },
            {
              id: 'linkedin',
              name: 'LinkedIn Profile',
              type: 'url',
              required: false,
              placeholder: 'https://linkedin.com/in/yourprofile'
            }
          ];

        case EntityCategory.COMPANIES:
          return [
            {
              id: 'industry',
              name: 'Industry',
              type: 'select',
              required: true,
              options: [
                'Technology',
                'Healthcare',
                'Finance',
                'Education',
                'Manufacturing',
                'Retail',
                'Consulting',
                'Media & Entertainment',
                'Real Estate',
                'Other'
              ]
            },
            {
              id: 'company_size',
              name: 'Company Size',
              type: 'select',
              required: true,
              options: [
                'Startup (1-10)',
                'Small (11-50)',
                'Medium (51-200)',
                'Large (201-1000)',
                'Enterprise (1000+)'
              ]
            },
            {
              id: 'headquarters',
              name: 'Headquarters Location',
              type: 'text',
              required: false,
              placeholder: 'e.g., San Francisco, CA'
            },
            {
              id: 'founded_year',
              name: 'Founded Year',
              type: 'number',
              required: false,
              placeholder: 'e.g., 2010'
            },
            {
              id: 'website',
              name: 'Website',
              type: 'url',
              required: false,
              placeholder: 'https://example.com'
            }
          ];

        case EntityCategory.PLACES:
          return [
            {
              id: 'address',
              name: 'Address',
              type: 'text',
              required: true,
              placeholder: 'Full street address'
            },
            {
              id: 'city',
              name: 'City',
              type: 'text',
              required: true,
              placeholder: 'City name'
            },
            {
              id: 'state',
              name: 'State/Province',
              type: 'text',
              required: true,
              placeholder: 'State or province'
            },
            {
              id: 'postal_code',
              name: 'Postal Code',
              type: 'text',
              required: false,
              placeholder: 'ZIP or postal code'
            },
            {
              id: 'phone',
              name: 'Phone Number',
              type: 'tel',
              required: false,
              placeholder: '+1 (555) 123-4567'
            },
            {
              id: 'website',
              name: 'Website',
              type: 'url',
              required: false,
              placeholder: 'https://example.com'
            },
            // Add subcategory-specific fields
            ...(finalCategory.name.toLowerCase().includes('restaurant') ? [
              {
                id: 'cuisine_type',
                name: 'Cuisine Type',
                type: 'select',
                required: true,
                options: [
                  'American',
                  'Italian',
                  'Chinese',
                  'Mexican',
                  'Indian',
                  'Japanese',
                  'French',
                  'Mediterranean',
                  'Thai',
                  'Other'
                ]
              } as FormField,
              {
                id: 'price_range',
                name: 'Price Range',
                type: 'select',
                required: true,
                options: ['Budget ($)', 'Moderate ($$)', 'Expensive ($$$)', 'Luxury ($$$$)']
              } as FormField
            ] : []),
            ...(finalCategory.name.toLowerCase().includes('hotel') ? [
              {
                id: 'star_rating',
                name: 'Star Rating',
                type: 'select',
                required: false,
                options: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']
              } as FormField
            ] : [])
          ];

        case EntityCategory.PRODUCTS:
          return [
            {
              id: 'manufacturer',
              name: 'Manufacturer/Developer',
              type: 'text',
              required: true,
              placeholder: 'e.g., Apple, Microsoft, Toyota'
            },
            {
              id: 'product_category',
              name: 'Product Category',
              type: 'select',
              required: true,
              options: [
                'Software',
                'Hardware',
                'Electronics',
                'Automotive',
                'Books',
                'Games',
                'Home & Garden',
                'Health & Beauty',
                'Sports & Outdoors',
                'Other'
              ]
            },
            {
              id: 'model_version',
              name: 'Model/Version',
              type: 'text',
              required: false,
              placeholder: 'e.g., iPhone 15, Windows 11'
            },
            {
              id: 'release_date',
              name: 'Release Date',
              type: 'date',
              required: false
            },
            {
              id: 'price',
              name: 'Price (USD)',
              type: 'number',
              required: false,
              placeholder: 'e.g., 999.99'
            },
            {
              id: 'website',
              name: 'Official Website',
              type: 'url',
              required: false,
              placeholder: 'https://example.com'
            }
          ];

        default:
          return [];
      }
    })();

    // Generate criteria based on category
    const criteria = (() => {
      switch (legacyCategory) {
        case EntityCategory.PROFESSIONALS:
          return [
            {
              id: 'expertise',
              name: 'Expertise',
              description: 'Knowledge and skills in their field',
              maxRating: 5,
              isRequired: true
            },
            {
              id: 'communication',
              name: 'Communication',
              description: 'Clarity and effectiveness in communication',
              maxRating: 5,
              isRequired: true
            },
            {
              id: 'reliability',
              name: 'Reliability',
              description: 'Dependability and consistency',
              maxRating: 5,
              isRequired: true
            },
            {
              id: 'overall_satisfaction',
              name: 'Overall Satisfaction',
              description: 'General satisfaction and recommendation',
              maxRating: 5,
              isRequired: true
            }
          ];

        case EntityCategory.COMPANIES:
          return [
            {
              id: 'work_environment',
              name: 'Work Environment',
              description: 'Culture, atmosphere, and workplace quality',
              maxRating: 5,
              isRequired: true
            },
            {
              id: 'management_quality',
              name: 'Management',
              description: 'Leadership and management effectiveness',
              maxRating: 5,
              isRequired: true
            },
            {
              id: 'compensation_benefits',
              name: 'Compensation & Benefits',
              description: 'Salary, benefits, and compensation package',
              maxRating: 5,
              isRequired: true
            },
            {
              id: 'growth_opportunities',
              name: 'Growth Opportunities',
              description: 'Career development and advancement',
              maxRating: 5,
              isRequired: true
            }
          ];

        case EntityCategory.PLACES:
          return [
            {
              id: 'atmosphere',
              name: 'Atmosphere',
              description: 'Ambiance and overall environment',
              maxRating: 5,
              isRequired: true
            },
            {
              id: 'service_quality',
              name: 'Service Quality',
              description: 'Staff service and customer care',
              maxRating: 5,
              isRequired: true
            },
            {
              id: 'cleanliness',
              name: 'Cleanliness',
              description: 'Hygiene and maintenance standards',
              maxRating: 5,
              isRequired: true
            },
            {
              id: 'value_for_money',
              name: 'Value for Money',
              description: 'Price vs. quality/service provided',
              maxRating: 5,
              isRequired: true
            }
          ];

        case EntityCategory.PRODUCTS:
          return [
            {
              id: 'quality',
              name: 'Quality',
              description: 'Build quality and reliability',
              maxRating: 5,
              isRequired: true
            },
            {
              id: 'usability',
              name: 'Usability',
              description: 'Ease of use and user experience',
              maxRating: 5,
              isRequired: true
            },
            {
              id: 'value_for_money',
              name: 'Value for Money',
              description: 'Price vs. features/performance',
              maxRating: 5,
              isRequired: true
            },
            {
              id: 'overall_satisfaction',
              name: 'Overall Satisfaction',
              description: 'General satisfaction and recommendation',
              maxRating: 5,
              isRequired: true
            }
          ];

        default:
          return [];
      }
    })();

    return {
      id: finalCategory.id.toString(),
      label: finalCategory.name,
      parentCategory: legacyCategory,
      criteria,
      fields: [...baseFields, ...categorySpecificFields]
    };
  }, [category, finalCategory, legacyCategory]);

  return (
    <DynamicEntityForm
      category={legacyCategory}
      subcategory={dynamicConfig}
      subcategoryData={finalCategory}
      onBack={onBack}
      onSubmit={onSubmit}
      initialData={initialData}
      isLoading={isLoading}
    />
  );
};

export default DynamicEntityFormAdapter;