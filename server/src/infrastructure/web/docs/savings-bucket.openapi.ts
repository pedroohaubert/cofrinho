import { z } from 'zod';
import { createBasicCRUDRoutes } from './generate-all-docs';
import {
  CreateSavingsBucketSchema,
  UpdateSavingsBucketSchema,
  SavingsBucketResponseSchema,
  TransferToBucketSchema,
  BucketTransferResponseSchema
} from '../../../application/validation/savings-bucket.schema';

// Generate basic CRUD routes for savings buckets
export const savingsBucketRoutes = createBasicCRUDRoutes('buckets', {
  list: z.array(SavingsBucketResponseSchema),
  create: CreateSavingsBucketSchema,
  update: UpdateSavingsBucketSchema,
  response: SavingsBucketResponseSchema,
}, 'Savings Buckets');

// Transfer to bucket route
export const transferToBucketRoute = {
  path: '/{id}/transfer',
  method: 'put' as const,
  tags: ['Savings Buckets'],
  summary: 'Transfer money to/from savings bucket',
  description: 'Deposit or withdraw money from a savings bucket',
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: 'id',
          in: 'path',
          description: 'Savings bucket ID',
          required: true,
        },
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: TransferToBucketSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Transfer completed successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: BucketTransferResponseSchema,
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: 'Bad request - Invalid transfer data',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              message: z.string(),
              code: z.string(),
              timestamp: z.string(),
              path: z.string(),
            }),
          }),
        },
      },
    },
    404: {
      description: 'Savings bucket not found',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              message: z.string(),
              code: z.string(),
              timestamp: z.string(),
              path: z.string(),
            }),
          }),
        },
      },
    },
  },
};

// Export individual routes for easy use
export const listSavingsBucketsRoute = savingsBucketRoutes.list;
export const createSavingsBucketRoute = savingsBucketRoutes.create;
export const getSavingsBucketRoute = savingsBucketRoutes.get;
export const updateSavingsBucketRoute = savingsBucketRoutes.update;
export const deleteSavingsBucketRoute = savingsBucketRoutes.delete; 