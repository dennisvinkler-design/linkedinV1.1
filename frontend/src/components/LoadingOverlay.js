import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import ProgressBar from './ProgressBar';

const LoadingOverlay = ({ 
  isLoading = false, 
  message = 'Loading...', 
  progress = null,
  total = 100,
  showProgress = false,
  className = ''
}) => {
  if (!isLoading) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {message}
            </h3>
            
            {showProgress && progress !== null && (
              <ProgressBar 
                progress={progress} 
                total={total}
                showPercentage={true}
                className="mt-4"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
