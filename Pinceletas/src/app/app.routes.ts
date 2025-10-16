import { Routes } from '@angular/router';
import { LoginComponent } from './modules/user-auth/login/login.component';
import { RegisterComponent } from './modules/user-auth/register/register.component';
import { ProfileComponent } from './modules/user-auth/profile/profile.component';
import { ForgotPasswordComponent } from './modules/user-auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './modules/user-auth/reset-password/reset-password.component';
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
  path: 'admin/audits',
  loadComponent: () =>
    import('./modules/commerce/product-audit/product-audit.component')
      .then(m => m.ProductAuditComponent),
  //canActivate: [authGuard]
<<<<<<< HEAD
},
{
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./modules/dashboard/dashboard-user-act-inac/dashboard-user-act-inac.component')
        .then(m => m.DashboardUserActInacComponent),
    // canActivate: [authGuard] // Solo usuarios autenticados pueden acceder al dashboard
=======
  },
  {
    path: 'favorites',
    loadComponent: () =>
      import('./modules/commerce/favorites-list/favorites-list.component')
       .then(m => m.FavoritesListComponent),
    canActivate: [authGuard] // Solo usuarios autenticados pueden ver favoritos
  },
  {
    path: 'carrito',
    loadComponent: () =>
      import('./modules/commerce/carrito-list/carrito-list.component')
        .then(m => m.CarritoListComponent),
    canActivate: [authGuard] // Solo usuarios autenticados
  },
  {
    path: 'mis-pedidos',
    loadComponent: () =>
      import('./modules/commerce/mis-pedidos/mis-pedidos.component')
        .then(m => m.MisPedidosComponent),
    canActivate: [authGuard] // Solo usuarios autenticados
  },
  {
    path: 'pedidos/detalle/:id',
    loadComponent: () =>
      import('./modules/commerce/detalle-pedido/detalle-pedido.component')
        .then(m => m.DetallePedidoComponent),
    canActivate: [authGuard] // Solo usuarios autenticados
  },
  {
    path: 'admin/pedidos',
    loadComponent: () =>
      import('./modules/commerce/gestion-pedidos/gestion-pedidos.component')
        .then(m => m.GestionPedidosComponent),
    canActivate: [authGuard] // Solo administradores
  },
  {
    path: 'admin/pedidos/detalle/:id',
    loadComponent: () =>
      import('./modules/commerce/detalle-pedido/detalle-pedido.component')
        .then(m => m.DetallePedidoComponent),
    canActivate: [authGuard] // Solo administradores
  },
  // RUTAS DE PAGO (públicas o según necesidad)
  {
    path: 'payment/success',
    loadComponent: () =>
      import('./modules/commerce/payment-success/payment-success.component')
        .then(m => m.PaymentSuccessComponent)
  },
  {
    path: 'payment/failure',
    loadComponent: () =>
      import('./modules/commerce/payment-failure/payment-failure.component')
        .then(m => m.PaymentFailureComponent)
  },
  {
    path: 'payment/pending',
    loadComponent: () =>
      import('./modules/commerce/payment-pending/payment-pending.component')
        .then(m => m.PaymentPendingComponent)
>>>>>>> 753c23a9fc715da7f588b4971b0b5c8d40a82ae4
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
    path: 'reset-password', 
    component: ResetPasswordComponent
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
