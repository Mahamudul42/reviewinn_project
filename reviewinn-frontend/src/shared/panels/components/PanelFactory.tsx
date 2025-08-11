import React from 'react';
import { usePanelVariant } from '../hooks/usePanelVariant';
import { LeftPanelPublic, LeftPanelAuth } from '../LeftPanel';
import { MiddlePanelPublic, MiddlePanelAuth } from '../MiddlePanel';
import { RightPanelPublic, RightPanelAuth } from '../RightPanel';
import type { Review, Entity } from '../../../types';

// Panel component map for factory pattern
const PANEL_MAP = {
  left: {
    public: LeftPanelPublic,
    authenticated: LeftPanelAuth,
  },
  middle: {
    public: MiddlePanelPublic,
    authenticated: MiddlePanelAuth,
  },
  right: {
    public: RightPanelPublic,
    authenticated: RightPanelAuth,
  },
} as const;

interface BasePanelProps {
  className?: string;
}

interface LeftPanelFactoryProps extends BasePanelProps {
  position: 'left';
}

interface MiddlePanelFactoryProps extends BasePanelProps {
  position: 'middle';
  userAvatar: string;
  userName: string;
  onAddReviewClick: () => void;
  reviewBarRef: React.RefObject<HTMLDivElement | null>;
  reviews: Review[];
  entities: Entity[];
  hasMoreReviews?: boolean;
  loadingMore?: boolean;
  loading?: boolean;
  onLoadMore?: () => void;
  onCommentAdd?: (reviewId: string, content: string, parentId?: string) => void;
  onCommentDelete?: (reviewId: string, commentId: string) => void;
  onCommentReaction?: (reviewId: string, commentId: string, reaction: string | null) => void;
  onGiveReviewClick?: (entity: Entity) => void;
}

interface RightPanelFactoryProps extends BasePanelProps {
  position: 'right';
}

type PanelFactoryProps = LeftPanelFactoryProps | MiddlePanelFactoryProps | RightPanelFactoryProps;

/**
 * Panel Factory Component
 * Automatically selects the appropriate panel variant based on authentication state
 */
const PanelFactory: React.FC<PanelFactoryProps> = (props) => {
  const { variant, user } = usePanelVariant();
  const { position, ...restProps } = props;

  // Get the appropriate panel component
  const PanelComponent = PANEL_MAP[position][variant];

  if (!PanelComponent) {
    console.error(`No panel component found for position: ${position}, variant: ${variant}`);
    return null;
  }

  // Render based on position and variant
  switch (position) {
    case 'left':
      if (variant === 'authenticated' && user) {
        const AuthLeftPanel = PanelComponent as typeof LeftPanelAuth;
        return <AuthLeftPanel {...restProps} user={user} />;
      } else {
        const PublicLeftPanel = PanelComponent as typeof LeftPanelPublic;
        return <PublicLeftPanel {...restProps} />;
      }

    case 'middle':
      const middleProps = props as MiddlePanelFactoryProps;
      if (variant === 'authenticated') {
        const AuthMiddlePanel = PanelComponent as typeof MiddlePanelAuth;
        return <AuthMiddlePanel {...middleProps} />;
      } else {
        const PublicMiddlePanel = PanelComponent as typeof MiddlePanelPublic;
        return <PublicMiddlePanel {...middleProps} />;
      }

    case 'right':
      if (variant === 'authenticated' && user) {
        const AuthRightPanel = PanelComponent as typeof RightPanelAuth;
        return <AuthRightPanel {...restProps} user={user} />;
      } else {
        const PublicRightPanel = PanelComponent as typeof RightPanelPublic;
        return <PublicRightPanel {...restProps} />;
      }

    default:
      return null;
  }
};

export default PanelFactory;