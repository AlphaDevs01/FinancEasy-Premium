import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../lib/auth';
import { getUserTransactions } from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies['auth-token'];
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const payload = verifyToken(token);
    const userId = payload.userId;
    const period = req.query.period as string || '6months';

    // Calcular período
    const months = period === '3months' ? 3 : period === '12months' ? 12 : 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const transactions = await getUserTransactions(userId, 1000);
    
    // Filtrar transações pelo período
    const filteredTransactions = transactions.filter(t => 
      new Date(t.date) >= startDate
    );

    // Dados mensais
    const monthlyData = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      const monthTransactions = filteredTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === date.getMonth() && 
               transactionDate.getFullYear() === date.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      monthlyData.push({ 
        month, 
        income, 
        expenses, 
        balance: income - expenses 
      });
    }

    // Dados por categoria
    const categoryMap = new Map();
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + Math.abs(t.amount));
      });

    const categoryData = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Resumo
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const summary = {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactionCount: filteredTransactions.length,
    };

    res.status(200).json({
      monthlyData,
      categoryData,
      summary,
    });
  } catch (error) {
    console.error('Erro na API de relatórios:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}