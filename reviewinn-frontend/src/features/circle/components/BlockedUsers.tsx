import React from 'react';
import { Ban, EyeOff, Shield, CheckCircle } from 'lucide-react';
import UserDisplay from './UserDisplay';
import { EmptyState } from '../../../shared/components/EmptyState';
import type { User } from '../../../types';
import '../circle-purple-buttons.css';

interface BlockedUsersProps {
  blockedUsers: User[];
  onUnblockUser: (userId: string | number, userName: string) => void;
}

const BlockedUsers: React.FC<BlockedUsersProps> = ({
  blockedUsers,
  onUnblockUser
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Blocked Users ({blockedUsers.length})</h2>
      </div>
      
      {blockedUsers.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-green-50 border border-green-200 rounded-xl p-8 shadow-sm">
          <EmptyState
            icon={<Shield className="w-16 h-16 text-green-500" />}
            title="No Blocked Users"
            description="Great! You haven't blocked anyone yet. Your circle environment is clean and welcoming. Blocked users will appear here if you need to manage them."
            action={
              <button className="bg-white text-green-600 border border-green-200 px-6 py-2 rounded-lg font-medium hover:bg-green-50 transition-all duration-200 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Keep It Clean</span>
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4">
          {blockedUsers.map((user) => (
            <div key={user.id} className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="space-y-3">
                <UserDisplay 
                  user={{
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    avatar: user.avatar
                  }}
                  size="lg"
                  subtitle={`Blocked on ${new Date(user.blocked_at || '').toLocaleDateString()}`}
                  badge={
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      Blocked
                    </span>
                  }
                  actions={
                    <button
                      onClick={() => onUnblockUser(user.id, user.name)}
                      className="circle-action-button-primary px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-1.5 shadow-sm"
                    >
                      <EyeOff size={14} />
                      <span>Unblock</span>
                    </button>
                  }
                  showClickable={false}
                />
                {user.reason && (
                  <p className="text-sm text-purple-500 pl-15">
                    <span className="font-medium">Reason:</span> {user.reason}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlockedUsers;