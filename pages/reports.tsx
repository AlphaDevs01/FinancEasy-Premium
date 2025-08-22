import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface ReportData {
  monthlyData: any[];
  categoryData: any[];
  yearlyComparison: any[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
  };
}

export default function Reports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    try {
      const response = await fetch(`/api/reports?period=${selectedPeriod}`);
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch('/api/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'relatorio-financeiro.pdf';
      a.click();
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/transactions/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transacoes.csv';
      a.click();
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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
          <h1 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h1>
          <div className="flex space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="3months">Últimos 3 meses</option>
              <option value="6months">Últimos 6 meses</option>
              <option value="12months">Último ano</option>
            </select>
            <Button
              onClick={handleExportCSV}
              variant="secondary"
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button
              onClick={handleExportPDF}
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Resumo Executivo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Total Receitas</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {reportData?.summary.totalIncome?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Total Despesas</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {reportData?.summary.totalExpenses?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Saldo Líquido</p>
                <p className={`text-2xl font-bold ${(reportData?.summary.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {reportData?.summary.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Transações</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData?.summary.transactionCount || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolução Mensal */}
          <Card title="Evolução Mensal">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']} />
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Receitas" />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Despesas" />
                <Line type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={2} name="Saldo" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Gastos por Categoria */}
          <Card title="Gastos por Categoria">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData?.categoryData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData?.categoryData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Comparativo Anual */}
        <Card title="Comparativo por Mês">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={reportData?.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']} />
              <Bar dataKey="income" fill="#10B981" name="Receitas" />
              <Bar dataKey="expenses" fill="#EF4444" name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Análise Detalhada */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Principais Categorias de Gastos">
            <div className="space-y-4">
              {reportData?.categoryData?.slice(0, 5).map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    R$ {category.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Insights Financeiros">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">Economia Mensal</h4>
                <p className="text-sm text-blue-700">
                  {(reportData?.summary.balance || 0) >= 0 
                    ? `Você economizou R$ ${Math.abs(reportData?.summary.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no período`
                    : `Você gastou R$ ${Math.abs(reportData?.summary.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a mais que ganhou`
                  }
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900">Meta de Gastos</h4>
                <p className="text-sm text-green-700">
                  Mantenha suas despesas abaixo de 80% da sua receita para uma vida financeira saudável.
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900">Dica de Economia</h4>
                <p className="text-sm text-yellow-700">
                  Revise suas categorias de maior gasto e identifique oportunidades de redução.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}