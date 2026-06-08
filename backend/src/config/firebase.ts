import admin from 'firebase-admin';

let initialized = false;

export function initFirebase(): admin.app.App {
  if (initialized) return admin.app();

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });

  initialized = true;
  console.log('🔥 Firebase Admin initialized');
  return admin.app();
}

export { admin };
