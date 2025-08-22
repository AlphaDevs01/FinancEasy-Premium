import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Plus, 
  Building2, 
  CreditCard, 
  Wallet, 
  RefreshCw,
  Trash2,
  Edit,
  Link as LinkIcon
} from 'lucide-react';

interface Account {
  id: string;
  account_name: string;
  account_type: string;
  account_balance: number;
  institution: string;
  external_id?: string;
  created_at: string;
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [formData, setFormData] = useState({
    account_name: '',
    account_type: 'checking',
    account_balance: '',
    institution: '',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          account_balance: parseFloat(formData.account_balance) || 0,
        }),
      });

      if (response.ok) {
        await fetchAccounts();
        setShowAddForm(false);
        setFormData({
          account_name: '',
          account_type: 'checking',
          account_balance: '',
          institution: '',
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar conta:', error);
    }
  };

  const handleConnectBank = async () => {
    setSyncing(true);
    try {
      console.log('Iniciando conexão com banco...');
      const response = await fetch('/api/pluggy/connect', {
        method: 'POST',
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data.connectUrl) {
        console.log('Abrindo URL de conexão:', data.connectUrl);
        console.log('Connect token recebido:', data.connectToken ? 'Presente' : 'Ausente');
        
        // Verificar se o connect token está presente na URL
        const url = new URL(data.connectUrl);
        const tokenFromUrl = url.searchParams.get('connectToken');
        console.log('Token na URL:', tokenFromUrl ? 'Presente' : 'Ausente');
        
        if (!tokenFromUrl) {
          alert('Erro: Connect token não encontrado na URL. Verifique os logs do console.');
          return;
        }
        
        window.open(data.connectUrl, '_blank', 'width=600,height=700');
      } else {
        console.error('Erro na resposta:', data);
        alert(`Erro ao conectar: ${data.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao conectar banco:', error);
      alert('Erro ao conectar com o banco. Verifique o console para mais detalhes.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncAccounts = async () => {
    setSyncing(true);
    try {
      await fetch('/api/pluggy/sync', { method: 'POST' });
      await fetchAccounts();
    } catch (error) {
      console.error('Erro ao sincronizar contas:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking': return <Wallet className="w-6 h-6" />;
      case 'savings': return <Building2 className="w-6 h-6" />;
      case 'credit': return <CreditCard className="w-6 h-6" />;
      default: return <Wallet className="w-6 h-6" />;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      checking: 'Conta Corrente',
      savings: 'Poupança',
      credit: 'Cartão de Crédito',
      investment: 'Investimento',
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Minhas Contas</h1>
          <div className="flex space-x-3">
            <Button
              onClick={handleConnectBank}
              loading={syncing}
              variant="secondary"
              className="flex items-center"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Conectar Banco
            </Button>
            <Button
              onClick={handleSyncAccounts}
              loading={syncing}
              variant="secondary"
              className="flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sincronizar
            </Button>
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Conta
            </Button>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Total de Contas</p>
              <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Saldo Total</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {accounts.reduce((sum, acc) => sum + acc.account_balance, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Contas Conectadas</p>
              <p className="text-2xl font-bold text-blue-600">
                {accounts.filter(acc => acc.external_id).length}
              </p>
            </div>
          </Card>
        </div>

        {/* Lista de Contas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <Card key={account.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    {getAccountIcon(account.account_type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {account.account_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {getAccountTypeLabel(account.account_type)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {account.institution}
                    </p>
                  </div>
                </div>
                {account.external_id && (
                  <div className="flex-shrink-0">
                    <div className="w-3 h-3 bg-green-400 rounded-full" title="Conta conectada"></div>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">
                  R$ {account.account_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500">
                  Adicionada em {new Date(account.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Modal de Adicionar Conta */}
        {showAddForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Adicionar Nova Conta</h2>
              <form onSubmit={handleAddAccount} className="space-y-4">
                <Input
                  label="Nome da Conta"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Conta
                  </label>
                  <select
                    value={formData.account_type}
                    onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="checking">Conta Corrente</option>
                    <option value="savings">Poupança</option>
                    <option value="credit">Cartão de Crédito</option>
                    <option value="investment">Investimento</option>
                  </select>
                </div>
                <Input
                  label="Saldo Inicial"
                  type="number"
                  step="0.01"
                  value={formData.account_balance}
                  onChange={(e) => setFormData({ ...formData, account_balance: e.target.value })}
                />
                <Input
                  label="Instituição"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  required
                />
                <div className="flex space-x-3">
                  <Button type="submit" className="flex-1">
                    Adicionar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}