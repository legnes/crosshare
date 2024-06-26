#!/usr/bin/env -S npx tsx

import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '../lib/firebaseAdminWrapper.js';

const adminApp = getAdminApp();
const auth = getAuth(adminApp);

async function grantAdminRole(userEmail: string): Promise<void> {
  const user = await auth.getUserByEmail(userEmail);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  if (user.customClaims && (user.customClaims as any).admin === true) {
    return;
  }
  return auth.setCustomUserClaims(user.uid, {
    admin: true,
  });
}

if (process.argv.length !== 3) {
  throw Error('Invalid use of makeAdmin. Usage: node makeAdmin.js <email>');
}
const email = process.argv[2];
if (!email) {
  throw new Error('Bad email param');
}
grantAdminRole(email)
  .then(() => {
    console.log(`User ${email} has been given admin role`);
    process.exit(0);
  })
  .catch((err: unknown) => {
    console.error('Failed to grant user admin role: ', err);
    process.exit(1);
  });
