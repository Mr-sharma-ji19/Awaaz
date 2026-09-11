# Awaaz — Firebase + Cloudinary

## Services
- Firebase Auth (Email/Password)
- Firestore
- Cloudinary unsigned image upload

## Role system
Every newly registered Firebase account gets a Firestore profile at `users/{uid}` with `role: "user"`.
Only `admin` or `editor` profiles can access `admin.html`.

### Roles
- `admin`: create/edit/delete/publish any post
- `editor`: create/edit/delete only their own draft posts; cannot publish
- `user`: normal account; no admin dashboard access

## First admin setup
1. Firebase Console → Authentication → Users → open your admin user and copy the full User UID.
2. Firestore Database → Data → create collection `users`.
3. Use the copied UID as the document ID.
4. Add fields:
   - `email` (string): your admin email
   - `displayName` (string): your name
   - `role` (string): `admin`
   - `createdAt` (timestamp)
5. Publish the included `firestore.rules`.

After that, that account will be recognized as Admin. Other users can sign up normally and will start as `user`. To promote someone to editor, create/update their own `users/{uid}` document with `role: "editor"` using the Firebase console while you are an authorized admin.

## Cloudinary
Cloud Name: `dsqbcdhk`
Upload preset: `awaaz_images`

Never put Firebase Admin SDK private keys or the Cloudinary API secret in frontend code.
