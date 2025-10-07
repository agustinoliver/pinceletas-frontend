import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserAuthService } from '../../../services/user-auth.service';
import { PasswordToggleComponent } from "../password-toggle/password-toggle.component";
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PasswordToggleComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl: string = '/productlist';

  get passwordControl(): FormControl {
    return this.registerForm.get('password') as FormControl;
  }

  get confirmPasswordControl(): FormControl {
    return this.registerForm.get('confirmPassword') as FormControl;
  }

  constructor(
    private fb: FormBuilder,
    private authService: UserAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, this.phoneValidator]],
      password: ['', [Validators.required, Validators.minLength(6), this.passwordValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/productlist']);
      return;
    }

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/productlist';
  }

  private phoneValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    
    if (!value) {
      return null;
    }

    // Eliminar espacios, guiones, paréntesis y otros caracteres especiales
    const cleanPhone = value.replace(/[\s\-\(\)\+]/g, '');
    
    // Validar que solo contenga números
    const hasOnlyNumbers = /^\d+$/.test(cleanPhone);
    
    // Validar longitud mínima y máxima para celulares (generalmente entre 8 y 15 dígitos)
    const isValidLength = cleanPhone.length >= 8 && cleanPhone.length <= 15;
    
    const isValidFormat = /^(\+?\d{1,3})?[\d\s\-\(\)]{8,15}$/.test(value);

    if (!hasOnlyNumbers) {
      return { 'phoneInvalidChars': true };
    }

    if (!isValidLength) {
      return { 'phoneInvalidLength': true };
    }

    if (!isValidFormat) {
      return { 'phoneInvalidFormat': true };
    }

    return null;
  }

  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    
    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumber;

    if (!passwordValid) {
      return { 'passwordRequirements': true };
    }

    return null;
  }

  // Validador para coincidencia de contraseñas
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  async onSubmit(): Promise<void> {
    // Marcar todos los campos como touched para mostrar errores
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });

    if (this.registerForm.valid) {
      // Mostrar confirmación antes del registro
      const result = await this.mostrarConfirmacionRegistro();
      
      if (!result.isConfirmed) {
        return;
      }

      this.isLoading = true;
      this.errorMessage = '';

      this.authService.register(this.registerForm.value).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.mostrarAlertaExito('¡Registro exitoso!', 'Tu cuenta ha sido creada correctamente')
            .then(() => {
              // ✅ Redirigir a la URL guardada después del registro
              this.router.navigateByUrl(this.returnUrl);
            });
        },
        error: (error) => {
          this.isLoading = false;
          let mensajeError = 'Error al registrarse';
          
          if (error.error?.message) {
            mensajeError = error.error.message;
          } else if (error.status === 400) {
            mensajeError = 'Datos de registro inválidos';
          } else if (error.status === 409) {
            mensajeError = 'El email ya está registrado';
          } else if (error.status === 500) {
            mensajeError = 'Error del servidor. Por favor intenta más tarde.';
          }
          
          this.mostrarAlertaError(mensajeError);
        }
      });
    } else {
      this.mostrarAlertaError('Por favor completa todos los campos correctamente');
    }
  }

  // Métodos de SweetAlert2

  private mostrarConfirmacionRegistro(): Promise<any> {
    const userData = this.registerForm.value;
    
    return Swal.fire({
      title: 'Confirmar Registro',
      html: `
        <div class="text-start">
          <p>¿Estás seguro de que quieres crear tu cuenta con los siguientes datos?</p>
          <div class="mt-3">
            <strong>Nombre:</strong> ${userData.nombre} ${userData.apellido}<br>
            <strong>Email:</strong> ${userData.email}<br>
            <strong>Teléfono:</strong> ${userData.telefono}
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, crear cuenta',
      cancelButtonText: 'Revisar datos',
      confirmButtonColor: '#ed620c',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      }
    });
  }

  private mostrarAlertaExito(titulo: string, mensaje: string): Promise<any> {
    return Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'success',
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#ed620c',
      timer: 3000,
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
      title: 'Error en el registro',
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

  // Mostrar información de términos (opcional)
  mostrarTerminos(): void {
    Swal.fire({
      title: 'Términos y Condiciones',
      html: `
        <div class="text-start">
          <p>Al registrarte, aceptas nuestros términos y condiciones:</p>
          <ul>
            <li>Debes proporcionar información veraz y actualizada</li>
            <li>Eres responsable de mantener la confidencialidad de tu cuenta</li>
            <li>Nos comprometemos a proteger tu privacidad</li>
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