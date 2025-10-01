import { Routes } from '@angular/router';


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
  }
];
