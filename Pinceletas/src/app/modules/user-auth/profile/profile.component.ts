import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserAuthService } from '../../../services/user-auth.service';
import { User, UpdateUserRequest, UpdateAddressRequest, ChangePasswordRequest } from '../../../models/user.model';
import { Country, State } from '../../../models/location.model';
import { PasswordToggleComponent } from '../password-toggle/password-toggle.component';

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

  updatePersonalData(): void {
    this.personalDataSubmitted = true;
    
    // Marcar todos los campos como touched para mostrar errores
    Object.keys(this.personalDataForm.controls).forEach(key => {
      this.personalDataForm.get(key)?.markAsTouched();
    });

    if (this.personalDataForm.valid && this.user) {
      this.isLoading = true;
      const userData: UpdateUserRequest = this.personalDataForm.value;

      this.authService.updateUserProfile(this.user.email, userData).subscribe({
        next: () => {
          this.showSuccess('Datos personales actualizados correctamente');
          this.isLoading = false;
          this.personalDataSubmitted = false;
        },
        error: (error) => {
          this.showError(error.error?.message || 'Error al actualizar datos');
          this.isLoading = false;
        }
      });
    }
  }

  updateAddress(): void {
    this.addressSubmitted = true;
    
    // Marcar todos los campos como touched para mostrar errores
    Object.keys(this.addressForm.controls).forEach(key => {
      this.addressForm.get(key)?.markAsTouched();
    });

    if (this.addressForm.valid && this.user) {
      this.isLoading = true;
      const addressData: UpdateAddressRequest = this.addressForm.value;

      this.authService.updateUserAddress(this.user.email, addressData).subscribe({
        next: () => {
          this.showSuccess('Dirección actualizada correctamente');
          this.isLoading = false;
          this.addressSubmitted = false;
        },
        error: (error) => {
          this.showError(error.error?.message || 'Error al actualizar dirección');
          this.isLoading = false;
        }
      });
    }
  }

  changePassword(): void {
    this.securitySubmitted = true;
    
    // Marcar todos los campos como touched para mostrar errores
    Object.keys(this.securityForm.controls).forEach(key => {
      this.securityForm.get(key)?.markAsTouched();
    });

    if (this.securityForm.valid && this.user) {
      this.isLoading = true;
      const passwordData: ChangePasswordRequest = this.securityForm.value;

      this.authService.changePassword(this.user.email, passwordData).subscribe({
        next: () => {
          this.showSuccess('Contraseña cambiada correctamente');
          this.securityForm.reset();
          this.isLoading = false;
          this.securitySubmitted = false;
        },
        error: (error) => {
          this.showError(error.error?.message || 'Error al cambiar contraseña');
          this.isLoading = false;
        }
      });
    }
  }

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