/**
 * Form Builder Component
 * Main form component that orchestrates sections, validation, and submission
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Loader2, Save, RotateCcw, X, CheckCircle, AlertCircle } from 'lucide-react';
import { FormSection } from './FormSection';
import { ValidationProvider } from './ValidationProvider';
import type { FormBuilderProps, FormConfig } from './types';
import { cn } from '../../../../shared/design-system/utils/cn';
import { Button } from '../../../../shared/ui';

export const FormBuilder: React.FC<FormBuilderProps> = ({
  config,
  initialValues = {},
  onSubmit,
  onCancel,
  onReset,
  onChange,
  disabled = false,
  readonly = false,
  loading = false,
  className
}) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract all fields from config for validation
  const allFields = useMemo(() => {
    return config.sections.reduce((acc, section) => {
      return [...acc, ...section.fields];
    }, [] as any[]);
  }, [config]);

  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    setValues(prev => {
      const newValues = { ...prev, [fieldId]: value };
      onChange?.(newValues);
      return newValues;
    });
  }, [onChange]);

  const handleFieldBlur = useCallback((fieldId: string, value: any) => {
    setTouched(prev => ({ ...prev, [fieldId]: true }));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (disabled || readonly || loading) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setValues(initialValues);
    setTouched({});
    onReset?.();
  };

  const getThemeClasses = () => {
    switch (config.theme) {
      case 'professional':
        return {
          container: 'bg-gradient-to-br from-purple-50 to-indigo-50',
          header: 'bg-gradient-to-r from-purple-600 to-indigo-600',
          accent: 'text-purple-600',
          button: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
        };
      case 'company':
        return {
          container: 'bg-gradient-to-br from-emerald-50 to-teal-50',
          header: 'bg-gradient-to-r from-emerald-600 to-teal-600',
          accent: 'text-emerald-600',
          button: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
        };
      case 'location':
        return {
          container: 'bg-gradient-to-br from-rose-50 to-pink-50',
          header: 'bg-gradient-to-r from-rose-600 to-pink-600',
          accent: 'text-rose-600',
          button: 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700'
        };
      case 'product':
        return {
          container: 'bg-gradient-to-br from-amber-50 to-orange-50',
          header: 'bg-gradient-to-r from-amber-600 to-orange-600',
          accent: 'text-amber-600',
          button: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
        };
      default:
        return {
          container: 'bg-gradient-to-br from-gray-50 to-white',
          header: 'bg-gradient-to-r from-blue-600 to-indigo-600',
          accent: 'text-blue-600',
          button: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
        };
    }
  };

  const theme = getThemeClasses();
  const spacingClass = config.spacing === 'compact' ? 'space-y-4' : 
                     config.spacing === 'spacious' ? 'space-y-8' : 'space-y-6';

  return (
    <ValidationProvider fields={allFields} values={values}>
      <div className={cn("min-h-screen py-8", theme.container, className)}>
        <div className="max-w-4xl mx-auto px-4">
          {/* Form Header */}
          <div className={cn("rounded-xl mb-8 text-white overflow-hidden", theme.header)}>
            <div className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <h1 className="text-3xl font-bold mb-2">{config.title}</h1>
                {config.description && (
                  <p className="text-white/90">{config.description}</p>
                )}
                
                {config.showProgress && config.progressSteps && (
                  <div className="mt-4 flex items-center gap-2">
                    {config.progressSteps.map((step, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        {index < config.progressSteps!.length - 1 && (
                          <div className="w-12 h-0.5 bg-white/20 mx-2"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Sections */}
            <div className={spacingClass}>
              {config.sections.map((section) => (
                <FormSection
                  key={section.id}
                  config={section}
                  values={values}
                  errors={{}} // Handled by ValidationProvider
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  disabled={disabled || isSubmitting}
                  readonly={readonly}
                />
              ))}
            </div>

            {/* Form Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : Object.keys(touched).length > 0 ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Form data saved locally</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span>Fill out the form to continue</span>
                    </>
                  )}
                </div>

                <div className="flex gap-3">
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={isSubmitting}
                      leftIcon={<X className="w-4 h-4" />}
                    >
                      {config.cancelText || 'Cancel'}
                    </Button>
                  )}

                  {onReset && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      disabled={isSubmitting}
                      leftIcon={<RotateCcw className="w-4 h-4" />}
                    >
                      {config.resetText || 'Reset'}
                    </Button>
                  )}

                  <Button
                    type="submit"
                    disabled={disabled || readonly || isSubmitting}
                    loading={isSubmitting}
                    className={cn("text-white border-0", theme.button)}
                    leftIcon={isSubmitting ? undefined : <Save className="w-4 h-4" />}
                  >
                    {isSubmitting ? 'Processing...' : (config.submitText || 'Submit')}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ValidationProvider>
  );
};