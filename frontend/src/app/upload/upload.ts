import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, Transaction } from '../transaction';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [HttpClientModule, CommonModule, FormsModule],
  templateUrl: './upload.html',
  styleUrls: ['./upload.css']
})
export class UploadComponent implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  uniqueAnos: string[] = [];
  uniqueMeses: string[] = [];
  selectedAno: string = '';
  selectedMes: string = '';
  selectedCategoria: string = '';
  selectedTipo: string = '';
  saldoFinal: number = 0;
  isLoading: boolean = false;
  categorias: string[] = [];

  constructor(private http: HttpClient, private transactionService: TransactionService) {}

  ngOnInit() {
    this.loadTransactions();
    this.loadCategorias();
  }

  loadCategorias() {
    this.transactionService.getCategorias().subscribe((categorias: string[]) => {
      this.categorias = categorias;
    });
  }

  updateTransactionCategory(transaction: Transaction) {
    this.transactionService.updateTransactionCategory(transaction.id, transaction.categoria).subscribe({
      next: () => {
        console.log(`Categoria da transação ${transaction.id} atualizada para: ${transaction.categoria}`);
      },
      error: (error) => {
        console.error('Erro ao atualizar categoria:', error);
        alert('Erro ao atualizar categoria');
      }
    });
  }

  getCategoryDisplayName(categoria: string): string {
    const categoryNames: { [key: string]: string } = {
      'alimentacao': '🍔 Alimentação',
      'transporte': '🚗 Transporte',
      'saude': '🏥 Saúde',
      'educacao': '📚 Educação',
      'lazer': '🎭 Lazer',
      'casa': '🏠 Casa',
      'transferencia': '💸 Transferência',
      'renda': '💰 Renda',
      'investimento': '📈 Investimento',
      'vestuario': '👕 Vestuário',
      'saque': '🏧 Saque',
      'taxas': '📋 Taxas',
      'outros': '📦 Outros'
    };
    return categoryNames[categoria] || categoria;
  }

  loadTransactions() {
    this.isLoading = true;
    this.transactionService.getTransactions().subscribe((data: Transaction[]) => {
      this.transactions = data.filter(t => t.mes && t.ano && t.mes !== 'null' && t.ano !== 'null');
      this.uniqueAnos = [...new Set(this.transactions.map(t => t.ano))].sort();
      this.uniqueMeses = [...new Set(this.transactions.map(t => t.mes))].sort();
      this.applyFilters(); // Aplica filtros após carregar
      this.isLoading = false;
    });
  }

  applyFilters() {
    this.filteredTransactions = this.transactions.filter(t => {
      // Filtro por ano
      if (this.selectedAno && t.ano !== this.selectedAno) return false;
      
      // Filtro por mês
      if (this.selectedMes && t.mes !== this.selectedMes) return false;
      
      // Filtro por categoria
      if (this.selectedCategoria && t.categoria !== this.selectedCategoria) return false;
      
      // Filtro por tipo
      if (this.selectedTipo && t.tipo !== this.selectedTipo) return false;
      
      return true;
    });
    
    this.calculateSaldoFinal();
  }

  clearFilters() {
    this.selectedAno = '';
    this.selectedMes = '';
    this.selectedCategoria = '';
    this.selectedTipo = '';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedAno || this.selectedMes || this.selectedCategoria || this.selectedTipo);
  }

  // Método antigo mantido para compatibilidade com exclusão
  filterByAnoMes() {
    this.applyFilters();
  }

  calculateSaldoFinal() {
    this.saldoFinal = this.filteredTransactions.reduce((sum, t) => sum + t.valor, 0);
  }

  deleteSelectedAnoMes() {
    if (this.selectedAno && this.selectedMes && confirm(`Tem certeza que deseja excluir as transações de ${this.getMonthName(this.selectedMes)}/${this.selectedAno}?`)) {
      console.log('Excluindo: mes =', this.selectedMes, ', ano =', this.selectedAno);
      this.transactionService.deleteTransactionsByMesAno(this.selectedMes, this.selectedAno).subscribe({
        next: () => {
          console.log('Excluído com sucesso');
          this.loadTransactions();
        },
        error: (error) => {
          console.error('Erro ao excluir:', error);
          alert('Erro ao excluir: ' + error.message);
        }
      });
    } else {
      console.log('Selecione mês e ano para excluir');
    }
  }

  // Funções de formatação para melhor apresentação visual
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const [day, month, year] = dateString.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short'
      });
    } catch {
      return dateString;
    }
  }

  getMonthName(monthNumber: string): string {
    const months = {
      '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março',
      '04': 'Abril', '05': 'Maio', '06': 'Junho',
      '07': 'Julho', '08': 'Agosto', '09': 'Setembro',
      '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
    };
    return months[monthNumber as keyof typeof months] || monthNumber;
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      console.log('Arquivo selecionado:', file.name);
      this.isLoading = true;
      const formData = new FormData();
      formData.append('pdf', file);

      this.http.post('http://localhost:3000/upload', formData).subscribe({
        next: (response) => {
          console.log(response);
          this.loadTransactions();
        },
        error: (error) => {
          console.error('Erro:', error);
          this.isLoading = false;
        }
      });
    }
  }
}