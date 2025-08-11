'use client';

import { useState, useEffect } from 'react';
import { DONATION_ADDRESS, SUPPORTED_TOKENS } from '../config';
import sdk from '@farcaster/frame-sdk';

type TransactionState = 'idle' | 'connecting' | 'switching' | 'signing' | 'pending' | 'confirmed' | 'failed';

export default function EnhancedDonationWidget() {
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'BREAD'>('USDC');
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [txState, setTxState] = useState<TransactionState>('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [txError, setTxError] = useState<string>('');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isInFarcasterContext, setIsInFarcasterContext] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const networks = {
    base: { 
      name: 'Base', 
      chainId: 8453, 
      rpcUrl: 'https://mainnet.base.org',
      blockExplorer: 'https://basescan.org',
    },
    gnosis: { 
      name: 'Gnosis', 
      chainId: 100, 
      rpcUrl: 'https://rpc.gnosischain.com',
      blockExplorer: 'https://gnosisscan.io',
    },
  };

  // Check Farcaster context
  useEffect(() => {
    const checkContext = async () => {
      try {
        const context = await sdk.context;
        if (context) {
          setIsInFarcasterContext(true);
        }
      } catch {
        setIsInFarcasterContext(false);
      }
    };
    checkContext();
  }, []);

  // Monitor transaction status
  useEffect(() => {
    if (txHash && txState === 'pending') {
      const checkTxStatus = async () => {
        const token = SUPPORTED_TOKENS[selectedToken];
        const network = networks[token.network as keyof typeof networks];
        
        try {
          const response = await fetch(network.rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getTransactionReceipt',
              params: [txHash],
              id: 1
            })
          });
          
          const data = await response.json();
          if (data.result) {
            if (data.result.status === '0x1') {
              setTxState('confirmed');
            } else {
              setTxState('failed');
              setTxError('Transaction failed on chain');
            }
          }
        } catch (error) {
          console.error('Error checking tx status:', error);
        }
      };

      const interval = setInterval(checkTxStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [txHash, txState, selectedToken]);

  const connectWallet = async () => {
    setTxState('connecting');
    setTxError('');
    
    try {
      // Try Farcaster SDK first
      if (isInFarcasterContext) {
        try {
          const provider = await sdk.wallet.ethProvider;
          if (provider) {
            const accounts = await provider.request({
              method: 'eth_requestAccounts'
            }) as string[];
            
            if (accounts && accounts.length > 0) {
              setWalletAddress(accounts[0]);
              setTxState('idle');
              return;
            }
          }
        } catch (error) {
          console.log('Farcaster wallet failed:', error);
        }
      }

      // Fallback to window.ethereum
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setTxState('idle');
        }
      } else {
        setTxError('Please install MetaMask or another Web3 wallet');
        setTxState('failed');
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setTxError(error.message || 'Failed to connect wallet');
      setTxState('failed');
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(DONATION_ADDRESS);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const sendTransaction = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setTxError('Please enter a valid amount');
      return;
    }

    if (!walletAddress) {
      await connectWallet();
      if (!walletAddress) return;
    }

    const token = SUPPORTED_TOKENS[selectedToken];
    const network = networks[token.network as keyof typeof networks];
    
    setTxState('switching');
    setTxError('');
    setTxHash('');

    try {
      let provider: any;
      
      // Get provider
      if (isInFarcasterContext) {
        try {
          provider = await sdk.wallet.ethProvider;
        } catch {
          provider = window.ethereum;
        }
      } else {
        provider = window.ethereum;
      }

      if (!provider) {
        setTxError('No wallet provider found');
        setTxState('failed');
        return;
      }

      // Switch to correct network
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${network.chainId.toString(16)}` }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          // Try to add the network
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${network.chainId.toString(16)}`,
                chainName: network.name,
                nativeCurrency: {
                  name: network.name === 'Base' ? 'ETH' : 'xDAI',
                  symbol: network.name === 'Base' ? 'ETH' : 'xDAI',
                  decimals: 18,
                },
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.blockExplorer],
              }],
            });
          } catch (addError) {
            setTxError(`Please add ${network.name} network to your wallet`);
            setTxState('failed');
            return;
          }
        } else {
          throw switchError;
        }
      }

      setTxState('signing');

      // Prepare transaction for ERC20 token transfer
      const amountInWei = BigInt(Math.floor(parseFloat(amount) * 10 ** token.decimals)).toString(16);
      
      // ERC20 transfer function signature: transfer(address,uint256)
      const transferFunctionSignature = '0xa9059cbb';
      const recipientAddress = DONATION_ADDRESS.slice(2).padStart(64, '0');
      const transferAmount = amountInWei.padStart(64, '0');
      const data = transferFunctionSignature + recipientAddress + transferAmount;

      // Send transaction
      const hash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress as `0x${string}`,
          to: token.address as `0x${string}`,
          data: data as `0x${string}`,
          gas: '0x30000', // 196,608 gas limit
        }],
      });

      setTxHash(hash);
      setTxState('pending');
      setAmount('');

    } catch (error: any) {
      console.error('Transaction error:', error);
      if (error.code === 4001) {
        setTxError('Transaction cancelled by user');
      } else if (error.message?.includes('insufficient funds')) {
        setTxError('Insufficient balance for transaction');
      } else {
        setTxError(error.message || 'Transaction failed');
      }
      setTxState('failed');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getExplorerUrl = () => {
    if (!txHash) return '';
    const token = SUPPORTED_TOKENS[selectedToken];
    const network = networks[token.network as keyof typeof networks];
    return `${network.blockExplorer}/tx/${txHash}`;
  };

  // Quick amounts based on token
  const quickAmounts = selectedToken === 'USDC' 
    ? ['10', '25', '50', '100', '250', '500']
    : ['100', '250', '500', '1000', '2500', '5000'];

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Context Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-4 border-l-4 border-purple-500">
        <h3 className="font-bold text-gray-900 mb-2">Support Ibrahim's Family in Gaza</h3>
        <p className="text-sm text-gray-700 mb-3">
          Your donation directly supports Ibrahim, 26, and his family of 27 people displaced in Deir al-Balah. 
          This includes his pregnant wife, elders, children, and a disabled adult.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-xl font-bold text-red-600">€150/day</div>
            <div className="text-xs text-gray-600">Basic food for 27 people</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xl font-bold text-blue-600">100%</div>
            <div className="text-xs text-gray-600">Direct to family</div>
          </div>
        </div>
        <div className="mb-3">
          <a 
            href="https://sindominio.net/ibrahimfriends/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <span>Visit Ibrahim Friends website</span>
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
        >
          {showInfo ? 'Hide details ▲' : 'Learn more ▼'}
        </button>
        
        {showInfo && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-sm text-gray-600">
            <p><strong>Why crypto?</strong> Immediate transfer, avoids frozen bank accounts, more access points than banks.</p>
            <p><strong>100% goes to family:</strong> We're volunteers, no admin costs. Daily direct transfers.</p>
            <p><strong>Current prices in Gaza:</strong> Flour $45/kg, Chicken $100 (when available).</p>
          </div>
        )}
      </div>

      {/* Main Donation Card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
          <h2 className="text-xl font-bold text-white text-center">Make a Donation</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Token Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Select Token</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedToken('USDC')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                  selectedToken === 'USDC' 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-lg">USDC</div>
                <div className="text-xs text-gray-600">on Base</div>
              </button>
              <button
                onClick={() => setSelectedToken('BREAD')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                  selectedToken === 'BREAD' 
                    ? 'border-orange-500 bg-orange-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-lg">BREAD 🍞</div>
                <div className="text-xs text-gray-600">on Gnosis</div>
              </button>
            </div>
          </div>

          {/* Wallet Connection */}
          {!walletAddress ? (
            <button
              onClick={connectWallet}
              disabled={txState === 'connecting'}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 transform hover:scale-105 disabled:scale-100"
            >
              {txState === 'connecting' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </span>
              ) : 'Connect Wallet'}
            </button>
          ) : (
            <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm text-gray-600">Connected</span>
                </div>
                <span className="font-mono text-sm font-medium">{formatAddress(walletAddress)}</span>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="any"
                min="0"
                className="w-full px-4 py-3 pr-16 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg transition-all duration-200"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium bg-white px-2">
                {selectedToken}
              </span>
            </div>
            {amount && selectedToken === 'USDC' && (
              <p className="text-xs text-gray-500">
                ≈ {(parseFloat(amount) / 150).toFixed(2)} days of food for the family
              </p>
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount)}
                className="py-2 px-3 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 font-medium transform hover:scale-105"
              >
                {quickAmount}
              </button>
            ))}
          </div>

          {/* Send Button */}
          <button
            onClick={sendTransaction}
            disabled={!amount || parseFloat(amount) <= 0 || ['connecting', 'switching', 'signing', 'pending'].includes(txState)}
            className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 transform hover:scale-105 disabled:scale-100 text-lg"
          >
            {txState === 'switching' ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Switching Network...
              </span>
            ) : txState === 'signing' ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sign in Wallet...
              </span>
            ) : txState === 'pending' ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Transaction Pending...
              </span>
            ) : (
              `Send ${amount || '0'} ${selectedToken}`
            )}
          </button>

          {/* Transaction Status */}
          {txHash && (
            <div className={`p-4 rounded-xl transition-all duration-500 ${
              txState === 'pending' ? 'bg-blue-50 border border-blue-200' :
              txState === 'confirmed' ? 'bg-green-50 border border-green-200 animate-pulse' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${
                    txState === 'pending' ? 'text-blue-900' :
                    txState === 'confirmed' ? 'text-green-900' :
                    'text-red-900'
                  }`}>
                    {txState === 'pending' ? '⏳ Transaction Pending' :
                     txState === 'confirmed' ? '✅ Transaction Confirmed!' :
                     '❌ Transaction Failed'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 font-mono break-all">
                    {formatAddress(txHash)}
                  </p>
                </div>
                <a
                  href={getExplorerUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`ml-2 px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${
                    selectedToken === 'USDC' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                >
                  View on {selectedToken === 'USDC' ? 'Basescan' : 'Gnosisscan'}
                </a>
              </div>
              {txState === 'pending' && (
                <div className="mt-2">
                  <div className="w-full bg-blue-200 rounded-full h-1 overflow-hidden">
                    <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ animation: 'loading 2s ease-in-out infinite' }}></div>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">Waiting for confirmation...</p>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {txError && txState === 'failed' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-800">⚠️ {txError}</p>
            </div>
          )}

          {/* Manual Transfer Info */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">Manual Transfer</h3>
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="text-xs text-gray-600 mb-2">
                Send {selectedToken} on {selectedToken === 'USDC' ? 'Base' : 'Gnosis'} to:
              </p>
              <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                <code className="text-xs font-mono break-all text-gray-700">{DONATION_ADDRESS}</code>
                <button
                  onClick={copyAddress}
                  className={`ml-2 px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 transform ${
                    copiedAddress 
                      ? 'bg-green-600 text-white scale-95' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:scale-105'
                  }`}
                >
                  {copiedAddress ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}

declare global {
  interface Window {
    ethereum?: any;
  }
}