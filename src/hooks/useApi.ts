import { useState, useCallback, useRef } from 'react';
import { useSnackbar } from '@context/SnackbarContext';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiRequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  showSuccess?: boolean;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

const useApi = <T = any>(baseUrl: string = '') => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { showMessage } = useSnackbar();
  const abortControllerRef = useRef<AbortController | null>(null);

  const request = useCallback(
    async <T = any>(
      endpoint: string = '',
      options: ApiRequestOptions = {}
    ): Promise<{ data: T | null; error: Error | null }> => {
      const {
        method = 'GET',
        headers = {},
        body,
        showSuccess = true,
        successMessage,
        errorMessage,
        onSuccess,
        onError,
      } = options;

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const url = `${baseUrl}${endpoint}`;
      
      // Set up request headers
      const requestHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...headers,
      };

      // Prepare request config
      const config: RequestInit = {
        method,
        headers: requestHeaders,
        signal: controller.signal,
      };

      // Add body for non-GET requests
      if (method !== 'GET' && body) {
        config.body = JSON.stringify(body);
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, config);
        
        // Handle non-2xx responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || errorMessage || `Request failed with status ${response.status}`
          );
        }

        // Parse response
        const responseData = await response.json().catch(() => ({}));
        
        setData(responseData);
        
        // Show success message if needed
        if (showSuccess && successMessage) {
          showMessage(successMessage, 'success');
        }
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(responseData);
        }
        
        return { data: responseData, error: null };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An unknown error occurred');
        setError(error);
        
        // Show error message if not aborted
        if (error.name !== 'AbortError') {
          showMessage(errorMessage || error.message, 'error');
        }
        
        // Call error callback if provided
        if (onError) {
          onError(error);
        }
        
        return { data: null, error };
      } finally {
        // Only reset loading state if this is the most recent request
        if (abortControllerRef.current === controller) {
          setLoading(false);
          abortControllerRef.current = null;
        }
      }
    },
    [baseUrl, showMessage]
  );

  // Convenience methods
  const get = useCallback(
    <T = any>(endpoint: string, options: Omit<ApiRequestOptions, 'method'> = {}) => {
      return request<T>(endpoint, { ...options, method: 'GET' });
    },
    [request]
  );

  const post = useCallback(
    <T = any>(
      endpoint: string,
      body: any,
      options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
    ) => {
      return request<T>(endpoint, { ...options, method: 'POST', body });
    },
    [request]
  );

  const put = useCallback(
    <T = any>(
      endpoint: string,
      body: any,
      options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
    ) => {
      return request<T>(endpoint, { ...options, method: 'PUT', body });
    },
    [request]
  );

  const del = useCallback(
    <T = any>(endpoint: string, options: Omit<ApiRequestOptions, 'method'> = {}) => {
      return request<T>(endpoint, { ...options, method: 'DELETE' });
    },
    [request]
  );

  const patch = useCallback(
    <T = any>(
      endpoint: string,
      body: any,
      options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
    ) => {
      return request<T>(endpoint, { ...options, method: 'PATCH', body });
    },
    [request]
  );

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    data,
    loading,
    error,
    request,
    get,
    post,
    put,
    del,
    patch,
    cancelRequest,
    reset: () => {
      setData(null);
      setError(null);
      cancelRequest();
    },
  };
};

export default useApi;
