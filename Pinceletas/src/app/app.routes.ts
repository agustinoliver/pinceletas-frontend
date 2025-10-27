import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { 
    path: 'productlist', 
    loadComponent: () => import('./modules/commerce/product-list/product-list.component')
      .then(m => m.ProductListComponent) 
  },
  { 
    path: 'productdetail/:id', 
    loadComponent: () => import('./modules/commerce/product-detail/product-detail.component')
      .then(m => m.ProductDetailComponent) 
  },
  { 
    path: 'productcreate', 
    loadComponent: () => import('./modules/commerce/product-create/product-create.component')
      .then(m => m.ProductCreateComponent)
    // canActivate: [authGuard] // Solo usuarios autenticados pueden crear productos
  },
  { 
    path: 'admin/products', 
    loadComponent: () => import('./modules/commerce/product-list-admin/product-list-admin.component')
      .then(m => m.ProductListAdminComponent),
    // canActivate: [authGuard]
  },
  { 
    path: 'admin/products/edit/:id', 
    loadComponent: () => import('./modules/commerce/product-edit/product-edit.component')
      .then(m => m.ProductEditComponent),
    // canActivate: [authGuard]
  },
  { 
    path: 'admin/audits', 
    loadComponent: () => import('./modules/commerce/product-audit/product-audit.component')
      .then(m => m.ProductAuditComponent),
    // canActivate: [authGuard]
  },
  { 
    path: 'admin/pedidos/auditoria', 
    loadComponent: () => import('./modules/commerce/pedido-audit/pedido-audit.component')
      .then(m => m.PedidoAuditComponent),
    canActivate: [authGuard] // Solo administradores
  },
  { 
    path: 'admin/dashboard', 
    loadComponent: () => import('./modules/dashboard/dashboard-user-act-inac/dashboard-user-act-inac.component')
      .then(m => m.DashboardUserActInacComponent),
    // canActivate: [authGuard]
  },
  { 
    path: 'favorites', 
    loadComponent: () => import('./modules/commerce/favorites-list/favorites-list.component')
      .then(m => m.FavoritesListComponent),
    canActivate: [authGuard] // Solo usuarios autenticados pueden ver favoritos
  },
  { 
    path: 'carrito', 
    loadComponent: () => import('./modules/commerce/carrito-list/carrito-list.component')
      .then(m => m.CarritoListComponent),
    canActivate: [authGuard] // Solo usuarios autenticados
  },
  { 
    path: 'mis-pedidos', 
    loadComponent: () => import('./modules/commerce/mis-pedidos/mis-pedidos.component')
      .then(m => m.MisPedidosComponent),
    canActivate: [authGuard] // Solo usuarios autenticados
  },
  { 
    path: 'pedidos/detalle/:id', 
    loadComponent: () => import('./modules/commerce/detalle-pedido/detalle-pedido.component')
      .then(m => m.DetallePedidoComponent),
    canActivate: [authGuard] // Solo usuarios autenticados
  },
  { 
    path: 'admin/pedidos', 
    loadComponent: () => import('./modules/commerce/gestion-pedidos/gestion-pedidos.component')
      .then(m => m.GestionPedidosComponent),
    canActivate: [authGuard] // Solo administradores
  },
  { 
    path: 'admin/pedidos/detalle/:id', 
    loadComponent: () => import('./modules/commerce/detalle-pedido/detalle-pedido.component')
      .then(m => m.DetallePedidoComponent),
    canActivate: [authGuard] // Solo administradores
  },
  
  // RUTAS DE PAGO (públicas o según necesidad)
  { 
    path: 'payment/success', 
    loadComponent: () => import('./modules/commerce/payment-success/payment-success.component')
      .then(m => m.PaymentSuccessComponent) 
  },
  { 
    path: 'payment/failure', 
    loadComponent: () => import('./modules/commerce/payment-failure/payment-failure.component')
      .then(m => m.PaymentFailureComponent) 
  },
  { 
    path: 'payment/pending', 
    loadComponent: () => import('./modules/commerce/payment-pending/payment-pending.component')
      .then(m => m.PaymentPendingComponent) 
  },

  // Rutas de User Auth (nuestro microservicio) - AHORA CON LAZY LOADING
  { 
    path: 'login', 
    loadComponent: () => import('./modules/user-auth/login/login.component')
      .then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./modules/user-auth/register/register.component')
      .then(m => m.RegisterComponent) 
  },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./modules/user-auth/forgot-password/forgot-password.component')
      .then(m => m.ForgotPasswordComponent) 
  },
  { 
    path: 'reset-password', 
    loadComponent: () => import('./modules/user-auth/reset-password/reset-password.component')
      .then(m => m.ResetPasswordComponent) 
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./modules/user-auth/profile/profile.component')
      .then(m => m.ProfileComponent),
    canActivate: [authGuard] 
  },

  // Rutas por defecto y redirecciones
  { path: '', 
    redirectTo: 'productlist', 
    pathMatch: 'full' },
  
  // ✅ NUEVA RUTA PARA PÁGINA NO ENCONTRADA
  { 
    path: '**', 
    loadComponent: () => import('./modules/shared/not-found/not-found.component')
      .then(m => m.NotFoundComponent) 
  }
];