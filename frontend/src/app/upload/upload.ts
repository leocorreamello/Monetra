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

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './upload.html',
  styleUrls: ['./upload.css']
})
export class UploadComponent implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  categorias: string[] = [];
  isLoading = false;
  
  // Filtros
  selectedCategoria = '';
  selectedTipo = '';
  selectedAno = '';
  selectedMes = '';
  
  // Dados únicos para os filtros
  uniqueAnos: string[] = [];
  uniqueMeses: string[] = [];
  
  saldoFinal = 0;

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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      console.log(`🔍 Arquivo selecionado: ${file.name}`);
      console.log(`📁 Tipo MIME: "${file.type}"`);
      console.log(`📄 Tamanho: ${file.size} bytes`);
      
      // Verifica se o arquivo é CSV ou TXT
      const allowedTypes = [
        'text/csv', 
        'application/vnd.ms-excel',
        'text/plain',
        'text/txt',
        'application/csv',
        'application/x-csv',
        'text/x-csv',
        'text/comma-separated-values',
        'application/octet-stream', // Alguns sistemas usam este tipo genérico
        '' // Alguns sistemas podem não definir MIME type
      ];
      const allowedExtensions = ['.csv', '.txt'];
      
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      console.log(`🔖 Extensão detectada: "${fileExtension}"`);
      
      // Validação mais permissiva: aceita se tem extensão correta OU tipo MIME correto
      const hasValidExtension = allowedExtensions.includes(fileExtension);
      const hasValidMimeType = allowedTypes.includes(file.type);
      
      console.log(`✅ Extensão válida: ${hasValidExtension}`);
      console.log(`✅ Tipo MIME válido: ${hasValidMimeType}`);
      
      if (hasValidExtension || hasValidMimeType) {
        console.log(`🎉 Arquivo aceito para upload!`);
        this.uploadFile(file);
      } else {
        console.log(`❌ Arquivo rejeitado - extensão: ${fileExtension}`);
        alert(`Arquivo não suportado. 
Extensão: ${fileExtension} 
Por favor, selecione um arquivo CSV ou TXT válido.`);
      }
    }
  }

  uploadFile(file: File) {
    this.isLoading = true;
    const formData = new FormData();
    formData.append('pdf', file); // Mantém 'pdf' pois o servidor espera esse nome

    this.http.post(`${this.apiUrl}/upload`, formData).subscribe({
      next: (response) => {
        console.log('Upload realizado com sucesso:', response);
        this.loadTransactions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erro detalhado no upload:', error);
        console.error('📄 Status:', error.status);
        console.error('📝 Mensagem:', error.error);
        
        let errorMessage = 'Erro ao processar o arquivo.';
        
        if (error.status === 0) {
          errorMessage += ' Servidor não está respondendo. Verifique se o backend está rodando na porta 3000.';
        } else if (error.status === 400) {
          errorMessage += ' ' + (error.error?.error || 'Arquivo inválido ou formato não suportado.');
        } else if (error.status === 413) {
          errorMessage += ' Arquivo muito grande (limite: 10MB).';
        } else if (error.status === 500) {
          errorMessage += ' Erro interno do servidor. Verifique os logs do backend.';
        } else {
          errorMessage += ` Código de erro: ${error.status}`;
        }
        
        alert(errorMessage);
        this.isLoading = false;
      }
    });
  }

  updateUniqueValues() {
    this.uniqueAnos = [...new Set(this.transactions.map(t => t.ano))].sort();
    this.uniqueMeses = [...new Set(this.transactions.map(t => t.mes))].sort();
  }

  applyFilters() {
    this.filteredTransactions = this.transactions.filter(transaction => {
      return (
        (!this.selectedCategoria || transaction.categoria === this.selectedCategoria) &&
        (!this.selectedTipo || transaction.tipo === this.selectedTipo) &&
        (!this.selectedAno || transaction.ano === this.selectedAno) &&
        (!this.selectedMes || transaction.mes === this.selectedMes)
      );
    });

    this.calculateSaldo();
  }

  calculateSaldo() {
    this.saldoFinal = this.filteredTransactions.reduce((acc, transaction) => {
      return acc + transaction.valor;
    }, 0);
  }

  clearFilters() {
    this.selectedCategoria = '';
    this.selectedTipo = '';
    this.selectedAno = '';
    this.selectedMes = '';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedCategoria || this.selectedTipo || this.selectedAno || this.selectedMes);
  }

  deleteSelectedAnoMes() {
    if (!this.selectedAno || !this.selectedMes) {
      alert('Selecione um ano e mês para excluir.');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir todas as transações de ${this.getMonthName(this.selectedMes)}/${this.selectedAno}?`)) {
      this.http.delete(`${this.apiUrl}/transactions?mes=${this.selectedMes}&ano=${this.selectedAno}`)
        .subscribe({
          next: () => {
            this.loadTransactions();
            this.selectedAno = '';
            this.selectedMes = '';
          },
          error: (error) => {
            console.error('Erro ao excluir transações:', error);
            alert('Erro ao excluir transações.');
          }
        });
    }
  }

  updateTransactionCategory(transaction: Transaction) {
    this.http.put(`${this.apiUrl}/transactions/${transaction.id}/categoria`, { categoria: transaction.categoria })
      .subscribe({
        next: () => {
          console.log('Categoria atualizada com sucesso');
        },
        error: (error) => {
          console.error('Erro ao atualizar categoria:', error);
        }
      });
  }

  formatDate(dateStr: string): string {
    return dateStr;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  getMonthName(mes: string): string {
    const meses = {
      '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
      '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
      '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
    };
    return meses[mes as keyof typeof meses] || mes;
  }

  getCategoryDisplayName(categoria: string): string {
    const categoriaNames = {
      'alimentacao': '🍽️ Alimentação',
      'transporte': '🚗 Transporte',
      'saude': '🏥 Saúde',
      'educacao': '📚 Educação',
      'lazer': '🎮 Lazer',
      'casa': '🏠 Casa',
      'transferencia': '💸 Transferência',
      'renda': '💰 Renda',
      'investimento': '📈 Investimento',
      'vestuario': '👕 Vestuário',
      'saque': '🏧 Saque',
      'taxas': '📋 Taxas',
      'outros': '📦 Outros'
    };
    return categoriaNames[categoria as keyof typeof categoriaNames] || categoria;
  }
}