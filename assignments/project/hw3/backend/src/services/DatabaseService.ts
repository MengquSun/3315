/**
 * Database Service for Firebase Firestore integration
 * Implements the Data Access Layer of the 3-tier architecture
 */

import { cert, getApps, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { AppError, DatabaseStats, ErrorType, QueryOptions } from '../../shared/types';

export class DatabaseService {
  private db: Firestore | null = null;
  private isConnectedFlag: boolean = false;

  /**
   * Initialize Firebase connection
   */
  public async connect(): Promise<void> {
    try {
      // Check if Firebase app is already initialized
      if (getApps().length === 0) {
        const serviceAccount: ServiceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID!,
          privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          clientId: process.env.FIREBASE_CLIENT_ID!,
          authUri: process.env.FIREBASE_AUTH_URI!,
          tokenUri: process.env.FIREBASE_TOKEN_URI!,
        };

        initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID!,
        });
      }

      this.db = getFirestore();
      this.isConnectedFlag = true;
      
      // Test connection
      await this.testConnection();
      
    } catch (error) {
      this.isConnectedFlag = false;
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to connect to database',
        code: 'DB_CONNECTION_FAILED',
        details: error
      });
    }
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Try to read from a test collection
      await this.db.collection('_health_check').limit(1).get();
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Database connection test failed',
        code: 'DB_CONNECTION_TEST_FAILED',
        details: error
      });
    }
  }

  /**
   * Close database connection
   */
  public async disconnect(): Promise<void> {
    this.isConnectedFlag = false;
    // Firebase Admin SDK doesn't require explicit disconnect
    // Connection is managed automatically
  }

  /**
   * Check if database is connected
   */
  public isConnected(): boolean {
    return this.isConnectedFlag && this.db !== null;
  }

  /**
   * Get database statistics
   */
  public getStats(): DatabaseStats {
    return {
      connectionCount: this.isConnectedFlag ? 1 : 0,
      activeQueries: 0, // Firebase doesn't expose this
      uptime: process.uptime(),
      version: 'Firebase Firestore'
    };
  }

  /**
   * Generic find one operation
   */
  public async findOne<T>(collection: string, criteria: any): Promise<T | null> {
    if (!this.db) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Database not connected',
        code: 'DB_NOT_CONNECTED'
      });
    }

    try {
      const collectionRef = this.db.collection(collection);
      let query = collectionRef.limit(1);

      // Apply criteria filters
      for (const [field, value] of Object.entries(criteria)) {
        if (value !== undefined) {
          query = query.where(field, '==', value) as any;
        }
      }

      const snapshot = await query.get();
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as T;
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to find document',
        code: 'DB_FIND_FAILED',
        details: error
      });
    }
  }

  /**
   * Generic find many operation
   */
  public async findMany<T>(
    collection: string, 
    criteria: any = {}, 
    options: QueryOptions = {}
  ): Promise<T[]> {
    if (!this.db) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Database not connected',
        code: 'DB_NOT_CONNECTED'
      });
    }

    try {
      const collectionRef = this.db.collection(collection);
      let query: any = collectionRef;

      // Apply criteria filters
      for (const [field, value] of Object.entries(criteria)) {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            query = query.where(field, 'in', value);
          } else {
            query = query.where(field, '==', value);
          }
        }
      }

      // Apply sorting
      if (options.sort) {
        for (const [field, direction] of Object.entries(options.sort)) {
          query = query.orderBy(field, direction === 1 ? 'asc' : 'desc');
        }
      }

      // Apply pagination
      if (options.skip) {
        query = query.offset(options.skip);
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to find documents',
        code: 'DB_FIND_MANY_FAILED',
        details: error
      });
    }
  }

  /**
   * Generic create operation
   */
  public async createOne<T>(collection: string, data: any): Promise<T> {
    if (!this.db) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Database not connected',
        code: 'DB_NOT_CONNECTED'
      });
    }

    try {
      const collectionRef = this.db.collection(collection);
      const timestamp = new Date();
      
      const docData = {
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      const docRef = await collectionRef.add(docData);
      
      return {
        id: docRef.id,
        ...docData
      } as T;
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to create document',
        code: 'DB_CREATE_FAILED',
        details: error
      });
    }
  }

  /**
   * Generic update operation
   */
  public async updateOne<T>(collection: string, id: string, updates: any): Promise<T> {
    if (!this.db) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Database not connected',
        code: 'DB_NOT_CONNECTED'
      });
    }

    try {
      const docRef = this.db.collection(collection).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError({
          type: ErrorType.NOT_FOUND_ERROR,
          message: 'Document not found',
          code: 'DOCUMENT_NOT_FOUND'
        });
      }

      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      await docRef.update(updateData);

      const updatedDoc = await docRef.get();
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as T;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to update document',
        code: 'DB_UPDATE_FAILED',
        details: error
      });
    }
  }

  /**
   * Generic delete operation
   */
  public async deleteOne(collection: string, id: string): Promise<void> {
    if (!this.db) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Database not connected',
        code: 'DB_NOT_CONNECTED'
      });
    }

    try {
      const docRef = this.db.collection(collection).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError({
          type: ErrorType.NOT_FOUND_ERROR,
          message: 'Document not found',
          code: 'DOCUMENT_NOT_FOUND'
        });
      }

      await docRef.delete();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to delete document',
        code: 'DB_DELETE_FAILED',
        details: error
      });
    }
  }

  /**
   * Execute operation within transaction
   */
  public async withTransaction<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Database not connected',
        code: 'DB_NOT_CONNECTED'
      });
    }

    try {
      return await this.db.runTransaction(async () => {
        return await operation();
      });
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Transaction failed',
        code: 'DB_TRANSACTION_FAILED',
        details: error
      });
    }
  }

  /**
   * Get Firestore instance (for advanced operations)
   */
  public getFirestore(): Firestore {
    if (!this.db) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Database not connected',
        code: 'DB_NOT_CONNECTED'
      });
    }
    return this.db;
  }
}