import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./home/home').then(m => m.HomeComponent)
      },
      {
        path: 'planilhas',
        canActivate: [authGuard],
        loadComponent: () => import('./upload/upload.component').then(m => m.UploadComponent)
      },
      {
        path: 'graficos',
        canActivate: [authGuard],
        loadComponent: () => import('./graficos/graficos').then(m => m.GraficosComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
