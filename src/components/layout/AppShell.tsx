import React from 'react';
import { AppNavbar } from './AppNavbar';
import { AppSidebar } from './AppSidebar';
import { BottomTabBar } from './BottomTabBar';
import { PwaInstallBanner } from './PwaInstallBanner';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased">
      <PwaInstallBanner />
      <AppNavbar />
      <div className="flex-1 flex w-full">
        <AppSidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <BottomTabBar />
    </div>
  );
};
