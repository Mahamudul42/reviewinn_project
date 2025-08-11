import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EntityCategory } from '../../types';
import type { Entity, SubcategoryConfig } from '../../types';
import ReviewForm from '../../shared/organisms/ReviewForm';
import { getRandomPexelsImage } from '../../shared/utils/pexels';
import { entityService } from '../../api/services';

const mockSubcategories: SubcategoryConfig[] = [
  {
    id: 'professor',
    label: 'Professor',
    parentCategory: EntityCategory.PROFESSIONALS,
    criteria: [
      { id: 'teachingQuality', name: 'Teaching Quality', description: '', maxRating: 5, isRequired: true },
      { id: 'difficulty', name: 'Difficulty', description: '', maxRating: 5, isRequired: false },
    ],
    fields: []
  },
  {
    id: 'startup',
    label: 'Startup',
    parentCategory: EntityCategory.COMPANIES,
    criteria: [
      { id: 'innovation', name: 'Innovation', description: '', maxRating: 5, isRequired: true },
    ],
    fields: []
  },
  {
    id: 'smartphone',
    label: 'Smartphone',
    parentCategory: EntityCategory.PRODUCTS,
    criteria: [
      { id: 'quality', name: 'Quality', description: '', maxRating: 5, isRequired: true },
    ],
    fields: []
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    parentCategory: EntityCategory.PLACES,
    criteria: [
      { id: 'atmosphere', name: 'Atmosphere', description: '', maxRating: 5, isRequired: true },
    ],
    fields: []
  }
];

const ReviewPage: React.FC = () => {
  const { entityId } = useParams<{ entityId: string }>();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [subcategory, setSubcategory] = useState<SubcategoryConfig | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (entityId) {
      entityService.getEntityById(entityId).then((result) => {
        setEntity(result);
        // Optionally, set subcategory from result.subcategory or fetch config from backend
        // setSubcategory(...)
      });
    }
  }, [entityId]);

  if (!entity || !subcategory) {
    return <div className="w-full max-w-[800px] mx-auto mt-24 text-center text-gray-500 text-lg">Entity not found.</div>;
  }

  if (submitted) {
    return (
      <div className="w-full max-w-[800px] mx-auto mt-24 bg-white rounded-2xl shadow-xl p-12 text-center">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Thank you for your review!</h2>
        <p className="mb-8 text-gray-700">Your feedback helps others make better decisions.</p>
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition"
          onClick={() => navigate('/')}
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[800px] mx-auto mt-12 bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center mb-8">
        <img src={entity.avatar || getRandomPexelsImage(entity.category)} alt={entity.name} className="w-14 h-14 rounded-full object-cover border border-gray-300 mr-5" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Review: {entity.name}</h1>
          <p className="text-gray-600 text-sm">{entity.description}</p>
        </div>
      </div>
      <ReviewForm
        entity={entity}
        subcategory={subcategory}
        onBack={() => navigate(-1)}
        onSubmit={() => setSubmitted(true)}
      />
    </div>
  );
};

export default ReviewPage; 