import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserAuthService } from '../../../services/user-auth.service';
import { PasswordToggleComponent } from "../password-toggle/password-toggle.component";

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

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          // ✅ Redirigir a la URL guardada después del registro
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al registrarse';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }
}