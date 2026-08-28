import React from 'react';
import { LandingHeader } from './LandingHeader';
import { LandingHero } from './LandingHero';
import { LandingAudience } from './LandingAudience';
import { LandingProductDemo } from './LandingProductDemo';
import { LandingValueProps } from './LandingValueProps';
import { LandingPricing } from './LandingPricing';
import { LandingFooter } from './LandingFooter';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-[#F8FAFC] flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingAudience />
        <LandingProductDemo />
        <LandingValueProps />
        <LandingPricing />
      </main>
      <LandingFooter />
    </div>
  );
};
