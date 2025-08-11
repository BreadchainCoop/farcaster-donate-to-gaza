'use client';

import { useState, useEffect } from 'react';
import { DONATION_ADDRESS, SUPPORTED_TOKENS } from '../config';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import sdk from '@farcaster/frame-sdk';

export default function MobileDonationWidget() {
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('base');
  const [balance, setBalance] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInFarcasterContext, setIsInFarcasterContext] = useState(false);

  const networks = {
    base: { name: 'Base', chainId: 8453, explorer: 'https://basescan.org', rpcUrl: 'https://mainnet.base.org' },
    gnosis: { name: 'Gnosis', chainId: 100, explorer: 'https://gnosisscan.io', rpcUrl: 'https://rpc.gnosischain.com' },
    ethereum: { name: 'Ethereum', chainId: 1, explorer: 'https://etherscan.io', rpcUrl: 'https://eth.llamarpc.com' },
    optimism: { name: 'Optimism', chainId: 10, explorer: 'https://optimistic.etherscan.io', rpcUrl: 'https://mainnet.optimism.io' },
    arbitrum: { name: 'Arbitrum', chainId: 42161, explorer: 'https://arbiscan.io', rpcUrl: 'https://arb1.arbitrum.io/rpc' },
    polygon: { name: 'Polygon', chainId: 137, explorer: 'https://polygonscan.com', rpcUrl: 'https://polygon-rpc.com' },
  };

  // Initialize Farcaster context
  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        const context = await sdk.context;
        if (context) {
          setIsInFarcasterContext(true);
        }
      } catch (error) {
        setIsInFarcasterContext(false);
      }
    };
    initializeFarcaster();
  }, []);

  // Auto-switch to Gnosis when BREAD is selected
  useEffect(() => {
    if (selectedToken === 'BREAD') {
      setSelectedNetwork('gnosis');
    }
  }, [selectedToken]);

  // Fetch balance when wallet is connected
  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
    }
  }, [walletAddress, selectedNetwork, selectedToken]);

  const fetchBalance = async () => {
    if (!walletAddress) return;

    try {
      const network = networks[selectedNetwork as keyof typeof networks];
      
      // Try Farcaster SDK first
      if (isInFarcasterContext) {
        try {
          const provider = await sdk.wallet.ethProvider;
          if (provider) {
            const balanceHex = await provider.request({
              method: 'eth_getBalance',
              params: [walletAddress as `0x${string}`, 'latest']
            });
            const balanceWei = parseInt(balanceHex as string, 16);
            const balanceEth = (balanceWei / 1e18).toFixed(4);
            setBalance(balanceEth);
            return;
          }
        } catch (error) {
          console.log('Farcaster balance fetch failed:', error);
        }
      }

      // Fallback to RPC
      const response = await fetch(network.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [walletAddress, 'latest'],
          id: 1
        })
      });

      const data = await response.json();
      if (data.result) {
        const balanceWei = parseInt(data.result, 16);
        const balanceEth = (balanceWei / 1e18).toFixed(4);
        setBalance(balanceEth);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('--');
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    
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
              setIsConnecting(false);
              return;
            }
          }
        } catch (farcasterError) {
          console.log('Farcaster wallet failed:', farcasterError);
        }
      }

      // Fallback to window.ethereum
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } else {
        alert('Please install a Web3 wallet to donate');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(DONATION_ADDRESS);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleDonate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!walletAddress) {
      await connectWallet();
      if (!walletAddress) return;
    }

    const network = networks[selectedNetwork as keyof typeof networks];
    const token = SUPPORTED_TOKENS[selectedToken as keyof typeof SUPPORTED_TOKENS];

    try {
      // Try Farcaster SDK first
      if (isInFarcasterContext) {
        try {
          const provider = await sdk.wallet.ethProvider;
          
          if (provider) {
            // Switch network
            try {
              await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${network.chainId.toString(16)}` }],
              });
            } catch (switchError: any) {
              if (switchError.code === 4902) {
                alert(`Please add ${network.name} to your wallet`);
                return;
              }
            }

            if (token.isNative) {
              const value = ('0x' + Math.floor(parseFloat(amount) * 1e18).toString(16)) as `0x${string}`;
              const txHash = await provider.request({
                method: 'eth_sendTransaction',
                params: [{
                  from: walletAddress as `0x${string}`,
                  to: DONATION_ADDRESS as `0x${string}`,
                  value: value,
                  data: '0x' as `0x${string}`,
                }],
              });

              alert(`Transaction sent!\nHash: ${txHash}`);
              setAmount('');
              fetchBalance();
              return;
            } else {
              // For tokens, show manual instructions
              alert(`To send ${token.symbol}:\n\n1. Switch to ${network.name}\n2. Send ${amount} ${token.symbol} to:\n${DONATION_ADDRESS}`);
              return;
            }
          }
        } catch (farcasterError) {
          console.log('Farcaster tx failed:', farcasterError);
        }
      }

      // Fallback to window.ethereum
      if (typeof window.ethereum !== 'undefined') {
        // Switch network
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${network.chainId.toString(16)}` }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            alert(`Please add ${network.name} to your wallet`);
            return;
          }
        }

        if (token.isNative) {
          const value = ('0x' + (parseFloat(amount) * 1e18).toString(16)) as `0x${string}`;
          const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              to: DONATION_ADDRESS as `0x${string}`,
              from: walletAddress as `0x${string}`,
              value: value,
            }],
          });

          alert(`Transaction sent!\nHash: ${txHash}`);
          setAmount('');
          fetchBalance();
        } else {
          alert(`To send ${token.symbol}:\n\n1. You're now on ${network.name}\n2. Send ${amount} ${token.symbol} to:\n${DONATION_ADDRESS}`);
        }
      } else {
        alert('No wallet found. Please install a Web3 wallet.');
      }
    } catch (error: any) {
      console.error('Transaction error:', error);
      if (error.code === 4001) {
        alert('Transaction cancelled');
      } else {
        alert('Transaction failed');
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Quick amount buttons - no USD, just token amounts
  const quickAmounts = selectedToken === 'ETH' 
    ? ['0.001', '0.005', '0.01', '0.05', '0.1', '0.5']
    : selectedToken === 'BREAD'
    ? ['10', '50', '100', '500', '1000', '5000']
    : ['10', '25', '50', '100', '250', '500'];

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4">
        <h2 className="text-xl font-bold text-white">Make a Donation</h2>
        <p className="text-purple-100 text-sm mt-1">100% goes directly to the family</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Wallet Status - Simplified */}
        {walletAddress ? (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="text-xs text-gray-500">Connected</p>
              <p className="font-mono text-sm">{formatAddress(walletAddress)}</p>
            </div>
            {balance && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Balance</p>
                <p className="font-semibold text-sm">{balance} {selectedToken === 'BREAD' && selectedNetwork === 'gnosis' ? 'xDAI' : 'ETH'}</p>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 transition"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}

        {/* Token & Network Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Select Token</label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {Object.entries(SUPPORTED_TOKENS).map(([key, token]) => (
              <option key={key} value={key}>
                {token.symbol} {key === 'BREAD' && '(Gnosis)'}
              </option>
            ))}
          </select>
        </div>

        {/* Network Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Network</label>
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
            disabled={selectedToken === 'BREAD'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
          >
            {Object.entries(networks).map(([key, network]) => (
              <option key={key} value={key}>
                {network.name} {key === 'base' && '⭐'}
              </option>
            ))}
          </select>
          {selectedToken === 'BREAD' && (
            <p className="text-xs text-gray-500">BREAD is only on Gnosis Chain</p>
          )}
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Amount</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="any"
              min="0"
              className="w-full px-3 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              {selectedToken}
            </span>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {quickAmounts.map((quickAmount) => (
            <button
              key={quickAmount}
              onClick={() => setAmount(quickAmount)}
              className="py-2 px-3 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium"
            >
              {quickAmount}
            </button>
          ))}
        </div>

        {/* Donate Button */}
        <button
          onClick={handleDonate}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-lg"
        >
          {!walletAddress 
            ? 'Connect Wallet First'
            : amount 
              ? `Donate ${amount} ${selectedToken}` 
              : 'Enter Amount'}
        </button>

        {/* Manual Donation Section */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Manual Transfer</h3>
            <button
              onClick={() => setShowQR(!showQR)}
              className="text-sm text-purple-600 hover:underline"
            >
              {showQR ? 'Hide' : 'Show'} QR
            </button>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Send to this address:</p>
            <div className="flex items-center justify-between">
              <code className="text-xs font-mono break-all">{DONATION_ADDRESS}</code>
              <button
                onClick={copyAddress}
                className="ml-2 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition shrink-0"
              >
                {copiedAddress ? '✓' : 'Copy'}
              </button>
            </div>
          </div>

          {showQR && (
            <div className="mt-3 flex justify-center p-4 bg-white rounded-lg">
              <QRCode 
                value={`ethereum:${DONATION_ADDRESS}`} 
                size={160} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    ethereum?: any;
  }
}