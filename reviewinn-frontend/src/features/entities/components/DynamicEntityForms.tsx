/**
 * Dynamic Entity Forms
 * Different input forms based on entity type: professional, company, location, product
 */

import React from 'react';
import { User, Building2, MapPin, Package, Settings } from 'lucide-react';
import type { UnifiedCategory } from '../../../types';

export type EntityType = 'professional' | 'company' | 'location' | 'product' | 'custom';

interface BaseFormProps {
  values: Record<string, string>;
  onFieldChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
  selectedCategory?: UnifiedCategory | null;
}

// Professional Form
export const ProfessionalForm: React.FC<BaseFormProps> = ({ values, onFieldChange, errors }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
        <User className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">Professional Details</h3>
        <p className="text-sm text-neutral-600">Employment and professional information</p>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Job Title / Position *
      </label>
      <input
        type="text"
        value={values.jobTitle || ''}
        onChange={(e) => onFieldChange('jobTitle', e.target.value)}
        placeholder="Senior Software Engineer, Marketing Manager, etc."
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
      {errors?.jobTitle && <p className="text-red-500 text-sm mt-1">{errors.jobTitle}</p>}
    </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Organization / Company *
      </label>
      <input
        type="text"
        value={values.organization || ''}
        onChange={(e) => onFieldChange('organization', e.target.value)}
        placeholder="Google, Johns Hopkins Hospital, etc."
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
      {errors?.organization && <p className="text-red-500 text-sm mt-1">{errors.organization}</p>}
    </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Department / Division
      </label>
      <input
        type="text"
        value={values.department || ''}
        onChange={(e) => onFieldChange('department', e.target.value)}
        placeholder="Engineering, Marketing, Cardiology, etc."
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Work Location
      </label>
      <input
        type="text"
        value={values.workLocation || ''}
        onChange={(e) => onFieldChange('workLocation', e.target.value)}
        placeholder="New York, NY • Remote • San Francisco, CA"
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Start Date
        </label>
        <input
          type="month"
          value={values.startDate || ''}
          onChange={(e) => onFieldChange('startDate', e.target.value)}
          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          End Date
        </label>
        <input
          type="month"
          value={values.endDate || ''}
          onChange={(e) => onFieldChange('endDate', e.target.value)}
          placeholder="Leave empty if current"
          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
        <p className="text-xs text-neutral-500 mt-1">Leave empty if this is current position</p>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Specialization / Expertise
      </label>
      <textarea
        value={values.specialization || ''}
        onChange={(e) => onFieldChange('specialization', e.target.value)}
        placeholder="Key areas of expertise, certifications, notable achievements..."
        rows={3}
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
      />
    </div>
  </div>
);

// Company Form
export const CompanyForm: React.FC<BaseFormProps> = ({ values, onFieldChange, errors, selectedCategory }) => {
  // Helper function to get appropriate header based on category
  const getCompanyHeader = () => {
    if (!selectedCategory) return { title: "Organization Information", description: "Enter details about this organization" };
    
    const categoryName = selectedCategory.name?.toLowerCase() || '';
    const categoryPath = selectedCategory.path?.toLowerCase() || '';
    
    // Check for specific subcategories
    if (categoryName.includes('education') || categoryPath.includes('education')) {
      return { title: "Educational Institution Information", description: "Enter details about this educational institution" };
    }
    if (categoryName.includes('healthcare') || categoryPath.includes('healthcare')) {
      return { title: "Healthcare Institution Information", description: "Enter details about this healthcare institution" };
    }
    if (categoryName.includes('government') || categoryPath.includes('government')) {
      return { title: "Government Agency Information", description: "Enter details about this government agency" };
    }
    if (categoryName.includes('non-profit') || categoryPath.includes('non-profit')) {
      return { title: "Organization Information", description: "Enter details about this non-profit organization" };
    }
    if (categoryName.includes('technology') || categoryPath.includes('technology')) {
      return { title: "Technology Company Information", description: "Enter details about this technology company" };
    }
    if (categoryName.includes('manufacturing') || categoryPath.includes('manufacturing')) {
      return { title: "Manufacturing Company Information", description: "Enter details about this manufacturing company" };
    }
    if (categoryName.includes('finance') || categoryPath.includes('finance')) {
      return { title: "Financial Institution Information", description: "Enter details about this financial institution" };
    }
    
    // Default fallback
    return { title: "Organization Information", description: "Enter details about this organization" };
  };

  const header = getCompanyHeader();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">{header.title}</h3>
          <p className="text-sm text-neutral-600">{header.description}</p>
        </div>
      </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Industry/Sector *
      </label>
      <input
        type="text"
        value={values.industry || ''}
        onChange={(e) => onFieldChange('industry', e.target.value)}
        placeholder="Technology, Healthcare, Education, etc."
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
      {errors?.industry && <p className="text-red-500 text-sm mt-1">{errors.industry}</p>}
    </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Company Size
      </label>
      <select
        value={values.size || ''}
        onChange={(e) => onFieldChange('size', e.target.value)}
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      >
        <option value="">Select company size</option>
        <option value="startup">Startup (1-10 employees)</option>
        <option value="small">Small (11-50 employees)</option>
        <option value="medium">Medium (51-200 employees)</option>
        <option value="large">Large (201-1000 employees)</option>
        <option value="enterprise">Enterprise (1000+ employees)</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Founded Year
      </label>
      <input
        type="number"
        value={values.founded || ''}
        onChange={(e) => onFieldChange('founded', e.target.value)}
        placeholder="2020"
        min="1800"
        max={new Date().getFullYear()}
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Website
      </label>
      <input
        type="url"
        value={values.website || ''}
        onChange={(e) => onFieldChange('website', e.target.value)}
        placeholder="https://www.example.com"
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
    </div>
  </div>
  );
};

// Location Form  
export const LocationForm: React.FC<BaseFormProps> = ({ values, onFieldChange, errors }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
        <MapPin className="w-5 h-5 text-orange-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">Location Details</h3>
        <p className="text-sm text-neutral-600">Enter details about this place or location</p>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Full Address *
      </label>
      <input
        type="text"
        value={values.address || ''}
        onChange={(e) => onFieldChange('address', e.target.value)}
        placeholder="123 Main St, New York, NY 10001"
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
      {errors?.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          City *
        </label>
        <input
          type="text"
          value={values.city || ''}
          onChange={(e) => onFieldChange('city', e.target.value)}
          placeholder="New York"
          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
        {errors?.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Country *
        </label>
        <input
          type="text"
          value={values.country || ''}
          onChange={(e) => onFieldChange('country', e.target.value)}
          placeholder="United States"
          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
        {errors?.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Operating Hours
      </label>
      <input
        type="text"
        value={values.hours || ''}
        onChange={(e) => onFieldChange('hours', e.target.value)}
        placeholder="Mon-Fri: 9AM-6PM, Sat-Sun: 10AM-4PM"
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Phone Number
      </label>
      <input
        type="tel"
        value={values.phone || ''}
        onChange={(e) => onFieldChange('phone', e.target.value)}
        placeholder="+1 (555) 123-4567"
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Website
      </label>
      <input
        type="url"
        value={values.website || ''}
        onChange={(e) => onFieldChange('website', e.target.value)}
        placeholder="https://www.example.com"
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Special Features / Amenities
      </label>
      <textarea
        value={values.amenities || ''}
        onChange={(e) => onFieldChange('amenities', e.target.value)}
        placeholder="Free WiFi, Parking available, Wheelchair accessible, Outdoor seating..."
        rows={3}
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
      />
    </div>
  </div>
);

// Currency and price range configuration
const CURRENCY_CONFIG = {
  USD: {
    symbol: '$',
    name: 'US Dollar',
    ranges: [
      { key: 'budget', label: 'Budget', min: 0, max: 50 },
      { key: 'affordable', label: 'Affordable', min: 50, max: 200 },
      { key: 'mid-range', label: 'Mid-range', min: 200, max: 500 },
      { key: 'premium', label: 'Premium', min: 500, max: 1000 },
      { key: 'luxury', label: 'Luxury', min: 1000, max: null }
    ]
  },
  EUR: {
    symbol: '€',
    name: 'Euro',
    ranges: [
      { key: 'budget', label: 'Budget', min: 0, max: 45 },
      { key: 'affordable', label: 'Affordable', min: 45, max: 180 },
      { key: 'mid-range', label: 'Mid-range', min: 180, max: 450 },
      { key: 'premium', label: 'Premium', min: 450, max: 900 },
      { key: 'luxury', label: 'Luxury', min: 900, max: null }
    ]
  },
  GBP: {
    symbol: '£',
    name: 'British Pound',
    ranges: [
      { key: 'budget', label: 'Budget', min: 0, max: 40 },
      { key: 'affordable', label: 'Affordable', min: 40, max: 160 },
      { key: 'mid-range', label: 'Mid-range', min: 160, max: 400 },
      { key: 'premium', label: 'Premium', min: 400, max: 800 },
      { key: 'luxury', label: 'Luxury', min: 800, max: null }
    ]
  },
  JPY: {
    symbol: '¥',
    name: 'Japanese Yen',
    ranges: [
      { key: 'budget', label: 'Budget', min: 0, max: 7500 },
      { key: 'affordable', label: 'Affordable', min: 7500, max: 30000 },
      { key: 'mid-range', label: 'Mid-range', min: 30000, max: 75000 },
      { key: 'premium', label: 'Premium', min: 75000, max: 150000 },
      { key: 'luxury', label: 'Luxury', min: 150000, max: null }
    ]
  },
  CAD: {
    symbol: 'C$',
    name: 'Canadian Dollar',
    ranges: [
      { key: 'budget', label: 'Budget', min: 0, max: 65 },
      { key: 'affordable', label: 'Affordable', min: 65, max: 260 },
      { key: 'mid-range', label: 'Mid-range', min: 260, max: 650 },
      { key: 'premium', label: 'Premium', min: 650, max: 1300 },
      { key: 'luxury', label: 'Luxury', min: 1300, max: null }
    ]
  },
  AUD: {
    symbol: 'A$',
    name: 'Australian Dollar',
    ranges: [
      { key: 'budget', label: 'Budget', min: 0, max: 75 },
      { key: 'affordable', label: 'Affordable', min: 75, max: 300 },
      { key: 'mid-range', label: 'Mid-range', min: 300, max: 750 },
      { key: 'premium', label: 'Premium', min: 750, max: 1500 },
      { key: 'luxury', label: 'Luxury', min: 1500, max: null }
    ]
  },
  INR: {
    symbol: '₹',
    name: 'Indian Rupee',
    ranges: [
      { key: 'budget', label: 'Budget', min: 0, max: 4000 },
      { key: 'affordable', label: 'Affordable', min: 4000, max: 16000 },
      { key: 'mid-range', label: 'Mid-range', min: 16000, max: 40000 },
      { key: 'premium', label: 'Premium', min: 40000, max: 80000 },
      { key: 'luxury', label: 'Luxury', min: 80000, max: null }
    ]
  },
  CNY: {
    symbol: '¥',
    name: 'Chinese Yuan',
    ranges: [
      { key: 'budget', label: 'Budget', min: 0, max: 350 },
      { key: 'affordable', label: 'Affordable', min: 350, max: 1400 },
      { key: 'mid-range', label: 'Mid-range', min: 1400, max: 3500 },
      { key: 'premium', label: 'Premium', min: 3500, max: 7000 },
      { key: 'luxury', label: 'Luxury', min: 7000, max: null }
    ]
  }
};

// Product Form
export const ProductForm: React.FC<BaseFormProps> = ({ values, onFieldChange, errors }) => {
  const selectedCurrency = values.currency || 'USD';
  const currencyData = CURRENCY_CONFIG[selectedCurrency as keyof typeof CURRENCY_CONFIG];
  
  const formatPriceRange = (range: any) => {
    const symbol = currencyData.symbol;
    if (range.max === null) {
      return `${range.label} (${symbol}${range.min.toLocaleString()}+)`;
    }
    return `${range.label} (${symbol}${range.min.toLocaleString()}-${symbol}${range.max.toLocaleString()})`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Product Information</h3>
          <p className="text-sm text-neutral-600">Enter details about this product or service</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Brand/Manufacturer
        </label>
        <input
          type="text"
          value={values.brand || ''}
          onChange={(e) => onFieldChange('brand', e.target.value)}
          placeholder="Apple, Tesla, Nike, Samsung, etc."
          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Currency
          </label>
          <select
            value={selectedCurrency}
            onChange={(e) => {
              onFieldChange('currency', e.target.value);
              // Reset price range when currency changes
              onFieldChange('priceRange', '');
            }}
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          >
            {Object.entries(CURRENCY_CONFIG).map(([code, config]) => (
              <option key={code} value={code}>
                {config.symbol} {code} - {config.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Price Range
          </label>
          <select
            value={values.priceRange || ''}
            onChange={(e) => onFieldChange('priceRange', e.target.value)}
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          >
            <option value="">Select price range</option>
            {currencyData.ranges.map((range) => (
              <option key={range.key} value={range.key}>
                {formatPriceRange(range)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Release Year
        </label>
        <input
          type="number"
          value={values.releaseYear || ''}
          onChange={(e) => onFieldChange('releaseYear', e.target.value)}
          placeholder="2024"
          min="1900"
          max={new Date().getFullYear() + 1}
          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Key Features
        </label>
        <textarea
          value={values.features || ''}
          onChange={(e) => onFieldChange('features', e.target.value)}
          placeholder="List the main features that make this product unique..."
          rows={3}
          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
        />
      </div>
    </div>
  );
};

// Custom Form - for entities that don't fit the standard categories
export const CustomForm: React.FC<BaseFormProps> = ({ values, onFieldChange, errors }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
        <Settings className="w-5 h-5 text-gray-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">Custom Entity Details</h3>
        <p className="text-sm text-neutral-600">Provide information about this unique entity</p>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Entity Type/Category *
      </label>
      <input
        type="text"
        value={values.entityType || ''}
        onChange={(e) => onFieldChange('entityType', e.target.value)}
        placeholder="e.g., Service, Event, Concept, Tool, etc."
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
      {errors?.entityType && <p className="text-red-500 text-sm mt-1">{errors.entityType}</p>}
      <p className="text-xs text-neutral-500 mt-1">What kind of entity is this?</p>
    </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Primary Purpose/Function
      </label>
      <input
        type="text"
        value={values.primaryPurpose || ''}
        onChange={(e) => onFieldChange('primaryPurpose', e.target.value)}
        placeholder="What is the main function or purpose of this entity?"
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Key Attributes
      </label>
      <textarea
        value={values.keyAttributes || ''}
        onChange={(e) => onFieldChange('keyAttributes', e.target.value)}
        placeholder="List the most important characteristics or features..."
        rows={3}
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Associated Location
        </label>
        <input
          type="text"
          value={values.location || ''}
          onChange={(e) => onFieldChange('location', e.target.value)}
          placeholder="City, Country or Online"
          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Status/Availability
        </label>
        <select
          value={values.status || ''}
          onChange={(e) => onFieldChange('status', e.target.value)}
          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        >
          <option value="">Select status</option>
          <option value="active">Active</option>
          <option value="available">Available</option>
          <option value="in-development">In Development</option>
          <option value="discontinued">Discontinued</option>
          <option value="seasonal">Seasonal</option>
          <option value="limited">Limited Time</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Contact/Access Information
      </label>
      <input
        type="text"
        value={values.contactInfo || ''}
        onChange={(e) => onFieldChange('contactInfo', e.target.value)}
        placeholder="Website, email, phone, or how to access/contact"
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Additional Notes
      </label>
      <textarea
        value={values.additionalNotes || ''}
        onChange={(e) => onFieldChange('additionalNotes', e.target.value)}
        placeholder="Any other relevant information that would help others understand this entity..."
        rows={3}
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
      />
    </div>
  </div>
);

// Main Dynamic Form Component
interface DynamicEntityFormProps extends BaseFormProps {
  entityType?: EntityType;
  selectedCategory?: UnifiedCategory | null;
}

export const DynamicEntityForm: React.FC<DynamicEntityFormProps> = ({ 
  entityType, 
  selectedCategory,
  ...formProps 
}) => {
  // Get root category from unified category path or slug
  const getRootCategoryType = (): EntityType => {
    if (selectedCategory) {
      // Method 1: Check path field for exact matches (most reliable)
      if (selectedCategory.path) {
        const path = selectedCategory.path.toLowerCase();
        
        // Check for custom category first
        if (path.includes('other.custom') || path === 'other.custom') {
          return 'custom';
        }
        
        // Check root categories by path prefix
        if (path.startsWith('professionals') || path === 'professionals') return 'professional';
        if (path.startsWith('companiesinstitutes') || path === 'companiesinstitutes') return 'company';
        if (path.startsWith('places') || path === 'places') return 'location';
        if (path.startsWith('products') || path === 'products') return 'product';
        if (path.startsWith('other') || path === 'other') return 'custom';
      }
      
      // Method 2: Check if it's a root category by slug
      if (selectedCategory.is_root || selectedCategory.level <= 1) {
        const rootSlug = selectedCategory.slug.toLowerCase();
        if (rootSlug === 'professionals') return 'professional';
        if (rootSlug === 'companiesinstitutes') return 'company';
        if (rootSlug === 'places') return 'location';
        if (rootSlug === 'products') return 'product';
        if (rootSlug === 'other') return 'custom';
        
        // Fallback slug patterns for backwards compatibility
        if (rootSlug.includes('professional') || rootSlug.includes('person') || rootSlug.includes('people')) return 'professional';
        if (rootSlug.includes('compan') || rootSlug.includes('business') || rootSlug.includes('organization')) return 'company';
        if (rootSlug.includes('location') || rootSlug.includes('place') || rootSlug.includes('venue')) return 'location';
        if (rootSlug.includes('product') || rootSlug.includes('service') || rootSlug.includes('item')) return 'product';
      }
      
      // Method 3: Check path_text (from search API)
      const pathText = (selectedCategory as any).path_text;
      if (pathText) {
        const pathLower = pathText.toLowerCase();
        if (pathLower.includes('other') && pathLower.includes('custom')) return 'custom';
        if (pathLower.includes('professional') || pathLower.includes('person') || pathLower.includes('people')) return 'professional';
        if (pathLower.includes('compan') || pathLower.includes('business') || pathLower.includes('organization')) return 'company';
        if (pathLower.includes('location') || pathLower.includes('place') || pathLower.includes('venue')) return 'location';
        if (pathLower.includes('product') || pathLower.includes('service') || pathLower.includes('item')) return 'product';
      }
      
      // Method 4: Check individual slug patterns
      const categorySlug = selectedCategory.slug.toLowerCase();
      if (categorySlug === 'custom') return 'custom';
      if (categorySlug.includes('company') || categorySlug.includes('institution') || categorySlug.includes('business')) return 'company';
      if (categorySlug.includes('location') || categorySlug.includes('place') || categorySlug.includes('venue')) return 'location';
      if (categorySlug.includes('product') || categorySlug.includes('service') || categorySlug.includes('item')) return 'product';
    }
    
    return entityType || 'professional';
  };

  // Use provided entityType prop if available, otherwise fall back to detection
  const actualEntityType = entityType || getRootCategoryType();

  // Debug logging - Enhanced for debugging smartphones issue
  console.log('🔍 DynamicEntityForm Debug:', {
    providedEntityType: entityType,
    selectedCategory: selectedCategory ? {
      id: selectedCategory.id,
      name: selectedCategory.name,
      slug: selectedCategory.slug,
      path: selectedCategory.path,
      level: selectedCategory.level,
      is_root: selectedCategory.is_root,
      parent_id: selectedCategory.parent_id
    } : null,
    detectedFromCategory: getRootCategoryType(),
    actualEntityType,
    pathStartsWithProducts: selectedCategory?.path?.toLowerCase().startsWith('products'),
    pathIncludesProducts: selectedCategory?.path?.toLowerCase().includes('products')
  });

  switch (actualEntityType) {
    case 'company':
      return <CompanyForm {...formProps} selectedCategory={selectedCategory} />;
    case 'location':
      return <LocationForm {...formProps} selectedCategory={selectedCategory} />;
    case 'product':
      return <ProductForm {...formProps} selectedCategory={selectedCategory} />;
    case 'custom':
      return <CustomForm {...formProps} selectedCategory={selectedCategory} />;
    default:
      return <ProfessionalForm {...formProps} selectedCategory={selectedCategory} />;
  }
};

export default DynamicEntityForm;