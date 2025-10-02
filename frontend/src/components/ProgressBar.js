import React from 'react';

const ProgressBar = ({ 
  progress = 0, 
  total = 100, 
  showPercentage = true, 
  showSteps = false,
  currentStep = 0,
  totalSteps = 0,
  className = '',
  color = 'linkedin-500'
}) => {
  const percentage = Math.min(100, Math.max(0, (progress / total) * 100));
  
  const colorClasses = {
    'linkedin-500': 'bg-linkedin-500',
    'green-500': 'bg-green-500',
    'blue-500': 'bg-blue-500',
    'red-500': 'bg-red-500'
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        {showSteps && totalSteps > 0 && (
          <span className="text-sm text-gray-600">
            Step {currentStep} of {totalSteps}
          </span>
        )}
        {showPercentage && (
          <span className="text-sm text-gray-600">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ease-out ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
