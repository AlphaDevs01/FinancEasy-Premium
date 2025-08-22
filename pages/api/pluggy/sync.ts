import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth';
import { createAccount, createTransaction, getCategoryByName } from '../../../lib/database';
import { Pool } from 'pg';

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

    const clientId = process.env.PLUG_CLIENT_ID;
    const clientSecret = process.env.PLUG_CLIENT_SECRET;
    const apiUrl = process.env.PLUG_API_URL || 'https://api.pluggy.ai';

    if (!clientId || !clientSecret) {
      return res.status(500).json({ 
        message: 'Credenciais do Pluggy não configuradas' 
      });
    }

    // Obter token de acesso
    const authResponse = await fetch(`${apiUrl}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    });

    const authData = await authResponse.json();
    
    // Pluggy returns apiKey in the response
    const accessToken = authData.apiKey || authData.accessToken || authData.access_token;
    
    if (!accessToken) {
      throw new Error('Access token not found in Pluggy response');
    }

    // Buscar items (conexões) do usuário
    const itemsResponse = await fetch(`${apiUrl}/items?clientUserId=${userId}`, {
      headers: { 'X-API-KEY': accessToken },
    });

    const items = await itemsResponse.json();

    let syncedAccounts = 0;
    let syncedTransactions = 0;

    for (const item of items.results || []) {
      if (item.status !== 'UPDATED') continue;

      // Buscar contas do item
      const accountsResponse = await fetch(`${apiUrl}/accounts?itemId=${item.id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      const accounts = await accountsResponse.json();

      for (const pluggyAccount of accounts.results || []) {
        // Verificar se a conta já existe
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          headers: { 'X-API-KEY': accessToken },
        });

        const client = await pool.connect();
        
        try {
          const existingAccount = await client.query(
            'SELECT id FROM accounts WHERE external_id = $1 AND user_id = $2',
            [pluggyAccount.id, userId]
          );

          let accountId;

          if (existingAccount.rows.length === 0) {
            // Criar nova conta
            const account = await createAccount({
              user_id: userId,
              account_name: pluggyAccount.name,
              account_type: pluggyAccount.type.toLowerCase(),
              account_balance: pluggyAccount.balance || 0,
              institution: item.connector.name,
              external_id: pluggyAccount.id,
            });
            accountId = account.id;
            syncedAccounts++;
          } else {
            accountId = existingAccount.rows[0].id;
            
            // Atualizar saldo
            await client.query(
              'UPDATE accounts SET account_balance = $1, updated_at = NOW() WHERE id = $2',
              [pluggyAccount.balance || 0, accountId]
            );
          }

          // Buscar transações da conta
          const transactionsResponse = await fetch(
            `${apiUrl}/transactions?accountId=${pluggyAccount.id}&from=${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`,
            { headers: { 'X-API-KEY': accessToken } }
          );

          const transactions = await transactionsResponse.json();

          for (const pluggyTransaction of transactions.results || []) {
            // Verificar se a transação já existe
            const existingTransaction = await client.query(
              'SELECT id FROM transactions WHERE external_id = $1',
              [pluggyTransaction.id]
            );

            if (existingTransaction.rows.length === 0) {
              // Determinar categoria baseada na descrição
              const isIncome = pluggyTransaction.amount > 0;
              const categoryName = isIncome ? 'Outras Receitas' : 'Outros Gastos';
              const categoryId = await getCategoryByName(categoryName, isIncome ? 'income' : 'expense');

              if (categoryId) {
                await createTransaction({
                  account_id: accountId,
                  category_id: categoryId,
                  type: isIncome ? 'income' : 'expense',
                  description: pluggyTransaction.description || 'Transação importada',
                  amount: pluggyTransaction.amount,
                  date: pluggyTransaction.date,
                  origin: 'openfinance',
                  external_id: pluggyTransaction.id,
                });
                syncedTransactions++;
              }
            }
          }
        } finally {
          client.release();
          await pool.end();
        }
      }
    }

    res.status(200).json({
      message: 'Sincronização concluída',
      syncedAccounts,
      syncedTransactions,
    });
  } catch (error) {
    console.error('Erro na sincronização:', error);
    res.status(500).json({ 
      message: 'Erro na sincronização',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}