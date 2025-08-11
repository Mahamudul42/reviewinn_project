import html2canvas from 'html2canvas';
import React from 'react';
import { createRoot } from 'react-dom/client';
import type { Review, Entity } from '../../types';

export interface Html2CanvasImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'png' | 'jpeg' | 'webp';
  backgroundColor?: string;
  useCORS?: boolean;
  allowTaint?: boolean;
}

export interface GeneratedImageData {
  dataUrl: string;
  blob?: Blob;
  filename: string;
  canvas: HTMLCanvasElement;
}

export class Html2CanvasImageService {
  private defaultOptions: Required<Html2CanvasImageOptions> = {
    width: 1200,
    height: 630, // Social media optimized dimensions
    quality: 0.95,
    format: 'png',
    backgroundColor: '#ffffff',
    useCORS: true,
    allowTaint: false
  };

  /**
   * Generate a high-quality image from a DOM element using html2canvas
   */
  async generateImageFromElement(
    element: HTMLElement,
    options: Html2CanvasImageOptions = {}
  ): Promise<GeneratedImageData> {
    const opts = { ...this.defaultOptions, ...options };

    try {
      // Prepare the element for capture
      const preparedElement = await this.prepareElementForCapture(element);
      
      // Generate canvas using html2canvas
      const canvas = await html2canvas(preparedElement, {
        width: opts.width,
        height: opts.height,
        background: opts.backgroundColor,
        useCORS: opts.useCORS,
        allowTaint: opts.allowTaint,
        logging: false // Disable logging for cleaner output
      });

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, `image/${opts.format}`, opts.quality);
      });

      const dataUrl = canvas.toDataURL(`image/${opts.format}`, opts.quality);
      const filename = this.generateFilename();

      // Clean up
      this.cleanupAfterCapture(preparedElement);

      return {
        dataUrl,
        blob,
        filename,
        canvas
      };
    } catch (error) {
      console.error('Failed to generate image with html2canvas:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Image generation failed: ${errorMessage}`);
    }
  }

  /**
   * Generate a review image by creating a temporary DOM element that matches the actual UI
   */
  async generateReviewImage(
    review: Review,
    entity?: Entity,
    options: Html2CanvasImageOptions = {}
  ): Promise<GeneratedImageData> {
    const opts = { ...this.defaultOptions, ...options };

    // Try to capture an existing review card first
    const existingCard = await this.tryCapturingExistingReviewCard(review.id);
    if (existingCard) {
      return existingCard;
    }

    // Fallback: Create a temporary container using React component
    const container = await this.createReviewContainerWithReact(review, entity, opts);
    
    try {
      // Generate image
      const result = await this.generateImageFromElement(container, opts);
      
      return result;
    } finally {
      // Clean up - remove from DOM
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  }

  /**
   * Create a review container using React component for exact UI match
   */
  private async createReviewContainerWithReact(
    review: Review,
    entity?: Entity,
    options: Html2CanvasImageOptions = {}
  ): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      try {
        // Create container element
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        container.style.zIndex = '-1';
        
        // Add to DOM
        document.body.appendChild(container);

        // Use dynamic import with correct path
        import('../../features/reviews/components/ReviewImageCapture').then(({ default: ReviewImageCapture }) => {
          const root = createRoot(container);
          
          root.render(
            React.createElement(ReviewImageCapture, {
              review,
              entity,
              style: {
                width: `${options.width || 1200}px`,
                minHeight: `${options.height || 630}px`
              }
            })
          );

          // Wait for React to render
          setTimeout(() => {
            resolve(container.firstChild as HTMLElement || container);
          }, 200);
        }).catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Try to capture an existing review card from the page
   */
  private async tryCapturingExistingReviewCard(reviewId: string): Promise<GeneratedImageData | null> {
    try {
      // Look for review cards by data attributes or other identifiers
      const possibleSelectors = [
        `[data-review-id="${reviewId}"]`,
        `[data-testid="review-card-${reviewId}"]`,
        '.review-card', // Fallback to any review card
        '[class*="review"]' // Even broader fallback
      ];

      let reviewElement: HTMLElement | null = null;

      for (const selector of possibleSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          // Try to find the one that contains review content
          for (const element of elements) {
            if (this.elementContainsReviewContent(element as HTMLElement)) {
              reviewElement = element as HTMLElement;
              break;
            }
          }
          if (reviewElement) break;
        }
      }

      if (reviewElement) {
        // Clone the element to avoid modifying the original
        const clonedElement = this.cloneElementForCapture(reviewElement);
        document.body.appendChild(clonedElement);

        try {
          await this.waitForStylesAndFonts(clonedElement);
          
          const result = await this.generateImageFromElement(clonedElement, {
            width: 1200,
            height: 630,
            quality: 0.95,
            format: 'png',
            backgroundColor: '#ffffff'
          });

          return result;
        } finally {
          if (clonedElement.parentNode) {
            clonedElement.parentNode.removeChild(clonedElement);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to capture existing review card:', error);
    }

    return null;
  }

  /**
   * Check if an element contains review content
   */
  private elementContainsReviewContent(element: HTMLElement): boolean {
    const text = element.textContent?.toLowerCase() || '';
    
    // Look for common review indicators
    const reviewIndicators = [
      'overall score',
      'rating',
      'review',
      'stars',
      'pros',
      'cons',
      'comments',
      'reactions'
    ];

    return reviewIndicators.some(indicator => text.includes(indicator));
  }

  /**
   * Clone an element for capture with proper styling
   */
  private cloneElementForCapture(element: HTMLElement): HTMLElement {
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Position the clone for capture
    Object.assign(clone.style, {
      position: 'fixed',
      top: '-9999px',
      left: '-9999px',
      width: '1200px',
      maxWidth: '1200px',
      height: 'auto',
      backgroundColor: '#ffffff',
      padding: '32px',
      boxSizing: 'border-box',
      borderRadius: '16px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      zIndex: '-1',
      overflow: 'visible'
    });

    // Copy computed styles from original element
    this.copyComputedStyles(element, clone);

    return clone;
  }

  /**
   * Copy computed styles from source to target element
   */
  private copyComputedStyles(source: HTMLElement, target: HTMLElement): void {
    const sourceStyles = window.getComputedStyle(source);
    const targetStyle = target.style;

    // Copy important style properties
    const importantProps = [
      'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color',
      'backgroundColor', 'padding', 'margin', 'border', 'borderRadius',
      'textAlign', 'display', 'flexDirection', 'alignItems', 'justifyContent',
      'gap', 'boxShadow'
    ];

    importantProps.forEach(prop => {
      try {
        const value = sourceStyles.getPropertyValue(prop.replace(/([A-Z])/g, '-$1').toLowerCase());
        if (value) {
          targetStyle.setProperty(prop.replace(/([A-Z])/g, '-$1').toLowerCase(), value);
        }
      } catch (e) {
        // Ignore errors for unsupported properties
      }
    });

    // Recursively copy styles for child elements
    const sourceChildren = source.children;
    const targetChildren = target.children;

    for (let i = 0; i < Math.min(sourceChildren.length, targetChildren.length); i++) {
      this.copyComputedStyles(sourceChildren[i] as HTMLElement, targetChildren[i] as HTMLElement);
    }
  }

  /**
   * Wait for styles and fonts to load
   */
  private async waitForStylesAndFonts(element: HTMLElement): Promise<void> {
    // Wait for fonts to load
    if (document.fonts) {
      await document.fonts.ready;
    }

    // Wait for any images in the element to load
    const images = element.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      
      return new Promise((resolve) => {
        img.onload = () => resolve(void 0);
        img.onerror = () => resolve(void 0); // Still resolve on error
        // Timeout after 2 seconds
        setTimeout(() => resolve(void 0), 2000);
      });
    });

    await Promise.all(imagePromises);

    // Small delay to ensure all styles are applied
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Create a styled review container for image generation
   */
  private createReviewContainer(
    review: Review,
    entity?: Entity,
    options: Html2CanvasImageOptions = {}
  ): HTMLElement {
    const container = document.createElement('div');
    
    // Apply container styles
    Object.assign(container.style, {
      position: 'fixed',
      top: '-9999px',
      left: '-9999px',
      width: `${options.width || this.defaultOptions.width}px`,
      height: `${options.height || this.defaultOptions.height}px`,
      backgroundColor: options.backgroundColor || this.defaultOptions.backgroundColor,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '32px',
      boxSizing: 'border-box',
      overflow: 'hidden'
    });

    // Create the review content HTML
    container.innerHTML = this.createReviewHTML(review, entity);

    return container;
  }

  /**
   * Create HTML content for the review
   */
  private createReviewHTML(review: Review, entity?: Entity): string {
    const entitySection = entity ? this.createEntityHTML(entity) : '';
    const reviewerName = review.reviewerName || 'Anonymous User';
    const reviewDate = review.createdAt 
      ? new Date(review.createdAt).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        })
      : 'Recently';

    return `
      <div style="
        height: 100%;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      ">
        <!-- Header -->
        <div style="
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          padding: 24px 32px;
          position: relative;
        ">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="
              width: 56px;
              height: 56px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              font-weight: bold;
              border: 2px solid rgba(255, 255, 255, 0.3);
            ">
              ${reviewerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div style="flex: 1;">
              <div style="font-size: 20px; font-weight: 700; margin-bottom: 4px;">
                ${reviewerName}
              </div>
              <div style="font-size: 14px; opacity: 0.9;">
                ${reviewDate} • Review
              </div>
            </div>
            <div style="
              background: rgba(255, 255, 255, 0.15);
              padding: 8px 16px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
            ">
              ⭐ ${review.overallRating?.toFixed(1) || 'N/A'}/5
            </div>
          </div>
        </div>

        ${entitySection}

        <!-- Review Content -->
        <div style="flex: 1; padding: 32px; background: white;">
          ${review.title ? `
            <div style="
              font-size: 24px;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 24px;
              line-height: 1.3;
            ">
              ${this.escapeHtml(review.title)}
            </div>
          ` : ''}
          
          <div style="
            background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
            border: 2px solid #3b82f6;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 16px;
          ">
            <div style="
              font-size: 18px;
              font-weight: 600;
              color: #1d4ed8;
            ">
              Overall Rating:
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="display: flex; gap: 2px;">
                ${this.createStarRating(review.overallRating || 0)}
              </div>
              <span style="
                font-size: 20px;
                font-weight: 700;
                color: #1f2937;
              ">
                ${review.overallRating?.toFixed(1) || 'N/A'}
              </span>
            </div>
          </div>

          <div style="
            font-size: 16px;
            line-height: 1.6;
            color: #374151;
            margin-bottom: 24px;
          ">
            ${this.escapeHtml(review.content || 'No content available')}
          </div>

          ${this.createProsConsSection(review)}
        </div>

        <!-- Footer -->
        <div style="
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 20px 32px;
          border-top: 1px solid #e2e8f0;
        ">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <div style="
              font-size: 20px;
              font-weight: 700;
              color: #3b82f6;
            ">
              reviewinn.com
            </div>
            <div style="
              font-size: 14px;
              color: #64748b;
            ">
              Generated on ${new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create entity section HTML
   */
  private createEntityHTML(entity: Entity): string {
    return `
      <div style="
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        padding: 24px 32px;
        border-bottom: 1px solid #e2e8f0;
      ">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          ">
            ${entity.name.charAt(0).toUpperCase()}
          </div>
          <div style="flex: 1;">
            <div style="
              font-size: 22px;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 4px;
            ">
              ${this.escapeHtml(entity.name)}
            </div>
            <div style="
              font-size: 14px;
              color: #64748b;
            ">
              ${entity.category || 'Business'} • Review Subject
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create star rating HTML
   */
  private createStarRating(rating: number): string {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= rating;
      stars.push(`
        <span style="
          color: ${isFilled ? '#fbbf24' : '#d1d5db'};
          font-size: 20px;
        ">★</span>
      `);
    }
    return stars.join('');
  }

  /**
   * Create pros and cons section
   */
  private createProsConsSection(review: Review): string {
    if (!review.pros?.length && !review.cons?.length) {
      return '';
    }

    const prosSection = review.pros?.length ? `
      <div style="
        background: linear-gradient(135deg, #f0fdf4 0%, #f7fee7 100%);
        border: 1px solid #22c55e;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      ">
        <div style="
          font-size: 16px;
          font-weight: 600;
          color: #15803d;
          margin-bottom: 12px;
        ">
          👍 Pros
        </div>
        <ul style="margin: 0; padding-left: 20px; color: #166534;">
          ${review.pros.map(pro => `<li style="margin-bottom: 4px;">${this.escapeHtml(pro)}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    const consSection = review.cons?.length ? `
      <div style="
        background: linear-gradient(135deg, #fef2f2 0%, #fef7f7 100%);
        border: 1px solid #ef4444;
        border-radius: 8px;
        padding: 16px;
      ">
        <div style="
          font-size: 16px;
          font-weight: 600;
          color: #dc2626;
          margin-bottom: 12px;
        ">
          👎 Cons
        </div>
        <ul style="margin: 0; padding-left: 20px; color: #991b1b;">
          ${review.cons.map(con => `<li style="margin-bottom: 4px;">${this.escapeHtml(con)}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    if (!prosSection && !consSection) return '';

    return `
      <div style="margin-top: 24px;">
        ${prosSection}
        ${consSection}
      </div>
    `;
  }

  /**
   * Prepare element for capture by applying necessary styles
   */
  private async prepareElementForCapture(
    element: HTMLElement
  ): Promise<HTMLElement> {
    // Store original styles
    const originalStyles = {
      transform: element.style.transform,
      opacity: element.style.opacity,
      visibility: element.style.visibility
    };

    // Apply optimizations for better capture
    Object.assign(element.style, {
      transform: 'translateZ(0)', // Force hardware acceleration
      opacity: '1',
      visibility: 'visible'
    });

    // Store original styles for cleanup
    (element as any)._originalStyles = originalStyles;

    return element;
  }

  /**
   * Clean up after capture
   */
  private cleanupAfterCapture(element: HTMLElement): void {
    const originalStyles = (element as any)._originalStyles;
    if (originalStyles) {
      Object.assign(element.style, originalStyles);
      delete (element as any)._originalStyles;
    }
  }

  /**
   * Generate filename for the image
   */
  private generateFilename(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `reviewinn-review-${timestamp}.png`;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Download the generated image
   */
  async downloadImage(imageData: GeneratedImageData): Promise<void> {
    if (!imageData.blob) {
      throw new Error('No blob data available for download');
    }

    const url = URL.createObjectURL(imageData.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = imageData.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Share image using native sharing if available
   */
  async shareImage(imageData: GeneratedImageData, title: string, text: string): Promise<boolean> {
    if (!navigator.share || !imageData.blob) {
      return false;
    }

    try {
      const files = [new File([imageData.blob], imageData.filename, { type: 'image/png' })];
      await navigator.share({
        title,
        text,
        files
      });
      return true;
    } catch (error) {
      console.error('Failed to share image:', error);
      return false;
    }
  }

  /**
   * Capture an existing DOM element (e.g., a review card on the page)
   */
  async captureExistingElement(
    elementSelector: string,
    options: Html2CanvasImageOptions = {}
  ): Promise<GeneratedImageData> {
    const element = document.querySelector(elementSelector) as HTMLElement;
    
    if (!element) {
      throw new Error(`Element not found: ${elementSelector}`);
    }

    return this.generateImageFromElement(element, options);
  }
}

// Export singleton instance
export const html2canvasImageService = new Html2CanvasImageService();
export default html2canvasImageService;
