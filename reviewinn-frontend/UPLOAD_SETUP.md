# Image Upload Setup Guide

## Frontend Implementation ✅

The frontend now has full image upload functionality for group creation with:

- ✅ Profile photo upload with preview
- ✅ Cover photo upload with preview  
- ✅ Drag & drop support
- ✅ Image validation (size, format)
- ✅ Facebook-like multi-step form
- ✅ Real-time preview and image management

## Backend Setup Required

To complete the image upload functionality, you need to implement the backend upload endpoint:

### 1. Add Upload Endpoint

Create an endpoint at `POST /api/v1/upload/image` that:

- Accepts multipart/form-data with `file`, `type`, and `folder` fields
- Validates file type and size
- Uploads to your storage service (AWS S3, Cloudinary, etc.)
- Returns JSON with `url`, `public_id`, `size`, and `format`

### 2. Example Response Format

```json
{
  "url": "https://your-storage.com/groups/profile/image123.jpg",
  "public_id": "groups/profile/image123",
  "size": 1048576,
  "format": "jpg"
}
```

### 3. Group Creation Endpoint

The group creation endpoint at `POST /api/v1/groups` should accept:

```json
{
  "name": "Group Name",
  "description": "Group description",
  "group_type": "interest_based",
  "visibility": "public",
  "avatar_url": "https://uploaded-image-url.jpg",
  "cover_image_url": "https://uploaded-cover-url.jpg", 
  "rules_and_guidelines": "Group rules",
  "allow_public_reviews": true,
  "require_approval_for_reviews": false,
  "category_ids": [1]
}
```

### 4. Environment Variables

Add these to your `.env`:

```
UPLOAD_STORAGE_TYPE=s3  # or cloudinary, local, etc.
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

## Current Status

- ✅ Frontend: Complete with fallback to local preview URLs
- ⏳ Backend: Upload endpoint needed for production
- ✅ Database: Group model already supports `avatar_url` and `cover_image_url`

The frontend will work in demo mode until the backend endpoints are implemented.