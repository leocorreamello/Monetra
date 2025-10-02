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

  // Estado do gráfico de pizza
  activePieSlice: number = -1;
  
  // Estado do gráfico de linha - hover
  hoverInfo: { visible: boolean, day: string, entradas: number, saidas: number, x: number, y: number } = {
    visible: false,
    day: '',
    entradas: 0,
    saidas: 0,
    x: 0,
    y: 0
  };



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
    // Usar dados diários para melhor visualização
    const dailyData = new Map<string, { entradas: number, saidas: number }>();
    
    this.filteredTransactions.forEach(transaction => {
      // Extrair o dia da data (formato: "dd/mm/yyyy")
      const dateParts = transaction.data.split('/');
      const dayKey = dateParts[0]; // Primeiro elemento é o dia
      
      if (!dailyData.has(dayKey)) {
        dailyData.set(dayKey, { entradas: 0, saidas: 0 });
      }
      
      const data = dailyData.get(dayKey)!;
      if (transaction.tipo === 'entrada') {
        data.entradas += Math.abs(transaction.valor);
      } else {
        data.saidas += Math.abs(transaction.valor);
      }
    });

    // Criar array com todos os dias de 1 a 31
    const allDays = [];
    for (let day = 1; day <= 31; day++) {
      const dayKey = day.toString().padStart(2, '0');
      allDays.push({
        key: dayKey,
        label: day.toString(),
        entradas: dailyData.get(dayKey)?.entradas || 0,
        saidas: dailyData.get(dayKey)?.saidas || 0
      });
    }
    
    this.lineChartData = {
      labels: allDays.map(day => day.label),
      datasets: [
        {
          label: 'Entradas',
          data: allDays.map(day => day.entradas),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)'
        },
        {
          label: 'Saídas',
          data: allDays.map(day => day.saidas),
          borderColor: '#ef4444', 
          backgroundColor: 'rgba(239, 68, 68, 0.2)'
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
      'transferencia': '💸 Transferência',
      'renda': '💰 Renda',
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

  // Métodos para o gráfico de pizza
  getPieSlices(): any[] {
    if (!this.pieChartData.datasets[0] || !this.pieChartData.datasets[0].data.length) {
      return [];
    }

    const data = this.pieChartData.datasets[0].data;
    const total = data.reduce((sum: number, value: number) => sum + value, 0);
    
    if (total === 0) return [];

    let currentAngle = -90; // Começar no topo
    
    return data.map((value: number, index: number) => {
      const percentage = Math.round((value / total) * 100);
      const angle = (value / total) * 360;
      
      // Calcular o path SVG para a fatia
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const x1 = 100 + 65 * Math.cos(startAngleRad);
      const y1 = 100 + 65 * Math.sin(startAngleRad);
      const x2 = 100 + 65 * Math.cos(endAngleRad);
      const y2 = 100 + 65 * Math.sin(endAngleRad);
      
      const path = [
        `M 100 100`,
        `L ${x1} ${y1}`,
        `A 65 65 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `Z`
      ].join(' ');

      // Calcular posição do label
      const labelAngle = (startAngle + endAngle) / 2;
      const labelAngleRad = (labelAngle * Math.PI) / 180;
      const labelX = 100 + 45 * Math.cos(labelAngleRad);
      const labelY = 100 + 45 * Math.sin(labelAngleRad);
      
      currentAngle = endAngle;
      
      return {
        path,
        labelX,
        labelY,
        percentage,
        value,
        angle: labelAngle
      };
    });
  }

  getPieSlicePercentage(index: number): number {
    const slices = this.getPieSlices();
    return slices[index]?.percentage || 0;
  }

  onSliceHover(index: number, isHover: boolean): void {
    this.activePieSlice = isHover ? index : -1;
  }

  // === NOVOS MÉTODOS SIMPLES PARA O GRÁFICO DE LINHA ===
  
  // Obter dados preparados para o gráfico
  getChartData(): { entradas: number[], saidas: number[], labels: string[], maxValue: number } {
    if (!this.lineChartData.datasets || this.lineChartData.datasets.length < 2) {
      return { entradas: [], saidas: [], labels: [], maxValue: 0 };
    }

    const entradas = this.lineChartData.datasets[0].data as number[];
    const saidas = this.lineChartData.datasets[1].data as number[];
    const labels = this.lineChartData.labels;
    
    const maxEntrada = entradas.length > 0 ? Math.max(...entradas) : 0;
    const maxSaida = saidas.length > 0 ? Math.max(...saidas) : 0;
    const rawMaxValue = Math.max(maxEntrada, maxSaida, 100);
    const maxValue = this.getRoundedMaxValue(rawMaxValue); // Usar valor arredondado

    return { entradas, saidas, labels, maxValue };
  }

  // Gerar pontos SVG para as linhas
  getLinePoints(values: number[], maxValue: number, width: number = 1000, height: number = 390): string {
    if (!values || values.length === 0) return '';

    const offsetY = 80; // Offset do viewBox
    const padding = 120;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    let path = '';
    
    values.forEach((value, index) => {
      const x = padding + (index * chartWidth) / Math.max(values.length - 1, 1);
      const y = offsetY + padding + chartHeight - ((value / maxValue) * chartHeight);
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });

    return path;
  }

  // Gerar área preenchida
  getAreaPath(values: number[], maxValue: number, width: number = 1000, height: number = 390): string {
    const linePath = this.getLinePoints(values, maxValue, width, height);
    if (!linePath) return '';

    const offsetY = 80; // Offset do viewBox
    const padding = 120;
    const chartHeight = height - (padding * 2);
    const baseY = offsetY + padding + chartHeight;
    
    // Adicionar linha da base
    const firstX = padding;
    const lastX = padding + (width - padding * 2);
    
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }

  // Obter labels do eixo Y com valores arredondados
  getYLabels(maxValue: number): Array<{value: number, label: string, y: number}> {
    const height = 390; // Ajustado para o viewBox modificado
    const offsetY = 80; // Offset do viewBox
    const padding = 120;
    const chartHeight = height - (padding * 2);
    
    // Determinar a escala apropriada baseada no valor máximo
    const roundedMax = this.getRoundedMaxValue(maxValue);
    const steps = [0, 0.2, 0.4, 0.6, 0.8, 1.0]; // 6 steps para melhor granularidade
    const labels: Array<{value: number, label: string, y: number}> = [];

    steps.forEach(step => {
      const value = roundedMax * step;
      const y = offsetY + padding + chartHeight - ((value / roundedMax) * chartHeight);
      
      let label = '';
      if (value >= 1000000) {
        label = `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        label = `${(value / 1000).toFixed(0)}K`;
      } else {
        label = value.toFixed(0);
      }
      
      labels.push({ value, label, y });
    });

    return labels;
  }

  // Arredondar valor máximo para números legíveis como 50, 100, 500, 1000, etc.
  private getRoundedMaxValue(maxValue: number): number {
    if (maxValue <= 0) return 100;
    
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
    const normalized = maxValue / magnitude;
    
    let roundedNormalized;
    if (normalized <= 1) roundedNormalized = 1;
    else if (normalized <= 2) roundedNormalized = 2;
    else if (normalized <= 5) roundedNormalized = 5;
    else roundedNormalized = 10;
    
    const result = roundedNormalized * magnitude;
    
    // Garantir que seja pelo menos 50 e que esteja em valores "redondos"
    const roundValues = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];
    
    for (let i = 0; i < roundValues.length; i++) {
      if (maxValue <= roundValues[i]) {
        return roundValues[i];
      }
    }
    
    return Math.max(result, 100);
  }

  // Verificar se tem dados para mostrar o gráfico
  hasLineChartData(): boolean {
    return this.lineChartData && 
           this.lineChartData.labels && 
           this.lineChartData.labels.length > 0;
  }

  // Método para cálculos matemáticos no template
  mathMax(...values: number[]): number {
    return Math.max(...values);
  }

  // === MÉTODOS PARA HOVER DO GRÁFICO ===
  
  // Obter pontos de hover invisíveis para detectar mouse
  getHoverPoints(): Array<{x: number, y: number, day: string, entradas: number, saidas: number}> {
    const chartData = this.getChartData();
    if (!chartData.entradas.length) return [];

    const width = 1000;
    const height = 390; // Ajustado para o viewBox modificado
    const offsetY = 80; // Offset do viewBox
    const padding = 120;
    const chartWidth = width - (padding * 2);

    return chartData.entradas.map((entrada, index) => {
      const x = padding + (index * chartWidth) / Math.max(chartData.entradas.length - 1, 1);
      const day = chartData.labels[index];
      const saida = chartData.saidas[index] || 0;

      return { x, y: offsetY + 200, day, entradas: entrada, saidas: saida }; // y ajustado para a nova área
    });
  }

  // Mostrar tooltip no hover
  onLineHover(point: {x: number, y: number, day: string, entradas: number, saidas: number}, event: MouseEvent): void {
    const rect = (event.target as SVGElement).ownerSVGElement?.getBoundingClientRect();
    if (!rect) return;

    this.hoverInfo = {
      visible: true,
      day: `Dia ${point.day}`,
      entradas: point.entradas,
      saidas: point.saidas,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top - 60
    };
  }

  // Esconder tooltip
  onLineLeave(): void {
    this.hoverInfo.visible = false;
  }

  // === MÉTODOS PARA ANÁLISE ANUAL POR CATEGORIA ===

  // Obter meses disponíveis nos dados filtrados
  getAvailableMonths(): string[] {
    const months = [...new Set(this.filteredTransactions.map(t => t.mes))]
      .filter(mes => mes)
      .sort((a, b) => parseInt(a) - parseInt(b));
    return months;
  }

  // Obter categorias que têm receitas
  getReceitasCategorias(): string[] {
    const categorias = [...new Set(
      this.filteredTransactions
        .filter(t => t.tipo === 'entrada')
        .map(t => t.categoria)
    )].filter(cat => cat);
    return categorias.sort();
  }

  // Obter categorias que têm despesas
  getDespesasCategorias(): string[] {
    const categorias = [...new Set(
      this.filteredTransactions
        .filter(t => t.tipo === 'saida')
        .map(t => t.categoria)
    )].filter(cat => cat);
    return categorias.sort();
  }

  // Obter valor de uma categoria específica em um mês específico
  getMonthCategoryValue(mes: string, categoria: string, tipo: 'entrada' | 'saida'): number {
    return this.filteredTransactions
      .filter(t => t.mes === mes && t.categoria === categoria && t.tipo === tipo)
      .reduce((sum, t) => sum + Math.abs(t.valor), 0);
  }

  // Obter total de um mês por tipo (entrada ou saída)
  getMonthTotal(mes: string, tipo: 'entrada' | 'saida'): number {
    return this.filteredTransactions
      .filter(t => t.mes === mes && t.tipo === tipo)
      .reduce((sum, t) => sum + Math.abs(t.valor), 0);
  }

  // Obter saldo de um mês (receitas - despesas)
  getMonthBalance(mes: string): number {
    const entradas = this.getMonthTotal(mes, 'entrada');
    const saidas = this.getMonthTotal(mes, 'saida');
    return entradas - saidas;
  }

}