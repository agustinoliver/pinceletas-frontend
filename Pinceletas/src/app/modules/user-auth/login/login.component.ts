import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { UserAuthService } from '../../../services/user-auth.service';
import { PasswordToggleComponent } from '../password-toggle/password-toggle.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PasswordToggleComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading: boolean = false;
  googleLoading: boolean = false;
  errorMessage: string = '';
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

  /**
   * Login normal con email y password
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Por favor completa todos los campos correctamente';
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
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
        console.error('Login error:', error);
      }
    });
  }

  /**
   * Iniciar sesión con Google
   */
  loginWithGoogle(): void {
    this.googleLoading = true;
    this.errorMessage = '';

    this.authService.loginWithGoogle().subscribe({
      next: (response) => {
        this.googleLoading = false;
        console.log('Google login successful:', response);
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (error) => {
        this.googleLoading = false;
        this.errorMessage = error;
        console.error('Google login error:', error);
      }
    });
  }

  /**
   * Ir a registro
   */
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  /**
   * Ir a recuperar contraseña
   */
  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}