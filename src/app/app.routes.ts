import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AppShellComponent } from './layout/app-shell/app-shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
      },
      {
        path: '',
        loadChildren: () => import('./features/content/content.routes').then((m) => m.contentRoutes),
      },
      {
        path: 'categories',
        loadChildren: () => import('./features/lookup-manager/lookup-manager.routes').then((m) => m.lookupManagerRoutes),
      },
      {
        path: 'media',
        loadChildren: () => import('./features/media/media.routes').then((m) => m.mediaRoutes),
      },
      {
        path: 'users',
        canActivate: [roleGuard(['Admin'])],
        loadChildren: () => import('./features/users/users.routes').then((m) => m.usersRoutes),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
