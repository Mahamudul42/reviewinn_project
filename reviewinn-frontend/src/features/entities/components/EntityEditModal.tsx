import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, AlertCircle, CheckCircle, Loader2, Building2, ImageIcon, Globe, MapPin, Phone, Mail, Star, Facebook, Twitter, Instagram, Linkedin, Clock, Tag, Upload } from 'lucide-react';
import type { Entity, EntityCategory } from '../../../types';
import { entityService } from '../../../api/services/entityService';
import { useToast } from '../../../shared/components/ToastProvider';
import EntityImageUpload from './EntityImageUpload';

interface EntityEditModalProps {
  entity: Entity;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedEntity: Entity) => void;
}

interface EntityEditFormData {
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  location?: string;
  website?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  address?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  operatingHours?: string;
  tags?: string[];
  specialties?: string[];
  context?: any;
  additionalContexts?: any[];
  fields?: Record<string, any>;
  customFields?: Record<string, any>;
}

const EntityEditModal: React.FC<EntityEditModalProps> = ({
  entity,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { showToast } = useToast();
  const [currentTab, setCurrentTab] = useState<'basic' | 'image' | 'contact' | 'social' | 'advanced'>('basic');
  const [formData, setFormData] = useState<EntityEditFormData>({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    location: '',
    website: '',
    email: '',
    phone: '',
    avatar: '',
    address: '',
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    },
    operatingHours: '',
    tags: [],
    specialties: [],
    context: {},
    additionalContexts: [],
    fields: {},
    customFields: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');

  // Manage body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'relative';
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
      };
    }
  }, [isOpen]);

  // Initialize form data when entity changes
  useEffect(() => {
    if (entity) {
      setFormData({
        name: entity.name || '',
        description: entity.description || '',
        category: entity.category || '',
        subcategory: entity.subcategory || '',
        location: entity.context?.location || '',
        website: entity.context?.website || '',
        email: entity.context?.email || '',
        phone: entity.context?.phone || '',
        avatar: entity.avatar || entity.imageUrl || '',
        address: entity.context?.address || '',
        socialMedia: {
          facebook: entity.context?.socialMedia?.facebook || '',
          twitter: entity.context?.socialMedia?.twitter || '',
          instagram: entity.context?.socialMedia?.instagram || '',
          linkedin: entity.context?.socialMedia?.linkedin || ''
        },
        operatingHours: entity.context?.operatingHours || '',
        tags: entity.context?.tags || [],
        specialties: entity.context?.specialties || [],
        context: entity.context || {},
        additionalContexts: entity.context?.additionalContexts || [],
        fields: entity.fields || {},
        customFields: entity.customFields || {}
      });
      setErrors({});
    }
  }, [entity]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.name.trim()) {
      newErrors.name = 'Entity name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Entity name must be at least 2 characters';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Entity name cannot exceed 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 2000) {
      newErrors.description = 'Description cannot exceed 2000 characters';
    }

    // URL validations
    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid URL';
    }
    if (formData.avatar && !isValidUrl(formData.avatar)) {
      newErrors.avatar = 'Please enter a valid image URL';
    }

    // Email validation
    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Social media URL validations
    if (formData.socialMedia?.facebook && !isValidUrl(formData.socialMedia.facebook)) {
      newErrors.facebook = 'Please enter a valid Facebook URL';
    }
    if (formData.socialMedia?.twitter && !isValidUrl(formData.socialMedia.twitter)) {
      newErrors.twitter = 'Please enter a valid Twitter URL';
    }
    if (formData.socialMedia?.instagram && !isValidUrl(formData.socialMedia.instagram)) {
      newErrors.instagram = 'Please enter a valid Instagram URL';
    }
    if (formData.socialMedia?.linkedin && !isValidUrl(formData.socialMedia.linkedin)) {
      newErrors.linkedin = 'Please enter a valid LinkedIn URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field] || errors[field.split('.').pop() || '']) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
        [field.split('.').pop() || '']: ''
      }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties?.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...(prev.specialties || []), newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (specialtyToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties?.filter(specialty => specialty !== specialtyToRemove) || []
    }));
  };

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      avatar: imageUrl
    }));
    console.log('🖼️ EntityEditModal: Image uploaded:', imageUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Switch to tab with errors
      if (errors.name || errors.description || errors.category) {
        setCurrentTab('basic');
      } else if (errors.email || errors.phone || errors.website || errors.address) {
        setCurrentTab('contact');
      } else if (errors.facebook || errors.twitter || errors.instagram || errors.linkedin) {
        setCurrentTab('social');
      }
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare comprehensive update data
      const updateData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        subcategory: formData.subcategory || null
      };

      // Add comprehensive context data
      const contextData = {
        ...formData.context,
        location: formData.location || null,
        address: formData.address || null,
        website: formData.website || null,
        email: formData.email || null,
        phone: formData.phone || null,
        socialMedia: {
          facebook: formData.socialMedia?.facebook || null,
          twitter: formData.socialMedia?.twitter || null,
          instagram: formData.socialMedia?.instagram || null,
          linkedin: formData.socialMedia?.linkedin || null
        },
        operatingHours: formData.operatingHours || null,
        tags: formData.tags || [],
        specialties: formData.specialties || [],
        additionalContexts: formData.additionalContexts || []
      };

      updateData.context = contextData;

      if (formData.avatar) {
        updateData.avatar = formData.avatar;
      }

      if (Object.keys(formData.fields).length > 0) {
        updateData.fields = formData.fields;
      }

      if (Object.keys(formData.customFields).length > 0) {
        updateData.customFields = formData.customFields;
      }

      const updatedEntity = await entityService.updateEntity(entity.id, updateData);
      
      showToast({
        type: 'success',
        title: 'Entity Updated Successfully',
        message: 'All entity information has been updated successfully.',
        icon: CheckCircle
      });

      onSuccess(updatedEntity);
      onClose();
      
    } catch (error: any) {
      console.error('Error updating entity:', error);
      
      let errorMessage = 'Failed to update entity';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showToast({
        type: 'error',
        title: 'Update Failed',
        message: errorMessage,
        icon: AlertCircle
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Calculate the current viewport center dynamically
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  const modalHeight = Math.min(700, viewportHeight * 0.9);
  const modalWidth = Math.min(672, viewportWidth * 0.9); // Match middle panel max-w-2xl
  
  const centerTop = scrollTop + (viewportHeight / 2) - (modalHeight / 2);
  const centerLeft = scrollLeft + (viewportWidth / 2) - (modalWidth / 2);

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Building2 },
    { id: 'image', label: 'Image', icon: Upload },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'social', label: 'Social Media', icon: Globe },
    { id: 'advanced', label: 'Advanced', icon: Star }
  ] as const;

  return createPortal(
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: Math.max(document.documentElement.scrollHeight, viewportHeight),
        zIndex: 99999,
        background: 'rgba(0,0,0,0.5)',
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div style={{
        position: 'absolute',
        top: `${centerTop}px`,
        left: `${centerLeft}px`,
        width: `${modalWidth}px`,
        maxHeight: `${modalHeight}px`,
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderBottom: '1px solid #eee', 
          padding: '20px 24px 12px 24px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              padding: '8px', 
              backgroundColor: '#3b82f6', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 20, color: '#222' }}>Edit Entity</span>
              <p style={{ color: '#666', fontSize: 14, margin: '4px 0 0 0' }}>
                Update information for {entity.name}
              </p>
            </div>
          </div>
          <button
            style={{ 
              color: '#888', 
              fontSize: 28, 
              fontWeight: 700, 
              background: 'none', 
              border: 'none', 
              borderRadius: 999, 
              width: 36, 
              height: 36, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #eee',
          backgroundColor: '#f9fafb',
          padding: '0 24px'
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: currentTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                  color: currentTab === tab.id ? '#3b82f6' : '#6b7280',
                  fontWeight: currentTab === tab.id ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                disabled={isLoading}
              >
                <Icon style={{ width: '16px', height: '16px' }} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px'
        }}>
          <form onSubmit={handleSubmit} style={{ height: '100%' }}>
            {/* Basic Info Tab */}
            {currentTab === 'basic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    Entity Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: errors.name ? '2px solid #ef4444' : '2px solid #e5e7eb', 
                      borderRadius: '8px', 
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      backgroundColor: isLoading ? '#f9fafb' : 'white'
                    }}
                    placeholder="Enter entity name"
                    disabled={isLoading}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = errors.name ? '#ef4444' : '#e5e7eb'}
                  />
                  {errors.name && (
                    <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle style={{ width: '14px', height: '14px' }} />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: errors.description ? '2px solid #ef4444' : '2px solid #e5e7eb', 
                      borderRadius: '8px', 
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      resize: 'vertical',
                      minHeight: '100px',
                      backgroundColor: isLoading ? '#f9fafb' : 'white'
                    }}
                    placeholder="Describe this entity..."
                    disabled={isLoading}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = errors.description ? '#ef4444' : '#e5e7eb'}
                  />
                  {errors.description && (
                    <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle style={{ width: '14px', height: '14px' }} />
                      {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    readOnly
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '8px', 
                      fontSize: '14px',
                      backgroundColor: '#f9fafb',
                      color: '#6b7280'
                    }}
                    placeholder="Category (read-only)"
                  />
                  <p style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                    Category cannot be changed after creation
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    Subcategory
                  </label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => handleInputChange('subcategory', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '8px', 
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      backgroundColor: isLoading ? '#f9fafb' : 'white'
                    }}
                    placeholder="Enter subcategory"
                    disabled={isLoading}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

              </div>
            )}

            {/* Image Tab */}
            {currentTab === 'image' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#374151',
                    margin: '0 0 8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Upload style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                    Entity Image
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: '0 0 20px 0',
                    lineHeight: '1.5'
                  }}>
                    Upload a professional image for {entity.name}. The image will be automatically optimized and cropped for best display quality.
                  </p>
                </div>

                <div style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: '#fafbfc'
                }}>
                  <EntityImageUpload
                    onImageUpload={handleImageUpload}
                    currentImage={formData.avatar || null}
                    entityName={entity.name}
                    entityType={entity.category || 'professional'}
                    maxFileSize={5}
                    acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                  />
                </div>

                <div style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#0ea5e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>i</span>
                  </div>
                  <div>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0c4a6e',
                      margin: '0 0 4px 0'
                    }}>
                      Image Guidelines
                    </h4>
                    <ul style={{
                      fontSize: '13px',
                      color: '#0369a1',
                      margin: 0,
                      paddingLeft: '16px',
                      lineHeight: '1.4'
                    }}>
                      <li>Use high-quality, clear images (JPEG, PNG, or WebP format)</li>
                      <li>Square aspect ratio works best for profile photos</li>
                      <li>Avoid images with text overlays or watermarks</li>
                      <li>Maximum file size: 5MB</li>
                      <li>Images will be automatically optimized for web display</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {currentTab === 'contact' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    <Mail style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: errors.email ? '2px solid #ef4444' : '2px solid #e5e7eb', 
                      borderRadius: '8px', 
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      backgroundColor: isLoading ? '#f9fafb' : 'white'
                    }}
                    placeholder="contact@example.com"
                    disabled={isLoading}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = errors.email ? '#ef4444' : '#e5e7eb'}
                  />
                  {errors.email && (
                    <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle style={{ width: '14px', height: '14px' }} />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    <Phone style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: errors.phone ? '2px solid #ef4444' : '2px solid #e5e7eb', 
                      borderRadius: '8px', 
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      backgroundColor: isLoading ? '#f9fafb' : 'white'
                    }}
                    placeholder="+1 (555) 123-4567"
                    disabled={isLoading}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = errors.phone ? '#ef4444' : '#e5e7eb'}
                  />
                  {errors.phone && (
                    <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle style={{ width: '14px', height: '14px' }} />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    <Globe style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: errors.website ? '2px solid #ef4444' : '2px solid #e5e7eb', 
                      borderRadius: '8px', 
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      backgroundColor: isLoading ? '#f9fafb' : 'white'
                    }}
                    placeholder="https://example.com"
                    disabled={isLoading}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = errors.website ? '#ef4444' : '#e5e7eb'}
                  />
                  {errors.website && (
                    <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle style={{ width: '14px', height: '14px' }} />
                      {errors.website}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    <MapPin style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '8px', 
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      backgroundColor: isLoading ? '#f9fafb' : 'white'
                    }}
                    placeholder="City, State/Province, Country"
                    disabled={isLoading}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    Full Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '8px', 
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      resize: 'vertical',
                      backgroundColor: isLoading ? '#f9fafb' : 'white'
                    }}
                    placeholder="Street address, city, state, postal code, country"
                    disabled={isLoading}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    <Clock style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
                    Operating Hours
                  </label>
                  <textarea
                    value={formData.operatingHours}
                    onChange={(e) => handleInputChange('operatingHours', e.target.value)}
                    rows={3}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '8px', 
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      resize: 'vertical',
                      backgroundColor: isLoading ? '#f9fafb' : 'white'
                    }}
                    placeholder="Mon-Fri: 9AM-5PM&#10;Sat: 10AM-3PM&#10;Sun: Closed"
                    disabled={isLoading}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>
            )}

            {/* Social Media Tab */}
            {currentTab === 'social' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    <Facebook style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={formData.socialMedia?.facebook || ''}
                    onChange={(e) => handleInputChange('socialMedia.facebook', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: errors.facebook ? '2px solid #ef4444' : '2px solid #e5e7eb', 
                      borderRadius: '8px', 
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      backgroundColor: isLoading ? '#f9fafb' : 'white'
                    }}
                    placeholder="https://facebook.com/yourpage"
                    disabled={isLoading}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = errors.facebook ? '#ef4444' : '#e5e7eb'}
                  />
                  {errors.facebook && (
                    <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle style={{ width: '14px', height: '14px' }} />
                      {errors.facebook}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    <Twitter style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
                    Twitter
                  </label>
                  <input
                    type="url"
                    value={formData.socialMedia?.twitter || ''}
                    onChange={(e) => handleInputChange('socialMedia.twitter', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: errors.twitter ? '2px solid #ef4444' : '2px solid #e5e7eb', 
                      borderRadius: '8px', 
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      backgroundColor: isLoading ? '#f9fafb' : 'white'
                    }}
                    placeholder="https://twitter.com/yourhandle"
                    disabled={isLoading}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = errors.twitter ? '#ef4444' : '#e5e7eb'}
                  />
                  {errors.twitter && (
                    <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle style={{ width: '14px', height: '14px' }} />
                      {errors.twitter}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    <Instagram style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={formData.socialMedia?.instagram || ''}
                    onChange={(e) => handleInputChange('socialMedia.instagram', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: errors.instagram ? '2px solid #ef4444' : '2px solid #e5e7eb', 
                      borderRadius: '8px', 
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      backgroundColor: isLoading ? '#f9fafb' : 'white'
                    }}
                    placeholder="https://instagram.com/yourhandle"
                    disabled={isLoading}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = errors.instagram ? '#ef4444' : '#e5e7eb'}
                  />
                  {errors.instagram && (
                    <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle style={{ width: '14px', height: '14px' }} />
                      {errors.instagram}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    <Linkedin style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={formData.socialMedia?.linkedin || ''}
                    onChange={(e) => handleInputChange('socialMedia.linkedin', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: errors.linkedin ? '2px solid #ef4444' : '2px solid #e5e7eb', 
                      borderRadius: '8px', 
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      backgroundColor: isLoading ? '#f9fafb' : 'white'
                    }}
                    placeholder="https://linkedin.com/company/yourcompany"
                    disabled={isLoading}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = errors.linkedin ? '#ef4444' : '#e5e7eb'}
                  />
                  {errors.linkedin && (
                    <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle style={{ width: '14px', height: '14px' }} />
                      {errors.linkedin}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {currentTab === 'advanced' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    <Tag style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
                    Tags
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      style={{ 
                        flex: 1,
                        padding: '8px 12px', 
                        border: '2px solid #e5e7eb', 
                        borderRadius: '6px', 
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: isLoading ? '#f9fafb' : 'white'
                      }}
                      placeholder="Add a tag and press Enter"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      disabled={!newTag.trim() || isLoading}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        opacity: (!newTag.trim() || isLoading) ? 0.5 : 1
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {formData.tags?.map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          backgroundColor: '#e0e7ff',
                          color: '#3730a3',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#3730a3',
                            cursor: 'pointer',
                            fontSize: '14px',
                            lineHeight: 1,
                            padding: 0,
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          disabled={isLoading}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    <Star style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
                    Specialties
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialty())}
                      style={{ 
                        flex: 1,
                        padding: '8px 12px', 
                        border: '2px solid #e5e7eb', 
                        borderRadius: '6px', 
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: isLoading ? '#f9fafb' : 'white'
                      }}
                      placeholder="Add a specialty and press Enter"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={handleAddSpecialty}
                      disabled={!newSpecialty.trim() || isLoading}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        opacity: (!newSpecialty.trim() || isLoading) ? 0.5 : 1
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {formData.specialties?.map((specialty, index) => (
                      <span
                        key={index}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          backgroundColor: '#d1fae5',
                          color: '#065f46',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      >
                        {specialty}
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecialty(specialty)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#065f46',
                            cursor: 'pointer',
                            fontSize: '14px',
                            lineHeight: 1,
                            padding: 0,
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          disabled={isLoading}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'end', 
              gap: '12px', 
              paddingTop: '24px', 
              borderTop: '1px solid #e5e7eb',
              marginTop: '24px'
            }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  opacity: isLoading ? 0.5 : 1
                }}
                onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#e5e7eb')}
                onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#f3f4f6')}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: isLoading ? 0.5 : 1
                }}
                onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#2563eb')}
                onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#3b82f6')}
              >
                {isLoading ? (
                  <>
                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save style={{ width: '16px', height: '16px' }} />
                    Update Entity
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EntityEditModal;