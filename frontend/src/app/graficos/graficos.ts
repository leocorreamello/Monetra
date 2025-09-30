import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Transaction {
  id: number;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  categoria: string;
  mes: string;
  ano: string;
}

interface ChartData {
  labels: string[];
  datasets: any[];
}

@Component({
  selector: 'app-graficos',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './graficos.html',
  styleUrls: ['./graficos.css']
})
export class GraficosComponent implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  categorias: string[] = [];
  isLoading: boolean = false;

  // Filtros
  selectedAno: string = '';
  selectedMes: string = '';
  selectedCategoria: string = '';
  selectedTipo: string = '';

  // Dados únicos para filtros
  uniqueAnos: string[] = [];
  uniqueMeses: string[] = [];

  // Dados dos gráficos
  pieChartData: ChartData = { labels: [], datasets: [] };
  lineChartData: ChartData = { labels: [], datasets: [] };
  barChartData: ChartData = { labels: [], datasets: [] };

  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTransactions();
    this.loadCategorias();
  }

  loadTransactions() {
    this.http.get<Transaction[]>(`${this.apiUrl}/transactions`).subscribe({
      next: (data) => {
        this.transactions = data;
        this.updateUniqueValues();
        this.applyFilters();
        this.updateCharts();
      },
      error: (error) => {
        console.error('Erro ao carregar transações:', error);
      }
    });
  }

  loadCategorias() {
    this.http.get<string[]>(`${this.apiUrl}/categorias`).subscribe({
      next: (data) => {
        this.categorias = data;
      },
      error: (error) => {
        console.error('Erro ao carregar categorias:', error);
      }
    });
  }

  updateUniqueValues() {
    this.uniqueAnos = [...new Set(this.transactions.map(t => t.ano))]
      .filter(ano => ano)
      .sort((a, b) => parseInt(b) - parseInt(a));
    
    this.uniqueMeses = [...new Set(this.transactions.map(t => t.mes))]
      .filter(mes => mes)
      .sort((a, b) => parseInt(a) - parseInt(b));
  }

  applyFilters() {
    this.filteredTransactions = this.transactions.filter(transaction => {
      const anoMatch = !this.selectedAno || transaction.ano === this.selectedAno;
      const mesMatch = !this.selectedMes || transaction.mes === this.selectedMes;
      const categoriaMatch = !this.selectedCategoria || transaction.categoria === this.selectedCategoria;
      const tipoMatch = !this.selectedTipo || transaction.tipo === this.selectedTipo;
      
      return anoMatch && mesMatch && categoriaMatch && tipoMatch;
    });
    
    this.updateCharts();
  }

  clearFilters() {
    this.selectedAno = '';
    this.selectedMes = '';
    this.selectedCategoria = '';
    this.selectedTipo = '';
    this.filteredTransactions = [...this.transactions];
    this.updateCharts();
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedAno || this.selectedMes || this.selectedCategoria || this.selectedTipo);
  }

  updateCharts() {
    this.updatePieChart();
    this.updateLineChart();
    this.updateBarChart();
  }

  updatePieChart() {
    const categoryTotals = new Map<string, number>();
    
    this.filteredTransactions
      .filter(t => t.tipo === 'saida')
      .forEach(transaction => {
        const current = categoryTotals.get(transaction.categoria) || 0;
        categoryTotals.set(transaction.categoria, current + Math.abs(transaction.valor));
      });

    this.pieChartData = {
      labels: Array.from(categoryTotals.keys()).map(cat => this.getCategoryDisplayName(cat)),
      datasets: [{
        data: Array.from(categoryTotals.values()),
        backgroundColor: [
          '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981',
          '#f59e0b', '#ef4444', '#6366f1', '#8b5a2b', '#64748b'
        ]
      }]
    };
  }

  updateLineChart() {
    const monthlyData = new Map<string, { entradas: number, saidas: number }>();
    
    this.filteredTransactions.forEach(transaction => {
      const monthKey = `${transaction.ano}-${transaction.mes.padStart(2, '0')}`;
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { entradas: 0, saidas: 0 });
      }
      
      const data = monthlyData.get(monthKey)!;
      if (transaction.tipo === 'entrada') {
        data.entradas += transaction.valor;
      } else {
        data.saidas += Math.abs(transaction.valor);
      }
    });

    const sortedKeys = Array.from(monthlyData.keys()).sort();
    
    this.lineChartData = {
      labels: sortedKeys.map(key => {
        const [ano, mes] = key.split('-');
        return `${this.getMonthName(parseInt(mes))}/${ano}`;
      }),
      datasets: [
        {
          label: 'Entradas',
          data: sortedKeys.map(key => monthlyData.get(key)!.entradas),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        },
        {
          label: 'Saídas',
          data: sortedKeys.map(key => monthlyData.get(key)!.saidas),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4
        }
      ]
    };
  }

  updateBarChart() {
    const categoryTotals = new Map<string, { entradas: number, saidas: number }>();
    
    this.filteredTransactions.forEach(transaction => {
      if (!categoryTotals.has(transaction.categoria)) {
        categoryTotals.set(transaction.categoria, { entradas: 0, saidas: 0 });
      }
      
      const data = categoryTotals.get(transaction.categoria)!;
      if (transaction.tipo === 'entrada') {
        data.entradas += transaction.valor;
      } else {
        data.saidas += Math.abs(transaction.valor);
      }
    });

    this.barChartData = {
      labels: Array.from(categoryTotals.keys()).map(cat => this.getCategoryDisplayName(cat)),
      datasets: [
        {
          label: 'Entradas',
          data: Array.from(categoryTotals.values()).map(data => data.entradas),
          backgroundColor: '#10b981'
        },
        {
          label: 'Saídas',
          data: Array.from(categoryTotals.values()).map(data => data.saidas),
          backgroundColor: '#ef4444'
        }
      ]
    };
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Verifica se o arquivo é PDF ou CSV
      const allowedTypes = ['application/pdf', 'text/csv', 'application/vnd.ms-excel'];
      const allowedExtensions = ['.pdf', '.csv'];
      
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)) {
        this.uploadFile(file);
      } else {
        alert('Por favor, selecione um arquivo PDF ou CSV válido.');
      }
    }
  }

  uploadFile(file: File) {
    this.isLoading = true;
    const formData = new FormData();
    formData.append('pdf', file);

    this.http.post(`${this.apiUrl}/upload`, formData).subscribe({
      next: (response) => {
        console.log('Upload realizado com sucesso:', response);
        // Resetar o input de arquivo
        const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
        fileInputs.forEach(input => input.value = '');
        this.loadTransactions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro no upload:', error);
        this.isLoading = false;
        alert('Erro no upload do arquivo. Tente novamente.');
      }
    });
  }

  getCategoryDisplayName(categoria: string): string {
    const categoryNames: { [key: string]: string } = {
      'alimentacao': '🍽️ Alimentação',
      'transporte': '🚗 Transporte',
      'moradia': '🏠 Moradia',
      'saude': '🏥 Saúde',
      'lazer': '🎮 Lazer',
      'educacao': '📚 Educação',
      'vestuario': '👕 Vestuário',
      'servicos': '🔧 Serviços',
      'investimentos': '💰 Investimentos',
      'outros': '📦 Outros'
    };
    return categoryNames[categoria] || categoria;
  }

  getMonthName(mes: number | string): string {
    const meses = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    const mesNum = typeof mes === 'string' ? parseInt(mes) : mes;
    return meses[mesNum - 1] || mes.toString();
  }

  formatCurrency(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  // Métodos para cálculos dos cards de resumo
  getTotalEntradas(): number {
    return this.filteredTransactions
      .filter(t => t.tipo === 'entrada')
      .reduce((sum, t) => sum + t.valor, 0);
  }

  getTotalSaidas(): number {
    return this.filteredTransactions
      .filter(t => t.tipo === 'saida')
      .reduce((sum, t) => sum + Math.abs(t.valor), 0);
  }

  getSaldoPeriodo(): number {
    return this.filteredTransactions.reduce((sum, t) => sum + t.valor, 0);
  }

  isSaldoPositivo(): boolean {
    return this.getSaldoPeriodo() >= 0;
  }

  isSaldoNegativo(): boolean {
    return this.getSaldoPeriodo() < 0;
  }

  // Métodos para cálculos de altura dos gráficos
  getLineChartMaxValue(): number {
    if (!this.lineChartData.datasets || this.lineChartData.datasets.length === 0) {
      return 1;
    }
    const dataset1Max = Math.max(...(this.lineChartData.datasets[0]?.data || [0]));
    const dataset2Max = Math.max(...(this.lineChartData.datasets[1]?.data || [0]));
    return Math.max(dataset1Max, dataset2Max, 1);
  }

  getBarChartMaxValue(): number {
    if (!this.barChartData.datasets || this.barChartData.datasets.length === 0) {
      return 1;
    }
    const dataset1Max = Math.max(...(this.barChartData.datasets[0]?.data || [0]));
    const dataset2Max = Math.max(...(this.barChartData.datasets[1]?.data || [0]));
    return Math.max(dataset1Max, dataset2Max, 1);
  }

  getBarHeightPercentage(datasetIndex: number, itemIndex: number): number {
    if (!this.barChartData.datasets || 
        !this.barChartData.datasets[datasetIndex] || 
        !this.barChartData.datasets[datasetIndex].data[itemIndex]) {
      return 0;
    }
    const value = this.barChartData.datasets[datasetIndex].data[itemIndex];
    const maxValue = this.getBarChartMaxValue();
    return (value / maxValue) * 100;
  }

  getLineValuePercentage(value: number): number {
    const maxValue = this.getLineChartMaxValue();
    return (value / maxValue) * 100;
  }
}