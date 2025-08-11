import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Share2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import type { Review, Entity } from '../../../types';
import { imageGenerationService, type GeneratedImageData } from '../../../api/services/imageGenerationService';
import { useToast } from '../../../shared/components/ToastProvider';

interface ReviewImageShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
  entity?: Entity;
}

const ReviewImageShareModal: React.FC<ReviewImageShareModalProps> = ({
  isOpen,
  onClose,
  review,
  entity
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImageData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [useScreenshot, setUseScreenshot] = useState(true); // Default to screenshot approach
  const { showSuccess, showError } = useToast();

  // Generate image when modal opens
  useEffect(() => {
    if (isOpen && !generatedImage) {
      generateImage();
    }
  }, [isOpen]);

  const generateImage = async () => {
    if (!review) return;

    setIsGenerating(true);
    try {
      const options = {
        useScreenshot: useScreenshot,
        width: 800,
        height: 700,
        quality: 0.95
      };
      
      const imageData = await imageGenerationService.generateReviewImage(review, entity, options);
      setGeneratedImage(imageData);
      setPreviewUrl(imageData.dataUrl);
      showSuccess(`Review image generated successfully using ${useScreenshot ? 'screenshot' : 'canvas'} approach!`);
    } catch (error) {
      console.error('Failed to generate image:', error);
      showError('Failed to generate review image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      await imageGenerationService.downloadImage(generatedImage);
      showSuccess('Image downloaded successfully!');
    } catch (error) {
      console.error('Failed to download image:', error);
      showError('Failed to download image. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!generatedImage) return;

    try {
      const title = review.title || `Review of ${entity?.name || 'this business'}`;
      const text = `Check out this review on ReviewInn!`;
      
      const success = await imageGenerationService.shareImage(generatedImage, title, text);
      
      if (success) {
        showSuccess('Image shared successfully!');
      } else {
        // Fallback to download if native sharing is not available
        await handleDownload();
      }
    } catch (error) {
      console.error('Failed to share image:', error);
      showError('Failed to share image. Please try downloading instead.');
    }
  };

  const handleRegenerate = () => {
    setGeneratedImage(null);
    setPreviewUrl(null);
    generateImage();
  };

  // Regenerate when method changes
  useEffect(() => {
    if (generatedImage) {
      handleRegenerate();
    }
  }, [useScreenshot]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        pointerEvents: 'auto',
        padding: '20px',
        boxSizing: 'border-box',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div style={{
        background: 'white',
        borderRadius: 20,
        boxShadow: '0 20px 50px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.08)',
        width: '90%',
        maxWidth: 900,
        maxHeight: 'calc(100vh - 40px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(0,0,0,0.08)',
        position: 'fixed',
        top: '50vh',
        left: '50vw',
        transform: 'translate(-50%, -50%)',
        zIndex: 100000,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          padding: '24px 32px 16px 32px',
          position: 'sticky',
          top: 0,
          background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
          zIndex: 100,
          backdropFilter: 'blur(10px)',
        }}>
          <span style={{ 
            fontWeight: 700, 
            fontSize: 22, 
            color: '#1a1a1a',
            letterSpacing: '-0.02em'
          }}>Share Review as Image</span>
          <button
            style={{
              color: '#666',
              fontSize: 24,
              fontWeight: 400,
              background: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: 12,
              width: 40,
              height: 40,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 101,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
            onClick={onClose}
            aria-label="Close"
            onMouseOver={e => {
              e.currentTarget.style.background = '#e9ecef';
              e.currentTarget.style.color = '#333';
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = '#f8f9fa';
              e.currentTarget.style.color = '#666';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '32px',
          background: '#fafbfc'
        }}>
          {isGenerating ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 0'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '2px solid #3b82f6',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '16px'
              }}></div>
              <p style={{ color: '#6b7280' }}>Generating your review image...</p>
            </div>
          ) : previewUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Preview */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={previewUrl}
                    alt="Review preview"
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      border: '1px solid #e5e7eb',
                      maxHeight: '400px'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(255,255,255,0.9)',
                    borderRadius: '50%',
                    padding: '8px'
                  }}>
                    <ImageIcon style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                justifyContent: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '12px',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={handleDownload}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      background: '#2563eb',
                      color: 'white',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#1d4ed8'}
                    onMouseOut={e => e.currentTarget.style.background = '#2563eb'}
                  >
                    <Download style={{ width: '20px', height: '20px' }} />
                    Download Image
                  </button>
                  
                  <button
                    onClick={handleShare}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      background: '#059669',
                      color: 'white',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#047857'}
                    onMouseOut={e => e.currentTarget.style.background = '#059669'}
                  >
                    <Share2 style={{ width: '20px', height: '20px' }} />
                    Share Image
                  </button>
                  
                  <button
                    onClick={handleRegenerate}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      background: '#6b7280',
                      color: 'white',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#4b5563'}
                    onMouseOut={e => e.currentTarget.style.background = '#6b7280'}
                  >
                    <RefreshCw style={{ width: '20px', height: '20px' }} />
                    Regenerate
                  </button>
                </div>

                {/* Generation Method Toggle */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px'
                }}>
                  <label style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    fontWeight: 500
                  }}>
                    Image Generation Method:
                  </label>
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center'
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      <input
                        type="radio"
                        checked={useScreenshot}
                        onChange={() => setUseScreenshot(true)}
                        style={{ margin: 0 }}
                      />
                      📸 Screenshot (Exact Match)
                    </label>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      <input
                        type="radio"
                        checked={!useScreenshot}
                        onChange={() => setUseScreenshot(false)}
                        style={{ margin: 0 }}
                      />
                      🎨 Canvas (Fallback)
                    </label>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
                <p>Perfect for sharing on social media platforms like Facebook, Twitter, and Instagram!</p>
                <p style={{ marginTop: '4px' }}>
                  {useScreenshot 
                    ? 'Screenshot method captures exact homepage design with all styling and icons'
                    : 'Canvas method provides reliable fallback with simplified styling'
                  }
                </p>
                <p style={{ marginTop: '4px' }}>Image size: 800x700px (optimized for social media)</p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ color: '#6b7280' }}>Failed to generate image. Please try again.</p>
              <button
                onClick={generateImage}
                style={{
                  marginTop: '16px',
                  padding: '12px 24px',
                  background: '#2563eb',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#1d4ed8'}
                onMouseOut={e => e.currentTarget.style.background = '#2563eb'}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReviewImageShareModal; 