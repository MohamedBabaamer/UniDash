Cloud Function scaffold for secure counter increments

This folder contains a suggested Cloud Function to centralize and secure counter increments
(e.g., course codes, TD/TP sequence counters) instead of letting clients run Firestore transactions
directly. Using a trusted backend reduces race conditions and prevents malicious clients from
manipulating counters.

Example (Node.js, Firebase Functions):

```js
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

exports.incrementCounter = functions.https.onCall(async (data, context) => {
  // TODO: validate auth & roles
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  const { counterId, field } = data;
  if (!counterId || !field) throw new functions.https.HttpsError('invalid-argument', 'counterId and field required');

  const ref = db.collection('counters').doc(counterId);
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? (snap.get(field) || 0) : 0;
    const next = current + 1;
    tx.set(ref, { [field]: next }, { merge: true });
    return next;
  });

  return { next: result };
});
```

Usage from client (callable function): use Firebase Functions client SDK and call `incrementCounter`.

Security: ensure only admin users or server-side services can increment certain counters. Enforce
roles in the function using custom claims or verifying a server-side token.
