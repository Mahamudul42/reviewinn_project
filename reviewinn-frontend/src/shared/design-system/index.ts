/**
 * Design System - World-class component library
 * Unified export for all design system components and tokens
 */

// Design tokens
export * from './tokens';

// Theme utilities
export { purpleTheme, purpleStyles } from './utils/purpleTheme';
export * from './colors';

// Core components
import { Button, ButtonGroup, IconButton } from './components/Button';
import { PurpleButton, PurplePrimaryButton, PurpleSecondaryButton } from './components/PurpleButton';
import { Input, Textarea } from './components/Input';
import { Modal, ConfirmationModal, AlertModal, useModal } from './components/Modal';
import { ToastContainer, useToast, usePromiseToast } from './components/Toast';

// Re-export components
export { Button, ButtonGroup, IconButton };
export { PurpleButton, PurplePrimaryButton, PurpleSecondaryButton };
export type { ButtonProps, ButtonGroupProps, IconButtonProps } from './components/Button';

export { Input, Textarea };
export type { InputProps, TextareaProps } from './components/Input';

export { Modal, ConfirmationModal, AlertModal, useModal };
export type { ModalProps, ConfirmationModalProps, AlertModalProps } from './components/Modal';

export { ToastContainer, useToast, usePromiseToast };

// Component categories for documentation/organization
export const designSystem = {
  // Form components
  forms: {
    Button,
    ButtonGroup,
    IconButton,
    PurpleButton,
    PurplePrimaryButton,
    PurpleSecondaryButton,
    Input,
    Textarea,
  },
  
  // Overlay components
  overlays: {
    Modal,
    ConfirmationModal,
    AlertModal,
    ToastContainer,
  },
  
  // Hooks
  hooks: {
    useModal,
    useToast,
    usePromiseToast,
  },
} as const;

// Version information
export const DESIGN_SYSTEM_VERSION = '2.0.0';

// Component status for tracking implementation
export const componentStatus = {
  stable: [
    'Button',
    'ButtonGroup', 
    'IconButton',
    'Input',
    'Textarea',
    'Modal',
    'ConfirmationModal',
    'AlertModal',
    'ToastContainer',
  ],
  beta: [
    'useModal',
    'useToast', 
    'usePromiseToast',
  ],
  deprecated: [],
} as const;

export default designSystem;