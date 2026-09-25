import { InjectionToken } from '@angular/core';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type {
  FeaturedContent,
  Interview,
  NewsDraft,
  NewsItem,
  SponsorContent,
  Survey,
  VoteRecord,
} from './models';

export interface NewsRepository {
  watch(onChange: (items: NewsItem[]) => void): () => void;
  add(draft: NewsDraft): Promise<string>;
  remove(id: string): Promise<void>;
}

export interface SurveyResultCounts {
  surveyId: string;
  total: number;
  counts: Record<string, number>;
}

export interface VoteRepository {
  add(survey: Survey, vote: VoteRecord): Promise<void>;
  list(survey: Survey): Promise<VoteRecord[]>;
  hasDeviceVote(survey: Survey, deviceId: string): Promise<boolean>;
  clearDeviceVotes(deviceId: string, surveyIds: string[]): Promise<void>;
  watchResults(survey: Survey, onChange: (counts: SurveyResultCounts) => void): () => void;
  rebuildResults(survey: Survey, votes: VoteRecord[]): Promise<void>;
}

export interface SurveyRepository {
  watchActive(onChange: (items: Survey[]) => void): () => void;
  watchAll(onChange: (items: Survey[]) => void): () => void;
  save(survey: Survey): Promise<void>;
  remove(id: string): Promise<void>;
  seed(items: Survey[]): Promise<void>;
}

export interface ContentRepository {
  watchFeatured(onChange: (item: FeaturedContent) => void): () => void;
  watchInterview(onChange: (item: Interview) => void): () => void;
  watchSponsor(onChange: (item: SponsorContent) => void): () => void;
  saveFeatured(item: FeaturedContent): Promise<void>;
  saveInterview(item: Interview): Promise<void>;
  saveSponsor(item: SponsorContent): Promise<void>;
}

export const NEWS_REPOSITORY = new InjectionToken<NewsRepository>('NEWS_REPOSITORY');
export const VOTE_REPOSITORY = new InjectionToken<VoteRepository>('VOTE_REPOSITORY');
export const SURVEY_REPOSITORY = new InjectionToken<SurveyRepository>('SURVEY_REPOSITORY');
export const CONTENT_REPOSITORY = new InjectionToken<ContentRepository>('CONTENT_REPOSITORY');
export const FIRESTORE = new InjectionToken<Firestore>('FIRESTORE');
export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH');
