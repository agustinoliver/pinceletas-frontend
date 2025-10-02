import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { userAuthEnviroment } from '../enviroment/user-auth-enviroment';
import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  ChangePasswordRequest, 
  UpdateAddressRequest, 
  UpdateUserRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest 
} from '../models/user.model';
import { Country, State } from '../models/location.model';

@Injectable({
  providedIn: 'root'
})
export class UserAuthService {
  private apiAuth = userAuthEnviroment.apiAuth;
  private apiUsers = userAuthEnviroment.apiUsers;
  private apiLocations = userAuthEnviroment.apiLocations;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  /**
   * Carga el usuario desde sessionStorage al iniciar la aplicación
   * sessionStorage se borra automáticamente al cerrar la pestaña/navegador
   */
  private loadUserFromStorage(): void {
    const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('currentUser');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing user data from sessionStorage', error);
        this.clearUserData();
      }
    }
  }

  /**
   * Guarda los datos del usuario en sessionStorage y actualiza el BehaviorSubject
   * sessionStorage se borra automáticamente al cerrar la pestaña/navegador
   */
  private saveUserData(token: string, user: User): void {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Limpia todos los datos del usuario
   */
  private clearUserData(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  /**
   * Login del usuario
   */
  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiAuth}/login`, loginData)
      .pipe(
        tap(response => {
          // Guardar token inmediatamente
          localStorage.setItem('token', response.token);
          
          // Obtener datos completos del usuario
          this.getUserProfile(loginData.email).subscribe({
            next: (user) => {
              this.saveUserData(response.token, user);
            },
            error: (error) => {
              console.error('Error loading user profile after login', error);
              // Aún así mantener el token
            }
          });
        }),
        catchError(error => {
          console.error('Login error', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Registro de nuevo usuario
   */
  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiAuth}/register`, registerData)
      .pipe(
        tap(response => {
          // Guardar token inmediatamente
          localStorage.setItem('token', response.token);
          
          // Obtener datos completos del usuario
          this.getUserProfile(registerData.email).subscribe({
            next: (user) => {
              this.saveUserData(response.token, user);
            },
            error: (error) => {
              console.error('Error loading user profile after register', error);
            }
          });
        }),
        catchError(error => {
          console.error('Register error', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Solicitar recuperación de contraseña
   */
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiAuth}/forgot-password`, { email })
      .pipe(
        catchError(error => {
          console.error('Forgot password error', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Resetear contraseña con token
   */
  resetPassword(resetData: ResetPasswordRequest): Observable<any> {
    return this.http.post(`${this.apiAuth}/reset-password`, resetData)
      .pipe(
        catchError(error => {
          console.error('Reset password error', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener perfil del usuario
   */
  getUserProfile(email: string): Observable<User> {
    return this.http.get<User>(`${this.apiUsers}/profile/${email}`)
      .pipe(
        catchError(error => {
          console.error('Get user profile error', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Actualizar datos personales del usuario
   */
  updateUserProfile(email: string, userData: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUsers}/profile/${email}`, userData)
      .pipe(
        tap(user => {
          const currentToken = this.getToken();
          if (currentToken) {
            this.saveUserData(currentToken, user);
          }
        }),
        catchError(error => {
          console.error('Update user profile error', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Actualizar dirección del usuario
   */
  updateUserAddress(email: string, addressData: UpdateAddressRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUsers}/profile/${email}/address`, addressData)
      .pipe(
        tap(user => {
          const currentToken = this.getToken();
          if (currentToken) {
            this.saveUserData(currentToken, user);
          }
        }),
        catchError(error => {
          console.error('Update user address error', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Cambiar contraseña del usuario
   */
  changePassword(email: string, passwordData: ChangePasswordRequest): Observable<any> {
    return this.http.put(`${this.apiUsers}/profile/${email}/password`, passwordData)
      .pipe(
        catchError(error => {
          console.error('Change password error', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Desactivar cuenta de usuario
   */
  deactivateUser(email: string): Observable<any> {
    return this.http.put(`${this.apiUsers}/profile/${email}/deactivate`, {})
      .pipe(
        tap(() => {
          // Si el usuario desactiva su propia cuenta, hacer logout
          const currentUser = this.getCurrentUser();
          if (currentUser && currentUser.email === email) {
            this.logout();
          }
        }),
        catchError(error => {
          console.error('Deactivate user error', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Cerrar sesión del usuario
   */
  logout(): void {
    this.clearUserData();
  }

  /**
   * Obtener token JWT del sessionStorage
   */
  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  /**
   * Verificar si el usuario es administrador
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN';
  }

  // ==================== LOCATION METHODS ====================

  /**
   * Obtener todos los países
   */
  getAllCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.apiLocations}/countries`)
      .pipe(
        catchError(error => {
          console.error('Get countries error', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener estados/provincias por código de país
   */
  getStatesByCountry(countryCode: string): Observable<State[]> {
    return this.http.get<State[]>(`${this.apiLocations}/countries/${countryCode}/states`)
      .pipe(
        catchError(error => {
          console.error('Get states error', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Buscar países por nombre
   */
  searchCountries(query: string): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.apiLocations}/countries/search?query=${query}`)
      .pipe(
        catchError(error => {
          console.error('Search countries error', error);
          return throwError(() => error);
        })
      );
  }
}
