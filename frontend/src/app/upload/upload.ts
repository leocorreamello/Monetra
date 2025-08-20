import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http'; // Confirme este import

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [HttpClientModule], // Use o módulo, não o serviço diretamente
  templateUrl: './upload.html',
  styleUrls: ['./upload.css']
})
export class UploadComponent {
  constructor(private http: HttpClient) {}

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      console.log('Arquivo selecionado:', file.name);
      const formData = new FormData();
      formData.append('pdf', file);

      this.http.post('http://localhost:3000/upload', formData).subscribe({
        next: (response) => console.log(response),
        error: (error) => console.error('Erro:', error)
      });
    }
  }
}