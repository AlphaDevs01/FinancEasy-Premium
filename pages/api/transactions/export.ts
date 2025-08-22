import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth';
import { getUserTransactions } from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies['auth-token'];
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const payload = verifyToken(token);
    const userId = payload.userId;

    const transactions = await getUserTransactions(userId, 1000);

    // Criar CSV
    const csvHeader = 'Data,Descrição,Categoria,Conta,Tipo,Valor,Origem\n';
    const csvRows = transactions.map(t => {
      const date = new Date(t.date).toLocaleDateString('pt-BR');
      const amount = t.type === 'income' ? t.amount : -Math.abs(t.amount);
      const origin = t.origin === 'openfinance' ? 'Automática' : 'Manual';
      
      return `${date},"${t.description}","${t.category}","${t.account_name}","${t.type === 'income' ? 'Receita' : 'Despesa'}",${amount.toFixed(2)},"${origin}"`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=transacoes.csv');
    res.send('\uFEFF' + csv); // BOM para UTF-8
  } catch (error) {
    console.error('Erro ao exportar transações:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}