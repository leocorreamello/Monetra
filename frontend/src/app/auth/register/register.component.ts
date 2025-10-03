import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { take } from 'rxjs';
import { AuthService } from '../auth.service';
import { RegisterPayload } from '../auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  form: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        name: ['', [Validators.minLength(2), Validators.maxLength(60)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: [RegisterComponent.passwordMatchValidator] }
    );
  }

  ngOnInit(): void {
    this.authService.restoreSession().pipe(take(1)).subscribe(user => {
      if (user) {
        this.router.navigate(['/']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const payload: RegisterPayload = {
      name: this.form.value.name?.trim() || undefined,
      email: this.form.value.email,
      password: this.form.value.password
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = this.extractErrorMessage(error);
      }
    });
  }

  get name() {
    return this.form.get('name');
  }

  get email() {
    return this.form.get('email');
  }

  get password() {
    return this.form.get('password');
  }

  get confirmPassword() {
    return this.form.get('confirmPassword');
  }

  private extractErrorMessage(error: any): string {
    const apiErrors = error?.error?.errors;
    if (Array.isArray(apiErrors) && apiErrors.length > 0) {
      const first = apiErrors[0];
      if (typeof first?.msg === 'string' && first.msg.trim().length > 0) {
        return first.msg;
      }
    }

    const message = error?.error?.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }

    return 'Não foi possível criar a conta. Tente novamente.';
  }

  private static passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmControl = group.get('confirmPassword');

    if (!confirmControl) {
      return null;
    }

    if (confirmControl.errors && !confirmControl.errors['mismatch']) {
      return null;
    }

    if (password !== confirmControl.value) {
      confirmControl.setErrors({ mismatch: true });
    } else {
      confirmControl.setErrors(null);
    }

    return null;
  }
}
