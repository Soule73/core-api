import type { Server } from 'http';
import request, { type Response } from 'supertest';
import { TestContext } from '../core';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface RequestOptions {
  useAuth?: boolean;
  asAdmin?: boolean;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

/**
 * Base class for E2E test suites providing common HTTP request functionality.
 * Implements DRY principle by centralizing HTTP operations.
 */
export abstract class BaseE2ETest {
  get context(): TestContext {
    return TestContext.getInstance();
  }

  get server(): Server {
    return this.context.httpServer;
  }

  get adminToken(): string {
    return this.context.adminToken;
  }

  get userToken(): string {
    return this.context.userToken;
  }

  get testData() {
    return this.context.testData;
  }

  request(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
  ): Promise<Response> {
    const { useAuth = true, asAdmin = true, query, body } = options;

    let req = request(this.server)[method](path);

    if (useAuth) {
      const token = asAdmin ? this.adminToken : this.userToken;
      req = req.set('Authorization', `Bearer ${token}`);
    }

    if (query) {
      req = req.query(query);
    }

    if (body && (method === 'post' || method === 'put' || method === 'patch')) {
      req = req.send(body);
    }

    return req;
  }

  get(path: string, options?: RequestOptions): Promise<Response> {
    return this.request('get', path, options);
  }

  post(
    path: string,
    body?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<Response> {
    return this.request('post', path, { ...options, body });
  }

  put(
    path: string,
    body?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<Response> {
    return this.request('put', path, { ...options, body });
  }

  patch(
    path: string,
    body?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<Response> {
    return this.request('patch', path, { ...options, body });
  }

  delete(path: string, options?: RequestOptions): Promise<Response> {
    return this.request('delete', path, options);
  }
}
