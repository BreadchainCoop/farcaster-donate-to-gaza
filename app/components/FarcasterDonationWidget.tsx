'use client';

import { useState, useEffect } from 'react';
import { DONATION_ADDRESS, SUPPORTED_TOKENS } from '../config';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import sdk from '@farcaster/frame-sdk';

export default function FarcasterDonationWidget() {
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('base');
  const [usdEquivalent, setUsdEquivalent] = useState('0.00');
  const [balance, setBalance] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [frameContext, setFrameContext] = useState<any>(null);
  const [isInFarcasterContext, setIsInFarcasterContext] = useState(false);

  const networks = {
    base: { name: 'Base', chainId: 8453, explorer: 'https://basescan.org', rpcUrl: 'https://mainnet.base.org' },
    ethereum: { name: 'Ethereum Mainnet', chainId: 1, explorer: 'https://etherscan.io', rpcUrl: 'https://eth.llamarpc.com' },
    optimism: { name: 'Optimism', chainId: 10, explorer: 'https://optimistic.etherscan.io', rpcUrl: 'https://mainnet.optimism.io' },
    arbitrum: { name: 'Arbitrum', chainId: 42161, explorer: 'https://arbiscan.io', rpcUrl: 'https://arb1.arbitrum.io/rpc' },
    polygon: { name: 'Polygon', chainId: 137, explorer: 'https://polygonscan.com', rpcUrl: 'https://polygon-rpc.com' },
  };

  const tokenPrices: Record<string, number> = {
    ETH: 2300,
    USDT: 1,
    USDC: 1,
    DAI: 1,
  };

  const presetAmounts = [
    { label: '$10', value: 10 },
    { label: '$25', value: 25 },
    { label: '$50', value: 50 },
    { label: '$100', value: 100 },
    { label: '$250', value: 250 },
    { label: '$500', value: 500 },
  ];

  // Initialize Farcaster context
  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        const context = await sdk.context;
        if (context) {
          setFrameContext(context);
          setIsInFarcasterContext(true);
          console.log('Farcaster context available:', context);
          
          // If user is available, set their address
          if (context.user?.username) {
            console.log('Farcaster user:', context.user.username);
          }
        }
      } catch (error) {
        console.log('Not in Farcaster context:', error);
        setIsInFarcasterContext(false);
      }
    };

    initializeFarcaster();
  }, []);

  // Fetch balance when wallet is connected
  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
    }
  }, [walletAddress, selectedNetwork, selectedToken]);

  // Calculate USD equivalent
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      const price = tokenPrices[selectedToken] || 1;
      const usd = (parseFloat(amount) * price).toFixed(2);
      setUsdEquivalent(usd);
    } else {
      setUsdEquivalent('0.00');
    }
  }, [amount, selectedToken]);

  const fetchBalance = async () => {
    if (!walletAddress) return;

    try {
      const network = networks[selectedNetwork as keyof typeof networks];
      
      // For Farcaster context, try to get balance through SDK
      if (isInFarcasterContext) {
        try {
          const provider = await sdk.wallet.ethProvider;
          if (provider) {
            const balanceHex = await provider.request({
              method: 'eth_getBalance',
              params: [walletAddress as `0x${string}`, 'latest']
            });
            const balanceWei = parseInt(balanceHex as string, 16);
            const balanceEth = (balanceWei / 1e18).toFixed(6);
            setBalance(balanceEth);
            return;
          }
        } catch (error) {
          console.log('Failed to get balance through Farcaster SDK:', error);
        }
      }

      // Fallback to RPC call
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
        const balanceEth = (balanceWei / 1e18).toFixed(6);
        setBalance(balanceEth);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('Error');
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Try Farcaster SDK wallet connection first
      if (isInFarcasterContext) {
        try {
          // Request wallet provider from Farcaster
          const provider = await sdk.wallet.ethProvider;
          
          if (provider) {
            // Request accounts
            const accounts = await provider.request({
              method: 'eth_requestAccounts'
            }) as string[];
            
            if (accounts && accounts.length > 0) {
              setWalletAddress(accounts[0]);
              console.log('Connected via Farcaster:', accounts[0]);
              setIsConnecting(false);
              return;
            }
          }
        } catch (farcasterError) {
          console.log('Farcaster wallet connection failed:', farcasterError);
        }
      }

      // Fallback to window.ethereum
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          console.log('Connected via window.ethereum:', accounts[0]);
        }
      } else {
        alert('Please install a Web3 wallet or use this app in Farcaster');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const setAmountFromUSD = (usdValue: number) => {
    const price = tokenPrices[selectedToken] || 1;
    const tokenAmount = (usdValue / price).toFixed(6);
    setAmount(tokenAmount);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(DONATION_ADDRESS);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleDonate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid donation amount');
      return;
    }

    if (!walletAddress) {
      await connectWallet();
      if (!walletAddress) return;
    }

    const network = networks[selectedNetwork as keyof typeof networks];
    const token = SUPPORTED_TOKENS[selectedToken as keyof typeof SUPPORTED_TOKENS];

    try {
      // Try Farcaster SDK transaction first
      if (isInFarcasterContext) {
        try {
          const provider = await sdk.wallet.ethProvider;
          
          if (provider) {
            // Switch to correct network
            try {
              await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${network.chainId.toString(16)}` }],
              });
            } catch (switchError: any) {
              if (switchError.code === 4902) {
                alert(`Please add ${network.name} to your wallet.`);
                return;
              }
            }

            // Send transaction
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

            alert(`Transaction sent! Hash: ${txHash}\n\nThank you for your donation of ${amount} ${selectedToken} (≈$${usdEquivalent})!`);
            setAmount('');
            fetchBalance(); // Update balance after transaction
            return;
          }
        } catch (farcasterError) {
          console.log('Farcaster transaction failed, trying window.ethereum:', farcasterError);
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
            alert(`Please add ${network.name} to your wallet.`);
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

          alert(`Transaction sent! Hash: ${txHash}\n\nThank you for your donation of ${amount} ${selectedToken} (≈$${usdEquivalent})!`);
          setAmount('');
          fetchBalance();
        } else {
          alert(`To send ${token.symbol}, you'll need to:\n\n1. Go to your wallet\n2. Send ${amount} ${token.symbol} to:\n${DONATION_ADDRESS}\n\nMake sure you're on ${network.name}`);
        }
      } else {
        alert('No wallet provider found. Please use Farcaster or install a Web3 wallet.');
      }
    } catch (error: any) {
      console.error('Transaction error:', error);
      if (error.code === 4001) {
        alert('Transaction was cancelled.');
      } else {
        alert('Transaction failed. Please try again.');
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6">Make a Donation</h2>

      {/* Wallet Connection Status */}
      <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-purple-600 font-semibold">
              {isInFarcasterContext ? '🟪 Farcaster Connected' : '🔗 Web3 Wallet'}
            </span>
            {frameContext?.user?.username && (
              <span className="text-sm text-purple-700">@{frameContext.user.username}</span>
            )}
          </div>
          {!walletAddress ? (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 text-sm"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="text-right">
              <p className="text-sm text-purple-700 font-mono">{formatAddress(walletAddress)}</p>
              {balance && (
                <p className="text-xs text-purple-600">Balance: {balance} ETH</p>
              )}
            </div>
          )}
        </div>
        {!walletAddress && (
          <p className="text-xs text-purple-700">
            Connect your wallet to donate directly through {isInFarcasterContext ? 'Farcaster' : 'your browser'}
          </p>
        )}
      </div>

      {/* Amount Input Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Donation Amount
        </label>
        
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.000001"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            {Object.entries(SUPPORTED_TOKENS).map(([key, token]) => (
              <option key={key} value={key}>
                {token.symbol}
              </option>
            ))}
          </select>
        </div>

        {amount && (
          <p className="text-sm text-gray-600 mb-3">
            ≈ ${usdEquivalent} USD
          </p>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {presetAmounts.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setAmountFromUSD(preset.value)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Network Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Network
        </label>
        <select
          value={selectedNetwork}
          onChange={(e) => setSelectedNetwork(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          {Object.entries(networks).map(([key, network]) => (
            <option key={key} value={key}>
              {network.name} {key === 'base' && '(Recommended for Farcaster)'}
            </option>
          ))}
        </select>
      </div>

      {/* Donate Button */}
      <div className="mb-6">
        <button
          onClick={handleDonate}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
        >
          {!walletAddress 
            ? 'Connect Wallet to Donate'
            : amount 
              ? `Donate ${amount} ${selectedToken} (≈$${usdEquivalent})` 
              : 'Enter Amount to Donate'}
        </button>
        
        <p className="text-xs text-gray-600 mt-2 text-center">
          {isInFarcasterContext 
            ? 'Using Farcaster integrated wallet'
            : 'Works with MetaMask, WalletConnect, and other Web3 wallets'}
        </p>
      </div>

      {/* Impact Calculator */}
      {amount && parseFloat(usdEquivalent) > 0 && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Your Impact</h4>
          <div className="text-sm text-green-800 space-y-1">
            {parseFloat(usdEquivalent) >= 150 && (
              <p>✓ Feeds the entire family for {Math.floor(parseFloat(usdEquivalent) / 150)} day(s)</p>
            )}
            {parseFloat(usdEquivalent) >= 45 && parseFloat(usdEquivalent) < 150 && (
              <p>✓ Buys {Math.floor(parseFloat(usdEquivalent) / 45)} kg of flour</p>
            )}
            {parseFloat(usdEquivalent) >= 10 && parseFloat(usdEquivalent) < 45 && (
              <p>✓ Provides essential supplies for the children</p>
            )}
            {parseFloat(usdEquivalent) < 10 && (
              <p>✓ Every donation helps - combines with others for daily needs</p>
            )}
          </div>
        </div>
      )}

      {/* Manual Donation Section */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Manual Donation</h3>
        <p className="text-sm text-gray-600 mb-4">
          Send {amount ? `${amount} ${selectedToken}` : 'any amount'} to this address:
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <code className="text-xs break-all font-mono">{DONATION_ADDRESS}</code>
            <button
              onClick={copyAddress}
              className="ml-2 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition"
            >
              {copiedAddress ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowQR(!showQR)}
          className="text-sm text-purple-600 hover:underline mb-4"
        >
          {showQR ? 'Hide' : 'Show'} QR Code
        </button>

        {showQR && (
          <div className="mb-4 flex justify-center">
            <div className="p-4 bg-white border-2 border-purple-300 rounded">
              <QRCode 
                value={`ethereum:${DONATION_ADDRESS}${amount ? `?value=${parseFloat(amount) * 1e18}` : ''}`} 
                size={200} 
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded">
            <p className="text-xs text-purple-800">
              <strong>Farcaster Users:</strong> This frame integrates directly with your Farcaster wallet for seamless donations on Base network!
            </p>
          </div>
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-xs text-blue-800">
              <strong>Daily Goal:</strong> €150 feeds all 27 family members for one day. 
              {usdEquivalent !== '0.00' && ` Your donation of $${usdEquivalent} makes a real difference!`}
            </p>
          </div>
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