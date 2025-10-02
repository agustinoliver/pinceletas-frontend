import { Routes } from '@angular/router';
import { Login } from './modules/user-auth/login/login';
import { Register } from './modules/user-auth/register/register';
import { Profile } from './modules/user-auth/profile/profile';
import { ForgotPassword } from './modules/user-auth/forgot-password/forgot-password';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
    path: 'productlist',
    loadComponent: () =>
      import('./modules/commerce/product-list/product-list.component')
        .then(m => m.ProductListComponent)
  },
  {
    path: 'productdetail/:id',
    loadComponent: () =>
      import('./modules/commerce/product-detail/product-detail.component')
        .then(m => m.ProductDetailComponent)
  },
  {
    path: '',
    redirectTo: 'productlist',
    pathMatch: 'full'
  },

  // Rutas de User Auth (nuestro microservicio)
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'profile', component: Profile, canActivate: [authGuard] },

  // Rutas por defecto y redirecciones
  { path: '', redirectTo: 'productlist', pathMatch: 'full' },
  { path: '**', redirectTo: 'productlist' }
];
