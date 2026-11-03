import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { env, assertFirebaseConfig } from '../config/environment.js';

let services = null;

/**
 * Initializes Firebase exactly once and returns the service handles.
 */
export function initFirebase() {
  if (services) return services;

  assertFirebaseConfig();

  const app = getApps().length ? getApp() : initializeApp(env.firebase);

  services = Object.freeze({
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
    functions: getFunctions(app, env.functionsRegion),
  });

  return services;
}

export function getFirebaseServices() {
  return services ?? initFirebase();
}