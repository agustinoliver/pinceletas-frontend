import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { UserAuthService } from '../../../services/user-auth.service';
import { PasswordToggleComponent } from '../password-toggle/password-toggle.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PasswordToggleComponent],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  email: string = '';
  loading = false;
  errorMessage = '';
  passwordReset = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: UserAuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
    });

    this.resetForm = this.fb.group({
      token: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      newPassword: ['', [Validators.required, Validators.minLength(6), this.passwordValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  get tokenControl(): FormControl {
    return this.resetForm.get('token') as FormControl;
  }

  get newPasswordControl(): FormControl {
    return this.resetForm.get('newPassword') as FormControl;
  }

  get confirmPasswordControl(): FormControl {
    return this.resetForm.get('confirmPassword') as FormControl;
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.errorMessage = 'Por favor corrige los errores del formulario';
      this.resetForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { token, newPassword, confirmPassword } = this.resetForm.value;

    this.authService.resetPassword(token, newPassword, confirmPassword).subscribe({
      next: () => {
        this.loading = false;
        this.passwordReset = true;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = typeof error === 'string'
          ? error
          : 'Error al restablecer la contraseña. Verifica el código.';
      }
    });
  }

  resendCode(): void {
    if (!this.email) {
      this.errorMessage = 'Email no disponible para reenviar código';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading = false;
        alert('Código reenviado exitosamente. Revisa tu email.');
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Error al reenviar el código';
      }
    });
  }

  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    // Requiere al menos una mayúscula, una minúscula y un número
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);

    return hasUpper && hasLower && hasNumber ? null : { passwordRequirements: true };
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword');
    const confirm = control.get('confirmPassword');
    if (password && confirm && password.value !== confirm.value) {
      confirm.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}