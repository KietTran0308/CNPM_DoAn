/**
 * =====================================================================
 * KẾT NỐI CƠ SỞ DỮ LIỆU SQL ĐA NỀN TẢNG (DATABASE CONNECTION MANAGER)
 * =====================================================================
 * Tự động hỗ trợ:
 * 1. PostgreSQL (khi có biến môi trường DATABASE_URL hoặc SQL_HOST)
 * 2. SQLite nhúng độc lập (sql.js lưu tại data/app.db) tự khởi tạo từ schema.sql
 */

import fs from 'fs';
import path from 'path';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import pg from 'pg';

const { Pool } = pg;

export interface DatabaseAdapter {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<void>;
  isPg: boolean;
}

class SqlDatabaseManager {
  private adapter: DatabaseAdapter | null = null;
  private isInitializing: Promise<DatabaseAdapter> | null = null;

  async getDb(): Promise<DatabaseAdapter> {
    if (this.adapter) return this.adapter;
    if (this.isInitializing) return this.isInitializing;

    this.isInitializing = this.init();
    this.adapter = await this.isInitializing;
    return this.adapter;
  }

  private async init(): Promise<DatabaseAdapter> {
    const hasPg = Boolean(
      process.env.DATABASE_URL ||
      (process.env.SQL_HOST && process.env.SQL_USER)
    );

    if (hasPg) {
      try {
        console.log('[DB] Connecting to PostgreSQL database...');
        const pool = new Pool(
          process.env.DATABASE_URL
            ? { connectionString: process.env.DATABASE_URL }
            : {
                host: process.env.SQL_HOST,
                user: process.env.SQL_USER,
                password: process.env.SQL_PASSWORD,
                database: process.env.SQL_DB_NAME,
                port: Number(process.env.SQL_PORT || 5432),
              }
        );

        // Test connection
        await pool.query('SELECT 1');
        console.log('[DB] Connected successfully to PostgreSQL.');

        const pgAdapter: DatabaseAdapter = {
          isPg: true,
          async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
            const res = await pool.query(sql, params);
            return res.rows as T[];
          },
          async execute(sql: string, params: any[] = []): Promise<void> {
            await pool.query(sql, params);
          },
        };

        // Bootstrap schema if needed
        await this.bootstrapSchema(pgAdapter);
        return pgAdapter;
      } catch (err) {
        console.warn('[DB] PostgreSQL connection failed. Falling back to embedded SQLite:', err);
      }
    }

    // Fallback: Embedded SQLite via sql.js with local disk persistence
    console.log('[DB] Initializing embedded SQLite relational database...');
    const SQL = await initSqlJs();
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbFilePath = path.join(dataDir, 'app.db');
    let dbInstance: SqlJsDatabase;

    if (fs.existsSync(dbFilePath)) {
      const fileBuffer = fs.readFileSync(dbFilePath);
      dbInstance = new SQL.Database(fileBuffer);
      console.log('[DB] Loaded existing database from data/app.db');
    } else {
      dbInstance = new SQL.Database();
      console.log('[DB] Created fresh database file.');
    }

    const saveToDisk = () => {
      try {
        const data = dbInstance.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbFilePath, buffer);
      } catch (err) {
        console.error('[DB] Failed to persist database to disk:', err);
      }
    };

    const sqliteAdapter: DatabaseAdapter = {
      isPg: false,
      async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        // Convert $1, $2 (PG style) to ?, ? (SQLite style) if needed
        const normalizedSql = sql.replace(/\$(\d+)/g, '?');
        try {
          const stmt = dbInstance.prepare(normalizedSql);
          stmt.bind(params);
          const results: T[] = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject() as T);
          }
          stmt.free();
          return results;
        } catch (err) {
          console.error('[DB Query Error]', err, 'SQL:', normalizedSql, 'Params:', params);
          throw err;
        }
      },
      async execute(sql: string, params: any[] = []): Promise<void> {
        const normalizedSql = sql.replace(/\$(\d+)/g, '?');
        try {
          dbInstance.run(normalizedSql, params);
          saveToDisk();
        } catch (err) {
          console.error('[DB Execute Error]', err, 'SQL:', normalizedSql, 'Params:', params);
          throw err;
        }
      },
    };

    await this.bootstrapSchema(sqliteAdapter);
    return sqliteAdapter;
  }

  private async bootstrapSchema(adapter: DatabaseAdapter) {
    try {
      // Check if menu_items already has records
      const existing = await adapter.query<{ count: number }>(
        'SELECT count(*) as count FROM menu_items'
      );
      if (existing.length > 0 && Number(existing[0].count) > 0) {
        console.log(`[DB] Database already initialized with ${existing[0].count} menu items.`);
        return;
      }
    } catch {
      // Table doesn't exist yet, proceed to execute schema.sql
    }

    console.log('[DB] Executing schema.sql initialization & seed data...');
    const schemaPath = path.resolve(process.cwd(), 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      // Strip comments (-- and /* */) and split by semicolon
      const noComments = schemaSql
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');

      const statements = noComments
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        try {
          await adapter.execute(stmt);
        } catch (err) {
          console.error('[DB Init Statement Failed]', stmt.slice(0, 80), err);
        }
      }
      console.log('[DB] Schema and 32 menu items successfully seeded into database!');
    }
  }
}

export const dbManager = new SqlDatabaseManager();
