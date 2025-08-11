import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Star, 
  BookOpen, 
  TrendingUp, 
  Zap,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
  category: 'review' | 'search' | 'entity' | 'analytics';
}

const QuickActionsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const quickActions: QuickAction[] = [
    {
      id: 'add-entity',
      label: 'Add Entity',
      description: 'Create a new entity to review',
      icon: <Plus size={20} />,
      action: () => {
        navigate('/add-entity');
        setIsOpen(false);
      },
      shortcut: 'Ctrl+N',
      category: 'entity'
    },
    {
      id: 'search',
      label: 'Advanced Search',
      description: 'Find entities with filters',
      icon: <Search size={20} />,
      action: () => {
        navigate('/search');
        setIsOpen(false);
      },
      shortcut: 'Ctrl+K',
      category: 'search'
    },
    {
      id: 'dashboard',
      label: 'Analytics Dashboard',
      description: 'View insights and trends',
      icon: <TrendingUp size={20} />,
      action: () => {
        navigate('/dashboard');
        setIsOpen(false);
      },
      shortcut: 'Ctrl+D',
      category: 'analytics'
    },
    {
      id: 'top-rated',
      label: 'Top Rated Entities',
      description: 'Browse highest rated items',
      icon: <Star size={20} />,
      action: () => {
        navigate('/search?sort=rating&order=desc');
        setIsOpen(false);
      },
      category: 'search'
    },
    {
      id: 'recent-reviews',
      label: 'Recent Reviews',
      description: 'See latest community reviews',
      icon: <BookOpen size={20} />,
      action: () => {
        // In a real app, this would navigate to a reviews feed
        console.log('Navigate to recent reviews');
        setIsOpen(false);
      },
      category: 'review'
    },
    {
      id: 'trending',
      label: 'Trending Now',
      description: 'Popular entities this week',
      icon: <TrendingUp size={20} />,
      action: () => {
        navigate('/search?trending=true');
        setIsOpen(false);
      },
      category: 'search'
    }
  ];

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const renderActionsByCategory = (category: QuickAction['category']) => {
    const actions = quickActions.filter(action => action.category === category);
    
    if (actions.length === 0) return null;

    return (
      <div className="action-category">
        <h4 className="category-title">
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </h4>
        <div className="actions-grid">
          {actions.map(action => (
            <button
              key={action.id}
              onClick={action.action}
              className="quick-action"
              title={`${action.description}${action.shortcut ? ` (${action.shortcut})` : ''}`}
            >
              <div className="action-icon">{action.icon}</div>
              <div className="action-content">
                <div className="action-label">{action.label}</div>
                <div className="action-description">{action.description}</div>
                {action.shortcut && (
                  <div className="action-shortcut">{action.shortcut}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Register keyboard shortcuts
  React.useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'k':
            event.preventDefault();
            navigate('/search');
            break;
          case 'n':
            event.preventDefault();
            navigate('/add-entity');
            break;
          case 'd':
            event.preventDefault();
            navigate('/dashboard');
            break;
          case ' ':
            event.preventDefault();
            setIsOpen(true);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [navigate]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="quick-actions-trigger"
        title="Quick Actions (Ctrl+Space)"
      >
        <Zap size={20} />
        <span>Quick Actions</span>
      </button>

      {isOpen && (
        <div className="quick-actions-overlay" onClick={() => setIsOpen(false)}>
          <div 
            className="quick-actions-panel"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            <div className="panel-header">
              <h3>Quick Actions</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="close-button"
                aria-label="Close quick actions"
              >
                <X size={20} />
              </button>
            </div>

            <div className="panel-content">
              {renderActionsByCategory('entity')}
              {renderActionsByCategory('search')}
              {renderActionsByCategory('review')}
              {renderActionsByCategory('analytics')}
            </div>

            <div className="panel-footer">
              <p className="keyboard-hint">
                💡 Tip: Use keyboard shortcuts for faster access
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .quick-actions-trigger {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--primary-light);
          color: var(--primary-color);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .quick-actions-trigger:hover {
          background: var(--primary-color);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }

        .quick-actions-trigger span {
          font-size: 0.9rem;
        }

        .quick-actions-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }

        .quick-actions-panel {
          background: var(--card-bg);
          border-radius: 16px;
          width: 100%;
          max-width: 800px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
          animation: scaleIn 0.2s ease-out;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .panel-header h3 {
          margin: 0;
          color: var(--text-primary);
          font-size: 1.25rem;
        }

        .close-button {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: var(--border-color);
          color: var(--text-primary);
        }

        .panel-content {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .action-category {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .category-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          text-transform: capitalize;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
        }

        .quick-action {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .quick-action:hover {
          background: var(--primary-light);
          border-color: var(--primary-color);
          transform: translateY(-1px);
        }

        .action-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: var(--primary-color);
          color: white;
          border-radius: 10px;
          flex-shrink: 0;
        }

        .quick-action:hover .action-icon {
          background: var(--primary-dark);
        }

        .action-content {
          flex: 1;
          min-width: 0;
        }

        .action-label {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .action-description {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin-bottom: 0.5rem;
        }

        .action-shortcut {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          background: var(--border-color);
          color: var(--text-secondary);
          border-radius: 4px;
          font-size: 0.75rem;
          font-family: monospace;
        }

        .panel-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-color);
          background: var(--bg-color);
        }

        .keyboard-hint {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
          text-align: center;
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .quick-actions-trigger {
            bottom: 1rem;
            right: 1rem;
            padding: 0.75rem;
          }

          .quick-actions-trigger span {
            display: none;
          }

          .quick-actions-overlay {
            padding: 1rem;
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }

          .panel-header {
            padding: 1rem;
          }

          .panel-content {
            padding: 1rem;
          }

          .panel-footer {
            padding: 1rem;
          }
        }
      `}</style>
    </>
  );
};

export default QuickActionsPanel;
