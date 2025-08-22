import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../lib/auth';
import { openFinanceService } from '../../lib/openfinance';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies['auth-token'];
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const payload = verifyToken(token);
    const userId = payload.userId;

    // Sincronizar dados do OpenFinance
    const result = await openFinanceService.syncUserData(userId);

    if (result.success) {
      res.status(200).json({ message: 'Sincronização realizada com sucesso' });
    } else {
      res.status(500).json({ message: 'Erro na sincronização', error: result.error });
    }
  } catch (error) {
    console.error('Erro na sincronização:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}