'use client';

import { DONATION_ADDRESS } from '../config';
import { campaignInfo } from '../lib/campaignInfo';
import Card from './Card';
import FarcasterDonationWidget from './FarcasterDonationWidget';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{campaignInfo.title}</h1>
          <p className="text-xl text-gray-600 mb-8">{campaignInfo.subtitle}</p>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Donation Widget */}
            <div>
              <FarcasterDonationWidget />
            </div>
            
            {/* Campaign Info */}
            <div>
              {/* Quick Facts */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <Card>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{campaignInfo.quickFacts.familySize}</div>
                    <div className="text-sm text-gray-600">People Supported</div>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{campaignInfo.quickFacts.dailyFoodCost}</div>
                    <div className="text-sm text-gray-600">Daily Food Cost</div>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{campaignInfo.quickFacts.monthlyGoal}</div>
                    <div className="text-sm text-gray-600">Monthly Goal</div>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{campaignInfo.quickFacts.commissionRate}</div>
                    <div className="text-sm text-gray-600">Exchange Fee</div>
                  </div>
                </Card>
              </div>

              {/* About Section */}
              <Card className="mb-8">
                <h3 className="text-lg font-semibold mb-3">About This Campaign</h3>
                <p className="text-sm text-gray-700">
                  Your donation directly supports Ibrahim and his family of 27 people in Gaza. 
                  These funds are their sole source of income for food, rent, and medicine. 
                  We are a volunteer group sending 100% of donations directly to the family.
                </p>
              </Card>

              {/* Urgency Notice */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">Urgent Need</h4>
                <p className="text-sm text-red-800">
                  Food prices in Gaza: Flour costs $45/kg, chicken (when available) is $100. 
                  The family needs €150 daily just for basic food to survive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Information Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
        
        <div className="space-y-8">
          {campaignInfo.sections.map((section, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <details className="cursor-pointer">
                <summary className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                  {section.title}
                </summary>
                <div className="mt-4 text-gray-700 whitespace-pre-line">{section.content}</div>
              </details>
            </div>
          ))}
        </div>


        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>100% of donations go directly to Ibrahim and his family in Gaza.</p>
          <p className="mt-2">This is a volunteer-run campaign with no administrative costs.</p>
          <p className="mt-4 text-xs">
            Donation Address: <code className="bg-gray-100 px-2 py-1 rounded">{DONATION_ADDRESS}</code>
          </p>
        </div>
      </div>
    </div>
  );
}