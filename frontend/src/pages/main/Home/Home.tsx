import React, { useState, useEffect } from 'react';
import { Upload, Wallet, Sparkles, Image, FileText, Trash2, Edit3, RefreshCw, Link, Cloud } from 'lucide-react';
import { ConnectButton, useCurrentAccount, useDisconnectWallet, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { WalrusService, type WalrusBlob } from '../../../services/walrus';

interface NFT {
  id: string;
  name: string;
  description: string;
  image_url: string;
  creator: string;
  timestamp: Date;
  minting_time?: number;
  walrus_blob_id?: string;
}

type ImageInputMethod = 'file' | 'url';

const SuiNFTMinter: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  // Contract configuration
  const NFT_PACKAGE_ID = "0xc6aa3596fec7b0778dbb42e5932277b09b7cfea25beb21bf9b56c715c53d7a1e";
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: ''
  });
  
  const [imageInputMethod, setImageInputMethod] = useState<ImageInputMethod>('file');
  const [walrusBlob, setWalrusBlob] = useState<WalrusBlob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  
  const [mintedNFTs, setMintedNFTs] = useState<NFT[]>([]);
  const [isMinting, setIsMinting] = useState(false);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [activeTab, setActiveTab] = useState<'mint' | 'collection'>('mint');
  const [editingNFT, setEditingNFT] = useState<string | null>(null);
  const [newDescription, setNewDescription] = useState('');

  // Fetch user's NFTs from the blockchain
  const fetchUserNFTs = async () => {
    if (!currentAccount || !suiClient) return;
    
    setIsLoadingNFTs(true);
    try {
      // Get all objects owned by the user
      const objects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: `${NFT_PACKAGE_ID}::sui_nft::Sui_nft`
        },
        options: {
          showDisplay: true,
          showContent: true,
        }
      });

      const nfts: NFT[] = [];
      
      for (const obj of objects.data) {
        if (obj.data?.content?.dataType === 'moveObject' && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as any;
          const mintingTime = fields.minting_time ? Number(fields.minting_time) : Date.now();
          
          nfts.push({
            id: obj.data.objectId,
            name: fields.name || 'Unknown',
            description: fields.description || 'No description',
            image_url: fields.image_url || '',
            creator: currentAccount.address,
            timestamp: new Date(mintingTime),
            minting_time: mintingTime,
            walrus_blob_id: fields.walrus_blob_id || undefined
          });
        }
      }
      
      setMintedNFTs(nfts);
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
    } finally {
      setIsLoadingNFTs(false);
    }
  };

  // Load NFTs when wallet connects
  useEffect(() => {
    if (currentAccount) {
      fetchUserNFTs();
    } else {
      setMintedNFTs([]);
    }
  }, [currentAccount?.address]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress('Uploading to Walrus...');
    
    try {
      // Pass the user's address to ensure blob ownership
      const blob = await WalrusService.uploadFile(file, currentAccount?.address);
      setWalrusBlob(blob);
      setFormData(prev => ({
        ...prev,
        image_url: blob.walrusUrl
      }));
      
      // Check blob certification with progress updates
      setUploadProgress('Upload successful! Waiting for blob certification...');
      
      const isCertified = await WalrusService.waitForBlobCertification(
        blob.blobId,
        (message) => setUploadProgress(message)
      );
      
      if (isCertified) {
        setUploadProgress('File uploaded and certified successfully!');
      } else {
        setUploadProgress('File uploaded! Certification may take a few more moments.');
      }
      
      setTimeout(() => setUploadProgress(''), 3000);
    } catch (error) {
      console.error('File upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to upload file to Walrus: ${errorMessage}`);
      setUploadProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlToWalrus = async () => {
    if (!formData.image_url.trim()) {
      alert('Please enter a valid URL');
      return;
    }

    // Check if it's already a Walrus URL
    if (WalrusService.isWalrusUrl(formData.image_url)) {
      alert('This is already a Walrus URL');
      return;
    }

    setIsUploading(true);
    setUploadProgress('Fetching from URL and uploading to Walrus...');
    
    try {
      // Pass the user's address to ensure blob ownership
      const blob = await WalrusService.uploadFromUrl(formData.image_url, currentAccount?.address);
      setWalrusBlob(blob);
      setFormData(prev => ({
        ...prev,
        image_url: blob.walrusUrl
      }));
      
      // Check blob certification with progress updates
      setUploadProgress('Upload successful! Waiting for blob certification...');
      
      const isCertified = await WalrusService.waitForBlobCertification(
        blob.blobId,
        (message) => setUploadProgress(message)
      );
      
      if (isCertified) {
        setUploadProgress('URL content uploaded and certified successfully!');
      } else {
        setUploadProgress('URL content uploaded! Certification may take a few more moments.');
      }
      
      setTimeout(() => setUploadProgress(''), 3000);
    } catch (error) {
      console.error('URL upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to upload URL to Walrus: ${errorMessage}`);
      setUploadProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  const resetImageInput = () => {
    setWalrusBlob(null);
    setFormData(prev => ({
      ...prev,
      image_url: ''
    }));
    setUploadProgress('');
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

    // Validate argument sizes (Sui has a 16KB limit for pure arguments)
    const nameBytes = new TextEncoder().encode(formData.name);
    const descriptionBytes = new TextEncoder().encode(formData.description);
    const imageUrlBytes = new TextEncoder().encode(formData.image_url);

    if (nameBytes.length > 15000) {
      alert('NFT name is too long. Please use a shorter name.');
      return;
    }

    if (descriptionBytes.length > 15000) {
      alert('Description is too long. Please use a shorter description.');
      return;
    }

    if (imageUrlBytes.length > 15000) {
      alert('Image URL is too long. Please use a shorter URL.');
      return;
    }

    setIsMinting(true);
    
    try {
      // Create transaction for minting NFT
      const tx = new Transaction();
      
      // Prepare arguments
      const args = [
        tx.pure.vector('u8', nameBytes),
        tx.pure.vector('u8', descriptionBytes),
        tx.pure.vector('u8', imageUrlBytes),
      ];

      // Add Walrus blob ID if available
      if (walrusBlob?.blobId) {
        const blobIdBytes = new TextEncoder().encode(walrusBlob.blobId);
        args.push(tx.pure.option('vector<u8>', Array.from(blobIdBytes)));
      } else {
        args.push(tx.pure.option('vector<u8>', null));
      }

      args.push(tx.object('0x6')); // Clock object ID (shared object)

      // Call the mint_with_walrus function from the smart contract
      tx.moveCall({
        target: `${NFT_PACKAGE_ID}::sui_nft::mint_with_walrus`,
        arguments: args,
      });

      // Sign and execute the transaction
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Minting successful:', result);
            
            // Refresh NFTs from blockchain
            fetchUserNFTs();
            
            // Reset form
            setFormData({ name: '', description: '', image_url: '' });
            setWalrusBlob(null);
            setIsMinting(false);
            setActiveTab('collection');
            
            alert('NFT minted successfully!');
          },
          onError: (error) => {
            console.error('Minting failed:', error);
            setIsMinting(false);
            alert(`Minting failed: ${error.message}`);
          },
        }
      );
    } catch (error) {
      console.error('Transaction preparation failed:', error);
      setIsMinting(false);
      alert(`Failed to prepare transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateDescription = async (nftId: string) => {
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    // Validate description size
    const descriptionBytes = new TextEncoder().encode(newDescription);
    if (descriptionBytes.length > 15000) {
      alert('Description is too long. Please use a shorter description.');
      return;
    }

    try {
      const tx = new Transaction();
      
      // Call update_description function with actual NFT object
      tx.moveCall({
        target: `${NFT_PACKAGE_ID}::sui_nft::update_description`,
        arguments: [
          tx.object(nftId), // Use actual NFT object ID
          tx.pure.vector('u8', descriptionBytes),
        ],
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Update successful:', result);
            
            // Update local state
            setMintedNFTs(prev => 
              prev.map(nft => 
                nft.id === nftId 
                  ? { ...nft, description: newDescription }
                  : nft
              )
            );
            setEditingNFT(null);
            setNewDescription('');
            
            alert('NFT description updated successfully!');
          },
          onError: (error) => {
            console.error('Update failed:', error);
            alert(`Update failed: ${error.message}`);
          },
        }
      );
       
    } catch (error) {
      console.error('Update failed:', error);
      alert(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleBurnNFT = async (nftId: string) => {
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    if (!window.confirm('Are you sure you want to burn this NFT? This action cannot be undone.')) {
      return;
    }

    try {
      const tx = new Transaction();
      
      // Call burn function with actual NFT object
      tx.moveCall({
        target: `${NFT_PACKAGE_ID}::sui_nft::burn`,
        arguments: [
          tx.object(nftId), // Use actual NFT object ID
        ],
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Burn successful:', result);
            
            // Remove from local state
            setMintedNFTs(prev => prev.filter(nft => nft.id !== nftId));
            
            alert('NFT burned successfully!');
          },
          onError: (error) => {
            console.error('Burn failed:', error);
            alert(`Burn failed: ${error.message}`);
          },
        }
      );
       
    } catch (error) {
      console.error('Burn failed:', error);
      alert(`Burn failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 w-full">
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
            Create, manage, and showcase your unique NFTs on the Sui blockchain with Walrus decentralized storage
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
                      <label className="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          NFT Name
                        </div>
                        <span className={`text-xs ${formData.name.length > 100 ? 'text-red-400' : 'text-gray-500'}`}>
                          {formData.name.length}/200
                        </span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter NFT name"
                        maxLength={200}
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
                        required
                      />
                    </div>

                    {/* NFT Description */}
                    <div>
                      <label className="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                        <div className="flex items-center">
                          <Edit3 className="w-4 h-4 mr-2" />
                          Description
                        </div>
                        <span className={`text-xs ${formData.description.length > 1000 ? 'text-red-400' : 'text-gray-500'}`}>
                          {formData.description.length}/2000
                        </span>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe your NFT"
                        rows={4}
                        maxLength={2000}
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 resize-none"
                        required
                      />
                    </div>

                    {/* Image Input Method Selection */}
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-3 block">
                        Choose Image Input Method
                      </label>
                      <div className="flex space-x-4 mb-4">
                        <button
                          type="button"
                          onClick={() => {
                            setImageInputMethod('file');
                            resetImageInput();
                          }}
                          className={`flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${
                            imageInputMethod === 'file'
                              ? 'bg-cyan-500 text-white'
                              : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setImageInputMethod('url');
                            resetImageInput();
                          }}
                          className={`flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${
                            imageInputMethod === 'url'
                              ? 'bg-cyan-500 text-white'
                              : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          <Link className="w-4 h-4 mr-2" />
                          Enter URL
                        </button>
                      </div>
                    </div>

                    {/* File Upload */}
                    {imageInputMethod === 'file' && (
                      <div>
                        <label className="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                          <div className="flex items-center">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload to Walrus
                          </div>
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                          disabled={isUploading}
                          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:text-white hover:file:bg-cyan-600 disabled:opacity-50"
                        />
                      </div>
                    )}

                    {/* URL Input */}
                    {imageInputMethod === 'url' && (
                      <div>
                        <label className="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                          <div className="flex items-center">
                            <Image className="w-4 h-4 mr-2" />
                            Image URL
                          </div>
                          <span className={`text-xs ${formData.image_url.length > 500 ? 'text-red-400' : 'text-gray-500'}`}>
                            {formData.image_url.length}/1000
                          </span>
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="url"
                            name="image_url"
                            value={formData.image_url}
                            onChange={handleInputChange}
                            placeholder="https://example.com/image.jpg"
                            maxLength={1000}
                            className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
                            required
                          />
                          <button
                            type="button"
                            onClick={handleUrlToWalrus}
                            disabled={isUploading || !formData.image_url.trim()}
                            className="flex items-center px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white rounded-xl transition-all duration-300 disabled:cursor-not-allowed"
                          >
                            <Cloud className="w-4 h-4 mr-2" />
                            Store in Walrus
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Optional: Store the image from URL in Walrus for decentralized hosting
                        </p>
                      </div>
                    )}

                    {/* Upload Progress */}
                    {(isUploading || uploadProgress) && (
                      <div className="bg-white/5 border border-white/20 rounded-xl p-4">
                        {isUploading ? (
                          <div className="flex items-center text-cyan-400">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400 mr-3"></div>
                            {uploadProgress}
                          </div>
                        ) : (
                          <div className="text-green-400">{uploadProgress}</div>
                        )}
                      </div>
                    )}

                    {/* Walrus Status */}
                    {walrusBlob && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                        <div className="flex items-center text-green-400 mb-2">
                          <Cloud className="w-4 h-4 mr-2" />
                          Stored in Walrus
                        </div>
                        <p className="text-sm text-gray-300">
                          Blob ID: <code className="bg-black/20 px-1 rounded">{walrusBlob.blobId}</code>
                        </p>
                        {walrusBlob.originalUrl && (
                          <p className="text-xs text-gray-400 mt-1">
                            Original: {walrusBlob.originalUrl}
                          </p>
                        )}
                      </div>
                    )}

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
                      disabled={isMinting || isUploading}
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
                {/* Refresh button */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">My NFT Collection</h2>
                  <button
                    onClick={fetchUserNFTs}
                    disabled={isLoadingNFTs}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingNFTs ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {isLoadingNFTs ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading your NFTs...</p>
                  </div>
                ) : mintedNFTs.length === 0 ? (
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
                          {/* Walrus indicator */}
                          {nft.walrus_blob_id && (
                            <div className="absolute top-4 left-4">
                              <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-2">
                                <Cloud className="w-4 h-4 text-green-400" />
                              </div>
                            </div>
                          )}
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
                            {nft.walrus_blob_id && (
                              <div className="flex items-center">
                                <span className="font-medium">Walrus ID:</span>
                                <span className="ml-2 font-mono text-xs truncate">{nft.walrus_blob_id}</span>
                              </div>
                            )}
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