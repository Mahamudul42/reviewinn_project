import { reviewService } from './reviewService';

export interface ShareMetadata {
  title: string;
  description: string;
  url: string;
  image?: string;
  author?: string;
  rating?: number;
  entityName?: string;
}

export class SharingService {
  private baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com';

  /**
   * Generate a shareable URL for a review
   */
  generateReviewShareUrl(reviewId: string | number): string {
    return `${this.baseUrl}/review/share/${reviewId}`;
  }

  /**
   * Generate sharing URLs for different platforms
   */
  generatePlatformUrls(metadata: ShareMetadata) {
    const encodedUrl = encodeURIComponent(metadata.url);
    const encodedTitle = encodeURIComponent(metadata.title);
    const encodedDescription = encodeURIComponent(metadata.description);
    const combinedText = encodeURIComponent(`${metadata.title} - ${metadata.description}`);

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${combinedText} ${encodedUrl}`,
      email: `mailto:?subject=${encodedTitle}&body=Check out this review: ${encodedUrl}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      pinterest: metadata.image 
        ? `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodeURIComponent(metadata.image)}&description=${encodedDescription}`
        : `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedDescription}`
    };
  }

  /**
   * Open a sharing window for a specific platform
   */
  openShareWindow(url: string, platform: string, width = 600, height = 400) {
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    const popup = window.open(
      url,
      `share-${platform}`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no`
    );

    // Focus the popup window
    if (popup && popup.focus) {
      popup.focus();
    }

    return popup;
  }

  /**
   * Use Web Share API if available, otherwise fallback to copy URL
   */
  async shareNative(metadata: ShareMetadata): Promise<boolean> {
    if (!navigator.share) {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(metadata.url);
        return true;
      } catch (err) {
        console.error('Failed to copy URL:', err);
        return false;
      }
    }

    try {
      await navigator.share({
        title: metadata.title,
        text: metadata.description,
        url: metadata.url,
      });
      return true;
    } catch (err) {
      // User cancelled or sharing failed
      console.log('Share cancelled or failed:', err);
      return false;
    }
  }

  /**
   * Copy URL to clipboard
   */
  async copyToClipboard(url: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (err) {
      console.error('Failed to copy URL:', err);
      return false;
    }
  }

  /**
   * Generate metadata for review sharing
   */
  async generateReviewShareMetadata(reviewId: string): Promise<ShareMetadata | null> {
    try {
      const metadata = await reviewService.getReviewShareMetadata(reviewId);
      
      if (!metadata) return null;

      return {
        title: metadata.title,
        description: metadata.description,
        url: metadata.canonical_url,
        image: metadata.og_image,
        author: metadata.author,
        rating: metadata.rating,
        entityName: metadata.entity_name
      };
    } catch (err) {
      console.error('Failed to generate share metadata:', err);
      return null;
    }
  }

  /**
   * Track sharing events for analytics
   */
  trackShare(platform: string, reviewId: string, success: boolean) {
    // TODO: Implement analytics tracking
    console.log(`Share event: ${platform}, review: ${reviewId}, success: ${success}`);
    
    // Example analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: platform,
        content_type: 'review',
        item_id: reviewId,
        success: success
      });
    }
  }

  /**
   * Get optimal sharing platforms based on user agent/device
   */
  getRecommendedPlatforms(): string[] {
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);

    const basePlatforms = ['facebook', 'twitter', 'linkedin', 'email'];
    
    if (isMobile) {
      if (isIOS) {
        return ['native', 'whatsapp', ...basePlatforms];
      } else if (isAndroid) {
        return ['native', 'whatsapp', 'telegram', ...basePlatforms];
      } else {
        return ['whatsapp', ...basePlatforms];
      }
    }

    return basePlatforms;
  }

  /**
   * Generate Open Graph meta tags for a review
   */
  generateOpenGraphTags(metadata: ShareMetadata) {
    const tags = [
      { property: 'og:type', content: 'article' },
      { property: 'og:title', content: metadata.title },
      { property: 'og:description', content: metadata.description },
      { property: 'og:url', content: metadata.url },
      { property: 'og:site_name', content: 'ReviewInn' }
    ];

    if (metadata.image) {
      tags.push({ property: 'og:image', content: metadata.image });
    }

    if (metadata.author) {
      tags.push({ property: 'article:author', content: metadata.author });
    }

    return tags;
  }

  /**
   * Generate Twitter Card meta tags for a review
   */
  generateTwitterCardTags(metadata: ShareMetadata) {
    const tags = [
      { name: 'twitter:card', content: metadata.image ? 'summary_large_image' : 'summary' },
      { name: 'twitter:title', content: metadata.title },
      { name: 'twitter:description', content: metadata.description },
      { name: 'twitter:url', content: metadata.url }
    ];

    if (metadata.image) {
      tags.push({ name: 'twitter:image', content: metadata.image });
    }

    return tags;
  }
}

// Export singleton instance
export const sharingService = new SharingService();