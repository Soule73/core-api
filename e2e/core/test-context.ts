import type { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import type {
  ITestContext,
  TestDataSet,
  IAppFactory,
  IDataSeeder,
  IAuthenticator,
} from './interfaces';
import { NestAppFactory } from './factories';
import { AuthenticationService, DataSeederService } from './services';

/**
 * Singleton class managing the global E2E test context.
 * Provides centralized access to application, authentication tokens, and test data.
 * Implements Singleton pattern for shared state across all test files.
 */
export class TestContext implements ITestContext {
  private static instance: TestContext | null = null;

  private _app: INestApplication | null = null;
  private _testData: TestDataSet | null = null;
  private _adminToken = '';
  private _userToken = '';
  private _isReady = false;

  private readonly appFactory: IAppFactory;
  private readonly dataSeeder: IDataSeeder;
  private readonly authenticator: IAuthenticator;

  private constructor() {
    this.appFactory = new NestAppFactory();
    this.dataSeeder = new DataSeederService();
    this.authenticator = new AuthenticationService();
  }

  /**
   * Returns the singleton instance of TestContext.
   */
  static getInstance(): TestContext {
    if (!TestContext.instance) {
      TestContext.instance = new TestContext();
    }
    return TestContext.instance;
  }

  /**
   * Resets the singleton instance (useful for testing the test framework itself).
   */
  static resetInstance(): void {
    TestContext.instance = null;
  }

  get app(): INestApplication {
    this.ensureInitialized();
    return this._app!;
  }

  get httpServer(): Server {
    this.ensureInitialized();
    return this._app!.getHttpServer() as Server;
  }

  get testData(): TestDataSet {
    this.ensureInitialized();
    return this._testData!;
  }

  get adminToken(): string {
    this.ensureInitialized();
    return this._adminToken;
  }

  get userToken(): string {
    this.ensureInitialized();
    return this._userToken;
  }

  get isReady(): boolean {
    return this._isReady;
  }

  /**
   * Initializes the test environment: creates app, seeds data, authenticates users.
   */
  async initialize(): Promise<void> {
    if (this._isReady) {
      return;
    }

    console.info('[TestContext] Initializing E2E environment...');

    this._app = await this.appFactory.create();
    console.info('[TestContext] Application created');

    this._testData = await this.dataSeeder.seed(this._app);
    console.info('[TestContext] Test data seeded');

    this._adminToken = await this.authenticator.login(
      this._app,
      this._testData.adminUser.email,
      this._testData.adminUser.password,
    );
    console.info('[TestContext] Admin authenticated');

    this._userToken = await this.authenticator.login(
      this._app,
      this._testData.regularUser.email,
      this._testData.regularUser.password,
    );
    console.info('[TestContext] User authenticated');

    this._isReady = true;
    console.info('[TestContext] Ready!');
  }

  /**
   * Cleans up the test environment: logs out users, destroys app.
   */
  async destroy(): Promise<void> {
    if (!this._isReady) {
      return;
    }

    console.info('[TestContext]: Cleaning up...');

    try {
      if (this._app && this._adminToken) {
        await this.authenticator.logout(this._app, this._adminToken);
      }
      if (this._app && this._userToken) {
        await this.authenticator.logout(this._app, this._userToken);
      }
      console.info('[TestContext] Users logged out');
    } catch {
      // Logout may fail if server is already closed
    }

    if (this._app) {
      await this.appFactory.destroy(this._app);
      console.info('[TestContext] Application destroyed');
    }

    this._app = null;
    this._testData = null;
    this._adminToken = '';
    this._userToken = '';
    this._isReady = false;

    console.info('[TestContext] Cleanup complete!\n');
  }

  /**
   * Creates authorization header for admin user.
   */
  getAdminAuthHeader(): { Authorization: string } {
    return { Authorization: `Bearer ${this.adminToken}` };
  }

  /**
   * Creates authorization header for regular user.
   */
  getUserAuthHeader(): { Authorization: string } {
    return { Authorization: `Bearer ${this.userToken}` };
  }

  private ensureInitialized(): void {
    if (!this._isReady) {
      throw new Error(
        'TestContext not initialized. Call TestContext.getInstance().initialize() first.',
      );
    }
  }
}
