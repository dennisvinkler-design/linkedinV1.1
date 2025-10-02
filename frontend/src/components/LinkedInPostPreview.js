import React from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';

const LinkedInPostPreview = ({ post, userProfile = null }) => {
  // Default user profile if none provided
  const defaultProfile = {
    name: "Dennis V",
    title: "Entrepreneur & Business Developer",
    company: "Your Company",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
    timeAgo: "now"
  };

  const profile = userProfile || defaultProfile;

  // Get the backend base URL for images
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
  const BACKEND_BASE_URL = API_BASE_URL.replace('/api', '');
  
  // Construct full image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      console.log('🖼️ No image URL provided');
      return null;
    }
    if (imageUrl.startsWith('http')) {
      console.log('🖼️ Using absolute URL:', imageUrl);
      return imageUrl;
    }
    if (imageUrl.startsWith('data:')) {
      console.log('🖼️ Using base64 image');
      return imageUrl;
    }
    const fullUrl = `${BACKEND_BASE_URL}${imageUrl}`;
    console.log('🖼️ Constructed image URL:', { 
      original: imageUrl, 
      backend: BACKEND_BASE_URL, 
      full: fullUrl 
    });
    return fullUrl;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm max-w-2xl mx-auto">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {profile.name}
                </h3>
                <span className="text-gray-500">•</span>
                <span className="text-xs text-gray-500">{profile.timeAgo}</span>
              </div>
              <p className="text-xs text-gray-600 truncate">
                {profile.title}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {profile.company}
              </p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
          {post?.content}
        </div>
        
        {/* Hashtags */}
        {post?.hashtags && post.hashtags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {post.hashtags.map((hashtag, index) => (
              <span 
                key={index} 
                className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                #{hashtag.replace('#', '')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post Image */}
      {post?.image_url && (
        <div className="px-4 pb-3">
          <img
            src={getImageUrl(post.image_url)}
            alt="Post content"
            className="w-full h-auto rounded-lg object-cover"
            onError={(e) => {
              console.error('Failed to load image:', post.image_url);
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Engagement Stats */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>👍 12 likes</span>
            <span>💬 3 comments</span>
            <span>🔄 1 share</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex items-center justify-around">
          <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 py-2 px-3 rounded-md hover:bg-gray-50 transition-colors">
            <Heart className="h-5 w-5" />
            <span className="text-sm font-medium">Like</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 py-2 px-3 rounded-md hover:bg-gray-50 transition-colors">
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Comment</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 py-2 px-3 rounded-md hover:bg-gray-50 transition-colors">
            <Share className="h-5 w-5" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkedInPostPreview;
