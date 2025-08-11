import React from 'react';
import { Facebook, Twitter, Linkedin, Mail, MessageCircle, Copy, Share2 } from 'lucide-react';
import { useConfirmation } from '../../../shared/components/ConfirmationSystem';

interface SocialSharingButtonsProps {
  metadata: {
    facebook_share: string;
    twitter_share: string;
    linkedin_share: string;
    whatsapp_share: string;
    email_share: string;
    canonical_url: string;
    title: string;
    description: string;
  };
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  variant?: 'horizontal' | 'vertical';
}

const SocialSharingButtons: React.FC<SocialSharingButtonsProps> = ({
  metadata,
  size = 'md',
  showLabels = true,
  variant = 'horizontal'
}) => {
  const { showSuccess, showError } = useConfirmation();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const openShareWindow = (url: string, title: string) => {
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
      url,
      title,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(metadata.canonical_url);
      showSuccess('URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy URL:', err);
      showError('Failed to copy URL');
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: metadata.title,
          text: metadata.description,
          url: metadata.canonical_url,
        });
        showSuccess('Shared successfully!');
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback to copy URL
      copyToClipboard();
    }
  };

  const shareButtons = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => openShareWindow(metadata.facebook_share, 'Share on Facebook')
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      action: () => openShareWindow(metadata.twitter_share, 'Share on Twitter')
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      action: () => openShareWindow(metadata.linkedin_share, 'Share on LinkedIn')
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-600 hover:bg-green-700',
      action: () => openShareWindow(metadata.whatsapp_share, 'Share on WhatsApp')
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      action: () => window.location.href = metadata.email_share
    },
    {
      name: 'Copy URL',
      icon: Copy,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      action: copyToClipboard
    }
  ];

  // Add native share button if supported
  if (navigator.share) {
    shareButtons.unshift({
      name: 'Share',
      icon: Share2,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: shareNative
    });
  }

  const containerClasses = variant === 'horizontal' 
    ? 'flex flex-wrap gap-3' 
    : 'flex flex-col space-y-2';

  const buttonClasses = variant === 'horizontal' 
    ? `inline-flex items-center justify-center ${sizeClasses[size]} rounded-full text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2`
    : `inline-flex items-center px-4 py-2 rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${textSizes[size]}`;

  return (
    <div className="w-full">
      <div className={containerClasses}>
        {shareButtons.map((button) => {
          const Icon = button.icon;
          
          if (variant === 'horizontal') {
            return (
              <div key={button.name} className="flex flex-col items-center">
                <button
                  onClick={button.action}
                  className={`${buttonClasses} ${button.color} focus:ring-opacity-50`}
                  title={`Share on ${button.name}`}
                  aria-label={`Share on ${button.name}`}
                >
                  <Icon className={iconSizes[size]} />
                </button>
                {showLabels && (
                  <span className={`mt-1 ${textSizes[size]} text-gray-600 text-center`}>
                    {button.name}
                  </span>
                )}
              </div>
            );
          } else {
            return (
              <button
                key={button.name}
                onClick={button.action}
                className={`${buttonClasses} ${button.color} focus:ring-opacity-50`}
                title={`Share on ${button.name}`}
                aria-label={`Share on ${button.name}`}
              >
                <Icon className={`${iconSizes[size]} mr-2`} />
                {button.name}
              </button>
            );
          }
        })}
      </div>
      
      {/* Quick share info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <div className="flex items-start space-x-2">
          <Share2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {metadata.title}
            </p>
            <p className="text-sm text-gray-500 line-clamp-2">
              {metadata.description}
            </p>
            <p className="text-xs text-gray-400 mt-1 truncate">
              {metadata.canonical_url}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialSharingButtons;