import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth';
import { getUserById, updateUser } from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies['auth-token'];
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const payload = verifyToken(token);
    const userId = payload.userId;

    if (req.method === 'GET') {
      const user = await getUserById(userId);
      res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        trial_end: user.trial_end,
        created_at: user.created_at,
      });
    } else if (req.method === 'PUT') {
      const { name, email } = req.body;

      if (!name || !email) {
        return res.status(400).json({ message: 'Nome e email são obrigatórios' });
      }

      const updatedUser = await updateUser(userId, { name, email });
      res.status(200).json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        status: updatedUser.status,
      });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Erro na API de perfil:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}