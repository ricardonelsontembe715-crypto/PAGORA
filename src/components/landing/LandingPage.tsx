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
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased selection:bg-indigo-600 selection:text-white">
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
