import React, { useState } from 'react';
import { Modal } from '../../../shared/design-system/components/Modal';
import { Button } from '../../../shared/design-system/components/Button';
import { 
  AlertTriangle, 
  Trash2, 
  X,
  Shield,
  CheckCircle
} from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  itemName?: string;
  type?: 'profile' | 'entity' | 'review';
  warningMessage?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName = '',
  type = 'entity',
  warningMessage
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  
  const requiredText = type === 'profile' ? 'DELETE MY ACCOUNT' : 'DELETE';
  const isConfirmValid = confirmText === requiredText;

  const getTypeConfig = () => {
    switch (type) {
      case 'profile':
        return {
          color: 'from-red-600 to-red-700',
          icon: <Shield className="w-6 h-6" />,
          severity: 'high'
        };
      case 'entity':
        return {
          color: 'from-orange-600 to-orange-700',
          icon: <AlertTriangle className="w-6 h-6" />,
          severity: 'medium'
        };
      case 'review':
        return {
          color: 'from-yellow-600 to-yellow-700',
          icon: <AlertTriangle className="w-6 h-6" />,
          severity: 'low'
        };
    }
  };

  const config = getTypeConfig();

  const handleConfirm = async () => {
    if (!isConfirmValid) return;
    
    try {
      setIsDeleting(true);
      await onConfirm();
      setConfirmText('');
      onClose();
    } catch (error) {
      console.error('Error during deletion:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className={`p-3 rounded-full bg-gradient-to-r ${config.color} text-white`}>
            {config.icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">This action cannot be undone</p>
          </div>
        </div>

        {/* Warning Message */}
        <div className={`p-4 rounded-lg border-l-4 mb-6 ${
          config.severity === 'high' 
            ? 'bg-red-50 border-red-400' 
            : config.severity === 'medium'
            ? 'bg-orange-50 border-orange-400'
            : 'bg-yellow-50 border-yellow-400'
        }`}>
          <div className="flex">
            <AlertTriangle className={`w-5 h-5 ${
              config.severity === 'high' 
                ? 'text-red-400' 
                : config.severity === 'medium'
                ? 'text-orange-400'
                : 'text-yellow-400'
            }`} />
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                config.severity === 'high' 
                  ? 'text-red-800' 
                  : config.severity === 'medium'
                  ? 'text-orange-800'
                  : 'text-yellow-800'
              }`}>
                {message}
              </p>
              {warningMessage && (
                <p className={`text-sm mt-1 ${
                  config.severity === 'high' 
                    ? 'text-red-700' 
                    : config.severity === 'medium'
                    ? 'text-orange-700'
                    : 'text-yellow-700'
                }`}>
                  {warningMessage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Item Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">You are about to delete:</p>
          <p className="font-semibold text-gray-900 truncate">{itemName}</p>
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type <code className="bg-gray-100 px-2 py-1 rounded text-red-600 font-mono text-xs">
              {requiredText}
            </code> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={`Type "${requiredText}" here`}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
              confirmText === requiredText
                ? 'border-green-300 focus:ring-green-500 bg-green-50'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            disabled={isDeleting}
          />
          {confirmText === requiredText && (
            <div className="flex items-center mt-2 text-green-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">Confirmation text matches</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-6"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isConfirmValid || isDeleting}
            className={`px-6 bg-gradient-to-r ${config.color} text-white hover:opacity-90 disabled:opacity-50`}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete Forever'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;