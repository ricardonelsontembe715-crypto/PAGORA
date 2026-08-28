import React from 'react';
import { AppNavbar } from './AppNavbar';
import { AppSidebar } from './AppSidebar';
import { BottomTabBar } from './BottomTabBar';
import { PwaInstallBanner } from './PwaInstallBanner';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-[#F8FAFC] flex flex-col antialiased">
      <PwaInstallBanner />
      <AppNavbar />
      <div className="flex-1 flex min-w-0 w-full">
        <AppSidebar />
        <main className="flex-1 min-w-0 w-full p-4 sm:p-6 lg:p-8 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
      <BottomTabBar />
    </div>
  );
};
