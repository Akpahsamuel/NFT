import React, { useState } from 'react';
import { Upload, Wallet, Sparkles, Image, FileText, Trash2, Edit3 } from 'lucide-react';
import { ConnectButton, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';

interface NFT {
  id: string;
  name: string;
  description: string;
  image_url: string;
  creator: string;
  timestamp: Date;
}

const SuiNFTMinter: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: ''
  });
  
  const [mintedNFTs, setMintedNFTs] = useState<NFT[]>([]);
  const [isMinting, setIsMinting] = useState(false);
  const [activeTab, setActiveTab] = useState<'mint' | 'collection'>('mint');
  const [editingNFT, setEditingNFT] = useState<string | null>(null);
  const [newDescription, setNewDescription] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMint = async () => {
    if (!formData.name || !formData.description || !formData.image_url) {
      alert('Please fill in all fields');
      return;
    }

    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    setIsMinting(true);
    
    // Simulate minting process
    setTimeout(() => {
      const newNFT: NFT = {
        id: `nft_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        image_url: formData.image_url,
        creator: currentAccount.address,
        timestamp: new Date()
      };
      
      setMintedNFTs(prev => [newNFT, ...prev]);
      setFormData({ name: '', description: '', image_url: '' });
      setIsMinting(false);
      setActiveTab('collection');
    }, 2000);
  };

  const handleUpdateDescription = (nftId: string) => {
    setMintedNFTs(prev => 
      prev.map(nft => 
        nft.id === nftId 
          ? { ...nft, description: newDescription }
          : nft
      )
    );
    setEditingNFT(null);
    setNewDescription('');
  };

  const handleBurnNFT = (nftId: string) => {
    if (window.confirm('Are you sure you want to burn this NFT? This action cannot be undone.')) {
      setMintedNFTs(prev => prev.filter(nft => nft.id !== nftId));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-2 py-6">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-cyan-400 mr-3" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Sui NFT Studio
            </h1>
            <Sparkles className="w-8 h-8 text-purple-400 ml-3" />
          </div>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Create, manage, and showcase your unique NFTs on the Sui blockchain
          </p>
        </header>

        {/* Wallet Connection */}
        {!currentAccount ? (
          <div className="max-w-md mx-auto mb-12 flex justify-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 text-center">
              <Wallet className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h3>
              <p className="text-gray-300 mb-6">Connect your Sui wallet to start minting NFTs</p>
              <ConnectButton 
                connectText="Connect Wallet"
              />
            </div>
          </div>
        ) : (
          <>
            {/* Wallet Info */}
            <div className="max-w-md mx-auto mb-8 flex justify-center">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4 text-center">
                <p className="text-gray-300 text-sm mb-2">Connected Wallet</p>
                <p className="text-white font-mono text-sm truncate mb-3">
                  {currentAccount.address.slice(0, 8)}...{currentAccount.address.slice(-8)}
                </p>
                <button
                  onClick={() => disconnect()}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-2 border border-white/20">
                <button
                  onClick={() => setActiveTab('mint')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'mint'
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Mint NFT
                </button>
                <button
                  onClick={() => setActiveTab('collection')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'collection'
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  My Collection ({mintedNFTs.length})
                </button>
              </div>
            </div>

            {/* Mint NFT Tab */}
            {activeTab === 'mint' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
                  <div className="flex items-center mb-6">
                    <Upload className="w-6 h-6 text-cyan-400 mr-3" />
                    <h2 className="text-2xl font-bold text-white">Create New NFT</h2>
                  </div>

                  <div className="space-y-6">
                    {/* NFT Name */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                        <FileText className="w-4 h-4 mr-2" />
                        NFT Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter NFT name"
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
                        required
                      />
                    </div>

                    {/* NFT Description */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe your NFT"
                        rows={4}
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 resize-none"
                        required
                      />
                    </div>

                    {/* Image URL */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                        <Image className="w-4 h-4 mr-2" />
                        Image URL
                      </label>
                      <input
                        type="url"
                        name="image_url"
                        value={formData.image_url}
                        onChange={handleInputChange}
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
                        required
                      />
                    </div>

                    {/* Image Preview */}
                    {formData.image_url && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Preview</label>
                        <div className="relative group">
                          <img
                            src={formData.image_url}
                            alt="NFT Preview"
                            className="w-full h-64 object-cover rounded-xl border border-white/20"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xMDAgNzBMMTMwIDEzMEg3MEwxMDAgNzBaIiBmaWxsPSIjNkI3Mjg2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNDAiIHN0cm9rZT0iIzZCNzI4NiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3Mjg2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPkltYWdlIG5vdCBmb3VuZDwvdGV4dD4KPHN2Zz4K';
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Mint Button */}
                    <button
                      type="button"
                      onClick={handleMint}
                      disabled={isMinting}
                      className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                      {isMinting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Minting NFT...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Sparkles className="w-5 h-5 mr-2" />
                          Mint NFT
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Collection Tab */}
            {activeTab === 'collection' && (
              <div className="max-w-6xl mx-auto">
                {mintedNFTs.length === 0 ? (
                  <div className="text-center py-16">
                    <Image className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-400 mb-2">No NFTs yet</h3>
                    <p className="text-gray-500 mb-6">Start by minting your first NFT</p>
                    <button
                      onClick={() => setActiveTab('mint')}
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                    >
                      Create NFT
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mintedNFTs.map((nft) => (
                      <div key={nft.id} className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden hover:border-cyan-400/50 transition-all duration-300 transform hover:scale-105">
                        <div className="relative">
                          <img
                            src={nft.image_url}
                            alt={nft.name}
                            className="w-full h-64 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xMDAgNzBMMTMwIDEzMEg3MEwxMDAgNzBaIiBmaWxsPSIjNkI3Mjg2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNDAiIHN0cm9rZT0iIzZCNzI4NiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3Mjg2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPkltYWdlIG5vdCBmb3VuZDwvdGV4dD4KPHN2Zz4K';
                            }}
                          />
                          <div className="absolute top-4 right-4 flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingNFT(nft.id);
                                setNewDescription(nft.description);
                              }}
                              className="bg-white/20 backdrop-blur-sm rounded-lg p-2 hover:bg-white/30 transition-all duration-300"
                            >
                              <Edit3 className="w-4 h-4 text-white" />
                            </button>
                            <button
                              onClick={() => handleBurnNFT(nft.id)}
                              className="bg-red-500/20 backdrop-blur-sm rounded-lg p-2 hover:bg-red-500/30 transition-all duration-300"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-white mb-2">{nft.name}</h3>
                          
                          {editingNFT === nft.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm"
                                rows={3}
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleUpdateDescription(nft.id)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm transition-all duration-300"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingNFT(null)}
                                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm transition-all duration-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-300 mb-4 line-clamp-3">{nft.description}</p>
                          )}
                          
                          <div className="space-y-2 text-sm text-gray-400">
                            <div className="flex items-center">
                              <span className="font-medium">Creator:</span>
                              <span className="ml-2">{nft.creator}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium">Minted:</span>
                              <span className="ml-2">{nft.timestamp.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium">ID:</span>
                              <span className="ml-2 font-mono text-xs truncate">{nft.id}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SuiNFTMinter;