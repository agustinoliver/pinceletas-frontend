import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserAuthService } from '../../../services/user-auth.service';
import { User, UpdateUserRequest, UpdateAddressRequest, ChangePasswordRequest } from '../../../models/user.model';
import { Country, State } from '../../../models/location.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class Profile implements OnInit {
  user: User | null = null;
  personalDataForm: FormGroup;
  addressForm: FormGroup;
  securityForm: FormGroup;
  countries: Country[] = [];
  states: State[] = [];
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: UserAuthService
  ) {
    this.personalDataForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required]]
    });

    this.addressForm = this.fb.group({
      calle: [''],
      numero: [''],
      ciudad: [''],
      piso: [''],
      barrio: [''],
      pais: [''],
      provincia: [''],
      codigoPostal: ['']
    });

    this.securityForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', [Validators.required]]
    });
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
    this.personalDataForm.patchValue({
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      telefono: user.telefono
    });

    this.addressForm.patchValue({
      calle: user.calle || '',
      numero: user.numero || '',
      ciudad: user.ciudad || '',
      piso: user.piso || '',
      barrio: user.barrio || '',
      pais: user.pais || '',
      provincia: user.provincia || '',
      codigoPostal: user.codigoPostal || ''
    });
  }

  loadCountries(): void {
    this.authService.getAllCountries().subscribe(countries => {
      this.countries = countries;
    });
  }

  onCountryChange(event: any): void {
    const countryCode = event.target.value;
    if (countryCode) {
      this.authService.getStatesByCountry(countryCode).subscribe(states => {
        this.states = states;
      });
    }
  }

  updatePersonalData(): void {
    if (this.personalDataForm.valid && this.user) {
      this.isLoading = true;
      const userData: UpdateUserRequest = this.personalDataForm.value;

      this.authService.updateUserProfile(this.user.email, userData).subscribe({
        next: () => {
          this.showSuccess('Datos personales actualizados correctamente');
        },
        error: (error) => {
          this.showError(error.error?.message || 'Error al actualizar datos');
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }

  updateAddress(): void {
    if (this.addressForm.valid && this.user) {
      this.isLoading = true;
      const addressData: UpdateAddressRequest = this.addressForm.value;

      this.authService.updateUserAddress(this.user.email, addressData).subscribe({
        next: () => {
          this.showSuccess('Dirección actualizada correctamente');
        },
        error: (error) => {
          this.showError(error.error?.message || 'Error al actualizar dirección');
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }

  changePassword(): void {
    if (this.securityForm.valid && this.user) {
      this.isLoading = true;
      const passwordData: ChangePasswordRequest = this.securityForm.value;

      this.authService.changePassword(this.user.email, passwordData).subscribe({
        next: () => {
          this.showSuccess('Contraseña cambiada correctamente');
          this.securityForm.reset();
        },
        error: (error) => {
          this.showError(error.error?.message || 'Error al cambiar contraseña');
        },
        complete: () => {
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
