import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share2, ArrowLeft, ExternalLink, MessageCircle, ThumbsUp } from 'lucide-react';
import { reviewService } from '../../api/services/reviewService';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import type { Review } from '../../types';
import LoadingSpinner from '../../shared/atoms/LoadingSpinner';
import SocialSharingButtons from './components/SocialSharingButtons';
import { useConfirmation } from '../../shared/components/ConfirmationSystem';
import DashboardLayout from '../../shared/layouts/DashboardLayout';
import ReviewDetailModal from './components/ReviewDetailModal';

interface ShareableReviewData {
  review: Review;
  sharing: {
    share_url: string;
    meta_title: string;
    meta_description: string;
    meta_image?: string;
    entity_name: string;
    reviewer_name: string;
    rating: number;
    view_count: number;
  };
  metadata?: {
    og_title: string;
    og_description: string;
    og_url: string;
    og_image?: string;
    og_type: string;
    og_site_name: string;
    twitter_card: string;
    twitter_title: string;
    twitter_description: string;
    twitter_image?: string;
    title: string;
    description: string;
    canonical_url: string;
    author: string;
    published_time: string;
    modified_time: string;
    entity_name: string;
    rating: number;
    rating_stars: string;
    view_count: number;
    is_verified: boolean;
    facebook_share: string;
    twitter_share: string;
    linkedin_share: string;
    whatsapp_share: string;
    email_share: string;
  };
}

const ShareableReviewPage: React.FC = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const { showError, showSuccess } = useConfirmation();
  const { isAuthenticated } = useUnifiedAuth();
  
  const [reviewData, setReviewData] = useState<ShareableReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  

  useEffect(() => {
    const loadReviewData = async () => {
      if (!reviewId) {
        setError('Review ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try the new shareable endpoints first, fallback to existing ones
        let shareableData: any = null;
        let metadata: any = null;

        try {
          const [newShareableData, newMetadata] = await Promise.all([
            reviewService.getShareableReview(reviewId),
            reviewService.getReviewShareMetadata(reviewId)
          ]);
          shareableData = newShareableData;
          metadata = newMetadata;
        } catch (err) {
          console.log('New endpoints not available, falling back to existing review endpoint');
          
          // Fallback to existing review endpoint
          const review = await reviewService.getReviewById(reviewId);
          if (review) {
            shareableData = {
              review: review,
              sharing: {
                share_url: `${window.location.origin}/review/share/${reviewId}`,
                meta_title: review.title || `Review by ${review.reviewerName}`,
                meta_description: review.content?.substring(0, 160) || 'Check out this review',
                entity_name: 'Unknown Entity',
                reviewer_name: review.reviewerName || 'Anonymous',
                rating: review.overallRating || 0,
                view_count: 0
              }
            };
            
            // Create basic metadata
            metadata = {
              og_title: shareableData.sharing.meta_title,
              og_description: shareableData.sharing.meta_description,
              og_url: shareableData.sharing.share_url,
              og_type: 'article',
              og_site_name: 'ReviewInn',
              twitter_card: 'summary',
              twitter_title: shareableData.sharing.meta_title,
              twitter_description: shareableData.sharing.meta_description,
              title: shareableData.sharing.meta_title,
              description: shareableData.sharing.meta_description,
              canonical_url: shareableData.sharing.share_url,
              author: shareableData.sharing.reviewer_name,
              published_time: review.createdAt || new Date().toISOString(),
              modified_time: review.updatedAt || review.createdAt || new Date().toISOString(),
              entity_name: shareableData.sharing.entity_name,
              rating: shareableData.sharing.rating,
              rating_stars: '★'.repeat(Math.floor(shareableData.sharing.rating)),
              view_count: shareableData.sharing.view_count,
              is_verified: review.isVerified || false,
              facebook_share: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableData.sharing.share_url)}`,
              twitter_share: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareableData.sharing.share_url)}&text=${encodeURIComponent(shareableData.sharing.meta_title)}`,
              linkedin_share: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareableData.sharing.share_url)}`,
              whatsapp_share: `https://wa.me/?text=${encodeURIComponent(shareableData.sharing.meta_title + ' ' + shareableData.sharing.share_url)}`,
              email_share: `mailto:?subject=${encodeURIComponent(shareableData.sharing.meta_title)}&body=${encodeURIComponent(shareableData.sharing.meta_description + '\n\n' + shareableData.sharing.share_url)}`
            };
          }
        }

        if (!shareableData) {
          setError('Review not found');
          return;
        }

        setReviewData({
          ...shareableData,
          metadata: metadata || undefined
        });

        // Open modal for authenticated users after data loads
        if (isAuthenticated) {
          setShowModal(true);
        }

        if (metadata) {
          document.title = metadata.title;
          
          let metaDescription = document.querySelector('meta[name="description"]');
          if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
          }
          metaDescription.setAttribute('content', metadata.description);

          const ogTags = [
            { property: 'og:title', content: metadata.og_title },
            { property: 'og:description', content: metadata.og_description },
            { property: 'og:url', content: metadata.og_url },
            { property: 'og:type', content: metadata.og_type },
            { property: 'og:site_name', content: metadata.og_site_name }
          ];

          if (metadata.og_image) {
            ogTags.push({ property: 'og:image', content: metadata.og_image });
          }

          ogTags.forEach(tag => {
            let metaTag = document.querySelector(`meta[property="${tag.property}"]`);
            if (!metaTag) {
              metaTag = document.createElement('meta');
              metaTag.setAttribute('property', tag.property);
              document.head.appendChild(metaTag);
            }
            metaTag.setAttribute('content', tag.content);
          });

          const twitterTags = [
            { name: 'twitter:card', content: metadata.twitter_card },
            { name: 'twitter:title', content: metadata.twitter_title },
            { name: 'twitter:description', content: metadata.twitter_description }
          ];

          if (metadata.twitter_image) {
            twitterTags.push({ name: 'twitter:image', content: metadata.twitter_image });
          }

          twitterTags.forEach(tag => {
            let metaTag = document.querySelector(`meta[name="${tag.name}"]`);
            if (!metaTag) {
              metaTag = document.createElement('meta');
              metaTag.setAttribute('name', tag.name);
              document.head.appendChild(metaTag);
            }
            metaTag.setAttribute('content', tag.content);
          });
        }

      } catch (err) {
        console.error('Error loading shareable review:', err);
        setError('Failed to load review. Please try again.');
        showError('Failed to load review');
      } finally {
        setLoading(false);
      }
    };

    loadReviewData();
  }, [reviewId, showError]);

  const handleBackToEntity = () => {
    if (reviewData?.review.entityId) {
      navigate(`/entity/${reviewData.review.entityId}`);
    } else {
      navigate('/');
    }
  };

  const handleShare = async () => {
    if (!reviewData?.metadata) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: reviewData.metadata.title,
          text: reviewData.metadata.description,
          url: reviewData.metadata.canonical_url,
        });
        showSuccess('Review shared successfully!');
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(reviewData.metadata.canonical_url);
        showSuccess('Review URL copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy URL:', err);
        showError('Failed to copy URL');
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    // Navigate to entity page or home page when modal is closed
    if (reviewData?.review.entityId) {
      navigate(`/entity/${reviewData.review.entityId}`);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return React.createElement('div', 
      { className: "min-h-screen flex items-center justify-center" },
      React.createElement(LoadingSpinner, { size: "lg" })
    );
  }

  if (error || !reviewData) {
    return React.createElement('div',
      { className: "min-h-screen flex items-center justify-center" },
      React.createElement('div', { className: "text-center" },
        React.createElement('h1', { className: "text-2xl font-bold text-gray-900 mb-4" }, "Review Not Found"),
        React.createElement('p', { className: "text-gray-600 mb-6" }, error || "The review you're looking for doesn't exist."),
        React.createElement('button', {
          onClick: () => navigate('/'),
          className: "inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        },
          React.createElement(ArrowLeft, { className: "w-4 h-4 mr-2" }),
          "Go Home"
        )
      )
    );
  }

  const { review, sharing, metadata } = reviewData;

  // For authenticated users: Show DashboardLayout + ReviewDetailModal
  if (isAuthenticated) {
    return React.createElement(React.Fragment, {},
      // Background page with sidebars
      React.createElement(DashboardLayout, {
      },
        // Empty center content - the modal will overlay this
        React.createElement('div', { 
          className: 'w-full h-full flex items-center justify-center' 
        },
          React.createElement('div', { 
            className: 'text-gray-500 text-lg' 
          }, 'Loading review...')
        )
      ),
      
      // ReviewDetailModal overlay
      React.createElement(ReviewDetailModal, {
        review: review,
        entity: undefined, // Will be fetched by the modal if needed
        open: showModal,
        onClose: handleModalClose
      })
    );
  }

  // For non-authenticated users: Show standalone page
  return React.createElement('div', { 
    className: "min-h-screen bg-gray-100 flex justify-center items-center p-4" 
  },
    // Modal-style container
    React.createElement('div', { 
      style: {
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
      }
    },
      // Header with same styling as ReviewDetailModal
      React.createElement('div', { 
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          padding: '24px 32px 16px 32px',
          background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
        }
      },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
          React.createElement('button', {
            onClick: handleBackToEntity,
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            },
            onMouseEnter: (e) => {
              e.target.style.background = '#e2e8f0';
              e.target.style.color = '#475569';
            },
            onMouseLeave: (e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.color = '#64748b';
            }
          },
            React.createElement(ArrowLeft, { style: { width: '16px', height: '16px' } }),
            `Back to ${sharing.entity_name}`
          )
        ),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
          React.createElement('button', {
            onClick: handleShare,
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            },
            onMouseEnter: (e) => {
              e.target.style.background = '#2563eb';
            },
            onMouseLeave: (e) => {
              e.target.style.background = '#3b82f6';
            }
          },
            React.createElement(Share2, { style: { width: '16px', height: '16px' } }),
            "Share"
          )
        )
      ),
      
      // Main content area with scroll - extracted from ReviewDetailModal
      React.createElement('div', { 
        style: {
          flex: 1,
          overflow: 'auto',
          padding: '32px',
          background: '#fafbfc'
        }
      },
        // Review Content - Same layout as ReviewDetailModal
        React.createElement('div', { className: 'space-y-6' },
          // Main Review Card
          React.createElement('div', { className: 'bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6' },
            // Reviewer Info - Same as ReviewDetailModal
            React.createElement('div', {
              className: `flex items-center gap-3 ${review.reviewerId && review.reviewerName !== 'Anonymous' ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`,
              onClick: review.reviewerId && review.reviewerName !== 'Anonymous' ? () => {
                if (review.reviewerId) {
                  navigate(`/profile/${review.reviewerId}`);
                }
              } : undefined,
              title: review.reviewerId && review.reviewerName !== 'Anonymous' ? `View ${review.reviewerName}'s profile` : undefined
            },
              review.reviewerAvatar ? 
                React.createElement('img', {
                  src: review.reviewerAvatar,
                  alt: review.reviewerName,
                  className: `w-12 h-12 rounded-full object-cover border border-gray-200 ${review.reviewerId && review.reviewerName !== 'Anonymous' ? 'hover:border-blue-300 transition-colors' : ''}`
                }) :
                React.createElement('div', {
                  className: `w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-lg ${review.reviewerId && review.reviewerName !== 'Anonymous' ? 'hover:shadow-md transition-shadow' : ''}`
                },
                  review.reviewerName ? review.reviewerName.split(' ').map(n => n[0]).join('').slice(0,2) : 'U'
                ),
              React.createElement('div', { className: 'flex flex-col' },
                React.createElement('span', {
                  className: `font-semibold text-lg text-gray-900 ${review.reviewerId && review.reviewerName !== 'Anonymous' ? 'hover:text-blue-600 transition-colors' : ''}`
                }, review.reviewerName || 'Anonymous'),
                React.createElement('span', { className: 'text-sm text-gray-500' },
                  `${new Date(review.createdAt).toLocaleDateString()}`
                )
              )
            ),

            // Entity Info - Same as ReviewDetailModal  
            React.createElement('div', { className: 'flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg' },
              React.createElement('div', { className: 'w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-xl' },
                sharing.entity_name.charAt(0)
              ),
              React.createElement('div', { className: 'flex flex-col flex-1' },
                React.createElement('div', { className: 'flex flex-wrap items-center gap-2 mb-2' },
                  React.createElement('h2', { className: 'text-xl font-bold text-blue-600' }, sharing.entity_name)
                )
              )
            ),

            // Review Content - Same structure as ReviewDetailModal
            React.createElement('div', { className: 'bg-white border border-gray-200 rounded-lg p-6 shadow-sm' },
              // Review Title
              review.title && React.createElement('div', { className: 'mb-4' },
                React.createElement('div', { className: 'flex items-start gap-3' },
                  React.createElement('svg', {
                    className: 'w-5 h-5 text-gray-500 mt-1 flex-shrink-0',
                    fill: 'none',
                    stroke: 'currentColor',
                    viewBox: '0 0 24 24'
                  },
                    React.createElement('path', {
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      strokeWidth: 2,
                      d: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z'
                    })
                  ),
                  React.createElement('h3', { className: 'text-xl font-semibold text-gray-900 flex-1' }, review.title)
                )
              ),

              // Overall Rating
              React.createElement('div', { className: 'mb-5 pb-4 border-b border-gray-100' },
                React.createElement('div', { className: 'flex items-start gap-3' },
                  React.createElement('svg', {
                    className: 'w-5 h-5 text-gray-500 mt-1 flex-shrink-0',
                    fill: 'currentColor',
                    viewBox: '0 0 24 24'
                  },
                    React.createElement('path', {
                      d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
                    })
                  ),
                  React.createElement('div', { className: 'flex-1' },
                    React.createElement('div', { className: 'inline-flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3' },
                      React.createElement('span', { className: 'text-base text-blue-700 font-medium' }, 'Overall Score:'),
                      React.createElement('div', { className: 'flex items-center gap-2' },
                        React.createElement('div', { className: 'flex' },
                          Array.from({ length: 5 }, (_, i) =>
                            React.createElement('span', {
                              key: i,
                              className: `text-xl ${i < Math.floor(review.overallRating) ? 'text-yellow-400' : 'text-gray-300'}`
                            }, '★')
                          )
                        ),
                        React.createElement('span', { className: 'text-lg font-bold text-gray-900' }, review.overallRating.toFixed(1))
                      )
                    )
                  )
                )
              ),

              // Review Content
              React.createElement('div', { className: 'space-y-3' },
                React.createElement('div', { className: 'flex items-start gap-3' },
                  React.createElement('svg', {
                    className: 'w-5 h-5 text-gray-500 mt-1 flex-shrink-0',
                    fill: 'none',
                    stroke: 'currentColor',
                    viewBox: '0 0 24 24'
                  },
                    React.createElement('path', {
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      strokeWidth: 2,
                      d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    })
                  ),
                  React.createElement('div', { className: 'flex-1' },
                    React.createElement('p', {
                      className: 'text-base text-gray-700 leading-relaxed whitespace-pre-wrap'
                    }, review.content)
                  )
                )
              )
            ),

            // Pros and Cons - Same as ReviewDetailModal
            (review.pros?.length > 0 || review.cons?.length > 0) && React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
              review.pros?.length > 0 && React.createElement('div', { className: 'bg-green-50 p-4 rounded-lg' },
                React.createElement('h4', { className: 'font-semibold text-green-800 mb-2' }, '👍 Pros'),
                React.createElement('ul', { className: 'space-y-1' },
                  review.pros.map((pro, index) =>
                    React.createElement('li', {
                      key: index,
                      className: 'text-green-700 text-sm'
                    }, `• ${pro}`)
                  )
                )
              ),
              review.cons?.length > 0 && React.createElement('div', { className: 'bg-red-50 p-4 rounded-lg' },
                React.createElement('h4', { className: 'font-semibold text-red-800 mb-2' }, '👎 Cons'),
                React.createElement('ul', { className: 'space-y-1' },
                  review.cons.map((con, index) =>
                    React.createElement('li', {
                      key: index,
                      className: 'text-red-700 text-sm'
                    }, `• ${con}`)
                  )
                )
              )
            )
          )
        )
      ),
      
      // Social sharing section at bottom
      metadata && React.createElement('div', { 
        style: {
          borderTop: '1px solid #f0f0f0',
          padding: '20px 32px',
          background: '#fafafa'
        }
      },
        React.createElement('h3', { 
          style: { 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#374151', 
            marginBottom: '16px',
            margin: '0 0 16px 0'
          } 
        }, "Share this review"),
        React.createElement(SocialSharingButtons, { metadata: metadata })
      )
    )
  );
};

export default ShareableReviewPage;