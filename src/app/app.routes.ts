import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/public/public-shell').then((m) => m.PublicShell),
    children: [
      { path: '', loadComponent: () => import('./features/public/home/home.page').then((m) => m.HomePage) },
      { path: 'graficas', loadComponent: () => import('./features/public/charts/charts.page').then((m) => m.ChartsPage) },
      { path: 'mananera', loadComponent: () => import('./features/public/briefing/briefing.page').then((m) => m.BriefingPage) },
      { path: 'entrevista', loadComponent: () => import('./features/public/interview/interview.page').then((m) => m.InterviewPage) },
      { path: 'nosotros', loadComponent: () => import('./features/public/about/about.page').then((m) => m.AboutPage) },
      { path: 'noticias', loadComponent: () => import('./features/public/news/news.page').then((m) => m.NewsPage) },
      { path: 'noticias/:id', loadComponent: () => import('./features/public/news/news-detail.page').then((m) => m.NewsDetailPage) },
      { path: 'contacto', loadComponent: () => import('./features/public/contact/contact.page').then((m) => m.ContactPage) },
      { path: 'encuesta/:id', loadComponent: () => import('./features/survey/survey.page').then((m) => m.SurveyPage) },
      { path: 'encuesta-tulum', redirectTo: 'encuesta/tulum-2027', pathMatch: 'full' },
    ],
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-monitor.page').then((m) => m.AdminMonitorPage),
  },
  { path: '**', redirectTo: '' },
];
