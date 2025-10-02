import React from 'react';

export const DanishFlag = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="16" fill="#C60C30"/>
    <rect x="0" y="6" width="24" height="4" fill="white"/>
    <rect x="8" y="0" width="4" height="16" fill="white"/>
  </svg>
);

export const AmericanFlag = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Red and white stripes */}
    <rect width="24" height="1.23" fill="#B22234"/>
    <rect y="1.23" width="24" height="1.23" fill="white"/>
    <rect y="2.46" width="24" height="1.23" fill="#B22234"/>
    <rect y="3.69" width="24" height="1.23" fill="white"/>
    <rect y="4.92" width="24" height="1.23" fill="#B22234"/>
    <rect y="6.15" width="24" height="1.23" fill="white"/>
    <rect y="7.38" width="24" height="1.23" fill="#B22234"/>
    <rect y="8.61" width="24" height="1.23" fill="white"/>
    <rect y="9.84" width="24" height="1.23" fill="#B22234"/>
    <rect y="11.07" width="24" height="1.23" fill="white"/>
    <rect y="12.3" width="24" height="1.23" fill="#B22234"/>
    <rect y="13.53" width="24" height="1.23" fill="white"/>
    <rect y="14.76" width="24" height="1.24" fill="#B22234"/>
    
    {/* Blue canton */}
    <rect width="9.6" height="8.31" fill="#3C3B6E"/>
    
    {/* Stars (simplified as small circles for visibility at small size) */}
    <circle cx="1.2" cy="1.2" r="0.3" fill="white"/>
    <circle cx="2.4" cy="1.2" r="0.3" fill="white"/>
    <circle cx="3.6" cy="1.2" r="0.3" fill="white"/>
    <circle cx="4.8" cy="1.2" r="0.3" fill="white"/>
    <circle cx="6" cy="1.2" r="0.3" fill="white"/>
    <circle cx="7.2" cy="1.2" r="0.3" fill="white"/>
    <circle cx="8.4" cy="1.2" r="0.3" fill="white"/>
    
    <circle cx="1.8" cy="2.4" r="0.3" fill="white"/>
    <circle cx="3" cy="2.4" r="0.3" fill="white"/>
    <circle cx="4.2" cy="2.4" r="0.3" fill="white"/>
    <circle cx="5.4" cy="2.4" r="0.3" fill="white"/>
    <circle cx="6.6" cy="2.4" r="0.3" fill="white"/>
    <circle cx="7.8" cy="2.4" r="0.3" fill="white"/>
    
    <circle cx="1.2" cy="3.6" r="0.3" fill="white"/>
    <circle cx="2.4" cy="3.6" r="0.3" fill="white"/>
    <circle cx="3.6" cy="3.6" r="0.3" fill="white"/>
    <circle cx="4.8" cy="3.6" r="0.3" fill="white"/>
    <circle cx="6" cy="3.6" r="0.3" fill="white"/>
    <circle cx="7.2" cy="3.6" r="0.3" fill="white"/>
    <circle cx="8.4" cy="3.6" r="0.3" fill="white"/>
    
    <circle cx="1.8" cy="4.8" r="0.3" fill="white"/>
    <circle cx="3" cy="4.8" r="0.3" fill="white"/>
    <circle cx="4.2" cy="4.8" r="0.3" fill="white"/>
    <circle cx="5.4" cy="4.8" r="0.3" fill="white"/>
    <circle cx="6.6" cy="4.8" r="0.3" fill="white"/>
    <circle cx="7.8" cy="4.8" r="0.3" fill="white"/>
    
    <circle cx="1.2" cy="6" r="0.3" fill="white"/>
    <circle cx="2.4" cy="6" r="0.3" fill="white"/>
    <circle cx="3.6" cy="6" r="0.3" fill="white"/>
    <circle cx="4.8" cy="6" r="0.3" fill="white"/>
    <circle cx="6" cy="6" r="0.3" fill="white"/>
    <circle cx="7.2" cy="6" r="0.3" fill="white"/>
    <circle cx="8.4" cy="6" r="0.3" fill="white"/>
    
    <circle cx="1.8" cy="7.2" r="0.3" fill="white"/>
    <circle cx="3" cy="7.2" r="0.3" fill="white"/>
    <circle cx="4.2" cy="7.2" r="0.3" fill="white"/>
    <circle cx="5.4" cy="7.2" r="0.3" fill="white"/>
    <circle cx="6.6" cy="7.2" r="0.3" fill="white"/>
    <circle cx="7.8" cy="7.2" r="0.3" fill="white"/>
  </svg>
);
