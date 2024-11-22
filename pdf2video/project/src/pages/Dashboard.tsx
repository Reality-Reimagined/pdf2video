import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { VideoList } from '../components/dashboard/VideoList';
import { UserSettings } from '../components/dashboard/UserSettings';
import { SubscriptionManager } from '../components/dashboard/SubscriptionManager';
import { useAuthStore } from '../lib/store';
import { Video, Settings, CreditCard } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
          <p className="text-gray-600">Manage your videos and account settings</p>
        </div>

        <Tabs.Root defaultValue="videos" className="space-y-6">
          <Tabs.List className="flex space-x-4 border-b border-gray-200">
            <Tabs.Trigger
              value="videos"
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
            >
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Videos
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="settings"
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="subscription"
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Subscription
              </div>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="videos" className="focus:outline-none">
            <VideoList />
          </Tabs.Content>

          <Tabs.Content value="settings" className="focus:outline-none">
            <UserSettings />
          </Tabs.Content>

          <Tabs.Content value="subscription" className="focus:outline-none">
            <SubscriptionManager />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
};