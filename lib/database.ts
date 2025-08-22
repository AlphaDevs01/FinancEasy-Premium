import { Pool } from 'pg';

// Database connection pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      acquireTimeoutMillis: 10000,
      allowExitOnIdle: true,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  
  return pool;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  stripe_customer_id?: string;
  status: 'trial' | 'active' | 'suspended' | 'cancelled';
  trial_end?: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  account_name: string;
  account_type: string;
  account_balance: number;
  institution: string;
  external_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  origin: 'openfinance' | 'manual';
  external_id?: string;
  created_at: string;
}

export const createUser = async (userData: Partial<User>): Promise<User> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO users (name, email, password_hash, stripe_customer_id, status, trial_end)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      userData.name,
      userData.email,
      userData.password_hash,
      userData.stripe_customer_id,
      userData.status || 'trial',
      userData.trial_end
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    // Test connection
    await client.query('SELECT 1');
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await client.query(query, [email]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const getUserById = async (id: string): Promise<User> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const fields = Object.keys(updates).filter(key => updates[key as keyof User] !== undefined);
    const values = fields.map(key => updates[key as keyof User]);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const query = `
      UPDATE users 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await client.query(query, [id, ...values]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const getUserAccounts = async (userId: string): Promise<Account[]> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT * FROM accounts 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [userId]);
    return result.rows;
  } finally {
    client.release();
  }
};

export const getAccountTransactions = async (accountId: string, limit = 100): Promise<Transaction[]> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT t.*, c.name as category
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.account_id = $1 
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT $2
    `;
    const result = await client.query(query, [accountId, limit]);
    return result.rows;
  } finally {
    client.release();
  }
};

export const getUserTransactions = async (userId: string, limit = 100): Promise<Transaction[]> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT t.*, c.name as category, a.account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      INNER JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = $1 
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT $2
    `;
    const result = await client.query(query, [userId, limit]);
    return result.rows;
  } finally {
    client.release();
  }
};

export const createAccount = async (accountData: Partial<Account>): Promise<Account> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO accounts (user_id, account_name, account_type, account_balance, institution, external_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      accountData.user_id,
      accountData.account_name,
      accountData.account_type,
      accountData.account_balance || 0,
      accountData.institution,
      accountData.external_id
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const createTransaction = async (transactionData: Partial<Transaction>): Promise<Transaction> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO transactions (account_id, category_id, type, description, amount, date, origin, external_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      transactionData.account_id,
      transactionData.category_id,
      transactionData.type,
      transactionData.description,
      transactionData.amount,
      transactionData.date,
      transactionData.origin || 'manual',
      transactionData.external_id
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
};

// Helper function to get default category ID by name and type
export const getCategoryByName = async (name: string, type: 'income' | 'expense'): Promise<string | null> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const query = 'SELECT id FROM categories WHERE name = $1 AND type = $2 AND is_default = true';
    const result = await client.query(query, [name, type]);
    return result.rows[0]?.id || null;
  } finally {
    client.release();
  }
};

// Helper function to initialize database with default categories
export const initializeDatabase = async (): Promise<void> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    // Check if categories table exists and has data
    const result = await client.query('SELECT COUNT(*) FROM categories WHERE is_default = true');
    const count = parseInt(result.rows[0].count);
    
    if (count === 0) {
      // Insert default categories
      const categories = [
        // Expense categories
        ['Alimentação', 'expense', '#EF4444', 'utensils', true],
        ['Transporte', 'expense', '#F59E0B', 'car', true],
        ['Moradia', 'expense', '#8B5CF6', 'home', true],
        ['Saúde', 'expense', '#10B981', 'heart', true],
        ['Educação', 'expense', '#3B82F6', 'book', true],
        ['Lazer', 'expense', '#F97316', 'gamepad-2', true],
        ['Compras', 'expense', '#EC4899', 'shopping-bag', true],
        ['Serviços', 'expense', '#6B7280', 'settings', true],
        ['Outros', 'expense', '#9CA3AF', 'more-horizontal', true],
        // Income categories
        ['Salário', 'income', '#10B981', 'briefcase', true],
        ['Freelance', 'income', '#059669', 'laptop', true],
        ['Investimentos', 'income', '#0D9488', 'trending-up', true],
        ['Vendas', 'income', '#0891B2', 'shopping-cart', true],
        ['Outros', 'income', '#6B7280', 'plus', true],
      ];
      
      for (const [name, type, color, icon, is_default] of categories) {
        await client.query(
          'INSERT INTO categories (name, type, color, icon, is_default) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
          [name, type, color, icon, is_default]
        );
      }
    }
  } finally {
    client.release();
  }
};
// Close database connection (useful for cleanup)
export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};