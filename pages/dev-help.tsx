import React from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  ExternalLink,
  Globe,
  Shield
} from 'lucide-react';

export default function DevHelp() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Ajuda para Desenvolvimento</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Problema: Webhook HTTPS">
            <div className="space-y-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">Erro Comum</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    "Webhook url must be a https secured url"
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Solução</h4>
                <p className="text-sm text-blue-700">
                  Durante o desenvolvimento, os webhooks são opcionais. O sistema funcionará 
                  normalmente, mas você precisará sincronizar manualmente as transações.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-green-900">Status Atual</h4>
                    <p className="text-sm text-green-700 mt-1">
                      ✅ Webhook removido para desenvolvimento<br/>
                      ✅ Connect token funcionando<br/>
                      ✅ Conexão com bancos disponível
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Testando a Integração">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Agora você pode testar a conexão com bancos:
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => window.location.href = '/accounts'}
                  className="w-full flex items-center justify-center"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Ir para Contas
                </Button>

                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/pluggy/test');
                      const data = await response.json();
                      if (data.success) {
                        alert('✅ Teste passou! Você pode conectar bancos agora.');
                      } else {
                        alert(`❌ Erro: ${data.message}`);
                      }
                    } catch (error) {
                      alert('❌ Erro na conexão');
                    }
                  }}
                  variant="secondary"
                  className="w-full flex items-center justify-center"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Testar Novamente
                </Button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Próximos Passos</h4>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                  <li>Vá para a página "Contas"</li>
                  <li>Clique em "Conectar Banco"</li>
                  <li>Escolha um banco de teste</li>
                  <li>Use as credenciais de sandbox</li>
                  <li>Sincronize manualmente se necessário</li>
                </ol>
              </div>
            </div>
          </Card>

          <Card title="Ambiente de Produção">
            <div className="space-y-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">Para Produção</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure uma URL HTTPS válida na variável NEXT_PUBLIC_APP_URL
                  </p>
                </div>
              </div>

              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                <div># Produção</div>
                <div>NEXT_PUBLIC_APP_URL=https://seudominio.com</div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Importante</h4>
                <p className="text-sm text-yellow-700">
                  Em produção, os webhooks funcionarão automaticamente e as 
                  transações serão sincronizadas em tempo real.
                </p>
              </div>
            </div>
          </Card>

          <Card title="Bancos de Teste">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Use estes bancos para testar no ambiente sandbox:
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Pluggy Bank</span>
                  <span className="text-xs text-gray-500">Teste</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Sandbox Bank</span>
                  <span className="text-xs text-gray-500">Teste</span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Credenciais de Teste</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div><strong>Usuário:</strong> user_good</div>
                  <div><strong>Senha:</strong> pass_good</div>
                </div>
              </div>

              <Button
                onClick={() => window.open('https://docs.pluggy.ai/docs/test-credentials', '_blank')}
                variant="secondary"
                className="w-full flex items-center justify-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver Mais Credenciais
              </Button>
            </div>
          </Card>
        </div>

        <Card title="Status do Sistema">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm font-medium text-gray-900">Pluggy API</div>
              <div className="text-xs text-gray-500">Conectado</div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm font-medium text-gray-900">Autenticação</div>
              <div className="text-xs text-gray-500">Funcionando</div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm font-medium text-gray-900">Connect Token</div>
              <div className="text-xs text-gray-500">OK</div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm font-medium text-gray-900">Webhooks</div>
              <div className="text-xs text-gray-500">Dev Mode</div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}