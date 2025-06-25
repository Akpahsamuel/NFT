# 🐋 Walrus Integration for NFT Project

This project integrates [Walrus](https://docs.wal.app/), a decentralized storage and data availability protocol, to provide secure, decentralized storage for NFT images and metadata.

## 🌟 Features

- **Decentralized Storage**: Store NFT images on Walrus for true decentralization
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
│ • Progress UI   │◀───│ • Get Blob URLs │◀───│ • Storage Nodes │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

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
const walrusBlob = await WalrusService.uploadFile(file);
console.log('Blob ID:', walrusBlob.blobId);
console.log('Walrus URL:', walrusBlob.walrusUrl);
```

#### Upload from URL

```typescript
const url = 'https://example.com/image.jpg';
const walrusBlob = await WalrusService.uploadFromUrl(url);
console.log('Original URL:', walrusBlob.originalUrl);
console.log('Walrus URL:', walrusBlob.walrusUrl);
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

### Debug Steps

1. **Check Service Health**
   ```typescript
   const isHealthy = await WalrusService.checkServiceHealth();
   console.log('Walrus service healthy:', isHealthy);
   ```

2. **Monitor Upload Progress**
   ```typescript
   await WalrusService.waitForBlobCertification(blobId, (message) => {
     console.log('Progress:', message);
   });
   ```

3. **Test Endpoints Manually**
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
const uploads = await Promise.all(
  files.map(file => WalrusService.uploadFile(file))
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
const metadataBlob = await WalrusService.uploadMetadata(metadata);
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