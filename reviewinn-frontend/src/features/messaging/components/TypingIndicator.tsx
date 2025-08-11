import React from 'react';

interface TypingIndicatorProps {
  users: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing...`;
    } else if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing...`;
    } else {
      return `${users[0]} and ${users.length - 1} others are typing...`;
    }
  };

  return (
    <div className="typing-indicator flex items-center space-x-2 p-3 max-w-xs">
      <div className="typing-avatar">
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-xs text-gray-600">💬</span>
        </div>
      </div>
      
      <div className="typing-bubble bg-gray-200 rounded-2xl px-4 py-2 rounded-bl-sm">
        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-600">{getTypingText()}</span>
          <div className="typing-dots flex space-x-1">
            <div className="dot w-1 h-1 bg-gray-600 rounded-full animate-bounce"></div>
            <div className="dot w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="dot w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .typing-indicator {
          margin-bottom: 0.5rem;
        }
        
        .typing-bubble {
          max-width: 200px;
        }
        
        .typing-dots .dot {
          animation-duration: 0.6s;
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }
        
        @keyframes bounce {
          from {
            transform: translateY(0px);
          }
          to {
            transform: translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;