'use client';

import { useState, useEffect } from 'react';
import { DONATION_ADDRESS, SUPPORTED_TOKENS } from '../config';
import sdk from '@farcaster/frame-sdk';

export default function SimplifiedDonationWidget() {
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'BREAD'>('USDC');
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [txStatus, setTxStatus] = useState<string>('');
  const [copiedAddress, setCopiedAddress] = useState(false);

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

  // Auto-detect Farcaster context
  const [isInFarcasterContext, setIsInFarcasterContext] = useState(false);
  
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

  const connectWallet = async () => {
    setIsConnecting(true);
    setTxStatus('');
    
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
        } catch (error) {
          console.log('Farcaster wallet connection failed:', error);
        }
      }

      // Fallback to window.ethereum
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } else {
        alert('Please install a Web3 wallet (like MetaMask) to donate');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setTxStatus('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(DONATION_ADDRESS);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const sendTransaction = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setTxStatus('Please enter a valid amount');
      return;
    }

    if (!walletAddress) {
      await connectWallet();
      if (!walletAddress) return;
    }

    const token = SUPPORTED_TOKENS[selectedToken];
    const network = networks[token.network as keyof typeof networks];
    
    setTxStatus('Processing transaction...');

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
        setTxStatus('No wallet provider found');
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
            setTxStatus(`Please add ${network.name} network to your wallet`);
            return;
          }
        } else {
          throw switchError;
        }
      }

      // Prepare transaction for ERC20 token transfer
      const amountInWei = BigInt(Math.floor(parseFloat(amount) * 10 ** token.decimals)).toString(16);
      
      // ERC20 transfer function signature: transfer(address,uint256)
      const transferFunctionSignature = '0xa9059cbb';
      const recipientAddress = DONATION_ADDRESS.slice(2).padStart(64, '0');
      const transferAmount = amountInWei.padStart(64, '0');
      const data = transferFunctionSignature + recipientAddress + transferAmount;

      // Send transaction
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress as `0x${string}`,
          to: token.address as `0x${string}`,
          data: data as `0x${string}`,
          gas: '0x30000', // 196,608 gas limit
        }],
      });

      setTxStatus(`✅ Transaction sent! Hash: ${txHash.slice(0, 10)}...`);
      setAmount('');
      
      // Open block explorer
      const explorerUrl = `${network.blockExplorer}/tx/${txHash}`;
      setTimeout(() => {
        if (confirm('View transaction on block explorer?')) {
          window.open(explorerUrl, '_blank');
        }
      }, 1000);

    } catch (error: any) {
      console.error('Transaction error:', error);
      if (error.code === 4001) {
        setTxStatus('Transaction cancelled');
      } else if (error.message?.includes('insufficient funds')) {
        setTxStatus('Insufficient balance for transaction');
      } else {
        setTxStatus(`Error: ${error.message || 'Transaction failed'}`);
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Quick amounts based on token
  const quickAmounts = selectedToken === 'USDC' 
    ? ['10', '25', '50', '100', '250', '500']
    : ['100', '250', '500', '1000', '2500', '5000'];

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Donate to Gaza</h2>
      
      {/* Token Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Select Token</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedToken('USDC')}
            className={`p-4 rounded-lg border-2 transition ${
              selectedToken === 'USDC' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">USDC</div>
            <div className="text-xs text-gray-600">on Base</div>
          </button>
          <button
            onClick={() => setSelectedToken('BREAD')}
            className={`p-4 rounded-lg border-2 transition ${
              selectedToken === 'BREAD' 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">BREAD 🍞</div>
            <div className="text-xs text-gray-600">on Gnosis</div>
          </button>
        </div>
      </div>

      {/* Wallet Connection */}
      {!walletAddress ? (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full mb-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 transition"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Connected:</span>
            <span className="font-mono text-sm">{formatAddress(walletAddress)}</span>
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="any"
            min="0"
            className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
            {selectedToken}
          </span>
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-6">
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

      {/* Send Button */}
      <button
        onClick={sendTransaction}
        disabled={!amount || parseFloat(amount) <= 0}
        className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-lg mb-4"
      >
        Send {amount || '0'} {selectedToken}
      </button>

      {/* Status Message */}
      {txStatus && (
        <div className={`p-3 rounded-lg text-sm ${
          txStatus.includes('✅') ? 'bg-green-50 text-green-800' : 
          txStatus.includes('Processing') ? 'bg-blue-50 text-blue-800' : 
          'bg-red-50 text-red-800'
        }`}>
          {txStatus}
        </div>
      )}

      {/* Manual Transfer Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="font-medium text-gray-900 mb-3">Manual Transfer</h3>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 mb-2">
            Send {selectedToken} on {selectedToken === 'USDC' ? 'Base' : 'Gnosis'} to:
          </p>
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
      </div>
    </div>
  );
}

declare global {
  interface Window {
    ethereum?: any;
  }
}