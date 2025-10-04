import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Transaction {
  id: number;
  data: string;
  descricao: string;
  valor: number;
  tipo: string;
  categoria: string;
  mes: string;
  ano: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'http://localhost:3000/transactions';
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiUrl);
  }

  deleteTransactionsByMesAno(mes: string, ano: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}?mes=${mes}&ano=${ano}`);
  }

  updateTransactionCategory(id: number, categoria: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/categoria`, { categoria });
  }

  getCategorias(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/categorias`);
  }
}