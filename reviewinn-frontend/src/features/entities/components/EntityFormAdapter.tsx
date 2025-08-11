import React from 'react';
import { EntityCategory } from '../../../types';
import type { SubcategoryConfig, EntityFormData } from '../../../types';
import type { LegacySubcategory } from '../../../types';
import EntityForm from './EntityForm';

interface EntityFormAdapterProps {
  category: EntityCategory;
  subcategory: LegacySubcategory;
  onBack: () => void;
  onSubmit: (data: EntityFormData) => void;
  initialData?: Partial<EntityFormData>;
}

const EntityFormAdapter: React.FC<EntityFormAdapterProps> = ({
  category,
  subcategory,
  onBack,
  onSubmit,
  initialData
}) => {
  // Convert Subcategory to SubcategoryConfig
  const subcategoryConfig: SubcategoryConfig = {
    id: subcategory.id.toString(),
    label: subcategory.name,
    parentCategory: category,
    criteria: [
      {
        id: 'overall_quality',
        name: 'Overall Quality',
        description: 'General quality and performance',
        maxRating: 5,
        isRequired: true
      },
      {
        id: 'value_for_money',
        name: 'Value for Money',
        description: 'Cost-effectiveness and value',
        maxRating: 5,
        isRequired: true
      },
      {
        id: 'reliability',
        name: 'Reliability',
        description: 'Consistency and dependability',
        maxRating: 5,
        isRequired: true
      }
    ],
    fields: [
      {
        id: 'name',
        name: 'Name',
        type: 'text',
        required: true,
        placeholder: 'Enter entity name'
      },
      {
        id: 'description',
        name: 'Description',
        type: 'textarea',
        required: true,
        placeholder: 'Enter entity description'
      },
      {
        id: 'location',
        name: 'Location',
        type: 'text',
        required: false,
        placeholder: 'Enter location (optional)'
      },
      {
        id: 'website',
        name: 'Website',
        type: 'text',
        required: false,
        placeholder: 'Enter website URL (optional)'
      },
      {
        id: 'phone',
        name: 'Phone',
        type: 'text',
        required: false,
        placeholder: 'Enter phone number (optional)'
      },
      {
        id: 'email',
        name: 'Email',
        type: 'text',
        required: false,
        placeholder: 'Enter email address (optional)'
      }
    ]
  };

  return (
    <EntityForm
      category={category}
      subcategory={subcategoryConfig}
      onBack={onBack}
      onSubmit={onSubmit}
      initialData={initialData}
    />
  );
};

export default EntityFormAdapter; 