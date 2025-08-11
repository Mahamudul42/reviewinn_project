/**
 * Centralized verification utilities to ensure consistency across all services
 * This now relies solely on database data for consistency
 */

export function enhanceEntityWithVerification<T extends { 
  name: string; 
  isVerified?: boolean; 
  isClaimed?: boolean;
  is_verified?: boolean;
  is_claimed?: boolean;
}>(entity: T): T {
  // Use database values directly - prioritize is_verified/is_claimed from API over isVerified/isClaimed
  const isVerified = entity.is_verified ?? entity.isVerified ?? false;
  const isClaimed = entity.is_claimed ?? entity.isClaimed ?? false;
  
  return {
    ...entity,
    isVerified,
    isClaimed
  };
}