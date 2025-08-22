import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../lib/auth';
import { Pool } from 'pg';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies['auth-token'];
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const payload = verifyToken(token);

    if (req.method === 'GET') {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });

      const client = await pool.connect();
      
      try {
        const query = `
          SELECT * FROM categories 
          WHERE is_default = true OR user_id = $1
          ORDER BY type, name
        `;
        const result = await client.query(query, [payload.userId]);
        res.status(200).json(result.rows);
      } finally {
        client.release();
        await pool.end();
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Erro na API de categorias:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}