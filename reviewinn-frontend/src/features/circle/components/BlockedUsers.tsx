import React from 'react';
import { Ban, EyeOff } from 'lucide-react';
import UserDisplay from './UserDisplay';
import type { User } from '../../../types';

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
        <h2 className="text-xl font-bold text-gray-900">Blocked Users ({blockedUsers.length})</h2>
      </div>
      
      {blockedUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Ban size={48} className="mx-auto mb-2 text-gray-300" />
          <p>No blocked users</p>
          <p className="text-sm">Users you block will appear here</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {blockedUsers.map((user) => (
            <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
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
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors flex items-center space-x-1.5"
                    >
                      <EyeOff size={14} />
                      <span>Unblock</span>
                    </button>
                  }
                  showClickable={false}
                />
                {user.reason && (
                  <p className="text-sm text-gray-500 pl-15">
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