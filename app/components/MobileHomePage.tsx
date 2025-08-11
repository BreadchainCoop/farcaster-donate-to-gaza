'use client';

import { DONATION_ADDRESS } from '../config';
import { campaignInfo } from '../lib/campaignInfo';
import MobileDonationWidget from './MobileDonationWidget';

export default function MobileHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{campaignInfo.title}</h1>
          <p className="text-sm text-gray-600 mt-1">{campaignInfo.subtitle}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">

        {/* Donation Widget */}
        <MobileDonationWidget />

        {/* About Section - Collapsible */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <details className="group">
            <summary className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50">
              <h3 className="font-semibold text-gray-900">About This Campaign</h3>
              <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-4 pb-4 text-sm text-gray-700 space-y-2">
              <p>Your donation directly supports Ibrahim and his family of 27 people in Gaza.</p>
              <p>These funds are their sole source of income for food, rent, and medicine.</p>
              <p className="font-semibold text-purple-600">We send 100% of donations directly to the family.</p>
            </div>
          </details>
        </div>

        {/* FAQ Section - Mobile Optimized */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 px-2">Common Questions</h2>
          
          {campaignInfo.sections.slice(0, 5).map((section, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <details className="group">
                <summary className="p-4 text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                  <span className="pr-2 flex-1">{section.title}</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform shrink-0">▼</span>
                </summary>
                <div className="px-4 pb-4 text-xs text-gray-700 whitespace-pre-line">
                  {section.content.substring(0, 300)}
                  {section.content.length > 300 && '...'}
                </div>
              </details>
            </div>
          ))}
          
          {/* Show More FAQs */}
          <details className="bg-white rounded-xl shadow-sm overflow-hidden">
            <summary className="p-4 text-sm font-medium text-purple-600 cursor-pointer hover:bg-purple-50 text-center">
              View All Questions ({campaignInfo.sections.length})
            </summary>
            <div className="space-y-3 p-3">
              {campaignInfo.sections.slice(5).map((section, index) => (
                <div key={index + 5} className="bg-gray-50 rounded-lg">
                  <details className="group">
                    <summary className="p-3 text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100">
                      {section.title}
                    </summary>
                    <div className="px-3 pb-3 text-xs text-gray-700 whitespace-pre-line">
                      {section.content}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* Footer - Mobile */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center space-y-3 pb-8">
          <p className="text-xs text-gray-600">
            100% of donations go directly to Ibrahim's family in Gaza
          </p>
          <p className="text-xs text-gray-500">
            Volunteer-run campaign • No admin costs
          </p>
          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Donation Address:</p>
            <code className="text-xs font-mono break-all">{DONATION_ADDRESS}</code>
          </div>
        </div>
      </div>
    </div>
  );
}