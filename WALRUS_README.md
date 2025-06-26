# 🐋 Walrus Integration for NFT Project

This project integrates [Walrus](https://docs.wal.app/), a decentralized storage and data availability protocol, to provide secure, decentralized storage for NFT images and metadata.

## 🌟 Features

- **Decentralized Storage**: Store NFT images on Walrus for true decentralization
- **User-Owned Blobs**: Ensure blob objects are owned by the user's Sui address, not the publisher
- **Dual Input Methods**: Upload files directly or provide URLs with optional Walrus backup
- **Automatic Certification**: Wait for blob certification with real-time progress updates
- **Fallback Endpoints**: Multiple aggregator endpoints for high availability
- **Visual Indicators**: Clear UI indicators for Walrus-stored content
- **Error Handling**: Comprehensive error messages for different failure scenarios

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Walrus Service │    │ Walrus Network  │
│                 │    │                 │    │                 │
│ • File Upload   │───▶│ • Upload Files  │───▶│ • Publisher     │
│ • URL Input     │    │ • Check Status  │    │ • Aggregator    │
│ • User Address  │    │ • Blob Ownership│    │ • Storage Nodes │
│ • Progress UI   │◀───│ • Get Blob URLs │◀───│ • User-Owned    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔑 Blob Ownership

This implementation ensures that **all Walrus blob objects are owned by the user's Sui address**, not by the publisher or any default address. This is achieved by:

1. **Automatic Address Detection**: The application automatically uses the connected wallet's address
2. **send_object_to Parameter**: All upload requests include `&send_object_to=<user_address>` 
3. **User Control**: Users have full ownership and control over their blob objects on Sui
4. **Lifecycle Management**: Users can manage blob lifecycle, extend storage, or delete blobs

### How It Works

When uploading to Walrus, the URL structure is:
```
PUT /v1/blobs?epochs=5&send_object_to=0x<USER_SUI_ADDRESS>
```

This ensures the resulting `Blob` object on Sui is transferred to the user's address instead of remaining with the publisher's sub-wallet.

## 🚀 Quick Start

### Prerequisites

- Node.js and npm installed
- Axios dependency (already included in package.json)

### Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the Application**
   ```bash
   npm start
   ```

3. **Try Walrus Integration**
   - Open the NFT minting page
   - Choose "Upload File" to store images on Walrus
   - Or use "Enter URL" with "Store in Walrus" option

## 🔧 Configuration

### Endpoints

The project uses reliable Walrus testnet endpoints:

```typescript
// Publisher (for uploads)
const WALRUS_PUBLISHER_URL = 'https://publisher.walrus-01.tududes.com';

// Aggregator (for downloads)
const WALRUS_AGGREGATOR_URL = 'https://aggregator.walrus-testnet.walrus.space';

// Backup aggregator
const BACKUP_AGGREGATOR_URL = 'https://wal-aggregator-testnet.staketab.org';
```

### Customization

To modify Walrus settings, edit `frontend/src/services/walrus.ts`:

- **Storage Duration**: Change `epochs=5` in upload URLs
- **Timeouts**: Adjust timeout values for uploads (default: 60s)
- **Retry Logic**: Modify `maxRetries` in availability checks

## 📖 Usage Guide

### For Users

1. **Direct File Upload**
   - Select "Upload File" method
   - Choose your image file
   - File is automatically uploaded to Walrus
   - NFT displays Walrus-stored image with cloud icon

2. **URL with Walrus Backup**
   - Select "Enter URL" method
   - Paste your image URL
   - Enable "Store in Walrus" toggle
   - Original URL is backed up to Walrus

### For Developers

#### Upload a File

```typescript
import { WalrusService } from './services/walrus';

const file = event.target.files[0];
const userAddress = '0x1234...'; // User's Sui address
const walrusBlob = await WalrusService.uploadFile(file, userAddress);
console.log('Blob ID:', walrusBlob.blobId);
console.log('Walrus URL:', walrusBlob.walrusUrl);
```

#### Upload from URL

```typescript
const url = 'https://example.com/image.jpg';
const userAddress = '0x1234...'; // User's Sui address
const walrusBlob = await WalrusService.uploadFromUrl(url, userAddress);
console.log('Original URL:', walrusBlob.originalUrl);
console.log('Walrus URL:', walrusBlob.walrusUrl);
```

#### Upload Metadata

```typescript
const metadata = { name: "My NFT", description: "...", image: "..." };
const userAddress = '0x1234...'; // User's Sui address
const walrusBlob = await WalrusService.uploadMetadata(metadata, userAddress);
console.log('Metadata Blob ID:', walrusBlob.blobId);
```

#### Check Blob Availability

```typescript
const isAvailable = await WalrusService.checkBlobAvailability(blobId);
if (isAvailable) {
  console.log('Blob is certified and ready!');
}
```

## 🛠️ Smart Contract Integration

### NFT Structure

```move
public struct Sui_nft has key, store {
    id: UID,
    name: string::String,
    description: string::String,
    image_url: string::String,
    walrus_blob_id: Option<string::String>, // Walrus integration
}
```

### Minting Functions

- `mint()`: Traditional minting with URL only
- `mint_with_walrus()`: Enhanced minting with optional Walrus blob ID

## 🔍 Troubleshooting

### Common Issues

#### "Network Error" during upload
- **Cause**: CORS issues or endpoint unavailability
- **Solution**: Endpoints are pre-configured with CORS support. Check internet connection.

#### "Upload timeout"
- **Cause**: Large files or slow connection
- **Solution**: Try smaller files or check network speed. Timeout is set to 60 seconds.

#### "Blob not available" after upload
- **Cause**: Walrus certification takes time
- **Solution**: Wait for automatic certification (usually < 30 seconds).

### CORS Issues with URL Uploads

When uploading from URLs, you may encounter CORS (Cross-Origin Resource Sharing) errors. This is a browser security feature that prevents websites from fetching content from other domains.

#### ✅ URLs that typically work:
- **Imgur**: `imgur.com`, `i.imgur.com`
- **GitHub**: `github.com`, `githubusercontent.com`
- **Unsplash**: `unsplash.com`, `images.unsplash.com`
- **Pexels**: `pexels.com`, `images.pexels.com`
- **Wikimedia**: `wikimedia.org`, `upload.wikimedia.org`

#### ❌ URLs that typically don't work:
- **Social Media**: Instagram, Facebook, Twitter/X, TikTok, LinkedIn, Pinterest
- **Most private websites**: Personal blogs, company websites
- **Image hosting with restrictions**: Some paid CDNs

#### 🛠️ Workarounds for blocked URLs:
1. **Download and Upload**: Right-click → "Save image as..." → Upload file directly
2. **Use URL directly**: Don't enable "Store in Walrus" option
3. **Use allowed domains**: Re-host images on CORS-friendly services like Imgur

### Debug Steps

1. **Check Service Health**
   ```typescript
   const isHealthy = await WalrusService.checkServiceHealth();
   console.log('Walrus service healthy:', isHealthy);
   ```

2. **Validate URL before upload**
   ```typescript
   const validation = WalrusService.validateUrlForUpload(url);
   console.log('URL validation:', validation);
   if (!validation.isValid) {
     console.log('Suggestions:', validation.suggestions);
   }
   ```

3. **Monitor Upload Progress**
   ```typescript
   await WalrusService.waitForBlobCertification(blobId, (message) => {
     console.log('Progress:', message);
   });
   ```

4. **Test Endpoints Manually**
   ```bash
   # Test publisher
   curl -I "https://publisher.walrus-01.tududes.com/v1/blobs?epochs=5" -X OPTIONS
   
   # Test aggregator
   curl -I "https://aggregator.walrus-testnet.walrus.space/v1/blobs/test"
   ```

## 📊 Status Indicators

The UI provides visual feedback for Walrus integration:

- **🔄 Uploading**: File is being uploaded to Walrus
- **⏳ Certifying**: Waiting for blob certification
- **☁️ Walrus**: Content is stored on Walrus
- **✅ Ready**: Blob is certified and accessible

## 🌐 Walrus Network Information

### Testnet Details

- **Network**: Walrus Testnet
- **Storage Duration**: 5 epochs (configurable)
- **Replication Factor**: ~4-5x with erasure coding
- **Fault Tolerance**: Up to 2/3 of storage nodes can fail

### Costs

- **Testnet**: Free (subsidized by Walrus Foundation)
- **Mainnet**: Requires WAL tokens for storage fees

## 🔐 Security Considerations

- **Public Storage**: All content on Walrus is publicly accessible
- **Immutable**: Once stored, blobs cannot be modified (only new versions)
- **Decentralized**: No single point of failure
- **Erasure Coded**: Data is split and distributed across multiple nodes

## 🚀 Advanced Features

### Bulk Operations

```typescript
// Upload multiple files
const files = Array.from(fileInput.files);
const userAddress = '0x1234...'; // User's Sui address
const uploads = await Promise.all(
  files.map(file => WalrusService.uploadFile(file, userAddress))
);
```

### Metadata Storage

```typescript
// Store NFT metadata on Walrus
const metadata = {
  name: "My NFT",
  description: "Stored on Walrus",
  image: walrusImageUrl,
  attributes: [...]
};
const userAddress = '0x1234...'; // User's Sui address
const metadataBlob = await WalrusService.uploadMetadata(metadata, userAddress);
```

## 📚 Resources

- **Walrus Documentation**: https://docs.wal.app/
- **Walrus Whitepaper**: https://docs.wal.app/blog/03_whitepaper.html
- **Testnet Information**: https://docs.wal.app/blog/04_testnet_update.html
- **Community Discord**: https://discord.gg/walrus

## 🤝 Contributing

To improve the Walrus integration:

1. Fork the repository
2. Create a feature branch
3. Test with Walrus testnet
4. Submit a pull request

## 📄 License

This integration follows the same license as the main NFT project. Walrus itself is open source under Apache 2.0 license.

---

**Need Help?** 

- Check the troubleshooting section above
- Review Walrus documentation
- Open an issue in the project repository 