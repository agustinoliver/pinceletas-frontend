import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
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

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('currentUser');
    
    if (token && userData) {
      this.currentUserSubject.next(JSON.parse(userData));
    }
  }

  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiAuth}/login`, loginData)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          this.getUserProfile(loginData.email).subscribe(user => {
            this.currentUserSubject.next(user);
            localStorage.setItem('currentUser', JSON.stringify(user));
          });
        })
      );
  }

  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiAuth}/register`, registerData)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          this.getUserProfile(registerData.email).subscribe(user => {
            this.currentUserSubject.next(user);
            localStorage.setItem('currentUser', JSON.stringify(user));
          });
        })
      );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiAuth}/forgot-password`, { email });
  }

  resetPassword(resetData: ResetPasswordRequest): Observable<any> {
    return this.http.post(`${this.apiAuth}/reset-password`, resetData);
  }

  getUserProfile(email: string): Observable<User> {
    return this.http.get<User>(`${this.apiUsers}/profile/${email}`);
  }

  updateUserProfile(email: string, userData: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUsers}/profile/${email}`, userData)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
        })
      );
  }

  updateUserAddress(email: string, addressData: UpdateAddressRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUsers}/profile/${email}/address`, addressData)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
        })
      );
  }

  changePassword(email: string, passwordData: ChangePasswordRequest): Observable<any> {
    return this.http.put(`${this.apiUsers}/profile/${email}/password`, passwordData);
  }

  deactivateUser(email: string): Observable<any> {
    return this.http.put(`${this.apiUsers}/profile/${email}/deactivate`, {});
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN';
  }

  // Location methods
  getAllCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.apiLocations}/countries`);
  }

  getStatesByCountry(countryCode: string): Observable<State[]> {
    return this.http.get<State[]>(`${this.apiLocations}/countries/${countryCode}/states`);
  }

  searchCountries(query: string): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.apiLocations}/countries/search?query=${query}`);
  }
}
