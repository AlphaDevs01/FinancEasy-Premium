import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      return res.status(500).json({ 
        error: 'DATABASE_URL não configurada',
        message: 'Configure a variável DATABASE_URL no arquivo .env.local'
      });
    }

    if (connectionString.includes('your-neon-endpoint')) {
      return res.status(500).json({ 
        error: 'DATABASE_URL não configurada corretamente',
        message: 'Substitua "your-neon-endpoint" pela sua connection string real do Neon'
      });
    }

    const pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 10000,
    });

    const client = await pool.connect();
    
    try {
      // Test basic connection
      const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
      
      // Test if users table exists
      const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      `);

      await pool.end();

      res.status(200).json({
        success: true,
        message: 'Conexão com banco de dados bem-sucedida!',
        data: {
          currentTime: result.rows[0].current_time,
          postgresVersion: result.rows[0].postgres_version,
          usersTableExists: tableCheck.rows.length > 0,
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro de conexão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro de conexão com banco de dados',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      details: 'Verifique se a DATABASE_URL está correta e se o banco está acessível'
    });
  }
}