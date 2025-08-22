import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../lib/auth';
import { getUserTransactions, createTransaction, getCategoryByName } from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies['auth-token'];
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const payload = verifyToken(token);
    const userId = payload.userId;

    if (req.method === 'GET') {
      const transactions = await getUserTransactions(userId, 100);
      res.status(200).json(transactions);
    } else if (req.method === 'POST') {
      const { account_id, type, category_id, description, amount, date } = req.body;

      if (!account_id || !type || !category_id || !description || !amount || !date) {
        return res.status(400).json({ message: 'Campos obrigatórios não preenchidos' });
      }

      const transaction = await createTransaction({
        account_id,
        category_id,
        type,
        description,
        amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
        date,
        origin: 'manual',
      });

      res.status(201).json(transaction);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Erro na API de transações:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}