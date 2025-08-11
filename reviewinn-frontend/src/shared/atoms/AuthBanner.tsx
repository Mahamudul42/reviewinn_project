import React from 'react';

interface AuthBannerProps {
  src: string;
  alt?: string;
  className?: string;
}

const AuthBanner: React.FC<AuthBannerProps> = ({ src, alt = 'Welcome', className = '' }) => (
  <div className="auth-modal-banner">
    <img src={src} alt={alt} className={`w-full h-32 object-cover rounded-t-2xl ${className}`} />
  </div>
);

export default AuthBanner; 