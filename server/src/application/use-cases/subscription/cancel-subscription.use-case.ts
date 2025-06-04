import { ISubscriptionRepository } from '@/domain/repositories/subscription-repository.js';
import { CancelSubscriptionDTO, SubscriptionResponseDTO, SubscriptionDTOMapper } from '@/application/dto/subscription.dto.js';

export interface CancelSubscriptionUseCaseResult {
  success: boolean;
  subscription?: SubscriptionResponseDTO;
  errors?: string[];
}

export class CancelSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepo: ISubscriptionRepository
  ) {}

  async execute(id: string, dto: CancelSubscriptionDTO): Promise<CancelSubscriptionUseCaseResult> {
    try {
      // Find existing subscription
      const subscription = await this.subscriptionRepo.findById(id);
      if (!subscription) {
        return {
          success: false,
          errors: ['Subscription not found'],
        };
      }

      // Check if subscription is already cancelled
      if (subscription.isCancelled()) {
        return {
          success: false,
          errors: ['Subscription is already cancelled'],
        };
      }

      // Cancel the subscription
      const endDate = dto.endDate ? new Date(dto.endDate) : new Date();
      subscription.cancel(endDate);

      // Save updated subscription
      await this.subscriptionRepo.update(subscription);

      return {
        success: true,
        subscription: SubscriptionDTOMapper.toResponseDTO(subscription),
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }
} 