import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  Auth, 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  UserCredential,
  signOut 
} from 'firebase/auth';
import { firebaseEnvironment } from '../enviroment/firebase-environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private auth: Auth;
  private googleProvider: GoogleAuthProvider;

  constructor() {
    // Verificar que la configuración de Firebase esté presente
    if (!this.isFirebaseConfigValid()) {
      throw new Error('Firebase configuration is missing or invalid. Please check firebase-environment.ts');
    }

    const app = initializeApp(firebaseEnvironment);
    this.auth = getAuth(app);
    this.googleProvider = new GoogleAuthProvider();
    
    // Configuración adicional del proveedor Google
    this.googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
  }

  /**
   * Validar que la configuración de Firebase sea válida
   */
  private isFirebaseConfigValid(): boolean {
    // Verificar que todos los campos requeridos estén presentes y no sean el template
    const requiredFields = ['apiKey', 'authDomain', 'projectId'];
    const hasAllFields = requiredFields.every(field => 
      firebaseEnvironment[field as keyof typeof firebaseEnvironment] && 
      firebaseEnvironment[field as keyof typeof firebaseEnvironment] !== ''
    );
    
    const isNotTemplate = firebaseEnvironment.apiKey !== "TU_API_KEY_AQUI";
    
    return hasAllFields && isNotTemplate;
  }

  /**
   * Iniciar sesión con Google
   */
  async signInWithGoogle(): Promise<UserCredential> {
    if (!this.isFirebaseConfigValid()) {
      throw new Error('Firebase no está configurado correctamente. Verifica firebase-environment.ts');
    }

    try {
      return await signInWithPopup(this.auth, this.googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Cerrar sesión de Firebase
   */
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Error signing out from Firebase:', error);
      throw error;
    }
  }

  /**
   * Obtener el usuario actual de Firebase
   */
  getCurrentUser() {
    return this.auth.currentUser;
  }

  /**
   * Manejar errores de Firebase
   */
  private handleFirebaseError(error: any): Error {
    const errorCode = error.code;
    
    switch (errorCode) {
      case 'auth/popup-closed-by-user':
        return new Error('El inicio de sesión fue cancelado');
      case 'auth/popup-blocked':
        return new Error('El popup fue bloqueado. Permite popups para este sitio.');
      case 'auth/network-request-failed':
        return new Error('Error de conexión. Verifica tu internet.');
      case 'auth/unauthorized-domain':
        return new Error('Este dominio no está autorizado para autenticación.');
      case 'auth/configuration-not-found':
        return new Error('Configuración de Firebase no encontrada.');
      default:
        return new Error('Error al conectar con el servicio de autenticación.');
    }
  }

  /**
   * Verificar si Firebase está configurado
   */
  isFirebaseConfigured(): boolean {
    return this.isFirebaseConfigValid();
  }
}