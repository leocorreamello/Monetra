import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload.html',
  styleUrls: ['./upload.css']
})
export class UploadComponent {
  transactions: any[] = [];
  filteredTransactions: any[] = [];
  isLoading: boolean = false;
  selectedAno: string = '';
  selectedMes: string = '';
  selectedCategoria: string = '';
  selectedTipo: string = '';
  uniqueAnos: string[] = [];
  uniqueMeses: string[] = [];
  categorias: string[] = [];

  constructor(private http: HttpClient) {
    this.loadTransactions();
    this.loadCategorias();
  }

  loadTransactions(): void {
    this.http.get<any[]>('http://localhost:3000/transactions').subscribe({
      next: (data) => {
        this.transactions = data;
        this.extractUniqueValues();
        this.applyFilters();
      },
      error: (error) => {
        console.error('Erro ao carregar transações:', error);
      }
    });
  }

  loadCategorias(): void {
    this.http.get<string[]>('http://localhost:3000/categorias').subscribe({
      next: (data) => {
        this.categorias = data;
      },
      error: (error) => {
        console.error('Erro ao carregar categorias:', error);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Verifica se o arquivo é PDF, CSV ou TXT
      const allowedTypes = [
        'application/pdf', 
        'text/csv', 
        'application/vnd.ms-excel',
        'text/plain',
        'text/txt',
        'application/csv',
        'application/x-csv',
        'text/x-csv',
        'text/comma-separated-values',
        '' // Alguns sistemas podem não definir MIME type
      ];
      const allowedExtensions = ['.pdf', '.csv', '.txt'];
      
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        console.log(`Arquivo rejeitado: ${file.name} (tipo: ${file.type}, extensão: ${fileExtension})`);
        alert('Apenas arquivos PDF, CSV e TXT são aceitos!');
        return;
      }

      this.isLoading = true;
      const formData = new FormData();
      formData.append('pdf', file); // Mantém 'pdf' pois o servidor espera esse nome

      this.http.post('http://localhost:3000/upload', formData).subscribe({
        next: (response) => {
          console.log('Upload realizado com sucesso:', response);
          this.loadTransactions();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro no upload:', error);
          alert('Erro no upload: ' + (error.error?.error || 'Erro desconhecido'));
          this.isLoading = false;
        }
      });
    }
  }

  extractUniqueValues(): void {
    this.uniqueAnos = [...new Set(this.transactions.map(t => t.ano))].sort();
    this.uniqueMeses = [...new Set(this.transactions.map(t => t.mes))].sort();
  }

  applyFilters(): void {
    this.filteredTransactions = this.transactions.filter(transaction => {
      const matchesAno = !this.selectedAno || transaction.ano === this.selectedAno;
      const matchesMes = !this.selectedMes || transaction.mes === this.selectedMes;
      const matchesCategoria = !this.selectedCategoria || transaction.categoria === this.selectedCategoria;
      const matchesTipo = !this.selectedTipo || transaction.tipo === this.selectedTipo;
      
      return matchesAno && matchesMes && matchesCategoria && matchesTipo;
    });
  }

  clearFilters(): void {
    this.selectedAno = '';
    this.selectedMes = '';
    this.selectedCategoria = '';
    this.selectedTipo = '';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedAno || this.selectedMes || this.selectedCategoria || this.selectedTipo);
  }

  deleteSelectedAnoMes(): void {
    if (!this.selectedAno || !this.selectedMes) {
      return;
    }

    const confirmDelete = confirm(`Deseja realmente excluir todas as transações de ${this.getMonthName(this.selectedMes)}/${this.selectedAno}?`);
    
    if (confirmDelete) {
      this.http.delete(`http://localhost:3000/transactions?mes=${this.selectedMes}&ano=${this.selectedAno}`).subscribe({
        next: (response) => {
          console.log('Transações excluídas:', response);
          this.loadTransactions();
          this.clearFilters();
        },
        error: (error) => {
          console.error('Erro ao excluir transações:', error);
        }
      });
    }
  }

  updateTransactionCategory(transaction: any): void {
    this.http.put(`http://localhost:3000/transactions/${transaction.id}/categoria`, {
      categoria: transaction.categoria
    }).subscribe({
      next: (response) => {
        console.log('Categoria atualizada:', response);
      },
      error: (error) => {
        console.error('Erro ao atualizar categoria:', error);
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatDate(dateString: string): string {
    return dateString;
  }

  getMonthName(monthNumber: string): string {
    const months = [
      '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[parseInt(monthNumber)] || monthNumber;
  }

  getCategoryDisplayName(categoria: string): string {
    const categoryNames: { [key: string]: string } = {
      'alimentacao': 'Alimentação',
      'transporte': 'Transporte',
      'saude': 'Saúde',
      'educacao': 'Educação',
      'lazer': 'Lazer',
      'casa': 'Casa',
      'transferencia': 'Transferência',
      'renda': 'Renda',
      'investimento': 'Investimento',
      'vestuario': 'Vestuário',
      'saque': 'Saque',
      'taxas': 'Taxas',
      'outros': 'Outros'
    };
    return categoryNames[categoria] || categoria;
  }

  get saldoFinal(): number {
    return this.filteredTransactions.reduce((total, transaction) => {
      return total + transaction.valor;
    }, 0);
  }

  getTotalEntradas(): number {
    return this.filteredTransactions
      .filter(t => t.tipo === 'entrada')
      .reduce((sum, t) => sum + t.valor, 0);
  }

  getTotalSaidas(): number {
    return Math.abs(this.filteredTransactions
      .filter(t => t.tipo === 'saida')
      .reduce((sum, t) => sum + t.valor, 0));
  }
}