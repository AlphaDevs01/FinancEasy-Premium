import React from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  ExternalLink, 
  Key, 
  Settings, 
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

export default function OpenFinanceSetup() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Configuração OpenFinance</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="1. Criar Conta no Pluggy">
              <div className="space-y-4">
                <p className="text-gray-600">
                  O Pluggy é nossa plataforma de integração OpenFinance que permite conectar 
                  com mais de 200 instituições financeiras no Brasil.
                </p>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-medium text-blue-900">Ambiente de Teste</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        O Pluggy oferece um ambiente sandbox gratuito para testes com bancos fictícios.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={() => window.open('https://pluggy.ai', '_blank')}
                    className="flex items-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Criar Conta no Pluggy
                  </Button>
                  <Button
                    onClick={() => window.open('https://docs.pluggy.ai', '_blank')}
                    variant="secondary"
                    className="flex items-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Documentação
                  </Button>
                </div>
              </div>
            </Card>

            <Card title="2. Obter Credenciais de API">
              <div className="space-y-4">
                <p className="text-gray-600">
                  Após criar sua conta no Pluggy, você precisa obter as credenciais de API:
                </p>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Faça login no dashboard do Pluggy</li>
                    <li>Vá para a seção "API Keys" ou "Credenciais"</li>
                    <li>Copie o <strong>Client ID</strong> e <strong>Client Secret</strong></li>
                    <li>Configure no arquivo <code>.env.local</code> do projeto</li>
                  </ol>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Desenvolvimento vs Produção</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Durante o desenvolvimento (localhost), os webhooks não funcionarão pois o Pluggy 
                        requer HTTPS. Em produção, configure uma URL HTTPS válida.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="3. Configurar Variáveis de Ambiente">
              <div className="space-y-4">
                <p className="text-gray-600">
                  Adicione as seguintes variáveis no seu arquivo <code>.env.local</code>:
                </p>

                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  <div className="space-y-1">
                    <div># OpenFinance/Pluggy Configuration</div>
                    <div>PLUG_API_URL=https://api.pluggy.ai</div>
                    <div>PLUG_CLIENT_ID=<span className="text-yellow-400">seu_client_id_aqui</span></div>
                    <div>PLUG_CLIENT_SECRET=<span className="text-yellow-400">seu_client_secret_aqui</span></div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-medium text-green-900">Sandbox vs Produção</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Para testes, use as credenciais de sandbox. Para produção, 
                        use as credenciais de produção do Pluggy.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="4. Testar Conexão">
              <div className="space-y-4">
                <p className="text-gray-600">
                  Após configurar as credenciais, teste a conexão:
                </p>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Reinicie o servidor de desenvolvimento</li>
                    <li>Vá para a página "Contas"</li>
                    <li>Clique em "Conectar Banco"</li>
                    <li>Uma nova janela deve abrir com o Pluggy Connect</li>
                  </ol>
                </div>

                <Button
                  onClick={() => window.location.href = '/accounts'}
                  className="flex items-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Ir para Contas
                </Button>
                
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/pluggy/test');
                      const data = await response.json();
                      console.log('Teste Pluggy:', data);
                      if (data.success) {
                        alert('✅ Conexão com Pluggy funcionando!');
                      } else {
                        alert(`❌ Erro no teste: ${data.message}`);
                      }
                    } catch (error) {
                      console.error('Erro no teste:', error);
                      alert('❌ Erro ao testar conexão');
                    }
                  }}
                  variant="secondary"
                  className="flex items-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Testar Conexão
                </Button>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Status da Configuração">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Client ID</span>
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                    Não configurado
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Client Secret</span>
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                    Não configurado
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API URL</span>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                    Configurado
                  </span>
                </div>
              </div>
            </Card>

            <Card title="Bancos Suportados">
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Principais bancos disponíveis:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Banco do Brasil
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Bradesco
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Itaú
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Santander
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Caixa Econômica
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Nubank
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    + mais de 200 instituições
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Precisa de Ajuda?">
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Recursos úteis para configuração:
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => window.open('https://docs.pluggy.ai/docs/quickstart', '_blank')}
                    variant="secondary"
                    size="sm"
                    className="w-full flex items-center justify-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Guia Rápido
                  </Button>
                  <Button
                    onClick={() => window.open('https://docs.pluggy.ai/docs/authentication', '_blank')}
                    variant="secondary"
                    size="sm"
                    className="w-full flex items-center justify-center"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Autenticação
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}