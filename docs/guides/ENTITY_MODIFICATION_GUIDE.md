# Entity Modification and Deletion System

## Overview

This document describes the comprehensive entity modification and deletion functionality implemented in the ReviewInn platform. The system follows industry best practices for security, user experience, and data integrity.

## Features Implemented

### 1. Entity Update Functionality
- **Comprehensive Form Validation**: Real-time validation with user-friendly error messages
- **Partial Updates**: Support for updating individual fields without affecting others
- **Permission-Based Access**: Only authorized users can modify entities
- **Audit Logging**: All modifications are logged for security and compliance
- **User Feedback**: Toast notifications for success/error states

### 2. Entity Deletion Functionality
- **Safety Confirmation**: Required confirmation text to prevent accidental deletions
- **Dependency Checking**: Prevents deletion of entities with existing reviews
- **Permission-Based Access**: Only owners and admins can delete entities
- **Audit Logging**: All deletions are logged with reasons
- **User Feedback**: Clear warnings and success notifications

### 3. Permission System
- **Role-Based Access Control**: Different permissions for different user levels
- **Entity Ownership**: Claimed entities can be managed by their owners
- **Admin Override**: Administrators can manage any entity
- **High-Level User Access**: Users with level 10+ can manage entities

## Backend Implementation

### API Endpoints

#### Update Entity
```http
PUT /api/v1/entities/{entity_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Entity Name",
  "description": "Updated description",
  "location": "New York, NY",
  "website": "https://example.com",
  "avatar": "https://example.com/image.jpg",
  "context": {
    "additionalInfo": "Extra context"
  }
}
```

#### Delete Entity
```http
DELETE /api/v1/entities/{entity_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "confirmation": "DELETE_ENTITY_123",
  "reason": "Entity no longer exists"
}
```

### Permission Logic

```python
def _check_entity_permissions(entity: dict, current_user: User) -> bool:
    """Check if user has permission to modify entity"""
    if not current_user:
        return False
    
    # Admin users can modify any entity
    if current_user.role.value in ['admin', 'moderator']:
        return True
    
    # Entity owners can modify their claimed entities
    if entity.get('claimed_by') == current_user.user_id:
        return True
    
    # Users with high level can modify entities
    if getattr(current_user, 'level', 0) >= 10:
        return True
    
    return False
```

### Security Features

1. **Authentication Required**: All modification endpoints require valid JWT tokens
2. **Authorization Checks**: Users can only modify entities they own or have permission for
3. **Input Validation**: Comprehensive validation of all input fields
4. **SQL Injection Prevention**: Parameterized queries and ORM usage
5. **Audit Logging**: All actions are logged with user and timestamp information

## Frontend Implementation

### Components Created

#### 1. EntityEditModal
- **Location**: `src/features/entities/components/EntityEditModal.tsx`
- **Features**:
  - Real-time form validation
  - Error handling and user feedback
  - Loading states
  - Responsive design
  - Accessibility features

#### 2. EntityDeleteModal
- **Location**: `src/features/entities/components/EntityDeleteModal.tsx`
- **Features**:
  - Confirmation requirement
  - Safety warnings
  - Entity information display
  - Reason collection (optional)

#### 3. EntityManagementActions
- **Location**: `src/features/entities/components/EntityManagementActions.tsx`
- **Features**:
  - Permission checking
  - Action buttons (Edit, Delete, Settings)
  - Modal management
  - User feedback

### User Experience Features

1. **Progressive Enhancement**: Components gracefully degrade for users without permissions
2. **Loading States**: Clear feedback during async operations
3. **Error Handling**: User-friendly error messages
4. **Success Feedback**: Toast notifications for successful operations
5. **Confirmation Dialogs**: Prevents accidental destructive actions

## Usage Examples

### Editing an Entity

1. Navigate to the entity detail page (`/entity/{id}`)
2. If you have permission, you'll see "Edit" and "Delete" buttons
3. Click "Edit" to open the edit modal
4. Modify the desired fields
5. Click "Update Entity" to save changes

### Deleting an Entity

1. Navigate to the entity detail page (`/entity/{id}`)
2. If you have permission, click "Delete"
3. Review the warning message and entity details
4. Type the required confirmation text
5. Optionally provide a reason for deletion
6. Click "Delete Permanently" to confirm

## Permission Levels

### User Levels
- **Level 1-9**: Can view entities and write reviews
- **Level 10+**: Can edit and delete entities
- **Level 50+**: Admin access to all entities

### Entity Ownership
- **Claimed Entities**: Owners can manage their claimed entities
- **Unclaimed Entities**: High-level users and admins can manage
- **Reviews Present**: Entities with reviews cannot be deleted

## Error Handling

### Common Error Scenarios

1. **Permission Denied**
   - User tries to edit/delete without permission
   - Solution: Upgrade account level or claim the entity

2. **Entity Has Reviews**
   - User tries to delete entity with existing reviews
   - Solution: Remove all reviews first

3. **Invalid Confirmation**
   - User doesn't type exact confirmation text
   - Solution: Type the exact text shown

4. **Network Errors**
   - API calls fail due to network issues
   - Solution: Retry operation

### Error Messages

All error messages are user-friendly and provide actionable guidance:

```typescript
// Permission error
"You don't have permission to modify this entity"

// Dependency error
"Cannot delete entity with 5 existing reviews. Please remove all reviews first."

// Validation error
"Entity name must be at least 2 characters"
```

## Security Considerations

### Data Protection
- All sensitive operations require authentication
- Permission checks on both frontend and backend
- Input validation and sanitization
- SQL injection prevention

### Audit Trail
- All modifications logged with user ID and timestamp
- Deletion reasons stored for compliance
- Entity history tracking (future enhancement)

### Rate Limiting
- API endpoints protected against abuse
- User-friendly error messages for rate limit exceeded

## Future Enhancements

### Planned Features
1. **Entity History**: Track all changes to entities
2. **Bulk Operations**: Edit/delete multiple entities
3. **Advanced Permissions**: Granular permission system
4. **Entity Templates**: Predefined entity types
5. **Automated Validation**: AI-powered content validation

### Technical Improvements
1. **Caching**: Implement entity data caching
2. **Real-time Updates**: WebSocket notifications for changes
3. **Offline Support**: Handle operations when offline
4. **Mobile Optimization**: Enhanced mobile experience

## Testing

### Manual Testing Checklist

- [ ] Edit entity with valid permissions
- [ ] Edit entity without permissions (should be denied)
- [ ] Delete entity with confirmation
- [ ] Delete entity without confirmation (should be denied)
- [ ] Delete entity with reviews (should be prevented)
- [ ] Network error handling
- [ ] Form validation
- [ ] Loading states
- [ ] Success/error notifications

### Automated Testing

```typescript
// Example test for entity editing
describe('EntityEditModal', () => {
  it('should update entity successfully', async () => {
    // Test implementation
  });

  it('should show validation errors', async () => {
    // Test implementation
  });

  it('should handle permission errors', async () => {
    // Test implementation
  });
});
```

## Deployment Notes

### Environment Variables
- Ensure proper JWT secret configuration
- Set up logging for audit trails
- Configure rate limiting

### Database Migrations
- No new migrations required for this feature
- Existing entity table structure supports all operations

### Monitoring
- Monitor API response times
- Track permission denial rates
- Log entity modification patterns

## Support and Maintenance

### Troubleshooting
1. **Permission Issues**: Check user level and entity ownership
2. **Validation Errors**: Review input requirements
3. **Network Errors**: Check API connectivity
4. **Performance Issues**: Monitor database queries

### Maintenance Tasks
- Regular audit log review
- Permission system updates
- Performance optimization
- Security updates

## Conclusion

The entity modification and deletion system provides a robust, secure, and user-friendly way to manage entities in the ReviewInn platform. The implementation follows industry best practices and includes comprehensive error handling, user feedback, and security measures.

The system is designed to be scalable and maintainable, with clear separation of concerns between frontend and backend components. Future enhancements can be easily integrated into the existing architecture. 