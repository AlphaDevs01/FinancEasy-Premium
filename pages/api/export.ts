import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../lib/auth';
import { getUserTransactions, getUserAccounts } from '../../lib/database';
import jsPDF from 'jspdf';

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

    // Buscar dados do usuário
    const accounts = await getUserAccounts(userId);
    const transactions = await getUserTransactions(userId, 100);

    // Criar PDF
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('Relatório Financeiro', 20, 30);
    
    // Data
    doc.setFontSize(12);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 45);
    
    // Resumo das contas
    doc.setFontSize(16);
    doc.text('Resumo das Contas', 20, 65);
    
    let yPosition = 80;
    accounts.forEach((account) => {
      doc.setFontSize(12);
      doc.text(`${account.account_name}: R$ ${account.account_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPosition);
      yPosition += 15;
    });
    
    // Transações recentes
    yPosition += 10;
    doc.setFontSize(16);
    doc.text('Transações Recentes', 20, yPosition);
    yPosition += 15;
    
    transactions.slice(0, 10).forEach((transaction) => {
      doc.setFontSize(10);
      const amount = transaction.type === 'income' ? `+R$ ${transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `-R$ ${Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      doc.text(`${new Date(transaction.date).toLocaleDateString('pt-BR')} - ${transaction.description} - ${amount}`, 20, yPosition);
      yPosition += 12;
      
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 30;
      }
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio-financeiro.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}