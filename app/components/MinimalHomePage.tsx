'use client';

import AnimatedDonationWidget from './AnimatedDonationWidget';

export default function MinimalHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <AnimatedDonationWidget />
    </div>
  );
}