import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../lib/auth';
import { getUserAccounts, createAccount } from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies['auth-token'];
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const payload = verifyToken(token);
    const userId = payload.userId;

    if (req.method === 'GET') {
      const accounts = await getUserAccounts(userId);
      res.status(200).json(accounts);
    } else if (req.method === 'POST') {
      const { account_name, account_type, account_balance, institution } = req.body;

      if (!account_name || !account_type || !institution) {
        return res.status(400).json({ message: 'Campos obrigatórios não preenchidos' });
      }

      const account = await createAccount({
        user_id: userId,
        account_name,
        account_type,
        account_balance: account_balance || 0,
        institution,
      });

      res.status(201).json(account);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Erro na API de contas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}