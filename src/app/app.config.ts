import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideFirebase } from './core/firebase/firestore.provider';
import { FirestoreContentRepository } from './data/firestore-content.repository';
import { FirestoreNewsRepository } from './data/firestore-news.repository';
import { FirestoreSurveyRepository } from './data/firestore-survey.repository';
import { FirestoreVoteRepository } from './data/firestore-vote.repository';
import { CONTENT_REPOSITORY, NEWS_REPOSITORY, SURVEY_REPOSITORY, VOTE_REPOSITORY } from './domain/tokens';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideFirebase(),
    { provide: NEWS_REPOSITORY, useClass: FirestoreNewsRepository },
    { provide: VOTE_REPOSITORY, useClass: FirestoreVoteRepository },
    { provide: SURVEY_REPOSITORY, useClass: FirestoreSurveyRepository },
    { provide: CONTENT_REPOSITORY, useClass: FirestoreContentRepository },
  ],
};
