'use client';

import { useState, useEffect, useRef } from 'react';
import sdk from '@farcaster/frame-sdk';
import html2canvas from 'html2canvas';

interface ShareDonationFrameProps {
  amount: string;
  asset: string;
  userAddress: string;
  txHash: string;
  onClose: () => void;
}

export default function ShareDonationFrame({ 
  amount, 
  asset, 
  userAddress, 
  txHash,
  onClose 
}: ShareDonationFrameProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  // Generate frame image on mount
  useEffect(() => {
    generateFrameImage();
  }, []);

  const generateFrameImage = async () => {
    if (!frameRef.current) return;
    
    setIsGenerating(true);
    try {
      // Wait a bit for the component to fully render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(frameRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      setImageDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating frame image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const shareToFarcaster = async () => {
    if (!imageDataUrl) {
      await generateFrameImage();
      return;
    }

    setIsSharing(true);
    try {
      // Check if we're in Farcaster context
      const context = await sdk.context;
      
      if (context) {
        // Use Farcaster SDK to open composer with the message
        const message = `🎉 I just donated ${amount} ${asset} to support families in Gaza through @breadchain! 

Every donation helps provide essential food and supplies. Join me in making a difference! 🌍❤️

Transaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}

Donate: https://farcaster-donate-to-gaza.vercel.app`;

        await sdk.actions.openUrl(
          `https://warpcast.com/~/compose?text=${encodeURIComponent(message)}`
        );
        
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        // Fallback for non-Farcaster contexts - open in new window
        const message = `🎉 I just donated ${amount} ${asset} to support families in Gaza!

Every donation helps provide essential food and supplies. Join me in making a difference! 🌍❤️

Transaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`;
        
        const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error sharing to Farcaster:', error);
      alert('Failed to share to Farcaster. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const downloadImage = () => {
    if (!imageDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `donation-gaza-${Date.now()}.png`;
    link.href = imageDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyImageToClipboard = async () => {
    if (!imageDataUrl) return;
    
    try {
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Try to use the Clipboard API if available
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else if (navigator.clipboard?.writeText) {
        // Fallback: copy the shareable text instead
        const text = `I just donated ${amount} ${asset} to support families in Gaza! 🌍❤️\nTx: ${txHash}`;
        await navigator.clipboard.writeText(text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        alert('Clipboard API not available');
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback to copying text
      const text = `I just donated ${amount} ${asset} to support families in Gaza! 🌍❤️\nTx: ${txHash}`;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        }).catch(() => {
          alert('Unable to copy to clipboard');
        });
      } else {
        alert('Unable to copy to clipboard');
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTxHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Thank You for Your Donation! 🎉</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Frame Preview */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Your donation is making a real difference! Share your support to inspire others:
            </p>
          </div>

          {/* Frame to be captured */}
          <div className="flex justify-center mb-6">
            <div 
              ref={frameRef}
              className="relative bg-gradient-to-br from-purple-600 to-pink-500 p-8 rounded-xl shadow-xl"
              style={{ width: '500px', height: '500px' }}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`,
                }}></div>
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center">
                {/* Watermelon emoji as logo */}
                <div className="text-6xl mb-4">🍉</div>
                
                <h3 className="text-3xl font-bold mb-2">I Donated!</h3>
                
                <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-4 mb-4">
                  <p className="text-4xl font-bold mb-1">
                    {amount} {asset}
                  </p>
                  <p className="text-sm opacity-90">
                    to support families in Gaza
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="opacity-90">
                    From: {formatAddress(userAddress)}
                  </p>
                  <p className="opacity-90">
                    Tx: {formatTxHash(txHash)}
                  </p>
                </div>

                <div className="mt-6 space-y-1">
                  <p className="text-lg font-semibold">Every donation matters</p>
                  <p className="text-sm opacity-90">Join us at breadchain.xyz</p>
                </div>

                {/* Breadchain branding */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs opacity-75">
                  <span>Powered by</span>
                  <span className="font-bold">Breadchain 🍞</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={shareToFarcaster}
              disabled={isSharing || isGenerating}
              className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
            >
              {isSharing ? (
                <>Sharing...</>
              ) : shareSuccess ? (
                <>✓ Shared!</>
              ) : (
                <>
                  <span>🟪</span>
                  Share to Farcaster
                </>
              )}
            </button>

            <button
              onClick={downloadImage}
              disabled={!imageDataUrl || isGenerating}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
            >
              <span>⬇️</span>
              Download Image
            </button>

            <button
              onClick={copyImageToClipboard}
              disabled={!imageDataUrl || isGenerating}
              className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
            >
              {copySuccess ? (
                <>✓ Copied!</>
              ) : (
                <>
                  <span>📋</span>
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              Your donation helps provide essential food and supplies to families in need. 
              Thank you for making a difference! 🌍❤️
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}