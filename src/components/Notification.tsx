import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, X, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
  type: NotificationType;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  isVisible,
  onClose,
  duration = 5000,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          onClose();
          setIsClosing(false);
        }, 300);
      }, duration);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isVisible, onClose, duration]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      case 'info':
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 w-80 p-4 rounded-md shadow-md border ${getColors()} transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <div className={`mr-3 ${getIconColor()}`}>{getIcon()}</div>
          <div className="text-sm">{message}</div>
        </div>
        <button
          onClick={() => {
            setIsClosing(true);
            setTimeout(() => {
              onClose();
              setIsClosing(false);
            }, 300);
          }}
          className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Notification; 