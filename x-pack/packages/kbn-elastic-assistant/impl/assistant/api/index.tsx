/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { HttpSetup } from '@kbn/core/public';
import { IHttpFetchError } from '@kbn/core-http-browser';
import {
  API_VERSIONS,
  ApiConfig,
  CreateKnowledgeBaseRequestParams,
  CreateKnowledgeBaseResponse,
  DeleteKnowledgeBaseRequestParams,
  DeleteKnowledgeBaseResponse,
  ELASTIC_AI_ASSISTANT_KNOWLEDGE_BASE_URL,
  ReadKnowledgeBaseRequestParams,
  ReadKnowledgeBaseResponse,
  Replacements,
} from '@kbn/elastic-assistant-common';
import { API_ERROR } from '../translations';
import { getOptionalRequestParams } from '../helpers';
import { TraceOptions } from '../types';
export * from './conversations';

export interface FetchConnectorExecuteAction {
  conversationId: string;
  isEnabledRAGAlerts: boolean;
  alertsIndexPattern?: string;
  isEnabledKnowledgeBase: boolean;
  assistantStreamingEnabled: boolean;
  apiConfig: ApiConfig;
  http: HttpSetup;
  message?: string;
  replacements: Replacements;
  signal?: AbortSignal | undefined;
  size?: number;
  traceOptions?: TraceOptions;
}

export interface FetchConnectorExecuteResponse {
  response: string | ReadableStreamDefaultReader<Uint8Array>;
  isError: boolean;
  isStream: boolean;
  traceData?: {
    transactionId: string;
    traceId: string;
  };
}

export const fetchConnectorExecuteAction = async ({
  conversationId,
  isEnabledRAGAlerts,
  alertsIndexPattern,
  isEnabledKnowledgeBase,
  assistantStreamingEnabled,
  http,
  message,
  replacements,
  apiConfig,
  signal,
  size,
  traceOptions,
}: FetchConnectorExecuteAction): Promise<FetchConnectorExecuteResponse> => {
  // TODO add streaming support for gemini with langchain on
  const isStream = assistantStreamingEnabled;

  const optionalRequestParams = getOptionalRequestParams({
    isEnabledRAGAlerts,
    alertsIndexPattern,
    size,
  });

  const requestBody = {
    model: apiConfig?.model,
    message,
    subAction: isStream ? 'invokeStream' : 'invokeAI',
    conversationId,
    actionTypeId: apiConfig.actionTypeId,
    replacements,
    isEnabledKnowledgeBase,
    isEnabledRAGAlerts,
    langSmithProject:
      traceOptions?.langSmithProject === '' ? undefined : traceOptions?.langSmithProject,
    langSmithApiKey:
      traceOptions?.langSmithApiKey === '' ? undefined : traceOptions?.langSmithApiKey,
    ...optionalRequestParams,
  };

  try {
    if (isStream) {
      const response = await http.fetch(
        `/internal/elastic_assistant/actions/connector/${apiConfig?.connectorId}/_execute`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          signal,
          asResponse: true,
          rawResponse: true,
          version: API_VERSIONS.internal.v1,
        }
      );

      const reader = response?.response?.body?.getReader();

      if (!reader) {
        return {
          response: `${API_ERROR}\n\nCould not get reader from response`,
          isError: true,
          isStream: false,
        };
      }
      return {
        response: reader,
        isStream: true,
        isError: false,
      };
    }

    const response = await http.fetch<{
      connector_id: string;
      status: string;
      data: string;
      replacements?: Replacements;
      service_message?: string;
      trace_data?: {
        transaction_id: string;
        trace_id: string;
      };
    }>(`/internal/elastic_assistant/actions/connector/${apiConfig?.connectorId}/_execute`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
      signal,
      version: API_VERSIONS.internal.v1,
    });

    if (response.status !== 'ok' || !response.data) {
      if (response.service_message) {
        return {
          response: `${API_ERROR}\n\n${response.service_message}`,
          isError: true,
          isStream: false,
        };
      }
      return {
        response: API_ERROR,
        isError: true,
        isStream: false,
      };
    }

    // Only add traceData if it exists in the response
    const traceData =
      response.trace_data?.trace_id != null && response.trace_data?.transaction_id != null
        ? {
            traceId: response.trace_data?.trace_id,
            transactionId: response.trace_data?.transaction_id,
          }
        : undefined;

    return {
      response: response.data,
      isError: false,
      isStream: false,
      traceData,
    };
  } catch (error) {
    const getReader = error?.response?.body?.getReader;
    const reader =
      isStream && typeof getReader === 'function' ? getReader.call(error.response.body) : null;

    if (!reader) {
      return {
        response: `${API_ERROR}\n\n${error?.body?.message ?? error?.message}`,
        isError: true,
        isStream: false,
      };
    }
    return {
      response: reader,
      isStream: true,
      isError: true,
    };
  }
};

/**
 * API call for getting the status of the Knowledge Base. Provide
 * a resource to include the status of that specific resource.
 *
 * @param {Object} options - The options object.
 * @param {HttpSetup} options.http - HttpSetup
 * @param {string} [options.resource] - Resource to get the status of, otherwise status of overall KB
 * @param {AbortSignal} [options.signal] - AbortSignal
 *
 * @returns {Promise<ReadKnowledgeBaseResponse | IHttpFetchError>}
 */
export const getKnowledgeBaseStatus = async ({
  http,
  resource,
  signal,
}: ReadKnowledgeBaseRequestParams & { http: HttpSetup; signal?: AbortSignal | undefined }): Promise<
  ReadKnowledgeBaseResponse | IHttpFetchError
> => {
  try {
    const path = ELASTIC_AI_ASSISTANT_KNOWLEDGE_BASE_URL.replace('{resource?}', resource || '');
    const response = await http.fetch(path, {
      method: 'GET',
      signal,
      version: API_VERSIONS.internal.v1,
    });

    return response as ReadKnowledgeBaseResponse;
  } catch (error) {
    return error as IHttpFetchError;
  }
};

/**
 * API call for setting up the Knowledge Base. Provide a resource to set up a specific resource.
 *
 * @param {Object} options - The options object.
 * @param {HttpSetup} options.http - HttpSetup
 * @param {string} [options.resource] - Resource to be added to the KB, otherwise sets up the base KB
 * @param {AbortSignal} [options.signal] - AbortSignal
 *
 * @returns {Promise<CreateKnowledgeBaseResponse | IHttpFetchError>}
 */
export const postKnowledgeBase = async ({
  http,
  resource,
  signal,
}: CreateKnowledgeBaseRequestParams & {
  http: HttpSetup;
  signal?: AbortSignal | undefined;
}): Promise<CreateKnowledgeBaseResponse | IHttpFetchError> => {
  try {
    const path = ELASTIC_AI_ASSISTANT_KNOWLEDGE_BASE_URL.replace('{resource?}', resource || '');
    const response = await http.fetch(path, {
      method: 'POST',
      signal,
      version: API_VERSIONS.internal.v1,
    });

    return response as CreateKnowledgeBaseResponse;
  } catch (error) {
    return error as IHttpFetchError;
  }
};

/**
 * API call for deleting the Knowledge Base. Provide a resource to delete that specific resource.
 *
 * @param {Object} options - The options object.
 * @param {HttpSetup} options.http - HttpSetup
 * @param {string} [options.resource] - Resource to be deleted from the KB, otherwise delete the entire KB
 * @param {AbortSignal} [options.signal] - AbortSignal
 *
 * @returns {Promise<DeleteKnowledgeBaseResponse | IHttpFetchError>}
 */
export const deleteKnowledgeBase = async ({
  http,
  resource,
  signal,
}: DeleteKnowledgeBaseRequestParams & {
  http: HttpSetup;
  signal?: AbortSignal | undefined;
}): Promise<DeleteKnowledgeBaseResponse | IHttpFetchError> => {
  try {
    const path = ELASTIC_AI_ASSISTANT_KNOWLEDGE_BASE_URL.replace('{resource?}', resource || '');
    const response = await http.fetch(path, {
      method: 'DELETE',
      signal,
      version: API_VERSIONS.internal.v1,
    });

    return response as DeleteKnowledgeBaseResponse;
  } catch (error) {
    return error as IHttpFetchError;
  }
};
