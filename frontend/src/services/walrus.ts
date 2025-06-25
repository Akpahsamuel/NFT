import axios from 'axios';

// Working Walrus testnet endpoints - Updated January 2025
// Publisher: Tudor's endpoint with confirmed CORS support
// Aggregator: Multiple fallback options
const WALRUS_PUBLISHER_URL = 'https://publisher.walrus-01.tududes.com';
const WALRUS_AGGREGATOR_URL = 'https://aggregator.walrus-testnet.walrus.space';

// Backup endpoints in case primary fails
const BACKUP_AGGREGATOR_URL = 'https://wal-aggregator-testnet.staketab.org';

export interface WalrusUploadResponse {
  newlyCreated?: {
    blobObject: {
      id: string;
      blobId: string;
    };
  };
  alreadyCertified?: {
    blobId: string;
  };
}

export interface WalrusBlob {
  blobId: string;
  walrusUrl: string;
  originalUrl?: string;
}

export class WalrusService {
  /**
   * Upload a file directly to Walrus
   */
  static async uploadFile(file: File): Promise<WalrusBlob> {
    try {
      // Convert file to raw binary data
      const fileData = await file.arrayBuffer();
      
      const response = await axios.put<WalrusUploadResponse>(
        `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=5`,
        fileData,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          // Add timeout for large files
          timeout: 60000, // 60 seconds
        }
      );

      // Extract blob ID from response
      const blobId = response.data.newlyCreated?.blobObject.blobId || 
                    response.data.alreadyCertified?.blobId;
      
      if (!blobId) {
        throw new Error('Failed to get blob ID from Walrus response');
      }

      return {
        blobId,
        walrusUrl: this.getBlobUrl(blobId),
      };
    } catch (error) {
      console.error('Walrus upload failed:', error);
      if (axios.isAxiosError(error)) {
        // Check for specific error types
        if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
          throw new Error('Network error: Unable to connect to Walrus. Please check your internet connection and try again.');
        }
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          throw new Error('Upload timeout: The file is too large or the connection is slow. Please try again.');
        }
        if (error.response?.status === 403) {
          throw new Error('Access denied: CORS or authentication error. Please contact support.');
        }
        if (error.response?.status === 404) {
          throw new Error('Service unavailable: Walrus endpoint not found. The service may be temporarily down.');
        }
        if (error.response && error.response.status >= 500) {
          throw new Error('Server error: Walrus service is experiencing issues. Please try again later.');
        }
        
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to upload to Walrus: ${message}`);
      }
      throw new Error(`Failed to upload to Walrus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch content from URL and upload to Walrus
   */
  static async uploadFromUrl(url: string): Promise<WalrusBlob> {
    try {
      // Fetch the content from the URL
      const response = await axios.get(url, {
        responseType: 'arraybuffer', // Get raw binary data
        timeout: 30000, // 30 second timeout
      });

      // Upload raw data to Walrus
      const walrusResponse = await axios.put<WalrusUploadResponse>(
        `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=5`,
        response.data,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          timeout: 60000, // 60 seconds
        }
      );

      // Extract blob ID from response
      const blobId = walrusResponse.data.newlyCreated?.blobObject.blobId || 
                    walrusResponse.data.alreadyCertified?.blobId;
      
      if (!blobId) {
        throw new Error('Failed to get blob ID from Walrus response');
      }

      return {
        blobId,
        walrusUrl: this.getBlobUrl(blobId),
        originalUrl: url,
      };
    } catch (error) {
      console.error('Failed to upload URL to Walrus:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to fetch and upload URL: ${message}`);
      }
      throw new Error(`Failed to fetch and upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the public URL for a Walrus blob
   */
  static getBlobUrl(blobId: string): string {
    return `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;
  }

  /**
   * Check if a blob is available (certified) for reading
   */
  static async checkBlobAvailability(blobId: string, maxRetries: number = 3, delayMs: number = 2000): Promise<boolean> {
    const aggregatorUrls = [WALRUS_AGGREGATOR_URL, BACKUP_AGGREGATOR_URL];
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Try both aggregator endpoints
      for (const aggregatorUrl of aggregatorUrls) {
        try {
          const response = await axios.head(`${aggregatorUrl}/v1/blobs/${blobId}`, {
            timeout: 5000,
          });
          if (response.status === 200) {
            return true;
          }
        } catch (error) {
          // Continue to next aggregator or retry
          console.warn(`Failed to check blob availability on ${aggregatorUrl}:`, error);
        }
      }
      
      if (attempt < maxRetries - 1) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    return false;
  }

  /**
   * Wait for blob to become available with progress callback
   */
  static async waitForBlobCertification(
    blobId: string, 
    onProgress?: (message: string) => void,
    maxWaitTimeMs: number = 30000
  ): Promise<boolean> {
    const startTime = Date.now();
    let attempt = 0;
    
    while (Date.now() - startTime < maxWaitTimeMs) {
      attempt++;
      
      if (onProgress) {
        onProgress(`Checking blob certification (attempt ${attempt})...`);
      }
      
      const isAvailable = await this.checkBlobAvailability(blobId, 1);
      if (isAvailable) {
        if (onProgress) {
          onProgress('Blob is now certified and available!');
        }
        return true;
      }
      
      // Wait 3 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    if (onProgress) {
      onProgress('Blob certification is taking longer than expected. The blob should become available soon.');
    }
    return false;
  }

  /**
   * Upload JSON metadata to Walrus
   */
  static async uploadMetadata(metadata: any): Promise<WalrusBlob> {
    const jsonData = JSON.stringify(metadata, null, 2);
    const encoder = new TextEncoder();
    const binaryData = encoder.encode(jsonData);
    
    try {
      const response = await axios.put<WalrusUploadResponse>(
        `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=5`,
        binaryData,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          timeout: 60000,
        }
      );

      const blobId = response.data.newlyCreated?.blobObject.blobId || 
                    response.data.alreadyCertified?.blobId;
      
      if (!blobId) {
        throw new Error('Failed to get blob ID from Walrus response');
      }

      return {
        blobId,
        walrusUrl: this.getBlobUrl(blobId),
      };
    } catch (error) {
      console.error('Walrus metadata upload failed:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to upload metadata to Walrus: ${message}`);
      }
      throw new Error('Failed to upload metadata to Walrus');
    }
  }

  /**
   * Check if a URL is already a Walrus URL
   */
  static isWalrusUrl(url: string): boolean {
    return url.includes(WALRUS_AGGREGATOR_URL) || url.includes('walrus');
  }

  /**
   * Extract filename from URL
   */
  private static getFilenameFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const filename = pathname.split('/').pop();
      return filename || 'file';
    } catch {
      return 'file';
    }
  }

  /**
   * Check if the Walrus service is available
   */
  static async checkServiceHealth(): Promise<boolean> {
    try {
      await axios.head(WALRUS_PUBLISHER_URL, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
} 