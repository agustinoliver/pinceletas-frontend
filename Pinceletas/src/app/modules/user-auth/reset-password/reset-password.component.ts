import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { UserAuthService } from '../../../services/user-auth.service';
import { PasswordToggleComponent } from '../password-toggle/password-toggle.component';
import Swal from 'sweetalert2';

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

  async onSubmit(): Promise<void> {
    // Marcar todos los campos como touched para mostrar errores
    Object.keys(this.resetForm.controls).forEach(key => {
      this.resetForm.get(key)?.markAsTouched();
    });

    if (this.resetForm.invalid) {
      this.mostrarAlertaError('Por favor corrige los errores del formulario');
      return;
    }

    // Mostrar confirmación antes de restablecer
    const result = await this.mostrarConfirmacionRestablecer();
    
    if (!result.isConfirmed) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { token, newPassword, confirmPassword } = this.resetForm.value;

    this.authService.resetPassword(token, newPassword, confirmPassword).subscribe({
      next: () => {
        this.loading = false;
        this.passwordReset = true;
        this.mostrarAlertaExito('¡Contraseña restablecida!', 'Tu contraseña ha sido cambiada exitosamente.')
          .then(() => {
            this.router.navigate(['/login']);
          });
      },
      error: (error) => {
        this.loading = false;
        let mensajeError = 'Error al restablecer la contraseña. Verifica el código.';
        
        if (typeof error === 'string') {
          mensajeError = error;
        } else if (error?.error?.message) {
          mensajeError = error.error.message;
        } else if (error?.status === 400) {
          mensajeError = 'Código inválido o expirado. Solicita un nuevo código.';
        } else if (error?.status === 404) {
          mensajeError = 'Código no encontrado. Verifica el código ingresado.';
        } else if (error?.status === 500) {
          mensajeError = 'Error del servidor. Por favor intenta más tarde.';
        }
        
        this.mostrarAlertaError(mensajeError);
      }
    });
  }

  async resendCode(): Promise<void> {
    if (!this.email) {
      this.mostrarAlertaError('Email no disponible para reenviar código');
      return;
    }

    // Mostrar confirmación para reenviar código
    const result = await this.mostrarConfirmacionReenvio();
    
    if (!result.isConfirmed) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading = false;
        this.mostrarAlertaExito('Código reenviado', 'Se ha enviado un nuevo código a tu email.', 'info', 3000);
      },
      error: (error) => {
        this.loading = false;
        let mensajeError = 'Error al reenviar el código';
        
        if (error?.error?.message) {
          mensajeError = error.error.message;
        } else if (error?.status === 404) {
          mensajeError = 'Email no encontrado en el sistema';
        } else if (error?.status === 500) {
          mensajeError = 'Error del servidor. Por favor intenta más tarde.';
        }
        
        this.mostrarAlertaError(mensajeError);
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

  // Métodos de SweetAlert2

  private mostrarConfirmacionRestablecer(): Promise<any> {
    return Swal.fire({
      title: 'Restablecer Contraseña',
      text: '¿Estás seguro de que quieres restablecer tu contraseña?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, restablecer',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ed620c',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      }
    });
  }

  private mostrarConfirmacionReenvio(): Promise<any> {
    return Swal.fire({
      title: 'Reenviar Código',
      html: `¿Quieres que reenviemos un nuevo código a <strong>${this.email}</strong>?`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Sí, reenviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ed620c',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      }
    });
  }

  private mostrarAlertaExito(
    titulo: string, 
    mensaje: string, 
    icon: 'success' | 'info' = 'success', 
    timer: number = 2000
  ): Promise<any> {
    return Swal.fire({
      title: titulo,
      text: mensaje,
      icon: icon,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#ed620c',
      timer: timer,
      timerProgressBar: true,
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });
  }

  private mostrarAlertaError(mensaje: string): void {
    Swal.fire({
      title: 'Error',
      text: mensaje,
      icon: 'error',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#d33',
      showClass: {
        popup: 'animate__animated animate__shakeX'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });
  }

  // Mostrar información sobre el código (opcional)
  mostrarInfoCodigo(): void {
    Swal.fire({
      title: 'Código de Verificación',
      html: `
        <div class="text-start">
          <p>El código de verificación:</p>
          <ul>
            <li>Debe tener exactamente <strong>6 dígitos</strong></li>
            <li>Es válido por <strong>15 minutos</strong></li>
            <li>Se envió al email: <strong>${this.email}</strong></li>
            <li>Si no lo recibes, verifica la carpeta de spam</li>
          </ul>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#ed620c',
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      }
    });
  }
}