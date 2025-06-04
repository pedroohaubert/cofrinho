import { SavingsBucket } from '../../../domain/entities/savings-bucket.js';
import { ISavingsBucketRepository } from '../../../domain/repositories/savings-bucket-repository.js';
import { CreateSavingsBucketDTO, SavingsBucketResponseDTO, SavingsBucketDTOMapper } from '../../dto/savings-bucket.dto.js';

export interface CreateSavingsBucketUseCaseResult {
  success: boolean;
  bucket?: SavingsBucketResponseDTO;
  errors?: string[];
}

export class CreateSavingsBucketUseCase {
  constructor(
    private readonly savingsBucketRepo: ISavingsBucketRepository
  ) {}

  async execute(dto: CreateSavingsBucketDTO): Promise<CreateSavingsBucketUseCaseResult> {
    try {
      // Check for duplicate bucket name
      const existingBucket = await this.savingsBucketRepo.findByName(dto.name);
      if (existingBucket && existingBucket.isActive) {
        return {
          success: false,
          errors: ['A savings bucket with this name already exists'],
        };
      }

      // Create domain objects
      const targetAmount = dto.targetAmount ? 
        SavingsBucketDTOMapper.toDomainMoney(dto.targetAmount, dto.currency) : 
        null;
      
      const initialBalance = dto.initialBalance ? 
        SavingsBucketDTOMapper.toDomainMoney(dto.initialBalance, dto.currency) : 
        null;
      
      // Generate unique ID
      const id = this.generateId();

      // Create savings bucket entity
      let bucket: SavingsBucket;
      
      if (initialBalance) {
        bucket = SavingsBucket.createWithInitialBalance(
          id,
          dto.name,
          initialBalance,
          targetAmount || undefined,
          dto.description
        );
      } else {
        bucket = SavingsBucket.create(
          id,
          dto.name,
          targetAmount || undefined,
          dto.description
        );
      }

      // Save bucket
      await this.savingsBucketRepo.save(bucket);

      return {
        success: true,
        bucket: SavingsBucketDTOMapper.toResponseDTO(bucket),
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to create savings bucket: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  private generateId(): string {
    // In a real application, use a proper UUID generator
    return `bucket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
} 