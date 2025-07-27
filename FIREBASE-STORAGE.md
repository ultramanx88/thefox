# Firebase Storage Configuration

This document explains the Firebase Storage setup, security rules, file organization, and usage patterns for the theFOX application.

## 🗂️ Storage Structure

### File Organization

```
thefox-storage/
├── users/
│   └── {userId}/
│       ├── profile/
│       │   └── avatar/           # User profile images
│       ├── documents/            # User documents (ID, etc.)
│       └── driver/               # Driver-specific documents
│           ├── license/
│           ├── vehicle/
│           └── insurance/
├── markets/
│   └── {marketId}/
│       ├── profile/              # Market profile image
│       ├── gallery/              # Market gallery images
│       └── documents/            # Business documents
│           ├── license/
│           ├── permit/
│           ├── certificate/
│           └── tax/
├── products/
│   └── {productId}/
│       ├── images/               # Product images
│       └── thumbnails/           # Auto-generated thumbnails
├── orders/
│   └── {orderId}/
│       ├── receipts/             # Order receipts/invoices
│       └── delivery/             # Delivery photos
├── categories/
│   └── {categoryId}/
│       └── images/               # Category icons
├── system/
│   ├── branding/                 # App branding assets
│   └── templates/                # System templates
├── temp/
│   └── {userId}/
│       └── {uploadId}/           # Temporary uploads (24h TTL)
├── backups/                      # System backups (admin only)
└── exports/                      # Data exports (admin only)
```

## 🔒 Security Rules

### Access Control Matrix

| Path | Customer | Vendor | Driver | Admin | Public Read |
|------|----------|--------|--------|-------|-------------|
| User Profile | Own only | Own only | Own only | All | ✅ |
| User Documents | Own only | Own only | Own only | All | ❌ |
| Market Profile | Owner only | Owner only | - | All | ✅ |
| Market Documents | Owner only | Owner only | - | All | ❌ |
| Product Images | - | Owner only | - | All | ✅ |
| Order Files | Order parties | Market owner | Driver | All | ❌ |
| System Files | - | - | - | Admin only | ✅ |

### Key Security Features

1. **Role-Based Access**: Different permissions for each user role
2. **File Type Validation**: Only allowed file types can be uploaded
3. **Size Limits**: Enforced file size limits per file type
4. **Filename Validation**: Secure filename patterns
5. **Ownership Verification**: Users can only access their own files
6. **Public/Private Separation**: Clear distinction between public and private files

### File Type and Size Limits

```javascript
// Image files (JPEG, PNG, GIF, WebP)
- Max size: 5MB
- Allowed for: avatars, product images, market gallery

// Document files (PDF, DOC, DOCX)
- Max size: 10MB
- Allowed for: business documents, receipts, licenses

// Temporary files
- Max size: 20MB
- Auto-cleanup after 24 hours
```

## 🛠️ Storage Service

### FirebaseStorageService Class

The `FirebaseStorageService` provides comprehensive file management:

#### Basic Operations
- `uploadFile()` - Upload single file with progress tracking
- `uploadMultipleFiles()` - Upload multiple files concurrently
- `deleteFile()` - Delete single file
- `deleteMultipleFiles()` - Delete multiple files
- `getDownloadURL()` - Get public download URL
- `listFiles()` - List files in directory

#### Image Processing
- `processImage()` - Resize and compress images
- `generateThumbnail()` - Create thumbnails
- `uploadUserAvatar()` - Upload with automatic processing
- `uploadProductImages()` - Upload with thumbnail generation

#### Specialized Methods
- `uploadMarketGallery()` - Market image gallery
- `validateImageFile()` - Image file validation
- `validateDocumentFile()` - Document file validation
- `cleanupTempFiles()` - Remove expired temporary files

### Usage Examples

```typescript
import { storageService, STORAGE_PATHS } from '@/packages/api/src/firebase/storage';

// Upload user avatar
const avatarURL = await storageService.uploadUserAvatar(userId, file, {
  onProgress: (progress) => console.log(`${progress.percentage}%`),
  onComplete: (url) => console.log('Upload complete:', url),
});

// Upload product images with thumbnails
const { images, thumbnails } = await storageService.uploadProductImages(
  productId, 
  files
);

// Upload document
const documentURL = await storageService.uploadFile(
  STORAGE_PATHS.USER_DOCUMENTS(userId),
  file,
  {
    metadata: {
      contentType: 'application/pdf',
      customMetadata: { documentType: 'license' }
    }
  }
);
```

## ⚛️ React Components

### File Upload Components

1. **SingleFileUpload** - Upload single file with drag & drop
2. **MultipleFileUpload** - Upload multiple files with progress
3. **ImagePreview** - Preview selected images before upload

### Component Examples

```tsx
import { SingleFileUpload, MultipleFileUpload } from '@/components/FileUpload';

// Single file upload
<SingleFileUpload
  path={STORAGE_PATHS.USER_AVATAR(userId)}
  acceptedTypes={['image/*']}
  maxSize={5 * 1024 * 1024}
  onUploadComplete={(url) => setAvatarURL(url)}
  placeholder="Upload your profile picture"
/>

// Multiple file upload
<MultipleFileUpload
  path={STORAGE_PATHS.PRODUCT_IMAGES(productId)}
  acceptedTypes={['image/*']}
  maxFiles={5}
  onUploadComplete={(urls) => setProductImages(urls)}
  placeholder="Upload product images"
/>
```

## 🪝 React Hooks

### Available Hooks

1. **Generic Hooks**
   - `useFileUpload()` - Single file upload with progress
   - `useMultipleFileUpload()` - Multiple file upload
   - `useFileList()` - List and manage files in directory

2. **Specialized Hooks**
   - `useUserAvatarUpload()` - User avatar with processing
   - `useProductImageUpload()` - Product images with thumbnails
   - `useMarketGalleryUpload()` - Market gallery images
   - `useDocumentUpload()` - Document file upload

3. **Utility Hooks**
   - `useStorageStats()` - Storage usage statistics
   - `useTempFileCleanup()` - Cleanup temporary files
   - `useDragAndDrop()` - Drag and drop functionality

### Hook Examples

```tsx
import { useUserAvatarUpload, useProductImageUpload } from '@/hooks/useStorage';

function UserProfile({ userId }: { userId: string }) {
  const { uploadAvatar, uploading, progress, avatarURL } = useUserAvatarUpload(userId);
  
  const handleFileSelect = async (file: File) => {
    try {
      const url = await uploadAvatar(file);
      console.log('Avatar uploaded:', url);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
  
  return (
    <div>
      {uploading && <div>Progress: {progress?.percentage}%</div>}
      {avatarURL && <img src={avatarURL} alt="Avatar" />}
    </div>
  );
}
```

## 🧪 Testing

### Test Scripts

1. **Storage Operations Test**
   ```bash
   npm run firebase:test:storage
   ```

2. **Security Rules Test**
   ```bash
   firebase emulators:exec "npm run test:storage:security"
   ```

### Test Coverage

Our tests cover:
- ✅ File upload/download operations
- ✅ File type and size validation
- ✅ Directory listing and metadata
- ✅ File deletion and cleanup
- ✅ Image processing and thumbnails
- ⚠️ Security rules (requires additional setup)

## 🚀 Deployment

### Deploy Storage Rules

```bash
# Deploy storage rules
npm run firebase:deploy:storage

# Deploy all Firebase services
npm run firebase:deploy
```

### Environment-Specific Deployment

```bash
# Staging
firebase use staging
npm run firebase:deploy:storage

# Production
firebase use production
npm run firebase:deploy:storage
```

## 📈 Performance Optimization

### Best Practices

1. **Image Optimization**
   - Automatic resizing and compression
   - WebP format for better compression
   - Thumbnail generation for faster loading
   - Progressive JPEG for large images

2. **Upload Optimization**
   - Resumable uploads for large files
   - Parallel uploads for multiple files
   - Progress tracking for better UX
   - Error handling and retry logic

3. **Storage Management**
   - Automatic cleanup of temporary files
   - File versioning for important documents
   - CDN integration for global delivery
   - Compression for document files

### Performance Monitoring

```typescript
// Monitor upload performance
const uploadWithMetrics = async (file: File) => {
  const startTime = Date.now();
  
  const url = await storageService.uploadFile(path, file, {
    onProgress: (progress) => {
      // Track upload speed
      const elapsed = Date.now() - startTime;
      const speed = progress.bytesTransferred / elapsed * 1000; // bytes/sec
      console.log(`Upload speed: ${speed} bytes/sec`);
    }
  });
  
  const totalTime = Date.now() - startTime;
  console.log(`Upload completed in ${totalTime}ms`);
  
  return url;
};
```

## 🔧 File Processing

### Image Processing Pipeline

1. **Client-Side Processing**
   - Resize images before upload
   - Compress to reduce file size
   - Generate thumbnails
   - Convert to optimal formats

2. **Server-Side Processing** (Future)
   - Cloud Functions for advanced processing
   - Automatic format conversion
   - Watermark application
   - Virus scanning

### Processing Examples

```typescript
// Process image before upload
const processedImage = await storageService.processImage(file, {
  maxWidth: 1200,
  maxHeight: 800,
  quality: 0.85,
  format: 'jpeg'
});

// Generate thumbnail
const thumbnail = await storageService.generateThumbnail(file, 300);
```

## 🔍 Troubleshooting

### Common Issues

1. **Upload Fails**
   ```
   Error: Permission denied
   ```
   **Solution**: Check security rules and user authentication

2. **File Too Large**
   ```
   Error: File size exceeds limit
   ```
   **Solution**: Compress file or check size limits in rules

3. **Invalid File Type**
   ```
   Error: File type not allowed
   ```
   **Solution**: Check accepted file types in security rules

4. **Quota Exceeded**
   ```
   Error: Storage quota exceeded
   ```
   **Solution**: Check Firebase billing and storage usage

### Debug Commands

```bash
# Check storage rules
firebase storage:rules:get

# View storage usage
firebase storage:usage

# Test with emulator
firebase emulators:start --only storage

# View logs
firebase functions:log
```

## 💰 Cost Optimization

### Storage Costs

- **Storage**: $0.026/GB/month
- **Downloads**: $0.12/GB
- **Uploads**: Free
- **Operations**: $0.05/10,000 operations

### Cost Optimization Strategies

1. **File Compression**
   - Compress images before upload
   - Use efficient formats (WebP, AVIF)
   - Remove metadata from images

2. **CDN Usage**
   - Enable Firebase CDN
   - Cache static assets
   - Use appropriate cache headers

3. **Cleanup Automation**
   - Remove temporary files
   - Delete unused files
   - Implement file lifecycle policies

## 🔄 Backup and Recovery

### Backup Strategy

1. **Automated Backups**
   - Daily backup of critical files
   - Incremental backup system
   - Cross-region replication

2. **Manual Backups**
   - Export user data
   - Backup business documents
   - Archive old files

### Recovery Procedures

```typescript
// Backup files to different location
const backupFiles = async (sourcePath: string, backupPath: string) => {
  const files = await storageService.listFiles(sourcePath);
  
  for (const file of files) {
    const url = await storageService.getDownloadURL(file.fullPath);
    // Copy to backup location
  }
};
```

## 🎯 Next Steps

After completing Firebase Storage setup:

1. ✅ Security rules configured and deployed
2. ✅ File organization structure implemented
3. ✅ Storage service and hooks created
4. ✅ Upload components built
5. 🔄 Deploy Cloud Functions (Task 4)
6. 🔄 Implement real-time sync (Task 5)
7. 🔄 Add error handling and monitoring (Task 6)

---

For more information, see:
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [File Upload Best Practices](https://firebase.google.com/docs/storage/web/upload-files)