import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { UserAuthService } from '../../../services/user-auth.service';
import { PasswordToggleComponent } from '../password-toggle/password-toggle.component';
import Swal from 'sweetalert2';
import { TerminosModalComponent } from '../../extras/terminos-modal/terminos-modal.component';
import { TerminosCondiciones } from '../../../models/config.model';
import { ConfigService } from '../../../services/config.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PasswordToggleComponent, TerminosModalComponent, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading: boolean = false;
  googleLoading: boolean = false;
  errorMessage: string = '';
  mensaje: string = ''; // ✅ Nuevo mensaje para mostrar notificación si viene del pago
  returnUrl: string = '/';

  showTerminosModal = false;
  terminosConfig: TerminosCondiciones | null = null;

  get passwordControl(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }

  constructor(
    private fb: FormBuilder,
    private authService: UserAuthService,
    private configService: ConfigService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  // 🔄 Nuevo ciclo de vida
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['paymentSuccess'] === 'true') {
        this.mensaje = '¡Tu pago fue exitoso! Inicia sesión para ver tu pedido.';
        console.log('💳 Login iniciado tras pago exitoso');
      }
    });
  }

  // NUEVO MÉTODO: Verificar y mostrar términos
  private verificarYMostrarTerminos(user: any): void {
  // Si el usuario ya aceptó los términos, continuar normal
  if (user.terminosAceptados) {
    this.onLoginSuccess();
    return;
  }

  // Si no los aceptó, cargar los términos y mostrar modal
  this.configService.getTerminosCondiciones().subscribe({
    next: (terminos) => {
      if (terminos && terminos.length > 0) {
        this.terminosConfig = terminos[0];
        this.showTerminosModal = true;
        // NO llamar onLoginSuccess aquí - esperar a que el modal se cierre
      } else {
        // Si no hay términos configurados, continuar igual
        console.warn('No hay términos y condiciones configurados');
        this.onLoginSuccess();
      }
    },
    error: (error) => {
      console.error('Error cargando términos:', error);
      this.onLoginSuccess(); // Continuar en caso de error
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
          
          // ✅ NUEVO: Mostrar alerta de éxito antes de redirigir
          this.mostrarAlertaExito('¡Bienvenido!', 'Has aceptado los términos y condiciones correctamente')
            .then(() => {
              this.onLoginSuccess();
            });
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

  // ✅ NUEVO MÉTODO: Alerta de éxito para términos aceptados
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

  // ✅ Nuevo método que maneja redirección post-login dependiendo del origen
  onLoginSuccess(): void {
  const currentUser = this.authService.getCurrentUser();
  console.log('🔐 Usuario después del login:', currentUser);
  console.log('📋 Términos aceptados?:', currentUser?.terminosAceptados);
 
  // Verificar si el usuario necesita aceptar términos
  if (currentUser && !currentUser.terminosAceptados) {
    console.log('📝 Mostrando términos...');
    this.verificarYMostrarTerminos(currentUser);
  } else {
    // Flujo normal de redirección
    const params = this.route.snapshot.queryParams;
    console.log('🔍 Parámetros URL:', params);
    
    // ✅ 1. Si viene returnUrl, redirigir ahí (PRIORIDAD MÁXIMA)
    if (params['returnUrl']) {
      console.log('➡️ Redirigiendo a returnUrl:', params['returnUrl']);
      this.router.navigateByUrl(params['returnUrl']);
    } 
    // ✅ 2. Si viene de pago exitoso
    else if (params['paymentSuccess'] === 'true' || sessionStorage.getItem('comingFromSuccessfulPayment')) {
      sessionStorage.removeItem('comingFromSuccessfulPayment');
      console.log('✅ Redirigiendo a /mis-pedidos');
      this.router.navigate(['/mis-pedidos']);
    } 
    // ✅ 3. Por defecto a productlist
    else {
      console.log('➡️ Redirigiendo a productlist');
      this.router.navigate(['/productlist']);
    }
  }
}

  // 🧾 Login normal
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.mostrarAlertaError('Por favor completa todos los campos correctamente');
      this.marcarCamposComoSucios();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const loginData = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        this.loading = false;
        // NO mostrar alerta de éxito aquí, el flujo continúa en onLoginSuccess
        this.onLoginSuccess();
      },
      error: (error) => {
        this.loading = false;
        
        let mensajeError = 'Error al iniciar sesión. Verifica tus credenciales.';
        
        if (error?.error?.message) {
          mensajeError = error.error.message;
        } else if (error?.message) {
          mensajeError = error.message;
        } else if (error?.status === 401) {
          mensajeError = 'Credenciales incorrectas. Verifica tu email y contraseña.';
        } else if (error?.status === 403) {
          mensajeError = 'Cuenta desactivada. Contacta al administrador.';
        } else if (error?.status === 404) {
          mensajeError = 'Usuario no encontrado. Verifica tu email.';
        } else if (error?.status === 500) {
          mensajeError = 'Error del servidor. Por favor intenta más tarde.';
        }
        
        this.mostrarAlertaError(mensajeError);
        console.error('Login error:', error);
      }
    });
  }

  // 🔐 Login con Google
  loginWithGoogle(): void {
    this.googleLoading = true;
    this.errorMessage = '';

    this.authService.loginWithGoogle().subscribe({
      next: (response) => {
        this.googleLoading = false;
        console.log('Google login successful:', response);
        // NO mostrar alerta de éxito aquí
        this.onLoginSuccess();
      },
      error: (error) => {
        this.googleLoading = false;
        
        let mensajeError = 'Error al iniciar sesión con Google. Intenta nuevamente.';
        
        if (error?.error?.message) {
          mensajeError = error.error.message;
        } else if (error?.message) {
          mensajeError = error.message;
        } else if (error?.status === 401) {
          mensajeError = 'Error de autenticación con Google.';
        } else if (error?.status === 500) {
          mensajeError = 'Error del servidor. Por favor intenta más tarde.';
        }
        
        this.mostrarAlertaError(mensajeError);
        console.error('Google login error:', error);
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  // ⚙️ Utilidades y alertas
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

  private mostrarConfirmacionGoogle(): Promise<any> {
    return Swal.fire({
      title: 'Iniciar sesión con Google',
      text: 'Serás redirigido a Google para autenticarte',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ed620c',
      cancelButtonColor: '#6c757d',
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      }
    });
  }

  private marcarCamposComoSucios(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  mostrarBienvenida(): void {
    if (this.returnUrl === '/') {
      Swal.fire({
        title: '¡Bienvenido!',
        text: 'Ingresa a tu cuenta para continuar',
        icon: 'info',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ed620c',
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        }
      });
    }
  }
}
