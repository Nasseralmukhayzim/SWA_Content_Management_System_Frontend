import { Routes } from '@angular/router';

export const mediaRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./media-list/media-list.component').then((m) => m.MediaListComponent),
  },
  {
    path: 'upload',
    loadComponent: () => import('./media-upload/media-upload.component').then((m) => m.MediaUploadComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./media-edit/media-edit.component').then((m) => m.MediaEditComponent),
  },
];
