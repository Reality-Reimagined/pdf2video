import React from 'react';
import { useAuthStore } from '../../lib/store';
import { format } from 'date-fns';
import { Play, Download } from 'lucide-react';

export const VideoList = () => {
  const { videos } = useAuthStore();

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No videos created yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="aspect-video bg-gray-100">
            {video.thumbnail ? (
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-medium text-gray-900">{video.title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(video.createdAt), 'MMM d, yyyy')}
            </p>
            <div className="mt-4 flex justify-between">
              <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Play className="w-4 h-4" />
                Play
              </button>
              <button className="text-gray-600 hover:text-gray-700 flex items-center gap-1">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};