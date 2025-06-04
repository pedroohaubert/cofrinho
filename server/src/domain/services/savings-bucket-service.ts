import { SavingsBucket } from '../entities/savings-bucket.js';
import {
  BucketTransfer,
  BucketTransferType,
} from '../entities/bucket-transfer.js';
import { Money } from '../value-objects/money.js';
import { DateRange } from '../value-objects/date-range.js';
import { ISavingsBucketRepository } from '../repositories/savings-bucket-repository.js';
import { IBucketTransferRepository } from '../repositories/bucket-transfer-repository.js';

export class SavingsBucketService {
  constructor(
    private readonly bucketRepo: ISavingsBucketRepository,
    private readonly transferRepo: IBucketTransferRepository
  ) { }

  async depositToBucket(
    bucketId: string,
    amount: Money,
    description?: string
  ): Promise<BucketTransfer> {
    const bucket = await this.bucketRepo.findById(bucketId);
    if (!bucket) {
      throw new Error('Savings bucket not found');
    }

    if (!bucket.isActive) {
      throw new Error('Cannot deposit to inactive bucket');
    }

    // Update bucket balance
    bucket.addFunds(amount);
    await this.bucketRepo.update(bucket);

    // Create transfer record
    const transferId = `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transfer = BucketTransfer.createDeposit(
      transferId,
      new Date(),
      amount,
      bucketId,
      description
    );

    await this.transferRepo.save(transfer);
    return transfer;
  }

  async withdrawFromBucket(
    bucketId: string,
    amount: Money,
    description?: string
  ): Promise<BucketTransfer> {
    const bucket = await this.bucketRepo.findById(bucketId);
    if (!bucket) {
      throw new Error('Savings bucket not found');
    }

    if (!bucket.isActive) {
      throw new Error('Cannot withdraw from inactive bucket');
    }

    if (!bucket.canWithdraw(amount)) {
      throw new Error('Insufficient funds in bucket');
    }

    // Update bucket balance
    bucket.withdrawFunds(amount);
    await this.bucketRepo.update(bucket);

    // Create transfer record
    const transferId = `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transfer = BucketTransfer.createWithdrawal(
      transferId,
      new Date(),
      amount,
      bucketId,
      description
    );

    await this.transferRepo.save(transfer);
    return transfer;
  }

  async getBucketSummary(bucketId: string): Promise<BucketSummary> {
    const bucket = await this.bucketRepo.findById(bucketId);
    if (!bucket) {
      throw new Error('Savings bucket not found');
    }

    const transfers = await this.transferRepo.findByBucket(bucketId);
    const deposits = transfers.filter((t) => t.isDeposit());
    const withdrawals = transfers.filter((t) => t.isWithdrawal());

    const totalDeposits = deposits.reduce(
      (sum, t) => sum.add(t.amount),
      Money.zero()
    );
    const totalWithdrawals = withdrawals.reduce(
      (sum, t) => sum.add(t.amount),
      Money.zero()
    );

    return {
      bucketId: bucket.id,
      name: bucket.name,
      description: bucket.description,
      currentBalance: bucket.currentBalance,
      targetAmount: bucket.targetAmount,
      progressPercentage: bucket.getProgressPercentage(),
      remainingAmount: bucket.getRemainingAmount(),
      isTargetReached: bucket.isTargetReached(),
      totalDeposits,
      totalWithdrawals,
      transferCount: transfers.length,
      isActive: bucket.isActive,
    };
  }

  async getAllBucketsSummary(): Promise<AllBucketsSummary> {
    const allBuckets = await this.bucketRepo.findAll();
    const activeBuckets = allBuckets.filter((b) => b.isActive);

    let totalBalance = Money.zero();
    let totalTargetAmount = Money.zero();
    let bucketsWithTargets = 0;
    let targetsReached = 0;

    const bucketSummaries: BucketSummary[] = [];

    for (const bucket of activeBuckets) {
      const summary = await this.getBucketSummary(bucket.id);
      bucketSummaries.push(summary);

      totalBalance = totalBalance.add(bucket.currentBalance);

      if (bucket.hasTarget()) {
        bucketsWithTargets++;
        totalTargetAmount = totalTargetAmount.add(bucket.targetAmount!);

        if (bucket.isTargetReached()) {
          targetsReached++;
        }
      }
    }

    return {
      totalBuckets: activeBuckets.length,
      totalBalance,
      totalTargetAmount: bucketsWithTargets > 0 ? totalTargetAmount : null,
      bucketsWithTargets,
      targetsReached,
      overallProgress:
        bucketsWithTargets > 0
          ? (totalBalance.amount / totalTargetAmount.amount) * 100
          : null,
      buckets: bucketSummaries,
    };
  }

  async getTransferHistory(
    bucketId: string,
    dateRange?: DateRange
  ): Promise<BucketTransfer[]> {
    if (dateRange) {
      return this.transferRepo.findByBucketAndDateRange(bucketId, dateRange);
    }
    return this.transferRepo.findByBucket(bucketId);
  }

  async calculateSavingsRate(dateRange: DateRange): Promise<SavingsRate> {
    const allBuckets = await this.bucketRepo.findActiveBuckets();
    let totalDeposits = Money.zero();
    let totalWithdrawals = Money.zero();

    for (const bucket of allBuckets) {
      const deposits = await this.transferRepo.getTotalByBucketAndDateRange(
        bucket.id,
        dateRange,
        BucketTransferType.DEPOSIT
      );
      const withdrawals = await this.transferRepo.getTotalByBucketAndDateRange(
        bucket.id,
        dateRange,
        BucketTransferType.WITHDRAWAL
      );

      totalDeposits = totalDeposits.add(Money.fromCents(deposits));
      totalWithdrawals = totalWithdrawals.add(Money.fromCents(withdrawals));
    }

    const netSavings = totalDeposits.subtract(totalWithdrawals);

    return {
      period: dateRange,
      totalDeposits,
      totalWithdrawals,
      netSavings,
      savingsCount: allBuckets.length,
    };
  }

  async suggestTargetReallocation(): Promise<TargetSuggestion[]> {
    const bucketsWithTargets = await this.bucketRepo.findBucketsWithTargets();
    const suggestions: TargetSuggestion[] = [];

    for (const bucket of bucketsWithTargets) {
      if (bucket.isTargetReached()) {
        suggestions.push({
          bucketId: bucket.id,
          bucketName: bucket.name,
          currentBalance: bucket.currentBalance,
          currentTarget: bucket.targetAmount!,
          suggestion:
            'Consider increasing the target amount or creating a new savings goal',
          type: 'INCREASE_TARGET',
        });
      } else {
        const progress = bucket.getProgressPercentage();
        if (progress !== null && progress < 10) {
          suggestions.push({
            bucketId: bucket.id,
            bucketName: bucket.name,
            currentBalance: bucket.currentBalance,
            currentTarget: bucket.targetAmount!,
            suggestion:
              'Consider setting up automatic transfers to reach your goal faster',
            type: 'AUTOMATE_SAVINGS',
          });
        }
      }
    }

    return suggestions;
  }
}

export interface BucketSummary {
  bucketId: string;
  name: string;
  description: string | null;
  currentBalance: Money;
  targetAmount: Money | null;
  progressPercentage: number | null;
  remainingAmount: Money | null;
  isTargetReached: boolean;
  totalDeposits: Money;
  totalWithdrawals: Money;
  transferCount: number;
  isActive: boolean;
}

export interface AllBucketsSummary {
  totalBuckets: number;
  totalBalance: Money;
  totalTargetAmount: Money | null;
  bucketsWithTargets: number;
  targetsReached: number;
  overallProgress: number | null;
  buckets: BucketSummary[];
}

export interface SavingsRate {
  period: DateRange;
  totalDeposits: Money;
  totalWithdrawals: Money;
  netSavings: Money;
  savingsCount: number;
}

export interface TargetSuggestion {
  bucketId: string;
  bucketName: string;
  currentBalance: Money;
  currentTarget: Money;
  suggestion: string;
  type: 'INCREASE_TARGET' | 'AUTOMATE_SAVINGS';
}
