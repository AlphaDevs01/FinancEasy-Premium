interface PluggyAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  bankData?: {
    transferNumber?: string;
    closingBalance?: number;
  };
}

interface PluggyTransaction {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  descriptionRaw?: string;
  date: string;
  category?: string;
  categoryId?: string;
  type?: string;
  balance?: number;
}

interface PluggyItem {
  id: string;
  connector: {
    id: number;
    name: string;
    institutionUrl: string;
    imageUrl: string;
    primaryColor: string;
    type: string;
  };
  status: string;
  statusDetail?: string;
  createdAt: string;
  updatedAt: string;
  lastUpdatedAt?: string;
  webhookUrl?: string;
  clientUserId?: string;
}

class PluggyService {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.baseUrl = process.env.PLUG_API_URL || 'https://api.pluggy.ai';
    this.clientId = process.env.PLUG_CLIENT_ID || '';
    this.clientSecret = process.env.PLUG_CLIENT_SECRET || '';

    if (!this.clientId || !this.clientSecret) {
      console.warn('OpenFinance credentials not configured. Configure PLUG_CLIENT_ID and PLUG_CLIENT_SECRET in .env.local');
    }
  }

  async getAccessToken(): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('OpenFinance credentials not configured. Configure PLUG_CLIENT_ID and PLUG_CLIENT_SECRET in .env.local');
    }

    // Verificar se o token ainda é válido
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    console.log('Obtendo novo token de acesso do Pluggy...');
    const response = await fetch(`${this.baseUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na autenticação Pluggy:', errorText);
      throw new Error(`Erro na autenticação: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Pluggy returns apiKey in the response
    this.accessToken = data.apiKey || data.accessToken || data.access_token;
    
    console.log('Pluggy auth response received');
    
    // Token expira em 1 hora, renovar 5 minutos antes
    this.tokenExpiry = Date.now() + (55 * 60 * 1000);
    
    if (!this.accessToken) {
      console.error('No access token found in response:', JSON.stringify(data, null, 2));
      throw new Error('Access token not found in Pluggy response');
    }
    
    console.log('Token de acesso obtido com sucesso');
    return this.accessToken;
  }

  async getItems(userId: string): Promise<PluggyItem[]> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.baseUrl}/items?clientUserId=${userId}`, {
      headers: {
        'X-API-KEY': token,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar items: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  async getAccounts(itemId: string): Promise<PluggyAccount[]> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.baseUrl}/accounts?itemId=${itemId}`, {
      headers: {
        'X-API-KEY': token,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar contas: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  async getTransactions(accountId: string, from?: string, to?: string): Promise<PluggyTransaction[]> {
    const token = await this.getAccessToken();
    
    const params = new URLSearchParams();
    params.append('accountId', accountId);
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const response = await fetch(`${this.baseUrl}/transactions?${params}`, {
      headers: {
        'X-API-KEY': token,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar transações: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  async createConnectToken(userId: string, itemId?: string): Promise<string> {
    const token = await this.getAccessToken();
    
    console.log('Criando connect token para usuário:', userId);
    
    const payload = {
      itemId: itemId || null,
      clientUserId: userId,
      options: {
        language: 'pt',
        products: ['accounts', 'transactions'],
      },
    };
    
    // Só adicionar webhook URL se estivermos em produção (HTTPS)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    if (appUrl.startsWith('https://')) {
      payload.options.webhookUrl = `${appUrl}/api/pluggy/webhook`;
    }
    
    const response = await fetch(`${this.baseUrl}/connect_token`, {
      method: 'POST',
      headers: {
        'X-API-KEY': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro ao criar connect token:', errorText);
      throw new Error(`Erro ao criar connect token: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Connect token criado com sucesso');
    return data.connectToken;
  }

  async syncUserData(userId: string): Promise<{ success: boolean; error?: any; data?: any }> {
    if (!this.clientId || !this.clientSecret) {
      return { success: false, error: 'OpenFinance credentials not configured' };
    }

    try {
      const items = await this.getItems(userId);
      const syncResults = {
        itemsFound: items.length,
        accountsSynced: 0,
        transactionsSynced: 0,
      };

      for (const item of items) {
        if (item.status !== 'UPDATED') continue;

        const accounts = await this.getAccounts(item.id);
        syncResults.accountsSynced += accounts.length;

        // Aqui você implementaria a lógica para salvar as contas no banco
        // e sincronizar as transações
      }
      
      return { success: true, data: syncResults };
    } catch (error) {
      console.error('Erro ao sincronizar dados:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  // Método para webhook do Pluggy
  async handleWebhook(webhookData: any): Promise<void> {
    console.log('Webhook recebido do Pluggy:', webhookData);
    
    // Implementar lógica de processamento do webhook
    // Por exemplo, quando uma conta é atualizada, sincronizar automaticamente
    if (webhookData.event === 'item/updated') {
      const itemId = webhookData.data.itemId;
      const clientUserId = webhookData.data.clientUserId;
      
      if (clientUserId) {
        await this.syncUserData(clientUserId);
      }
    }
  }
}

export const pluggyService = new PluggyService();

// Manter compatibilidade com código existente
export const openFinanceService = pluggyService;