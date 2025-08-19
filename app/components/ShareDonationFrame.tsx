'use client';

import { useState } from 'react';
import { NEXT_PUBLIC_URL } from '../config';

interface ShareDonationFrameProps {
  show: boolean;
  onClose: () => void;
  amount: string;
  token: string;
  userAddress: string;
  txHash: string;
}

export default function ShareDonationFrame({
  show,
  onClose,
  amount,
  token,
  userAddress,
  txHash,
}: ShareDonationFrameProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<string>('');

  if (!show) return null;

  // Generate the frame image URL with donation details
  const frameImageUrl = `${NEXT_PUBLIC_URL}/api/images/donation-success?${new URLSearchParams({
    amount,
    token,
    address: userAddress,
    txHash,
  }).toString()}`;

  const shareText = `I just donated ${amount} ${token} to support Gaza! 🇵🇸\n\nJoin me in supporting Ibrahim's family - 27 people depending on our help.\n\n100% goes directly to the family. Every contribution matters! 💚`;

  const handleShareToFarcaster = async () => {
    setIsSharing(true);
    setShareStatus('');

    try {
      // Check if we're in a Farcaster context and can use the SDK
      const sdk = await import('@farcaster/frame-sdk');
      
      try {
        const context = await sdk.default.context;
        if (context) {
          // Use Farcaster SDK to open composer
          await sdk.default.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(frameImageUrl)}`);
          setShareStatus('Opening Farcaster composer...');
        } else {
          throw new Error('Not in Farcaster context');
        }
      } catch {
        // Fallback: Open Warpcast composer in new window
        window.open(
          `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(frameImageUrl)}`,
          '_blank',
          'noopener,noreferrer'
        );
        setShareStatus('Opened Farcaster composer in new tab');
      }
    } catch (error) {
      console.error('Error sharing to Farcaster:', error);
      setShareStatus('Failed to share to Farcaster');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyImage = async () => {
    try {
      await navigator.clipboard.writeText(frameImageUrl);
      setShareStatus('Image URL copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      setShareStatus('Failed to copy image URL');
    }
  };

  const handleDownloadImage = async () => {
    try {
      const response = await fetch(frameImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `donation-${amount}-${token}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setShareStatus('Image downloaded!');
    } catch (error) {
      console.error('Error downloading image:', error);
      setShareStatus('Failed to download image');
    }
  };

  const handleShareToTwitter = () => {
    const twitterText = `I just donated ${amount} ${token} to support Gaza! 🇵🇸\n\nJoin me in supporting Ibrahim's family.\n\n100% goes directly to the family. Every contribution matters! 💚\n\n${NEXT_PUBLIC_URL}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`,
      '_blank',
      'noopener,noreferrer'
    );
    setShareStatus('Opened Twitter composer');
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTxHash = (hash: string) => {
    if (!hash) return '';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Share Your Impact! 🎉</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-purple-100 mt-2">Thank you for supporting Gaza! Share your donation to spread awareness.</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Frame Preview */}
          <div className="text-center">
            <div className="bg-gray-100 rounded-xl p-4 mb-4">
              <img
                src={frameImageUrl}
                alt="Donation Frame"
                className="w-full max-w-sm mx-auto rounded-lg shadow-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RnJhbWUgUHJldmlldyBMb2FkaW5nLi4uPC90ZXh0Pgo8L3N2Zz4K';
                }}
              />
            </div>
            
            {/* Donation Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="text-lg font-bold text-green-800 mb-2">
                ✅ Donation Confirmed!
              </div>
              <div className="text-2xl font-bold text-green-900 mb-2">
                {amount} {token}
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <div>From: <code className="bg-green-100 px-2 py-1 rounded">{formatAddress(userAddress)}</code></div>
                <div>Tx: <code className="bg-green-100 px-2 py-1 rounded">{formatTxHash(txHash)}</code></div>
              </div>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleShareToFarcaster}
              disabled={isSharing}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isSharing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Sharing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11 1.09-.09 2-.35 2-.35V8.99c0-.53-.28-1-.7-1.26L7 5.3 12 2z"/>
                  </svg>
                  Share to Farcaster
                </>
              )}
            </button>

            <button
              onClick={handleShareToTwitter}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Share to Twitter
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleCopyImage}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </button>
              
              <button
                onClick={handleDownloadImage}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
            </div>
          </div>

          {/* Status Message */}
          {shareStatus && (
            <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">{shareStatus}</p>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}