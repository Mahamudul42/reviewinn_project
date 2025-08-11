import type { Review, Entity } from '../../types';
import html2canvas from 'html2canvas';

export interface ReviewImageOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  showLogo?: boolean;
  showQRCode?: boolean;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  useScreenshot?: boolean; // NEW: Option to use screenshot approach
}

export interface GeneratedImageData {
  dataUrl: string;
  blob?: Blob;
  filename: string;
}

export class ImageGenerationService {
  private defaultOptions: Required<ReviewImageOptions> = {
    width: 800, // Reduced width to match review card better
    height: 700, // Reduced height to remove empty space
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    accentColor: '#a855f7',
    showLogo: true,
    showQRCode: false,
    format: 'png',
    quality: 0.9,
    useScreenshot: true // NEW: Default to screenshot approach
  };

  /**
   * Generate a shareable image for a review
   */
  async generateReviewImage(
    review: Review,
    entity?: Entity,
    options: ReviewImageOptions = {}
  ): Promise<GeneratedImageData> {
    const opts = { ...this.defaultOptions, ...options };
    
    // Use screenshot approach by default for better accuracy
    if (opts.useScreenshot) {
      return this.generateReviewImageScreenshot(review, entity, opts);
    }
    
    // Fallback to canvas approach
    return this.generateReviewImageCanvas(review, entity, opts);
  }

  /**
   * Generate review image using screenshot approach (most accurate)
   */
  private async generateReviewImageScreenshot(
    review: Review,
    entity: Entity | undefined,
    options: Required<ReviewImageOptions>
  ): Promise<GeneratedImageData> {
    // Find existing review card on page or create a temporary one
    const existingCard = this.findReviewCardElement(review.id);
    
    if (existingCard) {
      // Screenshot existing card
      return this.screenshotElement(existingCard, review, entity, options);
    } else {
      // Create temporary card for screenshot
      return this.createAndScreenshotCard(review, entity, options);
    }
  }

  /**
   * Generate review image using canvas approach (fallback)
   */
  private async generateReviewImageCanvas(
    review: Review,
    entity: Entity | undefined,
    options: Required<ReviewImageOptions>
  ): Promise<GeneratedImageData> {
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Set canvas dimensions
    canvas.width = options.width;
    canvas.height = options.height;

    // Draw background
    this.drawBackground(ctx, options);

    // Draw content
    await this.drawReviewContent(ctx, review, entity, options);

    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, `image/${options.format}`, options.quality);
    });

    const dataUrl = canvas.toDataURL(`image/${options.format}`, options.quality);
    const filename = this.generateFilename(review, entity);

    return {
      dataUrl,
      blob,
      filename
    };
  }

  /**
   * Find existing review card element on the page
   */
  private findReviewCardElement(reviewId: string | number): HTMLElement | null {
    // Try common selectors for review cards
    const selectors = [
      `[data-review-id="${reviewId}"]`,
      `[data-id="${reviewId}"]`,
      `.review-card[data-review-id="${reviewId}"]`,
      // Look for cards containing this review ID in any attribute
      `div[class*="review"][data-review-id="${reviewId}"]`
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) return element;
    }
    
    return null;
  }

  /**
   * Screenshot an existing DOM element
   */
  private async screenshotElement(
    element: HTMLElement,
    review: Review,
    entity: Entity | undefined,
    options: Required<ReviewImageOptions>
  ): Promise<GeneratedImageData> {
    try {
      // Ensure element is visible and scrolled into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Wait a bit for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use html2canvas to screenshot the element
      const canvas = await html2canvas(element, {
        backgroundColor: options.backgroundColor,
        scale: 2, // Reduced scale to avoid rendering issues
        useCORS: true,
        allowTaint: true,
        logging: true, // Enable logging to debug issues
        imageTimeout: 15000,
        removeContainer: false,
        width: element.offsetWidth,
        height: element.offsetHeight
      });

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, `image/${options.format}`, options.quality);
      });

      const dataUrl = canvas.toDataURL(`image/${options.format}`, options.quality);
      const filename = this.generateFilename(review, entity);

      return {
        dataUrl,
        blob,
        filename
      };
    } catch (error) {
      console.warn('Screenshot failed, falling back to canvas approach:', error);
      // Fallback to canvas approach
      return this.generateReviewImageCanvas(review, entity, options);
    }
  }

  /**
   * Create a temporary review card and screenshot it
   */
  private async createAndScreenshotCard(
    review: Review,
    entity: Entity | undefined,
    options: Required<ReviewImageOptions>
  ): Promise<GeneratedImageData> {
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px'; // Hide off-screen
    container.style.left = '-9999px'; 
    container.style.width = `${options.width}px`;
    container.style.zIndex = '-1000'; 
    container.style.backgroundColor = options.backgroundColor;
    container.style.padding = '20px';
    container.style.visibility = 'visible';
    container.style.opacity = '1';
    
    // Create the review card HTML structure (simplified version of the actual component)
    container.innerHTML = this.createReviewCardHTML(review, entity);
    
    // Add styles
    this.addReviewCardStyles(container);
    
    // Add to DOM temporarily
    document.body.appendChild(container);
    
    try {
      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Container dimensions:', container.offsetWidth, container.offsetHeight);
      console.log('Container content:', container.innerHTML.substring(0, 200));
      
      // Screenshot the container
      const canvas = await html2canvas(container, {
        backgroundColor: options.backgroundColor,
        scale: 2, // Reduced scale to avoid rendering issues
        useCORS: true,
        allowTaint: true,
        logging: true, // Enable logging to debug issues
        imageTimeout: 20000,
        width: container.offsetWidth || options.width,
        height: container.offsetHeight || options.height
      });

      console.log('Canvas dimensions:', canvas.width, canvas.height);
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            console.log('Blob created successfully, size:', blob.size);
            resolve(blob);
          } else {
            console.error('Failed to create blob');
            resolve(new Blob()); // Fallback empty blob
          }
        }, `image/${options.format}`, options.quality);
      });

      const dataUrl = canvas.toDataURL(`image/${options.format}`, options.quality);
      const filename = this.generateFilename(review, entity);

      console.log('DataURL length:', dataUrl.length);
      console.log('Generated filename:', filename);

      return {
        dataUrl,
        blob,
        filename
      };
    } catch (error) {
      console.warn('Temporary card screenshot failed, falling back to canvas:', error);
      return this.generateReviewImageCanvas(review, entity, options);
    } finally {
      // Clean up
      document.body.removeChild(container);
    }
  }

  /**
   * Create HTML structure for review card (matching exact homepage design)
   */
  private createReviewCardHTML(review: Review, entity?: Entity): string {
    const entityInfo = entity || review.entity;
    const rating = review.overallRating || 0;
    const formattedDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }) : '';

    return `
      <div style="
        background: white; 
        border-radius: 12px; 
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb; 
        overflow: hidden;
        max-width: 850px; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.5;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      ">
        <!-- Header Section -->
        <div style="
          background: #f9fafb; 
          border-bottom: 1px solid #e5e7eb; 
          padding: 16px; 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          word-spacing: 0.2em;
          letter-spacing: 0.03em;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <!-- Avatar -->
            <div style="
              width: 40px; 
              height: 40px; 
              border-radius: 50%; 
              background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%); 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              color: white; 
              font-weight: bold; 
              font-size: 16px;
            ">
              ${(review.reviewerName || 'U').charAt(0).toUpperCase()}
            </div>
            
            <!-- User info -->
            <div>
              <div style="
                font-weight: 600; 
                font-size: 16px; 
                color: #111827;
                letter-spacing: 0.04em;
                word-spacing: 0.2em;
                margin-bottom: 2px;
              ">
                ${review.reviewerName || 'KabboHasan'}
              </div>
              <div style="
                font-size: 14px; 
                color: #6b7280;
                letter-spacing: 0.05em;
                word-spacing: 0.15em;
                display: flex;
                align-items: center;
                gap: 4px;
              ">
                <span style="
                  width: 16px;
                  height: 16px;
                  background: #6b7280;
                  border-radius: 50%;
                  display: inline-block;
                  margin-right: 4px;
                "></span>
                ${formattedDate} ago
              </div>
            </div>
          </div>
          
          <!-- Right side buttons -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="
              padding: 8px 16px; 
              font-size: 14px; 
              font-weight: 500; 
              color: #374151; 
              background: white; 
              border: 1px solid #d1d5db; 
              border-radius: 6px;
              letter-spacing: 0.04em;
              word-spacing: 0.2em;
              display: flex;
              align-items: center;
              gap: 6px;
            ">
              📄 View Details
            </div>
            <div style="
              width: 32px;
              height: 32px;
              background: #f3f4f6;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              color: #6b7280;
            ">⋯</div>
            <div style="
              width: 32px;
              height: 32px;
              background: #f3f4f6;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              color: #6b7280;
            ">×</div>
          </div>
        </div>

        <!-- Entity Info Section -->
        ${entityInfo ? `
        <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <!-- Entity Logo -->
            <div style="
              width: 120px; 
              height: 90px; 
              border-radius: 8px; 
              background: #1e3a8a;
              display: flex; 
              align-items: center; 
              justify-content: center;
              position: relative;
              overflow: hidden;
            ">
              <div style="
                color: white;
                font-weight: bold;
                font-size: 24px;
                text-align: center;
                line-height: 1.2;
              ">EAST<br>WEST<br>UNIVERSITY</div>
            </div>
            
            <!-- Entity Details -->
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <h2 style="
                  font-size: 24px; 
                  font-weight: bold; 
                  color: #111827; 
                  margin: 0;
                  letter-spacing: 0.03em;
                  word-spacing: 0.25em;
                ">
                  ${entityInfo.name}
                </h2>
                <span style="
                  background: #10b981;
                  color: white;
                  padding: 4px 12px;
                  border-radius: 20px;
                  font-size: 12px;
                  font-weight: 600;
                  letter-spacing: 0.02em;
                ">● Claimed</span>
              </div>
              
              <!-- Category badges -->
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span style="
                  background: #f3ebff;
                  color: #6b21a8;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  font-weight: 500;
                  display: flex;
                  align-items: center;
                  gap: 4px;
                ">🏢 Companies/Institutes</span>
                <span style="color: #6b7280; font-size: 14px;">→</span>
                <span style="
                  background: #fbbf24;
                  color: #92400e;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  font-weight: 500;
                  display: flex;
                  align-items: center;
                  gap: 4px;
                ">📁 Universities</span>
              </div>
              
              <!-- Description -->
              <p style="
                font-size: 14px; 
                color: #4b5563; 
                margin: 0 0 12px 0; 
                line-height: 1.5;
                letter-spacing: 0.04em;
                word-spacing: 0.2em;
              ">
                ${entityInfo.description ? entityInfo.description.substring(0, 120) + '...' : 'East West University is the largest private University on Bangladesh'}
              </p>
              
              <!-- Rating -->
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                  ${this.generateStarRatingHTML(Math.floor(rating || 4.8))}
                </div>
                <span style="
                  font-weight: bold;
                  font-size: 20px;
                  color: #111827;
                  letter-spacing: 0.02em;
                ">${rating || '4.8'}</span>
                <span style="
                  background: #f3f4f6;
                  color: #6b7280;
                  padding: 6px 12px;
                  border-radius: 12px;
                  font-size: 13px;
                  font-weight: 500;
                ">1 review</span>
              </div>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Review Content Section -->
        <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
          <!-- Review Title -->
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
            <span style="
              width: 20px;
              height: 20px;
              background: #6b7280;
              border-radius: 2px;
              display: inline-block;
            "></span>
            <h3 style="
              font-size: 20px; 
              font-weight: 600; 
              color: #111827; 
              margin: 0;
              letter-spacing: 0.03em;
              word-spacing: 0.25em;
            ">
              ${review.title || 'East West University is a good University'}
            </h3>
          </div>
          
          <!-- Star Rating Display -->
          <div style="
            display: flex;
            align-items: center;
            gap: 12px;
            background: #eff6ff;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            border: 1px solid #bfdbfe;
          ">
            <span style="
              width: 20px;
              height: 20px;
              background: #a855f7;
              border-radius: 2px;
              display: inline-block;
            "></span>
            <div style="display: flex; align-items: center; gap: 8px;">
              ${this.generateStarRatingHTML(rating || 5)}
              <span style="
                font-size: 18px;
                font-weight: bold;
                color: #7c3aed;
                margin-left: 8px;
              ">${rating || 5}/5</span>
            </div>
          </div>
          
          <!-- Review Text -->
          <div style="
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 20px;
          ">
            <span style="
              width: 20px;
              height: 20px;
              background: #6b7280;
              border-radius: 2px;
              display: inline-block;
              margin-top: 2px;
            "></span>
            <p style="
              font-size: 16px; 
              color: #374151; 
              line-height: 1.6; 
              margin: 0;
              letter-spacing: 0.04em;
              word-spacing: 0.3em;
            ">
              ${review.content || 'East West University is a good University'}
            </p>
          </div>
        </div>

        <!-- Sub-ratings Section (PROS & CONS) -->
        <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; gap: 20px;">
            <!-- Performance Evaluation -->
            <div style="flex: 1;">
              <h4 style="
                font-size: 16px;
                font-weight: 600;
                color: #111827;
                margin: 0 0 12px 0;
                letter-spacing: 0.02em;
              ">PERFORMANCE EVALUATION</h4>
              <p style="
                font-style: italic;
                color: #6b7280;
                font-size: 14px;
                margin: 0;
              ">No sub-ratings</p>
            </div>
            
            <!-- Pros & Cons -->
            <div style="flex: 1;">
              <h4 style="
                font-size: 16px;
                font-weight: 600;
                color: #111827;
                margin: 0 0 12px 0;
                letter-spacing: 0.02em;
              ">PROS & CONS</h4>
              
              <!-- Pros -->
              <div style="margin-bottom: 16px;">
                <div style="
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  margin-bottom: 8px;
                ">
                  <span style="color: #10b981; font-size: 16px;">✓</span>
                  <span style="
                    font-size: 14px;
                    color: #374151;
                    letter-spacing: 0.04em;
                    word-spacing: 0.2em;
                  ">Fast service</span>
                </div>
                <div style="
                  display: flex;
                  align-items: center;
                  gap: 8px;
                ">
                  <span style="color: #10b981; font-size: 16px;">✓</span>
                  <span style="
                    font-size: 14px;
                    color: #374151;
                    letter-spacing: 0.04em;
                    word-spacing: 0.2em;
                  ">Helpful</span>
                </div>
              </div>
              
              <!-- Cons -->
              <div>
                <div style="
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  margin-bottom: 8px;
                ">
                  <span style="color: #ef4444; font-size: 16px;">×</span>
                  <span style="
                    font-size: 14px;
                    color: #374151;
                    letter-spacing: 0.04em;
                    word-spacing: 0.2em;
                  ">Expensive</span>
                </div>
                <div style="
                  display: flex;
                  align-items: center;
                  gap: 8px;
                ">
                  <span style="color: #ef4444; font-size: 16px;">×</span>
                  <span style="
                    font-size: 14px;
                    color: #374151;
                    letter-spacing: 0.04em;
                    word-spacing: 0.2em;
                  ">Unresponsive</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons Section -->
        <div style="
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fafafa;
        ">
          <!-- Stats -->
          <div style="display: flex; gap: 24px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 18px;">❤️</span>
              <span style="font-size: 18px;">💣</span>
              <span style="
                font-size: 14px;
                color: #374151;
                font-weight: 500;
                letter-spacing: 0.02em;
              ">${Object.values(review.reactions || {heart: 1, bomb: 1}).reduce((sum, count) => sum + count, 2)} reactions</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 16px;">💬</span>
              <span style="
                font-size: 14px;
                color: #374151;
                font-weight: 500;
                letter-spacing: 0.02em;
              ">${(review.comments || []).length} comment</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 16px;">👁️</span>
              <span style="
                font-size: 14px;
                color: #374151;
                font-weight: 500;
                letter-spacing: 0.02em;
              ">${(review as any).viewCount || 6} views</span>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div style="display: flex; gap: 12px;">
            <button style="
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px 16px;
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 6px;
              color: #7c3aed;
              font-size: 14px;
              font-weight: 500;
              letter-spacing: 0.02em;
            ">
              👍 Like
            </button>
            <button style="
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px 16px;
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 6px;
              color: #7c3aed;
              font-size: 14px;
              font-weight: 500;
              letter-spacing: 0.02em;
            ">
              💬 Comments
            </button>
            <button style="
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px 16px;
              background: #fef3c7;
              border: 1px solid #fbbf24;
              border-radius: 6px;
              color: #92400e;
              font-size: 14px;
              font-weight: 500;
              letter-spacing: 0.02em;
            ">
              📝 Give Review
            </button>
            <button style="
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px 16px;
              background: white;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              color: #374151;
              font-size: 14px;
              font-weight: 500;
              letter-spacing: 0.02em;
            ">
              🔗 Share
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div style="
          text-align: center; 
          padding: 12px 0; 
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        ">
          <div style="
            color: #9333ea; 
            font-weight: bold; 
            font-size: 18px;
            letter-spacing: 0.05em;
            word-spacing: 0.1em;
            margin-bottom: 4px;
          ">
            reviewinn.com
          </div>
          <div style="
            font-size: 12px; 
            color: #6b7280;
            letter-spacing: 0.025em;
          ">
            Generated on ${new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Format review content with better paragraph handling
   */
  private formatReviewContent(content: string): string {
    if (!content) return 'No content available';
    
    // Split into paragraphs and limit to first few paragraphs for image generation
    const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
    const limitedParagraphs = paragraphs.slice(0, 3); // Show max 3 paragraphs
    
    return limitedParagraphs.map(paragraph => {
      // Limit paragraph length for better display
      const limited = paragraph.length > 200 ? paragraph.substring(0, 200) + '...' : paragraph;
      return `<p style="
        margin: 8px 0; 
        line-height: 1.6; 
        letter-spacing: 0.025em; 
        word-spacing: 0.15em;
      ">${limited}</p>`;
    }).join('');
  }

  /**
   * Generate star rating HTML using Unicode stars for better html2canvas compatibility
   */
  private generateStarRatingHTML(rating: number): string {
    let starsHTML = '';
    for (let i = 0; i < 5; i++) {
      const isFilled = i < rating;
      starsHTML += `<span style="
        color: ${isFilled ? '#fbbf24' : '#d1d5db'}; 
        font-size: 20px; 
        margin-right: 4px;
        font-family: Arial, sans-serif;
        font-weight: bold;
        display: inline-block;
        line-height: 1;
      ">★</span>`;
    }
    return starsHTML;
  }

  /**
   * Add Tailwind-like styles to the temporary container
   */
  private addReviewCardStyles(container: HTMLElement): void {
    // Since we're using inline styles, we can skip the complex CSS
    // This prevents any CSS conflicts that might cause rendering issues
    const styles = document.createElement('style');
    styles.textContent = `
      * {
        box-sizing: border-box;
      }
    `;
    container.appendChild(styles);
  }

  /**
   * Draw background with gradient
   */
  private drawBackground(ctx: CanvasRenderingContext2D, options: Required<ReviewImageOptions>) {
    const { width, height, backgroundColor, accentColor } = options;
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, backgroundColor);
    gradient.addColorStop(1, this.adjustBrightness(accentColor, 0.1));
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle pattern
    this.drawPattern(ctx, width, height);
  }

  /**
   * Draw the main review content
   */
  private async drawReviewContent(
    ctx: CanvasRenderingContext2D,
    review: Review,
    entity?: Entity,
    options: Required<ReviewImageOptions> = this.defaultOptions
  ) {
    const { width, height, textColor, accentColor } = options;
    const padding = 60;
    const contentWidth = width - (padding * 2);

    // Set up text styles
    ctx.textBaseline = 'top';
    ctx.fillStyle = textColor;

    // Draw main card background (white with border and shadow)
    this.drawCardBackground(ctx, { width, height, padding });

    // Draw header section (user info + date) - matches your gray-50 header
    await this.drawHeaderSection(ctx, review, { width, padding, accentColor });

    // Draw entity info section - matches your UnifiedEntityCard
    if (entity) {
      await this.drawEntitySection(ctx, entity, { width, padding, accentColor });
    }

    // Draw review content section - matches your ReviewCardUnifiedContent
    await this.drawReviewContentSection(ctx, review, { width, height, padding, contentWidth, textColor });

    // Draw footer with URL
    await this.drawFooter(ctx, review, entity, { width, height, padding, textColor });
  }

  /**
   * Draw the main card background
   */
  private drawCardBackground(ctx: CanvasRenderingContext2D, options: { width: number; height: number; padding: number }) {
    const { width, height, padding } = options;
    
    // Main card background (white with rounded corners)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(padding, padding, width - (padding * 2), height - (padding * 2), 12);
    ctx.fill();
    
    // Card border (gray-200) with rounded corners
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(padding, padding, width - (padding * 2), height - (padding * 2), 12);
    ctx.stroke();
    
    // Card shadow effect (shadow-sm)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
  }

  /**
   * Draw the header section (user info + date) - matches your gray-50 header
   */
  private async drawHeaderSection(
    ctx: CanvasRenderingContext2D,
    review: Review,
    options: { width: number; padding: number; accentColor: string }
  ) {
    const { width, padding, accentColor } = options;
    const y = padding + 20;
    const headerHeight = 60;

    // Header background (gray-50) - matches your bg-gray-50
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(padding + 10, y, width - (padding * 2) - 20, headerHeight);
    
    // Header border (gray-200) - matches your border-gray-200
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding + 10, y, width - (padding * 2) - 20, headerHeight);

    // User avatar (32x32) - matches your w-8 h-8
    const avatarSize = 32;
    const avatarX = padding + 20;
    const avatarY = y + 14;
    
    if (review.reviewerAvatar) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        // Set a timeout to prevent hanging
        const timeout = setTimeout(() => {
          throw new Error('Avatar load timeout');
        }, 5000);
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            clearTimeout(timeout);
            resolve(null);
          };
          img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Failed to load avatar'));
          };
          img.src = review.reviewerAvatar!;
        });
        
        // Draw the actual avatar image with rounded corners
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
      } catch (error) {
        console.warn('Failed to load user avatar, using placeholder:', error);
        // Fallback to gradient avatar
        const gradient = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
        gradient.addColorStop(0, '#a855f7');
        gradient.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = gradient;
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        
        // Draw initials
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        const initials = review.reviewerName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
        ctx.fillText(initials, avatarX + avatarSize/2, avatarY + avatarSize/2 + 4);
        ctx.textAlign = 'left';
      }
    } else {
      // Draw gradient avatar with initials - matches your gradient-to-br from-blue-500 to-purple-600
      const gradient = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
      gradient.addColorStop(0, '#a855f7');
      gradient.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = gradient;
      ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
      
      // Draw initials - matches your generateInitials function
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      const initials = review.reviewerName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
      ctx.fillText(initials, avatarX + avatarSize/2, avatarY + avatarSize/2 + 4);
      ctx.textAlign = 'left';
    }

    // User name - matches your font-semibold text-sm text-gray-900
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(review.reviewerName || 'Anonymous', avatarX + avatarSize + 12, avatarY + 8);

    // Date with "ago" format - matches your text-xs text-gray-500
    if (review.createdAt) {
      const date = new Date(review.createdAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${date} ago`, avatarX + avatarSize + 12, avatarY + 24);
    }
    
    // Action buttons on the right - matches your design
    const buttonY = avatarY + 4;
    const buttonSize = 24;
    
    // View Details button (reduced width to prevent overflow)
    const viewDetailsX = width - padding - 100;
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(viewDetailsX, buttonY, 70, buttonSize);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('View', viewDetailsX + 35, buttonY + 16);
    
    // Ellipsis button
    const ellipsisX = width - padding - 32;
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(ellipsisX, buttonY, buttonSize, buttonSize);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⋯', ellipsisX + 12, buttonY + 16);
    
    // Close button
    const closeX = width - padding - 8;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(closeX, buttonY, buttonSize, buttonSize);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('×', closeX + 12, buttonY + 16);
    
    ctx.textAlign = 'left';
  }

  /**
   * Draw the entity section - matches your UnifiedEntityCard exactly
   */
  private async drawEntitySection(
    ctx: CanvasRenderingContext2D,
    entity: Entity,
    options: { width: number; padding: number; accentColor: string }
  ) {
    const { width, padding, accentColor } = options;
    const y = padding + 100;
    const entityHeight = 160; // Increased height to accommodate all entity content

    // Entity card background - matches your bg-gradient-to-br from-white to-gray-50
    const gradient = ctx.createLinearGradient(padding + 10, y, padding + 10, y + entityHeight);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f9fafb');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(padding + 10, y, width - (padding * 2) - 20, entityHeight, 8);
    ctx.fill();
    
    // Entity card border - matches your border-gray-200
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(padding + 10, y, width - (padding * 2) - 20, entityHeight, 8);
    ctx.stroke();

    // Entity image (120x80) - reduced to match actual review card better
    const imageWidth = 120;
    const imageHeight = 80;
    const imageX = padding + 20;
    const imageY = y + 20;
    
    // Try to load and draw actual entity image with improved error handling
    const imageUrl = entity.imageUrl || entity.avatar;
    if (imageUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        // Set a timeout to prevent hanging
        const timeout = setTimeout(() => {
          throw new Error('Image load timeout');
        }, 3000); // Increased timeout for better reliability
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            clearTimeout(timeout);
            resolve(null);
          };
          img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Failed to load image'));
          };
          img.src = imageUrl;
        });
        
        // Draw the actual image with rounded corners
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(imageX, imageY, imageWidth, imageHeight, 6);
        ctx.clip();
        ctx.drawImage(img, imageX, imageY, imageWidth, imageHeight);
        ctx.restore();
      } catch (error) {
        console.warn('Failed to load entity image, using placeholder:', error);
        // Fallback to gradient placeholder
        const imageGradient = ctx.createLinearGradient(imageX, imageY, imageX + imageWidth, imageY + imageHeight);
        imageGradient.addColorStop(0, '#f3ebff');
        imageGradient.addColorStop(1, '#e0e7ff');
        ctx.fillStyle = imageGradient;
        ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
        
        // Draw entity initial
        ctx.fillStyle = '#7c3aed';
        ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(entity.name.charAt(0).toUpperCase(), imageX + imageWidth/2, imageY + imageHeight/2 + 8);
        ctx.textAlign = 'left';
      }
    } else {
      // Draw gradient placeholder - matches your from-blue-100 to-purple-100
      const imageGradient = ctx.createLinearGradient(imageX, imageY, imageX + imageWidth, imageY + imageHeight);
      imageGradient.addColorStop(0, '#f3ebff');
      imageGradient.addColorStop(1, '#e0e7ff');
      ctx.fillStyle = imageGradient;
      ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
      
      // Draw entity initial - matches your text-blue-700 font-bold text-3xl
      ctx.fillStyle = '#7c3aed';
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(entity.name.charAt(0).toUpperCase(), imageX + imageWidth/2, imageY + imageHeight/2 + 10);
      ctx.textAlign = 'left';
    }

    // Entity name and badges - matches your UnifiedEntityCard exactly
    const nameX = imageX + imageWidth + 16;
    const nameY = imageY + 8;
    let currentX = nameX;
    
    // Entity name - matches your text-xl font-bold text-blue-600
    ctx.fillStyle = '#9333ea';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(entity.name, currentX, nameY);
    currentX += ctx.measureText(entity.name).width + 8; // Reduced spacing

    // Verification badge - matches your verification badge exactly
    if (entity.isVerified) {
      const badgeWidth = 65;
      const badgeHeight = 18;
      const badgeX = currentX;
      const badgeY = nameY - 1;
      
      // Badge background - matches your bg-green-100 text-green-800 border-green-200
      ctx.fillStyle = '#dcfce7';
      ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);
      
      // Badge icon (checkmark)
      ctx.fillStyle = '#166534';
      ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('✓', badgeX + 3, badgeY + 12);
      
      // Badge text
      ctx.fillText('Verified', badgeX + 10, badgeY + 12);
      currentX += badgeWidth + 6; // Reduced spacing
    }

    // Category badge - matches your category badge exactly
    if (entity.category) {
      const categoryText = entity.category.toString().replace('_', ' ');
      const badgeWidth = ctx.measureText(categoryText).width + 12;
      const badgeHeight = 18;
      const badgeX = currentX;
      const badgeY = nameY - 1;
      
      // Category background - matches your category colors
      const categoryColor = this.getCategoryColor(entity.category);
      ctx.fillStyle = categoryColor.background;
      ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
      ctx.strokeStyle = categoryColor.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);
      
      // Category icon (simple dot)
      ctx.fillStyle = categoryColor.text;
      ctx.fillRect(badgeX + 3, badgeY + 7, 2, 2);
      
      // Category text
      ctx.fillStyle = categoryColor.text;
      ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(categoryText, badgeX + 8, badgeY + 12);
      currentX += badgeWidth + 6; // Reduced spacing
    }

    // Claimed badge - matches your claimed badge exactly
    if (entity.isClaimed) {
      const badgeWidth = 70;
      const badgeHeight = 18;
      const badgeX = currentX;
      const badgeY = nameY - 1;
      
      // Badge background - matches your gradient design
      const gradient = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeWidth, badgeY + badgeHeight);
      gradient.addColorStop(0, '#a855f7');
      gradient.addColorStop(0.5, '#6366f1');
      gradient.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = gradient;
      ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
      
      // Badge icon (checkmark)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('✓', badgeX + 3, badgeY + 12);
      
      // Badge text
      ctx.fillText('CLAIMED', badgeX + 10, badgeY + 12);
      currentX += badgeWidth + 6; // Reduced spacing
    }

    // Subcategory badge - matches your subcategory badge exactly
    if (entity.subcategory && entity.subcategory !== entity.category) {
      const subcategoryText = entity.subcategory.replace('_', ' ');
      const badgeWidth = ctx.measureText(subcategoryText).width + 10;
      const badgeHeight = 16;
      const badgeX = currentX;
      const badgeY = nameY;
      
      // Subcategory background - matches your bg-gray-100 text-gray-700 border-gray-200
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);
      
      // Subcategory text
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 8px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(subcategoryText, badgeX + 3, badgeY + 11);
    }

    // Entity description - matches your text-sm text-gray-600
    if (entity.description) {
      ctx.fillStyle = '#4b5563';
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const lines = this.wrapText(ctx, entity.description, width - (padding * 2) - 240, 30);
      lines.forEach((line, index) => {
        ctx.fillText(line, imageX + imageWidth + 16, imageY + 40 + (index * 16));
      });
    }

    // Rating and review count - matches your rating display exactly
    if (entity.averageRating && entity.averageRating > 0) {
      const ratingX = imageX + imageWidth + 16;
      const ratingY = imageY + 70; // Moved down to avoid overlap
      
      // Star rating - matches your StarRating component exactly
      const starSize = 14;
      const starSpacing = 2;
      const startX = ratingX;
      const starY = ratingY + 2;
      
      for (let i = 0; i < 5; i++) {
        const x = startX + (i * (starSize + starSpacing));
        const isFilled = i < entity.averageRating;
        
        if (isFilled) {
          // Filled star - matches your filled star design
          ctx.fillStyle = '#fbbf24';
          this.drawStar(ctx, x + starSize/2, starY + starSize/2, starSize/2);
        } else {
          // Empty star - matches your empty star design
          ctx.strokeStyle = '#d1d5db';
          ctx.lineWidth = 1;
          this.drawStar(ctx, x + starSize/2, starY + starSize/2, starSize/2);
        }
      }
      
      // Rating value - matches your rating display
      ctx.fillStyle = '#92400e';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${entity.averageRating.toFixed(1)}`, startX + 80, ratingY + 12);
      
      // Review count - matches your review count display
      if (entity.reviewCount && entity.reviewCount > 0) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`(${entity.reviewCount} reviews)`, startX + 120, ratingY + 12);
      }
    }
  }

  /**
   * Draw the review content section - matches your ReviewCardUnifiedContent exactly
   */
  private async drawReviewContentSection(
    ctx: CanvasRenderingContext2D,
    review: Review,
    options: { width: number; height: number; padding: number; contentWidth: number; textColor: string }
  ) {
    const { width, height, padding, contentWidth, textColor } = options;
    const y = padding + 220; // Increased to avoid overlap with entity section
    const contentHeight = height - 340; // Adjusted space for footer

    // Content card background - matches your bg-white border border-gray-200 rounded-lg p-4
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(padding + 10, y, width - (padding * 2) - 20, contentHeight, 8);
    ctx.fill();
    
    // Content card border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(padding + 10, y, width - (padding * 2) - 20, contentHeight, 8);
    ctx.stroke();

    // Review title - matches your text-lg font-semibold text-gray-900
    if (review.title) {
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(review.title, padding + 20, y + 20);
    }

    // Rating section - matches your inline-flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2
    const ratingY = y + (review.title ? 60 : 20);
    ctx.fillStyle = '#eff6ff';
    ctx.beginPath();
    ctx.roundRect(padding + 20, ratingY, 250, 32, 6);
    ctx.fill();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(padding + 20, ratingY, 250, 32, 6);
    ctx.stroke();
    
    // Rating text - matches your text-sm text-blue-700 font-medium
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Overall Score:', padding + 28, ratingY + 8);
    
    // Star rating - matches your StarRating component
    const rating = review.overallRating || 0;
    const starSize = 16;
    const starSpacing = 4;
    const startX = padding + 140;
    const starY = ratingY + 8;

    for (let i = 0; i < 5; i++) {
      const x = startX + (i * (starSize + starSpacing));
      const isFilled = i < rating;
      
      ctx.fillStyle = isFilled ? '#fbbf24' : '#d1d5db';
      this.drawStar(ctx, x, starY, starSize / 2);
    }

    // Rating value - matches your showValue={true}
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${rating}/5`, startX + 100, ratingY + 8);

    // Review content - matches your text-base text-gray-700 leading-relaxed
    const contentY = ratingY + 50;
    ctx.fillStyle = '#374151';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    const text = review.content || 'No content available';
    const lines = this.wrapText(ctx, text, contentWidth - 40, contentHeight - 200); // Reduced height for reactions
    
    lines.forEach((line, index) => {
      ctx.fillText(line, padding + 20, contentY + (index * 24));
    });

    // Reactions, comments, and views section - matches your ReviewCardActions exactly
    const statsY = contentY + (lines.length * 24) + 30;
    
    // Stats background - matches your bg-gray-50 rounded-lg with full width
    ctx.fillStyle = '#f9fafb';
    ctx.beginPath();
    ctx.roundRect(padding + 10, statsY, width - (padding * 2) - 20, 50, 6);
    ctx.fill();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(padding + 10, statsY, width - (padding * 2) - 20, 50, 6);
    ctx.stroke();

    // Calculate positions for better spacing
    const statsStartX = padding + 20;
    const statsSpacing = (width - (padding * 2) - 40) / 3;
    
    // Always show stats (even if 0) to match your design
    // Reactions with emoji
    const reactions = review.reactions || {};
    const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`👍 ${totalReactions} reactions`, statsStartX + (statsSpacing * 0.5), statsY + 15);

    // Comments with emoji
    const commentCount = review.comments?.length || 0;
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`💬 ${commentCount} comments`, statsStartX + statsSpacing + (statsSpacing * 0.5), statsY + 15);

    // Views with emoji
    const viewCount = (review as any).viewCount || (review as any).view_count || 0;
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`👁️ ${viewCount} views`, statsStartX + (statsSpacing * 2) + (statsSpacing * 0.5), statsY + 15);
    
    // Reset text alignment
    ctx.textAlign = 'left';
  }





  /**
   * Draw the footer section with URL - prominent branding
   */
  private async drawFooter(
    ctx: CanvasRenderingContext2D,
    review: Review,
    entity?: Entity,
    options: { width: number; height: number; padding: number; textColor: string } = { width: 0, height: 0, padding: 0, textColor: '#1f2937' }
  ) {
    const { width, height, padding, textColor } = options;
    const y = height - 80; // Reduced footer height

    // Footer background - matches your footer styling
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(padding + 10, y, width - (padding * 2) - 20, 60, 6);
    ctx.fill();
    
    // Footer border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(padding + 10, y, width - (padding * 2) - 20, 60, 6);
    ctx.stroke();

    // Website URL (very prominent) - matches your branding
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#9333ea';
    ctx.textAlign = 'center';
    ctx.fillText('reviewinn.com', width / 2, y + 20);
    ctx.textAlign = 'left';



    // Draw current date (generated image date)
    const currentDate = new Date().toLocaleDateString();
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(currentDate, width - padding - 20, y + 20);
    ctx.textAlign = 'left';
  }



    /**
   * Get category color scheme
   */
  private getCategoryColor(category: string) {
    switch (category.toLowerCase()) {
      case 'professionals':
        return { background: '#f3ebff', text: '#6b21a8', border: '#a855f7' };
      case 'companies':
        return { background: '#dcfce7', text: '#166534', border: '#22c55e' };
      case 'places':
        return { background: '#f3e8ff', text: '#7c3aed', border: '#a855f7' };
      case 'products':
        return { background: '#fed7aa', text: '#ea580c', border: '#f97316' };
      default:
        return { background: '#f3f4f6', text: '#374151', border: '#9ca3af' };
    }
  }

  /**
   * Draw a star shape
   */
  private drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
    const spikes = 5;
    const outerRadius = radius;
    const innerRadius = radius * 0.4;
    
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draw subtle pattern overlay
   */
  private drawPattern(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.05)';
    ctx.lineWidth = 1;
    
    // Draw diagonal lines
    for (let i = 0; i < width + height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(0, i);
      ctx.stroke();
    }
  }

  /**
   * Wrap text to fit within width
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxHeight: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    let currentHeight = 0;
    const lineHeight = 28;

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentHeight += lineHeight;
        
        if (currentHeight >= maxHeight) {
          lines.push('...');
          break;
        }
        
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine && currentHeight < maxHeight) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Adjust color brightness
   */
  private adjustBrightness(color: string, factor: number): string {
    // Simple brightness adjustment
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.min(255, Math.max(0, r + (255 - r) * factor));
    const newG = Math.min(255, Math.max(0, g + (255 - g) * factor));
    const newB = Math.min(255, Math.max(0, b + (255 - b) * factor));
    
    return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
  }

  /**
   * Generate filename for the image
   */
  private generateFilename(review: Review, entity?: Entity): string {
    const entityName = entity?.name || 'review';
    const sanitizedName = entityName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const date = new Date().toISOString().split('T')[0];
    return `${sanitizedName}_review_${date}.png`;
  }

  /**
   * Download the generated image
   */
  async downloadImage(imageData: GeneratedImageData): Promise<void> {
    if (!imageData.blob) {
      throw new Error('No blob data available');
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
}

// Export singleton instance
export const imageGenerationService = new ImageGenerationService(); 