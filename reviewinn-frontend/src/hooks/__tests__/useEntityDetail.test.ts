import { renderHook, act } from '@testing-library/react';
import { useEntityDetail } from '../useEntityDetail';
import { entityServiceFactory } from '../../api/services/entityServiceFactory';
import { reviewService } from '../../api/services/reviewService';

// Mock the services
jest.mock('../../api/services/entityServiceFactory');
jest.mock('../../api/services/reviewService');
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: '123' }),
  useNavigate: () => jest.fn(),
}));

const mockEntityServiceFactory = entityServiceFactory as jest.Mocked<typeof entityServiceFactory>;
const mockReviewService = reviewService as jest.Mocked<typeof reviewService>;

describe('useEntityDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useEntityDetail());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.entity).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should load entity data successfully', async () => {
    const mockEntity = { id: '123', name: 'Test Entity' };
    const mockReviews = { reviews: [{ id: '1', content: 'Great!' }] };

    mockEntityServiceFactory.getEntityById.mockResolvedValue(mockEntity);
    mockReviewService.getReviewsForEntity.mockResolvedValue(mockReviews);

    const { result } = renderHook(() => useEntityDetail());

    // Wait for async operations to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.entity).toEqual(mockEntity);
    expect(result.current.allReviews).toEqual(mockReviews.reviews);
    expect(result.current.error).toBe(null);
  });

  it('should handle entity not found error', async () => {
    mockEntityServiceFactory.getEntityById.mockResolvedValue(null);
    mockReviewService.getReviewsForEntity.mockResolvedValue({ reviews: [] });

    const { result } = renderHook(() => useEntityDetail());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.entity).toBe(null);
    expect(result.current.error).toBe('Entity not found');
  });

  it('should handle service errors', async () => {
    mockEntityServiceFactory.getEntityById.mockRejectedValue(new Error('Service error'));

    const { result } = renderHook(() => useEntityDetail());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Failed to load entity data');
  });

  it('should handle rating filter changes', async () => {
    const mockEntity = { id: '123', name: 'Test Entity' };
    const mockReviews = { 
      reviews: [
        { id: '1', overallRating: 5 },
        { id: '2', overallRating: 3 },
        { id: '3', overallRating: 5 }
      ] 
    };

    mockEntityServiceFactory.getEntityById.mockResolvedValue(mockEntity);
    mockReviewService.getReviewsForEntity.mockResolvedValue(mockReviews);

    const { result } = renderHook(() => useEntityDetail());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Test rating filter
    act(() => {
      result.current.handleRatingChange(5);
    });

    expect(result.current.selectedRating).toBe(5);
    expect(result.current.displayedReviews).toHaveLength(2); // Only 5-star reviews
  });

  it('should handle time sort changes', async () => {
    const mockEntity = { id: '123', name: 'Test Entity' };
    const mockReviews = { 
      reviews: [
        { id: '1', createdAt: '2023-01-01' },
        { id: '2', createdAt: '2023-01-02' }
      ] 
    };

    mockEntityServiceFactory.getEntityById.mockResolvedValue(mockEntity);
    mockReviewService.getReviewsForEntity.mockResolvedValue(mockReviews);

    const { result } = renderHook(() => useEntityDetail());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Test time sort
    await act(async () => {
      await result.current.handleTimeSortChange('oldest');
    });

    expect(result.current.timeSort).toBe('oldest');
  });

  it('should provide computed values', async () => {
    const mockEntity = { id: '123', name: 'Test Entity', averageRating: 4.5 };
    const mockReviews = { 
      reviews: [
        { id: '1', overallRating: 5 },
        { id: '2', overallRating: 4 }
      ] 
    };

    mockEntityServiceFactory.getEntityById.mockResolvedValue(mockEntity);
    mockReviewService.getReviewsForEntity.mockResolvedValue(mockReviews);

    const { result } = renderHook(() => useEntityDetail());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.hasReviews).toBe(true);
    expect(result.current.totalReviews).toBe(2);
    expect(result.current.averageRating).toBe(4.5);
    expect(result.current.canWriteReview).toBe(true);
  });
}); 