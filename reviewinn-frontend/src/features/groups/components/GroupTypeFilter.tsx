import React from 'react';
import { Check, GraduationCap, Building, MapPin, Heart } from 'lucide-react';
import { GroupType } from '../types';

interface GroupTypeFilterProps {
  selectedType: GroupType | null;
  onTypeChange: (type: GroupType | null) => void;
}

const GROUP_TYPE_OPTIONS = [
  {
    type: GroupType.UNIVERSITY,
    label: 'University',
    icon: GraduationCap,
    color: 'text-blue-600'
  },
  {
    type: GroupType.COMPANY,
    label: 'Company',
    icon: Building,
    color: 'text-gray-600'
  },
  {
    type: GroupType.LOCATION,
    label: 'Location',
    icon: MapPin,
    color: 'text-green-600'
  },
  {
    type: GroupType.INTEREST_BASED,
    label: 'Interest',
    icon: Heart,
    color: 'text-pink-600'
  }
];

const GroupTypeFilter: React.FC<GroupTypeFilterProps> = ({
  selectedType,
  onTypeChange
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Type</h3>
      
      <div className="space-y-2">
        <button
          onClick={() => onTypeChange(null)}
          className={`w-full flex items-center justify-between p-2 rounded-md text-left transition-colors ${
            selectedType === null
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : 'hover:bg-gray-50'
          }`}
        >
          <span className="text-sm font-medium">All Types</span>
          {selectedType === null && <Check className="w-4 h-4" />}
        </button>
        
        {GROUP_TYPE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedType === option.type;
          
          return (
            <button
              key={option.type}
              onClick={() => onTypeChange(option.type)}
              className={`w-full flex items-center justify-between p-2 rounded-md text-left transition-colors ${
                isSelected
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon className={`w-4 h-4 ${option.color}`} />
                <span className="text-sm font-medium">{option.label}</span>
              </div>
              {isSelected && <Check className="w-4 h-4" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GroupTypeFilter;