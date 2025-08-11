'use client';

import EnhancedDonationWidget from './EnhancedDonationWidget';

export default function MinimalHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <EnhancedDonationWidget />
    </div>
  );
}