# ReviewInn - Coding Standards & Guidelines

**Version**: 1.0.0  
**Last Updated**: 2024-07-14  
**Applies To**: All development work on ReviewInn platform

## Table of Contents

1. [General Principles](#general-principles)
2. [Python Backend Standards](#python-backend-standards)
3. [TypeScript Frontend Standards](#typescript-frontend-standards)
4. [Database Standards](#database-standards)
5. [API Design Standards](#api-design-standards)
6. [Documentation Standards](#documentation-standards)
7. [Testing Standards](#testing-standards)
8. [Security Standards](#security-standards)
9. [Performance Standards](#performance-standards)
10. [Code Review Guidelines](#code-review-guidelines)

---

## General Principles

### 1. Clean Code Principles
- **Readable**: Code should be self-documenting and easy to understand
- **Simple**: Favor simple solutions over complex ones
- **DRY**: Don't Repeat Yourself - extract common functionality
- **SOLID**: Follow SOLID principles for object-oriented design
- **YAGNI**: You Aren't Gonna Need It - don't over-engineer

### 2. Architecture Principles
- **Domain-Driven**: Organize code around business domains
- **Interface-First**: Design interfaces before implementations
- **Dependency Injection**: Use dependency injection for loose coupling
- **Event-Driven**: Use domain events for cross-domain communication
- **Configuration-Driven**: Use configuration for environment-specific behavior

### 3. Quality Standards
- **Type Safety**: Use type hints (Python) and TypeScript
- **Error Handling**: Proper exception handling and logging
- **Testing**: Comprehensive test coverage
- **Documentation**: Clear documentation for all public APIs
- **Security**: Security-first approach in all design decisions

---

## Python Backend Standards

### Code Style & Formatting

#### Tools
- **Black**: Code formatting (line length: 88 characters)
- **isort**: Import sorting and organization
- **flake8**: Linting and style checking
- **mypy**: Static type checking

#### Configuration
```toml
# pyproject.toml
[tool.black]
line-length = 88
target-version = ['py311']

[tool.isort]
profile = "black"
multi_line_output = 3

[tool.mypy]
python_version = "3.11"
strict = true
```

### Naming Conventions

#### Files and Modules
```python
# Good
user_service.py
entity_management.py
auth_middleware.py

# Bad
UserService.py
entityManagement.py
Auth-Middleware.py
```

#### Classes
```python
# Good
class EntityManagementService:
class UserRepository:
class AuthenticationError:

# Bad
class entityManagementService:
class userRepository:
class authenticationError:
```

#### Functions and Variables
```python
# Good
def create_entity(entity_data: Dict[str, Any]) -> Entity:
user_id = get_current_user_id()
MAX_RETRY_ATTEMPTS = 3

# Bad
def CreateEntity(entityData):
userId = getCurrentUserId()
maxRetryAttempts = 3
```

### Type Hints

#### Function Signatures
```python
# Good - Complete type hints
async def create_entity(
    entity_data: CreateEntitySchema,
    user_id: int,
    db: AsyncSession
) -> EntityResponseSchema:
    pass

# Good - Generic types
def process_items[T](items: List[T]) -> Dict[str, T]:
    pass

# Bad - Missing type hints
def create_entity(entity_data, user_id, db):
    pass
```

#### Class Definitions
```python
# Good
class EntityService:
    def __init__(
        self,
        repository: IEntityRepository,
        cache: ICacheService
    ) -> None:
        self._repository = repository
        self._cache = cache
    
    async def get_entity(self, entity_id: int) -> Optional[Entity]:
        pass
```

### Error Handling

#### Custom Exceptions
```python
# Good - Domain-specific exceptions
class EntityNotFoundError(BaseApplicationError):
    def __init__(self, entity_id: int):
        super().__init__(
            message=f"Entity with ID {entity_id} not found",
            error_code="ENTITY_NOT_FOUND",
            status_code=404
        )

# Usage
async def get_entity(self, entity_id: int) -> Entity:
    entity = await self._repository.get_by_id(entity_id)
    if not entity:
        raise EntityNotFoundError(entity_id)
    return entity
```

#### Error Logging
```python
# Good - Structured logging
logger.error(
    "Failed to create entity",
    extra={
        "entity_data": entity_data,
        "user_id": user_id,
        "error": str(e)
    },
    exc_info=True
)

# Bad - Unstructured logging
logger.error(f"Error: {e}")
```

### Service Layer Patterns

#### Interface Definition
```python
# Good - Clear interface
class IEntityService(Protocol):
    async def create_entity(self, data: CreateEntitySchema) -> Entity:
        """Create a new entity with validation."""
        ...
    
    async def get_entity(self, entity_id: int) -> Optional[Entity]:
        """Retrieve entity by ID with caching."""
        ...
```

#### Service Implementation
```python
# Good - Following the pattern
class EntityManagementService(IEntityService):
    def __init__(
        self,
        repository: IEntityRepository,
        cache: ICacheService,
        event_bus: IEventBus
    ):
        self._repository = repository
        self._cache = cache
        self._events = event_bus
    
    async def create_entity(self, data: CreateEntitySchema) -> Entity:
        # 1. Validation (done by schema)
        # 2. Business logic
        entity = await self._repository.create(data.dict())
        
        # 3. Cache invalidation
        await self._cache.invalidate_pattern("entities:*")
        
        # 4. Event publishing
        await self._events.publish(EntityCreatedEvent(
            entity_id=entity.id,
            entity_data=data.dict()
        ))
        
        return entity
```

### Database Patterns

#### Repository Pattern
```python
# Good - Repository implementation
class EntityRepository(BaseRepository[Entity]):
    async def create(self, data: Dict[str, Any]) -> Entity:
        entity = Entity(**data)
        self.db.add(entity)
        await self.db.commit()
        await self.db.refresh(entity)
        return entity
    
    async def get_by_category(self, category: str) -> List[Entity]:
        result = await self.db.execute(
            select(Entity).where(Entity.category == category)
        )
        return result.scalars().all()
```

#### Model Definitions
```python
# Good - SQLAlchemy model
class Entity(Base):
    __tablename__ = "entities"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    
    # Relationships
    reviews: Mapped[List["Review"]] = relationship(
        back_populates="entity",
        cascade="all, delete-orphan"
    )
```

---

## TypeScript Frontend Standards

### Code Style & Formatting

#### Tools
- **Prettier**: Code formatting
- **ESLint**: Linting and code quality
- **TypeScript**: Type checking

#### Configuration
```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "prefer-const": "error",
    "no-var": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

### Naming Conventions

#### Files and Components
```typescript
// Good
EntityCard.tsx
entity-service.ts
useEntityData.ts
entityTypes.ts

// Bad
entitycard.tsx
EntityService.ts
UseEntityData.ts
entity_types.ts
```

#### Variables and Functions
```typescript
// Good
const entityData = await fetchEntity(entityId);
const handleEntityClick = (entity: Entity) => {};
const ENTITY_CACHE_KEY = 'entities';

// Bad
const EntityData = await fetchEntity(entityId);
const HandleEntityClick = (entity: Entity) => {};
const entity_cache_key = 'entities';
```

### React Component Patterns

#### Functional Components
```typescript
// Good - Proper typing and structure
interface EntityCardProps {
  entity: Entity;
  onEdit?: (entity: Entity) => void;
  className?: string;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  onEdit,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleEdit = useCallback(() => {
    onEdit?.(entity);
  }, [entity, onEdit]);
  
  return (
    <div className={`entity-card ${className}`}>
      {/* Component JSX */}
    </div>
  );
};
```

#### Custom Hooks
```typescript
// Good - Custom hook pattern
interface UseEntityDataOptions {
  entityId: number;
  refetchInterval?: number;
}

interface UseEntityDataReturn {
  entity: Entity | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useEntityData = ({
  entityId,
  refetchInterval = 30000
}: UseEntityDataOptions): UseEntityDataReturn => {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Implementation...
  
  return { entity, loading, error, refetch };
};
```

### Service Layer Patterns

#### API Services
```typescript
// Good - Service class pattern
class EntityService {
  constructor(private httpClient: HttpClient) {}
  
  async createEntity(data: CreateEntityRequest): Promise<Entity> {
    try {
      const response = await this.httpClient.post<ApiResponse<Entity>>(
        '/api/v1/entities',
        data
      );
      return response.data.data;
    } catch (error) {
      throw new EntityServiceError('Failed to create entity', error);
    }
  }
  
  async getEntity(entityId: number): Promise<Entity> {
    const response = await this.httpClient.get<ApiResponse<Entity>>(
      `/api/v1/entities/${entityId}`
    );
    return response.data.data;
  }
}
```

#### Type Definitions
```typescript
// Good - Complete type definitions
export interface Entity {
  id: number;
  name: string;
  category: string;
  description?: string;
  location?: string;
  website?: string;
  imageUrl?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
  
  // Analytics fields
  viewCount: number;
  reviewCount: number;
  averageRating?: number;
}

export interface CreateEntityRequest {
  name: string;
  category: string;
  description?: string;
  location?: string;
  website?: string;
  imageUrl?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface EntityListResponse {
  entities: Entity[];
  total: number;
  skip: number;
  limit: number;
  hasMore: boolean;
}
```

---

## Database Standards

### Schema Design

#### Table Naming
```sql
-- Good
CREATE TABLE entities (
CREATE TABLE user_profiles (
CREATE TABLE review_reactions (

-- Bad
CREATE TABLE Entity (
CREATE TABLE UserProfile (
CREATE TABLE ReviewReaction (
```

#### Column Naming
```sql
-- Good
CREATE TABLE entities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Bad
CREATE TABLE entities (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UpdatedAt TIMESTAMP WITH TIME ZONE
);
```

#### Indexes
```sql
-- Good - Proper indexing strategy
CREATE INDEX idx_entities_category ON entities(category);
CREATE INDEX idx_entities_name_search ON entities USING gin(to_tsvector('english', name));
CREATE INDEX idx_reviews_entity_created ON reviews(entity_id, created_at);

-- Composite indexes for common queries
CREATE INDEX idx_entities_category_rating ON entities(category, average_rating DESC);
```

### Migration Standards

#### Migration Files
```python
# Good - Clear migration structure
"""Add entity analytics table

Revision ID: 001_add_entity_analytics
Revises: 000_initial_schema
Create Date: 2024-07-14

"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'entity_analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=False),
        sa.Column('view_count', sa.Integer(), server_default='0'),
        sa.Column('last_viewed', sa.DateTime(timezone=True)),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['entity_id'], ['entities.id'])
    )

def downgrade():
    op.drop_table('entity_analytics')
```

---

## API Design Standards

### RESTful Design

#### URL Structure
```
# Good - RESTful URLs
GET    /api/v1/entities              # List entities
POST   /api/v1/entities              # Create entity
GET    /api/v1/entities/{id}         # Get entity
PUT    /api/v1/entities/{id}         # Update entity
DELETE /api/v1/entities/{id}         # Delete entity

# Good - Nested resources
GET    /api/v1/entities/{id}/reviews # Get entity reviews
POST   /api/v1/entities/{id}/reviews # Create review for entity

# Bad - Non-RESTful URLs
GET    /api/v1/getEntity
POST   /api/v1/createEntity
GET    /api/v1/entity-reviews
```

#### HTTP Status Codes
```python
# Good - Proper status codes
return JSONResponse(
    status_code=201,  # Created
    content={"success": True, "data": entity}
)

return JSONResponse(
    status_code=404,  # Not Found
    content={
        "success": False,
        "message": "Entity not found",
        "error_code": "ENTITY_NOT_FOUND"
    }
)

# Standard status codes:
# 200 - OK (successful GET, PUT)
# 201 - Created (successful POST)
# 204 - No Content (successful DELETE)
# 400 - Bad Request (validation errors)
# 401 - Unauthorized (authentication required)
# 403 - Forbidden (insufficient permissions)
# 404 - Not Found (resource doesn't exist)
# 409 - Conflict (resource already exists)
# 422 - Unprocessable Entity (validation errors)
# 500 - Internal Server Error (server errors)
```

#### Response Format
```python
# Good - Consistent response format
{
    "success": true,
    "data": {
        "id": 1,
        "name": "Example Entity",
        "category": "business"
    },
    "message": "Entity retrieved successfully"
}

# Error response format
{
    "success": false,
    "message": "Validation failed",
    "error_code": "VALIDATION_ERROR",
    "details": {
        "field": "name",
        "message": "Name is required"
    }
}
```

### API Documentation

#### OpenAPI/Swagger
```python
# Good - Comprehensive endpoint documentation
@router.post(
    "/entities",
    response_model=EntityResponseSchema,
    status_code=201,
    summary="Create a new entity",
    description="Create a new entity with the provided data",
    responses={
        201: {"description": "Entity created successfully"},
        400: {"description": "Invalid input data"},
        409: {"description": "Entity already exists"}
    }
)
async def create_entity(
    entity_data: CreateEntitySchema,
    current_user: User = Depends(get_current_user)
) -> EntityResponseSchema:
    """
    Create a new entity.
    
    - **name**: Entity name (required)
    - **category**: Entity category (required)
    - **description**: Optional description
    - **location**: Optional location
    """
    pass
```

---

## Documentation Standards

### Code Documentation

#### Docstrings
```python
# Good - Comprehensive docstring
class EntityManagementService:
    """
    Service for managing entity CRUD operations.
    
    This service handles all entity-related business logic including
    creation, retrieval, updating, and deletion of entities. It also
    manages caching and event publishing for entity operations.
    
    Attributes:
        _repository: Repository for entity data access
        _cache: Cache service for performance optimization
        _events: Event bus for domain event publishing
    """
    
    async def create_entity(self, data: CreateEntitySchema) -> Entity:
        """
        Create a new entity with validation and event publishing.
        
        Args:
            data: Entity creation data validated by schema
            
        Returns:
            The created entity with generated ID and timestamps
            
        Raises:
            ValidationError: When entity data is invalid
            DuplicateEntityError: When entity already exists
            
        Example:
            >>> service = EntityManagementService(repo, cache, events)
            >>> entity_data = CreateEntitySchema(name="Test", category="business")
            >>> entity = await service.create_entity(entity_data)
            >>> print(entity.id)  # Generated ID
        """
        pass
```

#### Inline Comments
```python
# Good - Explaining complex logic
async def calculate_trending_score(self, entity_id: int) -> float:
    # Algorithm weights: 40% recent views, 30% recent reviews, 30% rating
    recent_views = await self._get_weekly_views(entity_id)
    recent_reviews = await self._get_weekly_reviews(entity_id)
    avg_rating = await self._get_average_rating(entity_id)
    
    # Normalize values to 0-1 scale
    normalized_views = min(recent_views / 1000, 1.0)
    normalized_reviews = min(recent_reviews / 100, 1.0)
    normalized_rating = (avg_rating or 0) / 5.0
    
    return (normalized_views * 0.4 + 
            normalized_reviews * 0.3 + 
            normalized_rating * 0.3)
```

### README Files

#### Structure
```markdown
# Service/Component Name

Brief description of what this service/component does.

## Purpose

Detailed explanation of the business purpose and responsibilities.

## Dependencies

- List of dependencies
- External services used
- Required environment variables

## Usage

```python
# Code examples showing how to use the service
service = EntityManagementService(repository, cache, events)
entity = await service.create_entity(data)
```

## Configuration

Environment variables and configuration options.

## Testing

How to run tests and what they cover.
```

---

## Testing Standards

### Test Organization

#### Test Structure
```python
# Good - Clear test organization
class TestEntityManagementService:
    """Test suite for EntityManagementService."""
    
    @pytest.fixture
    async def service(self, mock_repository, mock_cache, mock_events):
        """Create service instance with mocked dependencies."""
        return EntityManagementService(
            repository=mock_repository,
            cache=mock_cache,
            event_bus=mock_events
        )
    
    class TestCreateEntity:
        """Tests for create_entity method."""
        
        async def test_create_entity_success(self, service, sample_entity_data):
            """Test successful entity creation."""
            # Arrange
            expected_entity = Entity(id=1, **sample_entity_data)
            service._repository.create.return_value = expected_entity
            
            # Act
            result = await service.create_entity(sample_entity_data)
            
            # Assert
            assert result.id == 1
            assert result.name == sample_entity_data["name"]
            service._repository.create.assert_called_once()
            service._events.publish.assert_called_once()
        
        async def test_create_entity_validation_error(self, service):
            """Test entity creation with invalid data."""
            # Arrange
            invalid_data = {"name": ""}  # Empty name should fail
            
            # Act & Assert
            with pytest.raises(ValidationError):
                await service.create_entity(invalid_data)
```

#### Test Categories
```python
# Unit Tests - Test individual components
@pytest.mark.unit
class TestEntityRepository:
    pass

# Integration Tests - Test component interactions
@pytest.mark.integration
class TestEntityAPI:
    pass

# End-to-End Tests - Test complete workflows
@pytest.mark.e2e
class TestEntityWorkflow:
    pass
```

### Frontend Testing

#### Component Testing
```typescript
// Good - React component testing
describe('EntityCard', () => {
  const mockEntity: Entity = {
    id: 1,
    name: 'Test Entity',
    category: 'business',
    // ... other required fields
  };

  it('renders entity information correctly', () => {
    render(<EntityCard entity={mockEntity} />);
    
    expect(screen.getByText('Test Entity')).toBeInTheDocument();
    expect(screen.getByText('business')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    render(<EntityCard entity={mockEntity} onEdit={mockOnEdit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockEntity);
  });
});
```

---

## Security Standards

### Input Validation

#### Backend Validation
```python
# Good - Comprehensive validation
class CreateEntitySchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., regex=r'^[a-zA-Z_]+$')
    website: Optional[str] = Field(None, regex=r'^https?://.+')
    
    @validator('name')
    def validate_name(cls, v):
        # Prevent XSS by sanitizing input
        if '<' in v or '>' in v:
            raise ValueError('Name contains invalid characters')
        return v.strip()
```

#### Authentication & Authorization
```python
# Good - Proper authentication check
@router.post("/entities")
async def create_entity(
    entity_data: CreateEntitySchema,
    current_user: User = Depends(get_current_active_user)
):
    # Verify user permissions
    if not current_user.can_create_entities():
        raise PermissionDeniedError("Insufficient permissions")
    
    return await entity_service.create_entity(entity_data)
```

### Data Protection

#### Password Handling
```python
# Good - Secure password handling
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

#### Sensitive Data Logging
```python
# Good - Avoid logging sensitive data
logger.info(
    "User login attempt",
    extra={
        "user_id": user.id,
        "email": user.email[:3] + "***",  # Partial email only
        "ip_address": request.client.host
    }
)

# Bad - Logging sensitive data
logger.info(f"User {user.email} logged in with password {password}")
```

---

## Performance Standards

### Database Performance

#### Query Optimization
```python
# Good - Efficient queries
async def get_entities_with_stats(self, category: str) -> List[Entity]:
    # Single query with joins instead of N+1 queries
    query = (
        select(Entity)
        .options(
            selectinload(Entity.reviews),
            selectinload(Entity.analytics)
        )
        .where(Entity.category == category)
        .order_by(Entity.created_at.desc())
    )
    
    result = await self.db.execute(query)
    return result.scalars().all()
```

#### Caching Strategy
```python
# Good - Strategic caching
async def get_trending_entities(self, limit: int = 10) -> List[Entity]:
    cache_key = f"trending:entities:{limit}"
    
    # Try cache first
    cached_result = await self._cache.get(cache_key)
    if cached_result:
        return cached_result
    
    # Expensive computation
    entities = await self._calculate_trending_entities(limit)
    
    # Cache for 15 minutes
    await self._cache.set(cache_key, entities, ttl=900)
    
    return entities
```

### Frontend Performance

#### Component Optimization
```typescript
// Good - Optimized React component
const EntityList = React.memo<EntityListProps>(({ entities, onEntityClick }) => {
  const handleEntityClick = useCallback((entity: Entity) => {
    onEntityClick(entity);
  }, [onEntityClick]);

  return (
    <div className="entity-list">
      {entities.map(entity => (
        <EntityCard 
          key={entity.id}
          entity={entity}
          onClick={handleEntityClick}
        />
      ))}
    </div>
  );
});
```

---

## Code Review Guidelines

### Review Checklist

#### Functionality
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] Input validation is comprehensive

#### Code Quality
- [ ] Code follows naming conventions
- [ ] Functions have single responsibility
- [ ] Code is DRY (Don't Repeat Yourself)
- [ ] Complex logic is commented

#### Architecture
- [ ] Code follows domain boundaries
- [ ] Dependencies are properly injected
- [ ] Interfaces are used appropriately
- [ ] Events are published for cross-domain communication

#### Security
- [ ] Input is validated and sanitized
- [ ] Authentication/authorization is checked
- [ ] Sensitive data is not logged
- [ ] SQL injection prevention

#### Performance
- [ ] Database queries are optimized
- [ ] Caching is used appropriately
- [ ] Large operations are async
- [ ] Memory usage is reasonable

#### Testing
- [ ] Unit tests cover main functionality
- [ ] Edge cases are tested
- [ ] Mocks are used appropriately
- [ ] Tests are maintainable

### Review Process

1. **Automated Checks**: Ensure all CI checks pass
2. **Code Review**: At least one reviewer approval required
3. **Testing**: Verify tests pass and coverage is adequate
4. **Documentation**: Check that documentation is updated
5. **Security Review**: Security implications are considered

---

**Document Status**: Living Document - Updated with coding practices  
**Next Review**: Quarterly or with major changes  
**Maintainer**: Development Team  
**Last Updated**: 2024-07-14