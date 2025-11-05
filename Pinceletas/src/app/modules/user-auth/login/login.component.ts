import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { UserAuthService } from '../../../services/user-auth.service';
import { PasswordToggleComponent } from '../password-toggle/password-toggle.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PasswordToggleComponent],
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

  get passwordControl(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }

  constructor(
    private fb: FormBuilder,
    private authService: UserAuthService,
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

  // ✅ Nuevo método que maneja redirección post-login dependiendo del origen
  onLoginSuccess(): void {
    this.route.queryParams.subscribe(params => {
      if (params['paymentSuccess'] === 'true' || sessionStorage.getItem('comingFromSuccessfulPayment')) {
        sessionStorage.removeItem('comingFromSuccessfulPayment');
        console.log('✅ Redirigiendo a /mis-pedidos tras pago exitoso');
        this.router.navigate(['/mis-pedidos']);
      } else {
        console.log('➡️ Redirigiendo a productlist (login normal)');
        this.router.navigate(['/productlist']);
      }
    });
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
        this.mostrarAlertaExito('¡Inicio de sesión exitoso!')
          .then(() => {
            // 🔄 Usar nueva función centralizada
            this.onLoginSuccess();
          });
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
        this.mostrarAlertaExito('¡Inicio de sesión con Google exitoso!')
          .then(() => {
            // 🔄 Usar el mismo flujo post-login
            this.onLoginSuccess();
          });
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
  private mostrarAlertaExito(mensaje: string): Promise<any> {
    return Swal.fire({
      title: '¡Éxito!',
      text: mensaje,
      icon: 'success',
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#ed620c',
      timer: 2000,
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
