import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserAuthService } from '../../../services/user-auth.service';
import { PasswordToggleComponent } from "../password-toggle/password-toggle.component";
import Swal from 'sweetalert2';
import { TerminosCondiciones } from '../../../models/config.model';
import { ConfigService } from '../../../services/config.service';
import { TerminosModalComponent } from '../../extras/terminos-modal/terminos-modal.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PasswordToggleComponent, TerminosModalComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl: string = '/productlist';

  // NUEVAS VARIABLES PARA TÉRMINOS
  showTerminosModal = false;
  terminosConfig: TerminosCondiciones | null = null;

  get passwordControl(): FormControl {
    return this.registerForm.get('password') as FormControl;
  }

  get confirmPasswordControl(): FormControl {
    return this.registerForm.get('confirmPassword') as FormControl;
  }

  constructor(
    private fb: FormBuilder,
    private authService: UserAuthService,
    private configService: ConfigService,
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

    // ✅ CAPTURAR returnUrl desde los queryParams
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/productlist';
    console.log('📍 Register - returnUrl capturado:', this.returnUrl);
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
          // NO redirigir inmediatamente, verificar términos primero
          this.verificarYMostrarTerminos();
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
          <p>Al registrarte, deberás aceptar nuestros términos y condiciones que incluyen:</p>
          <ul>
            <li>Protección de tus datos personales</li>
            <li>Condiciones de uso de la plataforma</li>
            <li>Políticas de privacidad y seguridad</li>
          </ul>
          <p class="mt-3"><small>Podrás leerlos completos después del registro.</small></p>
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


  // NUEVO MÉTODO: Verificar y mostrar términos después del registro
  private verificarYMostrarTerminos(): void {
    const currentUser = this.authService.getCurrentUser();
    
    // Si el usuario ya aceptó los términos (caso raro pero posible), continuar normal
    if (currentUser && currentUser.terminosAceptados) {
      this.redirigirDespuesDeRegistro();
      return;
    }

    // Si no los aceptó, cargar los términos y mostrar modal
    this.configService.getTerminosCondiciones().subscribe({
      next: (terminos) => {
        if (terminos && terminos.length > 0) {
          this.terminosConfig = terminos[0];
          this.showTerminosModal = true;
        } else {
          // Si no hay términos configurados, continuar igual
          console.warn('No hay términos y condiciones configurados');
          this.redirigirDespuesDeRegistro();
        }
      },
      error: (error) => {
        console.error('Error cargando términos:', error);
        this.redirigirDespuesDeRegistro(); // Continuar en caso de error
      }
    });
  }

  // NUEVO MÉTODO: Manejar cierre del modal
  onTerminosModalClosed(aceptado: boolean): void {
    this.showTerminosModal = false;
    
    if (aceptado) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        // Marcar términos como aceptados en el backend
        this.authService.marcarTerminosAceptados(currentUser.id).subscribe({
          next: () => {
            console.log('Términos aceptados correctamente');
            // Actualizar el usuario localmente
            const updatedUser = { ...currentUser, terminosAceptados: true };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            this.authService['currentUserSubject'].next(updatedUser);
            
            this.redirigirDespuesDeRegistro();
          },
          error: (error) => {
            console.error('Error marcando términos como aceptados:', error);
            this.mostrarAlertaError('Error al aceptar términos. Intenta nuevamente.');
            this.authService.logout();
          }
        });
      }
    } else {
      // Si rechaza los términos, cerrar sesión
      this.authService.logout();
      this.mostrarAlertaError('Debes aceptar los términos y condiciones para usar la plataforma');
    }
  }

  // NUEVO MÉTODO: Redirigir después del registro/aceptación
  private redirigirDespuesDeRegistro(): void {
    this.mostrarAlertaExito('¡Registro exitoso!', 'Tu cuenta ha sido creada correctamente')
      .then(() => {
        // ✅ Redirigir usando navigateByUrl para respetar la URL completa
        console.log('➡️ Redirigiendo después del registro a:', this.returnUrl);
        this.router.navigateByUrl(this.returnUrl);
      });
  }
}