import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { FIREBASE_AUTH, FIRESTORE } from '../../domain/tokens';

function firestoreFor(app: ReturnType<typeof getApp>) {
  try {
    return initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    return getFirestore(app);
  }
}

export function provideFirebase() {
  const app = getApps().length ? getApp() : initializeApp(environment.firebase);
  return [
    { provide: FIRESTORE, useValue: firestoreFor(app) },
    { provide: FIREBASE_AUTH, useValue: getAuth(app) },
  ];
}
