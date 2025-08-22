import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth';
import { getUserById } from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies['auth-token'];
    console.log('Status API - Token exists:', !!token);
    
    if (!token) {
      console.log('Status API - No token found');
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const payload = verifyToken(token);
    console.log('Status API - Token valid for user:', payload.email);
    const user = await getUserById(payload.userId);

    res.status(200).json({
      authenticated: true,
      status: user.status,
      trialEnd: user.trial_end,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar status do usuário:', error);
    res.status(401).json({ message: 'Token inválido' });
  }
}