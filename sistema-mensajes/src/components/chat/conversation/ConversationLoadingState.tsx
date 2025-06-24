import React from 'react';

export const ConversationLoadingState: React.FC = () => {
  return (
    <div className="bg-white/80 backdrop-blur-sm border-r border-gray-200/50 h-full flex flex-col">
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
          <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-gray-100 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};