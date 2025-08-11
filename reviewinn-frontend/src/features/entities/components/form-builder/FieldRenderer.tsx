/**
 * Field Renderer
 * Renders different field types based on configuration
 */

import React from 'react';
import { Eye, EyeOff, Upload, X, Check, AlertCircle } from 'lucide-react';
import type { FormFieldProps, SelectOption } from './types';
import { cn } from '../../../../shared/design-system/utils/cn';

export const FieldRenderer: React.FC<FormFieldProps> = ({
  config,
  value,
  error,
  onChange,
  onBlur,
  onFocus,
  formData,
  disabled = false,
  readonly = false
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const baseInputClasses = cn(
    "w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2",
    config.size === 'sm' && "px-3 py-2 text-sm",
    config.size === 'lg' && "px-5 py-4 text-lg",
    config.variant === 'outlined' && "border-2",
    config.variant === 'filled' && "bg-gray-50 border-gray-200",
    config.variant === 'underlined' && "border-t-0 border-l-0 border-r-0 border-b-2 rounded-none",
    error 
      ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
      : "border-gray-200 focus:border-blue-500 focus:ring-blue-200",
    disabled && "bg-gray-100 cursor-not-allowed opacity-60",
    readonly && "bg-gray-50 cursor-default",
    config.inputClassName
  );

  const labelClasses = cn(
    "block text-sm font-medium mb-2",
    error ? "text-red-700" : "text-gray-700",
    config.labelClassName
  );

  const handleChange = (newValue: any) => {
    if (disabled || readonly) return;
    onChange(newValue);
    config.onChange?.(newValue, formData || {});
  };

  const handleBlur = (newValue: any) => {
    onBlur?.(newValue);
    config.onBlur?.(newValue, formData || {});
  };

  const handleFocus = (newValue: any) => {
    onFocus?.(newValue);
    config.onFocus?.(newValue, formData || {});
  };

  const renderSelectOptions = (options: SelectOption[]) => {
    return options.map((option) => (
      <option key={option.value} value={option.value} disabled={option.disabled}>
        {option.label}
      </option>
    ));
  };

  const renderFileUpload = () => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        handleChange(config.multiple ? Array.from(files) : files[0]);
      }
    };

    const handleDrop = (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOver(false);
      
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        handleChange(config.multiple ? Array.from(files) : files[0]);
      }
    };

    const handleDragOver = (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = () => {
      setIsDragOver(false);
    };

    const removeFile = (index?: number) => {
      if (config.multiple && Array.isArray(value)) {
        const newFiles = value.filter((_, i) => i !== index);
        handleChange(newFiles.length > 0 ? newFiles : null);
      } else {
        handleChange(null);
      }
    };

    return (
      <div className="space-y-3">
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
            isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400",
            error && "border-red-300"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-1">
            Click to upload or drag and drop
          </p>
          {config.accept && (
            <p className="text-xs text-gray-400">
              Accepts: {config.accept}
            </p>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={config.accept}
          multiple={config.multiple}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        
        {value && (
          <div className="space-y-2">
            {config.multiple && Array.isArray(value) ? (
              value.map((file: File, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="flex-1 text-sm truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <Check className="w-4 h-4 text-green-500" />
                <span className="flex-1 text-sm truncate">
                  {value instanceof File ? value.name : 'File selected'}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile()}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderField = () => {
    switch (config.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'tel':
        return (
          <input
            type={config.type}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={(e) => handleBlur(e.target.value)}
            onFocus={(e) => handleFocus(e.target.value)}
            placeholder={config.placeholder}
            disabled={disabled}
            readOnly={readonly}
            className={baseInputClasses}
            min={config.min}
            max={config.max}
            step={config.step}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={(e) => handleBlur(e.target.value)}
            onFocus={(e) => handleFocus(e.target.value)}
            placeholder={config.placeholder}
            disabled={disabled}
            readOnly={readonly}
            rows={config.rows || 4}
            cols={config.cols}
            className={cn(baseInputClasses, "resize-none")}
          />
        );

      case 'number':
      case 'range':
        return (
          <input
            type={config.type}
            value={value || ''}
            onChange={(e) => handleChange(Number(e.target.value))}
            onBlur={(e) => handleBlur(Number(e.target.value))}
            onFocus={(e) => handleFocus(Number(e.target.value))}
            placeholder={config.placeholder}
            disabled={disabled}
            readOnly={readonly}
            min={config.min}
            max={config.max}
            step={config.step}
            className={baseInputClasses}
          />
        );

      case 'date':
      case 'datetime-local':
      case 'month':
        return (
          <input
            type={config.type}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={(e) => handleBlur(e.target.value)}
            onFocus={(e) => handleFocus(e.target.value)}
            disabled={disabled}
            readOnly={readonly}
            className={baseInputClasses}
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={(e) => handleBlur(e.target.value)}
            onFocus={(e) => handleFocus(e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
          >
            {config.placeholder && (
              <option value="">{config.placeholder}</option>
            )}
            {config.options && renderSelectOptions(config.options)}
          </select>
        );

      case 'multiselect':
        return (
          <select
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              handleChange(selected);
            }}
            onBlur={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              handleBlur(selected);
            }}
            onFocus={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              handleFocus(selected);
            }}
            disabled={disabled}
            className={cn(baseInputClasses, "h-32")}
          >
            {config.options && renderSelectOptions(config.options)}
          </select>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleChange(e.target.checked)}
              onBlur={(e) => handleBlur(e.target.checked)}
              onFocus={(e) => handleFocus(e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className={cn("text-sm", error ? "text-red-700" : "text-gray-700")}>
              {config.label}
            </span>
          </label>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {config.options?.map((option) => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={config.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => handleChange(option.value)}
                  onBlur={() => handleBlur(option.value)}
                  onFocus={() => handleFocus(option.value)}
                  disabled={disabled || option.disabled}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className={cn("text-sm", error ? "text-red-700" : "text-gray-700")}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        );

      case 'file':
      case 'image':
        return renderFileUpload();

      case 'color':
        return (
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={(e) => handleBlur(e.target.value)}
            onFocus={(e) => handleFocus(e.target.value)}
            disabled={disabled}
            className={cn(baseInputClasses, "h-12 p-1")}
          />
        );

      case 'custom':
        return config.customRenderer?.({ 
          config, 
          value, 
          error, 
          onChange: handleChange, 
          onBlur: handleBlur, 
          onFocus: handleFocus,
          formData,
          disabled,
          readonly
        });

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={(e) => handleBlur(e.target.value)}
            onFocus={(e) => handleFocus(e.target.value)}
            placeholder={config.placeholder}
            disabled={disabled}
            readOnly={readonly}
            className={baseInputClasses}
          />
        );
    }
  };

  return (
    <div className={cn("space-y-2", config.containerClassName)}>
      {config.type !== 'checkbox' && (
        <label htmlFor={config.id} className={labelClasses}>
          {config.icon && <config.icon className="inline w-4 h-4 mr-2" />}
          {config.label}
          {config.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {renderField()}
        
        {config.type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>

      {config.helpText && !error && (
        <p className="text-sm text-gray-500">{config.helpText}</p>
      )}
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};