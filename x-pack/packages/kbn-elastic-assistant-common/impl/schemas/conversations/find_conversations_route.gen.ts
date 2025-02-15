/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Find Conversations API endpoint
 *   version: 1
 */

import { z } from 'zod';
import { ArrayFromString } from '@kbn/zod-helpers';

import { ConversationResponse } from './common_attributes.gen';

export type FindConversationsSortField = z.infer<typeof FindConversationsSortField>;
export const FindConversationsSortField = z.enum([
  'created_at',
  'is_default',
  'title',
  'updated_at',
]);
export type FindConversationsSortFieldEnum = typeof FindConversationsSortField.enum;
export const FindConversationsSortFieldEnum = FindConversationsSortField.enum;

export type SortOrder = z.infer<typeof SortOrder>;
export const SortOrder = z.enum(['asc', 'desc']);
export type SortOrderEnum = typeof SortOrder.enum;
export const SortOrderEnum = SortOrder.enum;

export type FindConversationsRequestQuery = z.infer<typeof FindConversationsRequestQuery>;
export const FindConversationsRequestQuery = z.object({
  fields: ArrayFromString(z.string()).optional(),
  /**
   * Search query
   */
  filter: z.string().optional(),
  /**
   * Field to sort by
   */
  sort_field: FindConversationsSortField.optional(),
  /**
   * Sort order
   */
  sort_order: SortOrder.optional(),
  /**
   * Page number
   */
  page: z.coerce.number().int().min(1).optional().default(1),
  /**
   * Conversations per page
   */
  per_page: z.coerce.number().int().min(0).optional().default(20),
});
export type FindConversationsRequestQueryInput = z.input<typeof FindConversationsRequestQuery>;

export type FindConversationsResponse = z.infer<typeof FindConversationsResponse>;
export const FindConversationsResponse = z.object({
  page: z.number().int(),
  perPage: z.number().int(),
  total: z.number().int(),
  data: z.array(ConversationResponse),
});
export type FindCurrentUserConversationsRequestQuery = z.infer<
  typeof FindCurrentUserConversationsRequestQuery
>;
export const FindCurrentUserConversationsRequestQuery = z.object({
  fields: ArrayFromString(z.string()).optional(),
  /**
   * Search query
   */
  filter: z.string().optional(),
  /**
   * Field to sort by
   */
  sort_field: FindConversationsSortField.optional(),
  /**
   * Sort order
   */
  sort_order: SortOrder.optional(),
  /**
   * Page number
   */
  page: z.coerce.number().int().min(1).optional().default(1),
  /**
   * Conversations per page
   */
  per_page: z.coerce.number().int().min(0).optional().default(20),
});
export type FindCurrentUserConversationsRequestQueryInput = z.input<
  typeof FindCurrentUserConversationsRequestQuery
>;

export type FindCurrentUserConversationsResponse = z.infer<
  typeof FindCurrentUserConversationsResponse
>;
export const FindCurrentUserConversationsResponse = z.object({
  page: z.number().int(),
  perPage: z.number().int(),
  total: z.number().int(),
  data: z.array(ConversationResponse),
});
