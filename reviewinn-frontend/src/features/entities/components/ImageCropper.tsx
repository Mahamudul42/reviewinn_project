import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../../shared/ui';
import { Check, X, RotateCcw, ZoomIn, ZoomOut, Move, Maximize2 } from 'lucide-react';

interface ImageCropperProps {
  imageFile: File;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  isPersonEntity?: boolean;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageState {
  naturalWidth: number;
  naturalHeight: number;
  displayWidth: number;
  displayHeight: number;
  offsetX: number;
  offsetY: number;
  scale: number;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageFile,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  isPersonEntity = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageState, setImageState] = useState<ImageState>({
    naturalWidth: 0,
    naturalHeight: 0,
    displayWidth: 0,
    displayHeight: 0,
    offsetX: 0,
    offsetY: 0,
    scale: 1
  });
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 280, height: 280 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'image' | 'crop' | 'resize' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [initialCropArea, setInitialCropArea] = useState<CropArea | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const containerSize = useMemo(() => ({ width: 500, height: 350 }), []);
  const minCropSize = 100;
  const maxScale = 3;
  const minScale = 0.1;

  // Load image
  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Prevent body scroll and manage focus when modal is open
  useEffect(() => {
    // Prevent body scroll
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    // Focus management
    const modalElement = document.querySelector('[data-modal="image-cropper"]') as HTMLElement;
    if (modalElement) {
      modalElement.focus();
    }

    // Handle Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalStyle;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onCancel]);

  // Global mouse event handlers for better dragging experience
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragType || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const deltaX = currentX - dragStart.x;
      const deltaY = currentY - dragStart.y;
      
      if (dragType === 'image') {
        setImageState(prev => ({
          ...prev,
          offsetX: Math.min(
            containerSize.width - 50,
            Math.max(50 - prev.displayWidth, prev.offsetX + deltaX)
          ),
          offsetY: Math.min(
            containerSize.height - 50,
            Math.max(50 - prev.displayHeight, prev.offsetY + deltaY)
          )
        }));
      } else if (dragType === 'crop') {
        setCropArea(prev => ({
          ...prev,
          x: Math.max(0, Math.min(containerSize.width - prev.width, prev.x + deltaX)),
          y: Math.max(0, Math.min(containerSize.height - prev.height, prev.y + deltaY))
        }));
      } else if (dragType === 'resize' && initialCropArea && resizeHandle) {
        const newCropArea = { ...cropArea };
        
        // More robust resize logic
        if (resizeHandle.includes('n')) { // North (top)
          const newY = Math.max(0, Math.min(cropArea.y + deltaY, cropArea.y + cropArea.height - minCropSize));
          const newHeight = cropArea.y + cropArea.height - newY;
          newCropArea.y = newY;
          newCropArea.height = newHeight;
        }
        if (resizeHandle.includes('s')) { // South (bottom)
          const newHeight = Math.max(minCropSize, Math.min(cropArea.height + deltaY, containerSize.height - cropArea.y));
          newCropArea.height = newHeight;
        }
        if (resizeHandle.includes('w')) { // West (left)
          const newX = Math.max(0, Math.min(cropArea.x + deltaX, cropArea.x + cropArea.width - minCropSize));
          const newWidth = cropArea.x + cropArea.width - newX;
          newCropArea.x = newX;
          newCropArea.width = newWidth;
        }
        if (resizeHandle.includes('e')) { // East (right)
          const newWidth = Math.max(minCropSize, Math.min(cropArea.width + deltaX, containerSize.width - cropArea.x));
          newCropArea.width = newWidth;
        }
        
        // Maintain aspect ratio if needed (for square crop areas)
        if (aspectRatio === 1) {
          // For square crop areas, make width and height equal
          const size = Math.min(newCropArea.width, newCropArea.height);
          
          // Adjust position to keep the crop area within bounds
          if (resizeHandle.includes('n') || resizeHandle.includes('w')) {
            if (resizeHandle.includes('n')) {
              newCropArea.y = Math.max(0, newCropArea.y + newCropArea.height - size);
            }
            if (resizeHandle.includes('w')) {
              newCropArea.x = Math.max(0, newCropArea.x + newCropArea.width - size);
            }
          }
          
          newCropArea.width = size;
          newCropArea.height = size;
          
          // Final boundary check
          if (newCropArea.x + newCropArea.width > containerSize.width) {
            const overflow = (newCropArea.x + newCropArea.width) - containerSize.width;
            newCropArea.width -= overflow;
            newCropArea.height = newCropArea.width;
          }
          if (newCropArea.y + newCropArea.height > containerSize.height) {
            const overflow = (newCropArea.y + newCropArea.height) - containerSize.height;
            newCropArea.height -= overflow;
            newCropArea.width = newCropArea.height;
          }
        }
        
        setCropArea(newCropArea);
      }
      
      setDragStart({ x: currentX, y: currentY });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
      setResizeHandle('');
      setInitialCropArea(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragType, dragStart, containerSize, resizeHandle, initialCropArea, minCropSize, aspectRatio, cropArea]);

  // Initialize image state when loaded
  const handleImageLoad = useCallback(() => {
    if (!imageRef.current) return;
    
    const img = imageRef.current;
    const container = containerSize;
    
    // Calculate scale to fit image in container
    const scaleX = (container.width - 100) / img.naturalWidth;
    const scaleY = (container.height - 100) / img.naturalHeight;
    const initialScale = Math.min(scaleX, scaleY, 1);
    
    const displayWidth = img.naturalWidth * initialScale;
    const displayHeight = img.naturalHeight * initialScale;
    const offsetX = (container.width - displayWidth) / 2;
    const offsetY = (container.height - displayHeight) / 2;
    
    setImageState({
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      displayWidth,
      displayHeight,
      offsetX,
      offsetY,
      scale: initialScale
    });
    
    // Center crop area
    const cropSize = Math.min(280, displayWidth * 0.7, displayHeight * 0.7);
    const cropX = (container.width - cropSize) / 2;
    let cropY = (container.height - cropSize) / 2;
    
    // For person entities, position crop area slightly higher
    if (isPersonEntity) {
      cropY = Math.max(50, cropY - 50);
    }
    
    setCropArea({
      x: cropX,
      y: cropY,
      width: cropSize,
      height: cropSize * aspectRatio
    });
  }, [containerSize, aspectRatio, isPersonEntity]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'image' | 'crop' | 'resize', resizeHandleDir?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setIsDragging(true);
    setDragType(type);
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    if (type === 'resize' && resizeHandleDir) {
      setResizeHandle(resizeHandleDir);
      setInitialCropArea(cropArea);
    }
  }, [cropArea]);

  // Simplified mouse move handler - mainly for local container interactions
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // This is now handled by the global mouse event listener
    // Keep this function for compatibility but let global handler do the work
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
    setResizeHandle('');
    setInitialCropArea(null);
  }, []);

  // Zoom handlers
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    const factor = direction === 'in' ? 1.2 : 1 / 1.2;
    setImageState(prev => {
      const newScale = Math.max(minScale, Math.min(maxScale, prev.scale * factor));
      const scaleFactor = newScale / prev.scale;
      
      const newDisplayWidth = prev.naturalWidth * newScale;
      const newDisplayHeight = prev.naturalHeight * newScale;
      
      // Adjust offset to zoom towards center
      const centerX = containerSize.width / 2;
      const centerY = containerSize.height / 2;
      
      const newOffsetX = centerX - (centerX - prev.offsetX) * scaleFactor;
      const newOffsetY = centerY - (centerY - prev.offsetY) * scaleFactor;
      
      return {
        ...prev,
        scale: newScale,
        displayWidth: newDisplayWidth,
        displayHeight: newDisplayHeight,
        offsetX: newOffsetX,
        offsetY: newOffsetY
      };
    });
  }, [containerSize, minScale, maxScale]);

  // Reset to initial state
  const handleReset = useCallback(() => {
    handleImageLoad();
  }, [handleImageLoad]);

  // Crop the image
  const handleCrop = useCallback(async () => {
    if (!imageRef.current || !canvasRef.current) return;
    
    setIsLoading(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Calculate crop coordinates relative to the original image
      const scaleToOriginal = imageState.naturalWidth / imageState.displayWidth;
      
      const cropX = (cropArea.x - imageState.offsetX) * scaleToOriginal;
      const cropY = (cropArea.y - imageState.offsetY) * scaleToOriginal;
      const cropWidth = cropArea.width * scaleToOriginal;
      const cropHeight = cropArea.height * scaleToOriginal;
      
      // Set canvas size for output
      const outputSize = 400;
      canvas.width = outputSize;
      canvas.height = outputSize;
      
      // Draw cropped image
      ctx.drawImage(
        imageRef.current,
        Math.max(0, cropX),
        Math.max(0, cropY),
        Math.min(cropWidth, imageState.naturalWidth - cropX),
        Math.min(cropHeight, imageState.naturalHeight - cropY),
        0,
        0,
        outputSize,
        outputSize
      );
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
        }
        setIsLoading(false);
      }, 'image/webp', 0.9);
      
    } catch (error) {
      setIsLoading(false);
      console.error('Error cropping image:', error);
    }
  }, [imageState, cropArea, onCropComplete]);

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
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(4px)',
        padding: '16px'
      }}
      data-modal="image-cropper"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '900px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'hidden',
          animation: 'zoom-in-95 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <h2 id="modal-title" className="text-xl font-semibold text-black">Crop Photo</h2>
            <p className="text-sm text-black mt-1">
              {isPersonEntity ? 'Position the crop area to center the face' : 'Drag to reposition, scroll to zoom'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="flex gap-6 items-start">
            {/* Crop Area */}
            <div className="flex-1">
              <div
                ref={containerRef}
                className="relative bg-neutral-900 rounded-xl overflow-hidden cursor-move select-none"
                style={{ width: containerSize.width, height: containerSize.height }}
              >
                {/* Image */}
                {imageUrl && (
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Crop preview"
                    className="absolute"
                    style={{
                      width: imageState.displayWidth,
                      height: imageState.displayHeight,
                      left: imageState.offsetX,
                      top: imageState.offsetY,
                      transform: 'translateZ(0)', // Hardware acceleration
                      cursor: isDragging && dragType === 'image' ? 'grabbing' : 'grab'
                    }}
                    onLoad={handleImageLoad}
                    draggable={false}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleMouseDown(e, 'image');
                    }}
                  />
                )}

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none" />

                {/* Crop area */}
                <div
                  ref={cropAreaRef}
                  className="absolute border-2 border-white shadow-lg cursor-move bg-transparent"
                  style={{
                    left: cropArea.x,
                    top: cropArea.y,
                    width: cropArea.width,
                    height: cropArea.height,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e, 'crop');
                  }}
                >
                  {/* Grid lines */}
                  <div className="absolute inset-0 opacity-60">
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-black shadow-sm" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-black shadow-sm" />
                    <div className="absolute top-1/3 left-0 right-0 h-px bg-black shadow-sm" />
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-black shadow-sm" />
                  </div>
                  
                  {/* Corner handles - Enhanced visibility and usability */}
                  <div 
                    className="absolute -top-2 -left-2 w-5 h-5 bg-white border-2 border-purple-500 rounded-full cursor-nw-resize shadow-lg hover:scale-110 transition-transform" 
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, 'resize', 'nw');
                    }}
                  />
                  <div 
                    className="absolute -top-2 -right-2 w-5 h-5 bg-white border-2 border-purple-500 rounded-full cursor-ne-resize shadow-lg hover:scale-110 transition-transform" 
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, 'resize', 'ne');
                    }}
                  />
                  <div 
                    className="absolute -bottom-2 -left-2 w-5 h-5 bg-white border-2 border-purple-500 rounded-full cursor-sw-resize shadow-lg hover:scale-110 transition-transform" 
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, 'resize', 'sw');
                    }}
                  />
                  <div 
                    className="absolute -bottom-2 -right-2 w-5 h-5 bg-white border-2 border-purple-500 rounded-full cursor-se-resize shadow-lg hover:scale-110 transition-transform" 
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, 'resize', 'se');
                    }}
                  />
                  
                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Move className="w-6 h-6 text-black opacity-80 drop-shadow-lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Panel */}
            <div className="w-56 space-y-4 flex-shrink-0">
              {/* Preview */}
              <div>
                <h3 className="text-sm font-medium text-black mb-3">Preview</h3>
                <div className="w-24 h-24 bg-neutral-100 rounded-lg border-2 border-neutral-200 mx-auto relative overflow-hidden">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="absolute object-cover"
                      style={{
                        width: (imageState.displayWidth / cropArea.width) * 96,
                        height: (imageState.displayHeight / cropArea.height) * 96,
                        left: -((cropArea.x - imageState.offsetX) / cropArea.width) * 96,
                        top: -((cropArea.y - imageState.offsetY) / cropArea.height) * 96,
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Zoom Controls */}
              <div>
                <h3 className="text-sm font-medium text-black mb-3">Zoom</h3>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleZoom('out')}
                    disabled={imageState.scale <= minScale}
                    className="p-2"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="text-sm text-black">
                      {Math.round(imageState.scale * 100)}%
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleZoom('in')}
                    disabled={imageState.scale >= maxScale}
                    className="p-2"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-sm font-medium text-black mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="purple"
                    size="sm"
                    onClick={handleReset}
                    className="w-full flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Position
                  </Button>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-black mb-1">Tips</h4>
                <ul className="text-xs text-black space-y-1">
                  <li>• Drag the image to reposition</li>
                  <li>• Use zoom controls to resize</li>
                  <li>• Drag the crop area to move it</li>
                  <li>• Drag corner handles to resize crop box</li>
                  {isPersonEntity && <li>• Center the face in the crop area</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 bg-neutral-50">
          <Button variant="purple" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            variant="purple"
            onClick={handleCrop} 
            disabled={isLoading}
            className="flex items-center gap-2 min-w-24"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Cropping...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Apply Crop
              </>
            )}
          </Button>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>,
    document.body
  );
};