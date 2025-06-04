import { ISavingsBucketRepository } from '../../../domain/repositories/savings-bucket-repository.js';
import { SavingsBucketService } from '../../../domain/services/savings-bucket-service.js';
import { TransferToBucketDTO, BucketTransferResponseDTO, SavingsBucketDTOMapper } from '../../dto/savings-bucket.dto.js';
import { BucketTransferType } from '../../../domain/entities/bucket-transfer.js';

export interface TransferToBucketUseCaseResult {
  success: boolean;
  transfer?: BucketTransferResponseDTO;
  errors?: string[];
}

export class TransferToBucketUseCase {
  constructor(
    private readonly savingsBucketRepo: ISavingsBucketRepository,
    private readonly savingsBucketService: SavingsBucketService
  ) {}

  async execute(bucketId: string, dto: TransferToBucketDTO): Promise<TransferToBucketUseCaseResult> {
    try {
      // Check if bucket exists and is active
      const bucket = await this.savingsBucketRepo.findById(bucketId);
      if (!bucket) {
        return {
          success: false,
          errors: ['Savings bucket not found'],
        };
      }

      if (!bucket.isActive) {
        return {
          success: false,
          errors: ['Savings bucket is not active'],
        };
      }

      // Create domain money object
      const amount = SavingsBucketDTOMapper.toDomainMoney(dto.amount, dto.currency);

      // Perform transfer based on type
      let transfer;
      if (dto.type === 'deposit') {
        transfer = await this.savingsBucketService.depositToBucket(
          bucketId,
          amount,
          dto.description
        );
      } else {
        // Check if withdrawal is possible
        if (!bucket.canWithdraw(amount)) {
          return {
            success: false,
            errors: ['Insufficient funds in bucket for withdrawal'],
          };
        }

        transfer = await this.savingsBucketService.withdrawFromBucket(
          bucketId,
          amount,
          dto.description
        );
      }

      return {
        success: true,
        transfer: SavingsBucketDTOMapper.toTransferResponseDTO(transfer),
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to process transfer: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }
} 