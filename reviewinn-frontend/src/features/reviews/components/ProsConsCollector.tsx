import React, { useState } from 'react';
import { Plus, X, ThumbsUp, ThumbsDown } from 'lucide-react';
// import { REVIEW_TAGS } from '../../../config/enhanced-categories'; // Temporarily disabled
import { EntityCategory } from '../../../types';

interface ProsConsCollectorProps {
  pros: string[];
  cons: string[];
  onProsChange: (pros: string[]) => void;
  onConsChange: (cons: string[]) => void;
  entityCategory?: EntityCategory;
  disabled?: boolean;
}

export const ProsConsCollector: React.FC<ProsConsCollectorProps> = ({
  pros,
  cons,
  onProsChange,
  onConsChange,
  entityCategory,
  disabled = false
}) => {
  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');

  const getCategoryTags = () => {
    // Simplified - return basic tags for now
    return { 
      POSITIVE: ['Good quality', 'Professional', 'Helpful', 'Fast service', 'Good value'], 
      NEGATIVE: ['Poor quality', 'Unprofessional', 'Slow service', 'Expensive', 'Unresponsive'] 
    };
  };

  const categoryTags = getCategoryTags();

  const addPro = (text: string) => {
    if (text.trim() && !pros.includes(text.trim()) && pros.length < 5) {
      if (text.trim().length <= 100) {
        onProsChange([...pros, text.trim()]);
        setNewPro('');
      } else {
        alert('Each pro must be maximum 100 characters');
      }
    }
  };

  const addCon = (text: string) => {
    if (text.trim() && !cons.includes(text.trim()) && cons.length < 5) {
      if (text.trim().length <= 100) {
        onConsChange([...cons, text.trim()]);
        setNewCon('');
      } else {
        alert('Each con must be maximum 100 characters');
      }
    }
  };

  const removePro = (index: number) => {
    onProsChange(pros.filter((_, i) => i !== index));
  };

  const removeCon = (index: number) => {
    onConsChange(cons.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: 'pro' | 'con') => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (type === 'pro') {
        addPro(newPro);
      } else {
        addCon(newCon);
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900">
        Pros & Cons
      </h3>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Pros Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <ThumbsUp className="w-4 h-4 text-green-600" />
            <h4 className="text-sm font-medium text-gray-900">Pros</h4>
          </div>
          
          {/* Quick tags for pros */}
          {categoryTags.POSITIVE.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-600">Quick add:</p>
              <div className="flex flex-wrap gap-1">
                {categoryTags.POSITIVE.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addPro(tag)}
                    disabled={disabled || pros.includes(tag)}
                    className={`
                      px-2 py-1 text-xs rounded-full border transition-colors
                      ${pros.includes(tag)
                        ? 'bg-green-100 text-green-800 border-green-200 cursor-not-allowed'
                        : 'bg-white text-green-700 border-green-200 hover:bg-green-50'
                      }
                      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Manual input */}
          <div className="flex space-x-2">
            <div className="flex-1">
              <input
                type="text"
                value={newPro}
                onChange={(e) => setNewPro(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'pro')}
                placeholder="Add a positive point..."
                disabled={disabled || pros.length >= 5}
                maxLength={100}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 text-sm"
              />
              <div className="text-xs text-gray-500 mt-1">
                {newPro.length}/100 characters • {pros.length}/5 pros
              </div>
            </div>
            <button
              type="button"
              onClick={() => addPro(newPro)}
              disabled={disabled || !newPro.trim()}
              className="px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          
          {/* Pros list */}
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {pros.map((pro, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-green-50 px-2 py-1 rounded-lg"
              >
                <span className="text-xs text-green-800">{pro}</span>
                <button
                  type="button"
                  onClick={() => removePro(index)}
                  disabled={disabled}
                  className="text-green-600 hover:text-green-800 disabled:opacity-50"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cons Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <ThumbsDown className="w-4 h-4 text-red-600" />
            <h4 className="text-sm font-medium text-gray-900">Cons</h4>
          </div>
          
          {/* Quick tags for cons */}
          {categoryTags.NEGATIVE.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-600">Quick add:</p>
              <div className="flex flex-wrap gap-1">
                {categoryTags.NEGATIVE.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addCon(tag)}
                    disabled={disabled || cons.includes(tag)}
                    className={`
                      px-2 py-1 text-xs rounded-full border transition-colors
                      ${cons.includes(tag)
                        ? 'bg-red-100 text-red-800 border-red-200 cursor-not-allowed'
                        : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                      }
                      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Manual input */}
          <div className="flex space-x-2">
            <div className="flex-1">
              <input
                type="text"
                value={newCon}
                onChange={(e) => setNewCon(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'con')}
                placeholder="Add a negative point..."
                disabled={disabled || cons.length >= 5}
                maxLength={100}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 text-sm"
              />
              <div className="text-xs text-gray-500 mt-1">
                {newCon.length}/100 characters • {cons.length}/5 cons
              </div>
            </div>
            <button
              type="button"
              onClick={() => addCon(newCon)}
              disabled={disabled || !newCon.trim()}
              className="px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          
          {/* Cons list */}
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {cons.map((con, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-red-50 px-2 py-1 rounded-lg"
              >
                <span className="text-xs text-red-800">{con}</span>
                <button
                  type="button"
                  onClick={() => removeCon(index)}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProsConsCollector;