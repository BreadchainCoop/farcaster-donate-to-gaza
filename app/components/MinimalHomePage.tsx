'use client';

import SimplifiedDonationWidget from './SimplifiedDonationWidget';

export default function MinimalHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
      <SimplifiedDonationWidget />
    </div>
  );
}