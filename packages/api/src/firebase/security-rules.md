# Firebase Security Rules for Settings System

Add these rules to your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Settings collection - users can only access their own settings
    match /settings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Settings defaults - read-only for authenticated users
    match /settingsDefaults/{role} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Settings audit - users can only read their own audit logs
    match /settingsAudit/{userId}/changes/{changeId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Mobile appearance - read for all authenticated users, write for admins only
    match /mobileAppearance/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Mobile assets - read for all authenticated users, write for admins only
    match /mobileAssets/{assetId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user has admin role
    function isAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    // Helper function to validate settings data
    function isValidSettingsUpdate() {
      return request.resource.data.keys().hasAll(['updatedAt', 'version']) &&
        request.resource.data.version > resource.data.version;
    }
  }
}
```

## Storage Rules for Mobile Assets

Add these rules to your Firebase Storage security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Mobile appearance assets - read for all authenticated users, write for admins only
    match /mobile-assets/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // User profile assets - users can manage their own assets
    match /user-assets/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Validate image uploads
    function isValidImage() {
      return request.resource.size < 5 * 1024 * 1024 && // 5MB limit
        request.resource.contentType.matches('image/.*');
    }
  }
}
```

## Firestore Indexes

Add these composite indexes to your Firestore:

```javascript
// Settings audit collection
{
  "collectionGroup": "changes",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}

// Mobile assets collection
{
  "collectionGroup": "mobileAssets",
  "queryScope": "COLLECTION", 
  "fields": [
    { "fieldPath": "type", "order": "ASCENDING" },
    { "fieldPath": "uploadedAt", "order": "DESCENDING" }
  ]
}
```