import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError, map } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  ChangePasswordRequest, 
  UpdateAddressRequest, 
  UpdateUserRequest 
} from '../models/user.model';
import { Country, State } from '../models/location.model';
import { userAuthEnviroment } from '../enviroment/user-auth-enviroment';

@Injectable({
  providedIn: 'root'
})
export class UserAuthService {
  private apiAuth = userAuthEnviroment.apiAuth;
  private apiUsers = userAuthEnviroment.apiUsers;
  private apiLocations = userAuthEnviroment.apiLocations;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // ✅ NUEVO: Cache para usuarios
  private usuariosCache: Map<number, string> = new Map();

  constructor(
    private http: HttpClient,
    private firebaseService: FirebaseService
  ) {
    this.checkAndRestoreSession();
    this.loadUserFromStorage();

    if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => {
      console.log('🔄 Ventana obtuvo foco, verificando sesión...');
      this.checkAndRestoreSession();
    });
  }
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('currentUser');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing user data from localStorage', error);
        this.clearUserData();
      }
    }
  }

  private saveUserData(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private clearUserData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  // ✅ NUEVO: Método para obtener nombre de usuario desde el cache
  getNombreUsuario(usuarioId: number): string {
    if (usuarioId === 0) {
      return 'Sistema';
    }
    return this.usuariosCache.get(usuarioId) || `Usuario #${usuarioId}`;
  }

  // ✅ NUEVO: Método para agregar usuario al cache
  agregarUsuarioAlCache(usuarioId: number, nombreCompleto: string): void {
    this.usuariosCache.set(usuarioId, nombreCompleto);
  }

  // ✅ NUEVO: Método para obtener usuario por ID (usando el endpoint existente)
  obtenerUsuarioPorId(usuarioId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUsers}/by-id/${usuarioId}`)
      .pipe(
        tap(user => {
          // Agregar al cache cuando se obtiene un usuario
          const nombreCompleto = `${user.nombre} ${user.apellido}`;
          this.agregarUsuarioAlCache(user.id, nombreCompleto);
        }),
        catchError(error => {
          console.error('Error obteniendo usuario por ID', error);
          return throwError(() => error);
        })
      );
  }

  // ✅ NUEVO: Método para cargar múltiples usuarios al cache
  cargarUsuariosAlCache(usuarioIds: number[]): Observable<void> {
    return new Observable(observer => {
      const usuariosUnicos = [...new Set(usuarioIds)].filter(id => id !== 0 && !this.usuariosCache.has(id));
      
      if (usuariosUnicos.length === 0) {
        observer.next();
        observer.complete();
        return;
      }

      let usuariosCargados = 0;
      
      usuariosUnicos.forEach(usuarioId => {
        this.obtenerUsuarioPorId(usuarioId).subscribe({
          next: () => {
            usuariosCargados++;
            if (usuariosCargados === usuariosUnicos.length) {
              observer.next();
              observer.complete();
            }
          },
          error: (err) => {
            console.error(`Error cargando usuario ${usuarioId}:`, err);
            usuariosCargados++;
            if (usuariosCargados === usuariosUnicos.length) {
              observer.next();
              observer.complete();
            }
          }
        });
      });
    });
  }


  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiAuth}/login`, loginData)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          
          this.getUserProfile(loginData.email).subscribe({
            next: (user) => {
              this.saveUserData(response.token, user);
            },
            error: (error) => {
              console.error('Error loading user profile after login', error);
            }
          });
        }),
        catchError(error => {
          console.error('Login error', error);
          return throwError(() => error);
        })
      );
  }

  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiAuth}/register`, registerData)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          
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

  forgotPassword(email: string): Observable<any> {
  return this.http.post<{message: string}>(
    `${this.apiAuth}/forgot-password`,
    { email }
  ).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Forgot password error:', error);
      
      let errorMessage = 'Error al enviar el código de recuperación';
      
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 404) {
        errorMessage = 'El email ingresado no se encuentra registrado en el sistema';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Email inválido o cuenta desactivada';
      } else if (error.status === 500) {
        errorMessage = 'Error del servidor. Por favor intenta más tarde.';
      } else if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      }
      
      return throwError(() => new Error(errorMessage));
    })
  );
}

resetPassword(token: string, newPassword: string, confirmNewPassword: string): Observable<any> {
  return this.http.post<{message: string}>(
    `${this.apiAuth}/reset-password`,
    { token, newPassword, confirmNewPassword }
  ).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Reset password error:', error);
      
      let errorMessage = 'Error al restablecer la contraseña';
      
      if (error.error?.message) {
        // Usar mensaje específico del backend
        errorMessage = error.error.message;
      } else if (error.status === 400) {
        errorMessage = 'Código inválido o expirado';
      } else if (error.status === 500) {
        errorMessage = 'Error del servidor. Por favor intenta más tarde.';
      }
      
      return throwError(() => errorMessage);
    })
  );
}

  loginWithGoogle(): Observable<AuthResponse> {
    return new Observable(observer => {
      if (!this.firebaseService.isFirebaseConfigured()) {
        observer.error('La autenticación con Google no está configurada en el sistema');
        return;
      }

      this.firebaseService.signInWithGoogle()
        .then(async (firebaseUserCredential) => {
          try {
            const firebaseUser = firebaseUserCredential.user;
            const idToken = await firebaseUser.getIdToken();

            const requestBody = {
              firebaseIdToken: idToken
            };

            this.http.post<AuthResponse>(`${this.apiAuth}/firebase/login`, requestBody)
              .subscribe({
                next: (response) => {
                  this.handleAuthSuccess(response, firebaseUser.email!, observer);
                },
                error: (error) => {
                  console.error('Error en autenticación con backend:', error);
                  observer.error('Error al autenticar con el servidor. Intenta más tarde.');
                }
              });

          } catch (error) {
            console.error('Error al obtener token de Firebase:', error);
            observer.error('Error al procesar el inicio de sesión con Google');
          }
        })
        .catch(error => {
          console.error('Error en Google sign-in:', error);
          observer.error(error.message);
        });
    });
  }

  private handleAuthSuccess(response: AuthResponse, email: string, observer: any): void {
    localStorage.setItem('token', response.token);
    
    this.getUserProfile(email).subscribe({
      next: (user) => {
        this.saveUserData(response.token, user);
        observer.next(response);
        observer.complete();
      },
      error: (error) => {
        console.error('Error loading user profile after Google login:', error);
        observer.next(response);
        observer.complete();
      }
    });
  }

  getUserProfile(email: string): Observable<User> {
    return this.http.get<User>(`${this.apiUsers}/profile/${email}`)
      .pipe(
        catchError(error => {
          console.error('Get user profile error', error);
          return throwError(() => error);
        })
      );
  }

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

  changePassword(email: string, passwordData: ChangePasswordRequest): Observable<any> {
    return this.http.put<{message: string}>(`${this.apiUsers}/profile/${email}/password`, passwordData)
      .pipe(
        catchError(error => {
          console.error('Change password error', error);
          return throwError(() => error);
        })
      );
  }

  deactivateUser(email: string): Observable<any> {
    return this.http.put<{message: string}>(`${this.apiUsers}/profile/${email}/deactivate`, {})
      .pipe(
        tap(() => {
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

  logout(): void {
    this.clearUserData();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN';
  }

  // ==================== LOCATION METHODS ====================

  getAllCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.apiLocations}/countries`)
      .pipe(
        catchError(error => {
          console.error('Get countries error', error);
          return throwError(() => error);
        })
      );
  }

  getStatesByCountry(countryCode: string): Observable<State[]> {
    return this.http.get<State[]>(`${this.apiLocations}/countries/${countryCode}/states`)
      .pipe(
        catchError(error => {
          console.error('Get states error', error);
          return throwError(() => error);
        })
      );
  }

  searchCountries(query: string): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.apiLocations}/countries/search?query=${query}`)
      .pipe(
        catchError(error => {
          console.error('Search countries error', error);
          return throwError(() => error);
        })
      );
  }
    public checkAndRestoreSession(): void {
      console.log('🔄 VERIFICANDO Y RESTAURANDO SESIÓN...');
      
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('currentUser');
      
      console.log('📊 Estado localStorage:', {
        token: !!token,
        tokenLength: token?.length,
        userData: !!userData,
        userDataLength: userData?.length
      });
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          console.log('✅ Usuario parseado:', {
            id: user.id,
            email: user.email,
            nombre: user.nombre
          });
          
          // ✅ Actualizar el BehaviorSubject
          this.currentUserSubject.next(user);
          console.log('✅ Sesión restaurada exitosamente');
          
        } catch (error) {
          console.error('❌ Error parseando userData:', error);
          console.error('userData value:', userData);
          this.clearUserData();
        }
      } else {
        console.warn('⚠️ No hay datos de sesión para restaurar');
        console.log('Token presente:', !!token);
        console.log('UserData presente:', !!userData);
      }
    }
    public verificarIntegridadSesion(): boolean {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('currentUser');
      const currentUser = this.currentUserSubject.value;
      
      const sesionValida = !!(token && userData && currentUser);
      
      console.log('🔍 Verificación de integridad:', {
        token: !!token,
        userData: !!userData,
        currentUser: !!currentUser,
        sesionValida
      });
      
      return sesionValida;
    }
    public forzarSincronizacionSesion(): void {
      console.log('🔄 Forzando sincronización de sesión...');
      
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('currentUser');
      
      if (!token || !userData) {
        console.log('❌ No hay datos para sincronizar');
        this.clearUserData();
        return;
      }
      
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
        console.log('✅ Sesión sincronizada');
      } catch (error) {
        console.error('❌ Error en sincronización:', error);
        this.clearUserData();
      }
    }

    // En UserAuthService
    marcarTerminosAceptados(userId: number): Observable<any> {
      return this.http.put(`${this.apiUsers}/profile/${userId}/aceptar-terminos`, {});
    }
    
    verificarTerminosAceptados(userId: number): Observable<{terminosAceptados: boolean}> {
      return this.http.get<{terminosAceptados: boolean}>(`${this.apiUsers}/profile/${userId}/terminos-aceptados`);
    }
}