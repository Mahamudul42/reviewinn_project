import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import type { Entity } from '../../../types';

interface EntityDescriptionProps {
  entity: Entity;
  className?: string;
}

const EntityDescription: React.FC<EntityDescriptionProps> = ({ entity, className = '' }) => {
  if (!entity.description) return null;

  return (
    <div className={className}>
      <div className="bg-white border-2 border-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Colorful Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white drop-shadow-md">About {entity.name}</h3>
              <p className="text-white/90 text-sm">Learn more about this entity</p>
            </div>
            <div className="ml-auto">
              <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Description Content */}
        <div className="p-6 bg-gradient-to-br from-gray-50 to-emerald-50">
          <div className="relative">
            <div className="absolute -left-2 top-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
            <div className="pl-6">
              <p className="text-gray-800 text-lg leading-relaxed font-medium">
                {entity.description}
              </p>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <div className="w-8 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
              <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="w-8 h-0.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityDescription;