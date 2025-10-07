import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserAuthService } from '../../../services/user-auth.service';
import { User, UpdateUserRequest, UpdateAddressRequest, ChangePasswordRequest } from '../../../models/user.model';
import { Country, State } from '../../../models/location.model';
import { PasswordToggleComponent } from '../password-toggle/password-toggle.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PasswordToggleComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  personalDataForm: FormGroup;
  addressForm: FormGroup;
  securityForm: FormGroup;
  countries: Country[] = [];
  states: State[] = [];
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  tipoDireccion: 'calle' | 'manzana' = 'calle';

  // Variables para controlar la validación
  personalDataSubmitted = false;
  addressSubmitted = false;
  securitySubmitted = false;

  // Getters para los FormControls
  get currentPasswordControl(): FormControl {
    return this.securityForm.get('currentPassword') as FormControl;
  }

  get newPasswordControl(): FormControl {
    return this.securityForm.get('newPassword') as FormControl;
  }

  get confirmNewPasswordControl(): FormControl {
    return this.securityForm.get('confirmNewPassword') as FormControl;
  }

  constructor(
    private fb: FormBuilder,
    private authService: UserAuthService
  ) {
    // Formulario de datos personales - inicialmente no mostrar errores
    this.personalDataForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, this.phoneValidator]]
    });

    // Formulario de dirección - inicialmente no mostrar errores
    this.addressForm = this.fb.group({
      tipoDireccion: ['calle', [Validators.required]],
      calle: [''],
      numero: [''],
      manzana: [''],
      lote: [''],
      piso: ['', [Validators.required]],
      barrio: ['', [Validators.required]],
      ciudad: ['', [Validators.required]],
      pais: ['', [Validators.required]],
      provincia: ['', [Validators.required]],
      codigoPostal: ['', [Validators.required]]
    });

    // Formulario de seguridad - inicialmente no mostrar errores
    this.securityForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6), this.passwordValidator]],
      confirmNewPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Suscribirse a cambios en el tipo de dirección
    this.addressForm.get('tipoDireccion')?.valueChanges.subscribe(value => {
      this.tipoDireccion = value;
      this.updateAddressValidators();
    });
  }

  private phoneValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    
    if (!value) {
      return null;
    }

    const cleanPhone = value.replace(/[\s\-\(\)\+]/g, '');
    
    const hasOnlyNumbers = /^\d+$/.test(cleanPhone);
    
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

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.loadUserData(user);
        this.loadCountries();
      }
    });
  }

  loadUserData(user: User): void {
    // Cargar datos personales
    this.personalDataForm.patchValue({
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      telefono: user.telefono
    });

    // Determinar tipo de dirección
    let tipoDireccion = 'calle';
    if ((user.manzana || user.lote) && !user.calle && !user.numero) {
      tipoDireccion = 'manzana';
    }

    // Cargar datos de dirección
    this.addressForm.patchValue({
      tipoDireccion: tipoDireccion,
      calle: user.calle || '',
      numero: user.numero || '',
      manzana: user.manzana || '',
      lote: user.lote || '',
      piso: user.piso || '',
      barrio: user.barrio || '',
      ciudad: user.ciudad || '',
      pais: user.pais || '',
      provincia: user.provincia || '',
      codigoPostal: user.codigoPostal || ''
    });

    this.updateAddressValidators();

    // Cargar estados si hay país seleccionado
    if (user.pais) {
      const country = this.countries.find(c => c.name === user.pais);
      if (country) {
        this.authService.getStatesByCountry(country.code).subscribe(states => {
          this.states = states;
        });
      }
    }
  }

  private updateAddressValidators(): void {
    const calleControl = this.addressForm.get('calle');
    const numeroControl = this.addressForm.get('numero');
    const manzanaControl = this.addressForm.get('manzana');
    const loteControl = this.addressForm.get('lote');

    // Limpiar validadores existentes
    [calleControl, numeroControl, manzanaControl, loteControl].forEach(control => {
      control?.clearValidators();
      control?.updateValueAndValidity();
    });

    if (this.tipoDireccion === 'calle') {
      calleControl?.setValidators([Validators.required]);
      numeroControl?.setValidators([Validators.required]);
    } else {
      manzanaControl?.setValidators([Validators.required]);
      loteControl?.setValidators([Validators.required]);
    }

    // Actualizar validadores
    [calleControl, numeroControl, manzanaControl, loteControl].forEach(control => {
      control?.updateValueAndValidity();
    });
  }

  // Validador personalizado para contraseña
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
    const password = control.get('newPassword');
    const confirmPassword = control.get('confirmNewPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  loadCountries(): void {
    this.authService.getAllCountries().subscribe(countries => {
      this.countries = countries;
      
      // Cargar estados si hay país seleccionado
      if (this.user?.pais) {
        const country = this.countries.find(c => c.name === this.user!.pais);
        if (country) {
          this.authService.getStatesByCountry(country.code).subscribe(states => {
            this.states = states;
          });
        }
      }
    });
  }

  onCountryChange(event: any): void {
    const countryName = event.target.value;
    
    if (countryName) {
      const country = this.countries.find(c => c.name === countryName);
      
      if (country) {
        this.authService.getStatesByCountry(country.code).subscribe(states => {
          this.states = states;
          // Resetear provincia cuando cambia el país
          this.addressForm.patchValue({ provincia: '' });
        });
      }
    } else {
      this.states = [];
      this.addressForm.patchValue({ provincia: '' });
    }
  }

  async updatePersonalData(): Promise<void> {
    this.personalDataSubmitted = true;
    
    // Marcar todos los campos como touched para mostrar errores
    Object.keys(this.personalDataForm.controls).forEach(key => {
      this.personalDataForm.get(key)?.markAsTouched();
    });

    if (this.personalDataForm.valid && this.user) {
      // Mostrar confirmación antes de actualizar
      const result = await this.mostrarConfirmacion(
        'Actualizar datos personales',
        '¿Estás seguro de que quieres actualizar tus datos personales?'
      );

      if (!result.isConfirmed) {
        return;
      }

      this.isLoading = true;
      const userData: UpdateUserRequest = this.personalDataForm.value;

      this.authService.updateUserProfile(this.user.email, userData).subscribe({
        next: () => {
          this.isLoading = false;
          this.personalDataSubmitted = false;
          this.mostrarAlertaExito('Datos personales actualizados correctamente');
        },
        error: (error) => {
          this.isLoading = false;
          this.mostrarAlertaError(error.error?.message || 'Error al actualizar datos personales');
        }
      });
    } else {
      this.mostrarAlertaError('Por favor completa todos los campos correctamente');
    }
  }

  async updateAddress(): Promise<void> {
    this.addressSubmitted = true;
    
    // Marcar todos los campos como touched para mostrar errores
    Object.keys(this.addressForm.controls).forEach(key => {
      this.addressForm.get(key)?.markAsTouched();
    });

    if (this.addressForm.valid && this.user) {
      // Mostrar confirmación antes de actualizar
      const result = await this.mostrarConfirmacion(
        'Actualizar dirección',
        '¿Estás seguro de que quieres actualizar tu dirección?'
      );

      if (!result.isConfirmed) {
        return;
      }

      this.isLoading = true;
      const addressData: UpdateAddressRequest = this.addressForm.value;

      this.authService.updateUserAddress(this.user.email, addressData).subscribe({
        next: () => {
          this.isLoading = false;
          this.addressSubmitted = false;
          this.mostrarAlertaExito('Dirección actualizada correctamente');
        },
        error: (error) => {
          this.isLoading = false;
          this.mostrarAlertaError(error.error?.message || 'Error al actualizar dirección');
        }
      });
    } else {
      this.mostrarAlertaError('Por favor completa todos los campos de dirección correctamente');
    }
  }

  async changePassword(): Promise<void> {
    this.securitySubmitted = true;
    
    // Marcar todos los campos como touched para mostrar errores
    Object.keys(this.securityForm.controls).forEach(key => {
      this.securityForm.get(key)?.markAsTouched();
    });

    if (this.securityForm.valid && this.user) {
      // Mostrar confirmación antes de cambiar contraseña
      const result = await this.mostrarConfirmacion(
        'Cambiar contraseña',
        '¿Estás seguro de que quieres cambiar tu contraseña?',
        'warning'
      );

      if (!result.isConfirmed) {
        return;
      }

      this.isLoading = true;
      const passwordData: ChangePasswordRequest = this.securityForm.value;

      this.authService.changePassword(this.user.email, passwordData).subscribe({
        next: () => {
          this.isLoading = false;
          this.securitySubmitted = false;
          this.securityForm.reset();
          this.mostrarAlertaExito('Contraseña cambiada correctamente', 'success', 3000)
            .then(() => {
              // Opcional: Cerrar sesión después de cambiar contraseña
              // this.authService.logout();
            });
        },
        error: (error) => {
          this.isLoading = false;
          let mensajeError = 'Error al cambiar contraseña';
          
          if (error.error?.message) {
            mensajeError = error.error.message;
          } else if (error.status === 401) {
            mensajeError = 'La contraseña actual es incorrecta';
          } else if (error.status === 400) {
            mensajeError = 'La nueva contraseña no cumple con los requisitos de seguridad';
          }
          
          this.mostrarAlertaError(mensajeError);
        }
      });
    } else {
      this.mostrarAlertaError('Por favor completa todos los campos de seguridad correctamente');
    }
  }

  // Métodos de SweetAlert2

  private mostrarAlertaExito(
    mensaje: string, 
    icon: 'success' | 'info' = 'success', 
    timer: number = 2000
  ): Promise<any> {
    return Swal.fire({
      title: '¡Éxito!',
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

  private mostrarConfirmacion(
    titulo: string, 
    texto: string, 
    icon: 'warning' | 'question' | 'info' = 'question'
  ): Promise<any> {
    return Swal.fire({
      title: titulo,
      text: texto,
      icon: icon,
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ed620c',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      }
    });
  }

  // Métodos originales mantenidos por compatibilidad (pueden eliminarse gradualmente)
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 5000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 5000);
  }
}