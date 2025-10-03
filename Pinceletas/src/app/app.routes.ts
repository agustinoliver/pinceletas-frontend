import { Routes } from '@angular/router';
import { LoginComponent } from './modules/user-auth/login/login.component';
import { RegisterComponent } from './modules/user-auth/register/register.component';
import { ProfileComponent } from './modules/user-auth/profile/profile.component';
import { ForgotPasswordComponent } from './modules/user-auth/forgot-password/forgot-password.component';
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
    path: 'productcreate',
    loadComponent: () =>
      import('./modules/commerce/product-create/product-create.component')
        .then(m => m.ProductCreateComponent)
    // canActivate: [authGuard] // Solo usuarios autenticados pueden crear productos
  },
  {
    path: 'admin/products',
    loadComponent: () =>
      import('./modules/commerce/product-list-admin/product-list-admin.component')
        .then(m => m.ProductListAdminComponent),
    // canActivate: [authGuard]
  },
  {
    path: 'admin/products/edit/:id',
    loadComponent: () =>
      import('./modules/commerce/product-edit/product-edit.component')
        .then(m => m.ProductEditComponent),
    // canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'productlist',
    pathMatch: 'full'
  },

  // Rutas de User Auth (nuestro microservicio)
  { 
    path: 'login', 
    component: LoginComponent 
  },
  { 
    path: 'register', 
    component: RegisterComponent 
  },
  { 
    path: 'forgot-password', 
    component: ForgotPasswordComponent 
  },
  { 
    path: 'profile', 
    component: ProfileComponent, 
    canActivate: [authGuard] 
  },

  // Rutas por defecto y redirecciones
  { path: '', redirectTo: 'productlist', pathMatch: 'full' },
  { path: '**', redirectTo: 'productlist' }
];
