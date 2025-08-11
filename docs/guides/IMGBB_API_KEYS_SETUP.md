# ImgBB API Keys Setup Guide

## Overview

This guide explains how to set up separate ImgBB API keys for different types of image uploads in the ReviewInn application.

## Why Separate API Keys?

Using separate API keys for different upload types provides several benefits:

1. **Security**: If one key gets compromised, only that specific functionality is affected
2. **Rate Limiting**: Each key has its own rate limits, preventing one type of upload from affecting others
3. **Monitoring**: Easier to track usage and costs per feature
4. **Flexibility**: Can set different expiration times or settings per key

## API Key Types

### 1. Entity Images (`VITE_IMGBB_API_KEY_ENTITY`)
- **Purpose**: Upload images for businesses, places, and other entities
- **Usage**: Entity creation, entity editing, entity profile photos
- **Volume**: Medium to high (depends on entity creation rate)

### 2. User Photos (`VITE_IMGBB_API_KEY_USER`)
- **Purpose**: Upload user profile photos and avatars
- **Usage**: User profile editing, avatar uploads
- **Volume**: Low to medium (depends on user registration and profile updates)

### 3. Review Photos (`VITE_IMGBB_API_KEY_REVIEW`)
- **Purpose**: Upload photos attached to reviews
- **Usage**: Review creation, review editing
- **Volume**: High (most common upload type)

## Environment Variables Setup

### Option 1: Separate Keys (Recommended)

Add these to your `.env` file:

```env
# Entity Images
VITE_IMGBB_API_KEY_ENTITY=your-entity-images-key-here

# User Photos
VITE_IMGBB_API_KEY_USER=your-user-photos-key-here

# Review Photos
VITE_IMGBB_API_KEY_REVIEW=your-review-photos-key-here
```

### Option 2: Single Key (Backward Compatible)

If you prefer to use a single key for all uploads:

```env
VITE_IMGBB_API_KEY=your-single-imgbb-key-here
```

The application will fall back to the single key if specific keys are not provided.

## Getting ImgBB API Keys

1. Go to [ImgBB](https://imgbb.com/)
2. Create an account or log in
3. Go to your account settings
4. Generate API keys for each use case
5. Copy the keys to your environment variables

## Implementation Details

### Frontend Usage

The application automatically uses the appropriate key based on the upload context:

```typescript
// Entity images
await imgbbService.uploadImage(file, undefined, UploadType.ENTITY);

// User photos
await imgbbService.uploadImage(file, undefined, UploadType.USER);

// Review photos
await imgbbService.uploadImage(file, undefined, UploadType.REVIEW);
```

### Backward Compatibility

The system maintains backward compatibility:
- If specific keys are not provided, it falls back to `VITE_IMGBB_API_KEY`
- If no keys are provided, it shows a warning but continues to work

## Monitoring and Management

### Rate Limits
- Each API key has its own rate limits
- Monitor usage per key to optimize costs
- Consider upgrading plans for high-volume keys

### Cost Optimization
- Review photos typically have the highest volume
- Consider different plans for different keys based on usage
- Monitor image sizes and optimize accordingly

## Troubleshooting

### Common Issues

1. **"API key not configured" error**
   - Check that at least one API key is set in your `.env` file
   - Ensure the key is valid and active

2. **Rate limiting errors**
   - Check your ImgBB account for current usage
   - Consider upgrading your plan or using separate keys

3. **Upload failures**
   - Verify the API key is correct
   - Check file size limits (max 5MB per file)
   - Ensure file format is supported (JPEG, PNG, GIF, WebP)

### Debug Mode

Enable debug logging by checking the browser console for:
- API key configuration warnings
- Upload progress and errors
- Rate limiting information

## Migration from Single Key

If you're currently using a single API key and want to migrate to separate keys:

1. Create new API keys in your ImgBB account
2. Update your `.env` file with the new keys
3. Test each upload type to ensure they work correctly
4. Monitor usage to ensure proper key assignment

## Best Practices

1. **Key Rotation**: Regularly rotate your API keys for security
2. **Monitoring**: Set up alerts for rate limiting and usage
3. **Backup Keys**: Keep backup keys ready for emergency situations
4. **Documentation**: Document which key is used for which feature
5. **Testing**: Test all upload types after key changes

## Support

If you encounter issues with ImgBB API keys:
1. Check the [ImgBB API documentation](https://api.imgbb.com/)
2. Review your account settings and usage
3. Contact ImgBB support for account-specific issues
4. Check the application logs for detailed error messages 