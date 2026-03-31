# Reseau Social — Backend NestJS

## Description

API REST pour un reseau social. Stack : NestJS 10, Prisma ORM, PostgreSQL, JWT + TOTP 2FA.

Fonctionnalites actuelles : inscription/connexion, CRUD posts, CRUD commentaires, reset mot de passe par email avec code OTP, suppression de compte avec confirmation OTP.

---

## Demarrage

```bash
# 1. Installer les dependances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# Remplir DATABASE_URL, SECRET_KEY, OTP_CODE

# 3. Appliquer le schema Prisma
npx prisma migrate dev

# 4. Lancer en dev
npm run start:dev
```

Le serveur demarre sur `http://localhost:3000`. La documentation Swagger est disponible sur `/api`.

---

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run start:dev` | Serveur dev avec hot-reload |
| `npm run build` | Compilation vers `dist/` |
| `npm run start:prod` | Lancer la version compilee |
| `npm run lint` | ESLint avec auto-fix |
| `npm run format` | Prettier |
| `npm run test` | Tests unitaires (Jest) |
| `npm run test:e2e` | Tests end-to-end |
| `npx prisma migrate dev` | Creer/appliquer une migration |
| `npx prisma studio` | Interface visuelle DB |

---

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Connexion PostgreSQL (`postgresql://user:pass@host:5432/db?schema=public`) |
| `SECRET_KEY` | Cle secrete pour signer les JWT |
| `OTP_CODE` | Secret base32 pour generer les codes TOTP (speakeasy) |

---

## Architecture des modules

```
AppModule
├── UserModule        — Authentification, gestion de compte
├── PostModule        — CRUD publications
├── CommentModule     — CRUD commentaires
├── PrismaModule      — (global) Client Prisma
└── MailerModule      — (global) Envoi d'emails
```

Chaque module suit le pattern : `module.ts` → `controller.ts` → `service.ts` → `dto/`.

### Schema de la base de donnees

```
User (1) ──→ (*) Post (1) ──→ (*) Comment
User (1) ──→ (*) Comment
```

Toutes les relations utilisent `onDelete: Cascade`.

---

## Endpoints API

### Authentification (`/user`)

| Methode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/user/signup` | Non | Inscription |
| POST | `/user/signin` | Non | Connexion (retourne JWT) |
| PUT | `/user/update` | Non | Demande de reset mot de passe |
| POST | `/user/update_confirmation` | Non | Confirmation reset avec code OTP |
| DELETE | `/user/delete` | JWT | Demande suppression de compte |
| DELETE | `/user/delete_confirmation` | Non | Confirmation suppression avec code OTP |

### Posts (`/post`)

| Methode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/post/create` | JWT | Creer un post |
| GET | `/post` | Non | Lire tous les posts (avec users et commentaires) |
| PUT | `/post/update/:id` | JWT | Modifier un post (proprietaire uniquement) |
| DELETE | `/post/delete/:id` | JWT | Supprimer un post (proprietaire uniquement) |

### Commentaires (`/comment`)

| Methode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/comment/:id` | Non | Commentaires d'un post |
| POST | `/comment/create` | JWT | Creer un commentaire |
| PUT | `/comment/update/:id` | JWT | Modifier un commentaire (proprietaire) |
| DELETE | `/comment/delete/:id` | JWT | Supprimer un commentaire (proprietaire) |

---

## AUDIT CRITIQUE DU PROJET

### 1. Failles de securite (CRITIQUES)

#### 1.1 Les tokens JWT n'expirent jamais

**Fichier :** `src/user/strategie.service.ts` ligne 14

```typescript
ignoreExpiration: true
```

Meme si le token est signe avec `expiresIn: '2h'` a la creation, la strategie Passport **ignore l'expiration**. Un token vole reste valide indefiniment.

**Correction :** Mettre `ignoreExpiration: false` et implementer un systeme de refresh token.

---

#### 1.2 Secret OTP partage entre tous les utilisateurs

**Fichier :** `src/user/user.service.ts`

La meme variable `OTP_CODE` est utilisee pour generer les TOTP de tous les utilisateurs. Consequence : a un instant T donne, **tous les utilisateurs ont le meme code OTP**. Un attaquant pourrait demander un reset pour son propre compte, recuperer le code, et l'utiliser pour le compte d'un autre utilisateur.

**Correction :** Generer un secret OTP unique par utilisateur, le stocker en base (champ `otpSecret` dans le modele `User`), et l'utiliser pour la verification.

---

#### 1.3 L'endpoint de suppression de compte n'est pas protege

**Fichier :** `src/user/user.controller.ts`

`DELETE /user/delete` requiert un JWT, mais `DELETE /user/delete_confirmation` **n'a aucun guard**. N'importe qui connaissant l'email, le mot de passe et le code OTP (qui est le meme pour tout le monde, voir 1.2) peut supprimer un compte.

**Correction :** Ajouter `@UseGuards(AuthGuard("jwt"))` sur `delete_confirmation` aussi.

---

#### 1.4 Pas de CORS configure

**Fichier :** `src/main.ts`

Aucun `app.enableCors()`. Le frontend Next.js ne pourra pas appeler l'API depuis un autre port/domaine.

**Correction :**
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
});
```

---

#### 1.5 Fuite de donnees utilisateur dans les logs

**Fichier :** `src/user/strategie.service.ts` ligne 22

```typescript
console.log(user)
```

L'objet `user` complet est affiche dans les logs a chaque requete authentifiee. En production cela expose des donnees sensibles.

**Correction :** Supprimer ce `console.log`.

---

#### 1.6 Pas de rate limiting

Aucune protection contre le brute-force sur `/user/signin`, `/user/update`, ou la verification OTP. Un attaquant peut tester les 100 000 combinaisons du code a 5 chiffres.

**Correction :** Utiliser `@nestjs/throttler` pour limiter le nombre de requetes par IP.

---

#### 1.7 Injection HTML dans les emails

**Fichier :** `src/mailer/mailer.service.ts`

Les variables `code` et `url` sont injectees directement dans le HTML sans echappement. Si une donnee utilisateur finissait dans `url`, cela ouvrirait une faille XSS dans les clients mail.

---

#### 1.8 Le mot de passe peut fuiter dans les reponses

Pas de serialisation des reponses. `GET /post` inclut `password: false` dans le select Prisma, mais il n'y a pas de protection globale. Si un futur endpoint oublie de l'exclure, le hash du mot de passe sera retourne au client.

**Correction :** Utiliser un intercepteur global de serialisation avec `class-transformer` et `@Exclude()` sur le champ password.

---

### 2. Bugs

#### 2.1 Faute de frappe "localohst"

**Fichier :** `src/user/user.service.ts` lignes 73 et 119

```typescript
const url = "http://localohst:3000/user/update_confirmation"
const url = "http://localohst:3000/user/delete_confirmation"
```

Devrait etre `localhost`. De plus, ces URLs devraient provenir de variables d'environnement, pas etre en dur.

---

#### 2.2 Crash potentiel : null check apres utilisation

**Fichier :** `src/post/post.service.ts` methode `Update`

```typescript
const post = await this.prismaService.post.findUnique({where: {postId}})
if (post.userId != userId) throw new UnauthorizedException(...)  // ← crash si post est null
if (!post) throw new NotFoundException(...)  // ← trop tard
```

Le check `!post` doit etre fait **avant** d'acceder a `post.userId`.

---

#### 2.3 Faute de frappe dans la reponse Delete comment

**Fichier :** `src/comment/comment.service.ts` methode `Delete`

```typescript
return {date : "Comment Deleted"}  // ← "date" au lieu de "data"
```

---

#### 2.4 Faute de frappe dans le schema Prisma

**Fichier :** `prisma/schema.prisma`

Le nom de relation `"pots_comment"` devrait etre `"posts_comment"` (faute de frappe).

---

#### 2.5 Le test E2E est casse

**Fichier :** `test/app.e2e-spec.ts`

Le test attend un `GET /` retournant `"Hello World!"`, mais il n'y a aucun controller racine dans l'application. Ce test echouera systematiquement.

---

#### 2.6 ESLint est desactive

**Fichier :** `.eslintrc.js`

```javascript
ignorePatterns: ['.eslintrc.js', '*'],
```

Le pattern `'*'` exclut **tous les fichiers** du linting. La commande `npm run lint` ne verifie rien.

---

#### 2.7 DTO sans type

**Fichier :** `src/supabase/dto/Media_Post.dto.ts`

```typescript
readonly name_media  // ← pas de type TypeScript
```

---

### 3. Problemes de conception

#### 3.1 CreatePostDto demande `userId` dans le body

Le `userId` est envoye dans le body du DTO **et** extrait du token JWT. Le service compare les deux. C'est redondant et dangereux : le client ne devrait jamais envoyer son propre userId. Seul le JWT devrait etre la source de verite.

**Correction :** Retirer `userId` du `CreatePostDto` et utiliser uniquement celui du token.

---

#### 3.2 Pas de pagination

`GET /post` retourne **tous** les posts avec tous les commentaires inclus. Avec de la croissance, cette requete deviendra extremement lente et couteuse en memoire.

**Correction :** Ajouter `skip`, `take`, et un tri (`orderBy`) avec un DTO de query params (`?page=1&limit=20`).

---

#### 3.3 Le mailer cree un nouveau compte test a chaque envoi

**Fichier :** `src/mailer/mailer.service.ts`

La methode `transporteur()` appelle `nodemailer.createTestAccount()` a chaque email. Ce n'est viable qu'en dev avec un serveur local SMTP.

**Correction :** Configurer un vrai service SMTP (SendGrid, Resend, etc.) via des variables d'environnement. Initialiser le transport une seule fois.

---

#### 3.4 Pas de refresh token

Le systeme n'a qu'un access token (2h, et en realite infini a cause de `ignoreExpiration`). Il n'y a pas de mecanisme pour renouveler le token sans redemander le mot de passe.

**Correction :** Implementer un refresh token stocke en base avec un endpoint `POST /user/refresh`.

---

#### 3.5 Pas de timestamps sur Post et Comment

Les modeles `Post` et `Comment` n'ont pas de champs `createdAt` / `updatedAt`, contrairement a `User`. Impossible de trier par date ou de savoir quand un contenu a ete modifie.

---

#### 3.6 Le body d'un DELETE ne devrait pas contenir de donnees

Les endpoints `DELETE /user/delete` et `DELETE /comment/delete/:id` attendent un body JSON. Beaucoup de clients HTTP et proxies ignorent le body des requetes DELETE.

**Correction :** Passer les informations necessaires via les params d'URL ou les query params, ou utiliser POST pour ces operations.

---

#### 3.7 Routes pas RESTful

Les routes actuelles (`/post/create`, `/post/delete/:id`) ne suivent pas les conventions REST.

| Actuel | RESTful |
|--------|---------|
| `POST /post/create` | `POST /posts` |
| `GET /post` | `GET /posts` |
| `PUT /post/update/:id` | `PATCH /posts/:id` |
| `DELETE /post/delete/:id` | `DELETE /posts/:id` |

---

### 4. Qualite du code

#### 4.1 TypeScript pas du tout strict

**Fichier :** `tsconfig.json`

```json
"strictNullChecks": false,
"noImplicitAny": false,
"strictBindCallApply": false
```

Le compilateur ne detectera pas les erreurs de null/undefined ni les types manquants. C'est une source importante de bugs a l'execution.

**Correction :** Activer `"strict": true` et corriger les erreurs de type resultantes.

---

#### 4.2 Conventions de nommage incoherentes

| Element | Exemples | Probleme |
|---------|----------|----------|
| Methodes de service | `Signup`, `Signin`, `reset_password`, `Delete_Confirmation` | Mix PascalCase / snake_case |
| DTOs fichiers | `signup.dto.ts`, `CreatePost.dto.ts`, `Delete_Account_Confirmation.dto.ts` | Mix camelCase / PascalCase / snake_case |
| DTOs classes | `SignupDto`, `Reset_passwordDto`, `Delete_Account_ConfirmationDto` | Incoherent |
| Variables | `UserId`, `userId`, `userid` | Casse variable |

**Correction :** Adopter une convention unique : PascalCase pour les classes, camelCase pour les methodes et variables, kebab-case pour les fichiers.

---

#### 4.3 Messages d'erreur en anglais approximatif

```
"Are already exist"          → "User already exists"
"Password is false"          → "Invalid password"
"Post does not Found"        → "Post not found"
"delet accound mail..."      → "Account deletion email sent"
```

**Correction :** Choisir une langue (francais ou anglais) et etre coherent. Idealement utiliser un systeme de codes d'erreur.

---

#### 4.4 Type `any` utilise pour userId

**Fichier :** `src/comment/comment.service.ts`

```typescript
async Create(createComment: CreateCommentDto, userId: any)
```

Le `userId` devrait etre type `number`.

---

#### 4.5 Code mort et commente

**Fichier :** `src/post/post.service.ts`

```typescript
//await this.prismaService.post.create({where : {Id} , data : {content, title}})
//await this.prismaService.post.delete({where : {userId}})
```

Le module `supabase/` ne contient qu'un DTO vide et inutilise.

---

#### 4.6 Injection inutile

**Fichier :** `src/comment/comment.service.ts` — `ConfigService` est importe et injecte mais jamais utilise.

---

### 5. Ameliorations recommandees pour le frontend

Pour connecter le frontend Next.js au backend actuel, voici les prerequis cote backend :

| Priorite | Action |
|----------|--------|
| **P0** | Activer CORS |
| **P0** | Corriger `ignoreExpiration: false` |
| **P0** | Corriger les bugs de null check et typos |
| **P1** | Implementer un refresh token |
| **P1** | Ajouter la pagination sur les posts |
| **P1** | Retirer `userId` du body de creation de post |
| **P1** | Ajouter `createdAt`/`updatedAt` sur Post et Comment |
| **P1** | Mettre en place un vrai service mail (ou au minimum configurable) |
| **P2** | Ajouter rate limiting (`@nestjs/throttler`) |
| **P2** | Ajouter un endpoint `GET /user/profile` pour le frontend |
| **P2** | Normaliser les routes en RESTful |
| **P2** | Activer TypeScript strict |
| **P3** | Ajouter des tests unitaires et e2e fonctionnels |
| **P3** | Mettre en place un logger structure (Winston ou Pino) |
| **P3** | Ajouter un systeme de "like" et de profil utilisateur |

---

## Ordre de priorite pour la mise a jour

1. **Securite** — Corriger les failles critiques (JWT expiration, OTP partage, CORS, guards manquants)
2. **Bugs** — Corriger les typos, null checks, ESLint, tests casses
3. **API** — Rendre les routes RESTful, ajouter pagination, retirer userId du body
4. **Schema** — Ajouter timestamps, preparer les futures fonctionnalites (likes, profils)
5. **Code quality** — Activer strict mode, normaliser le nommage, nettoyer le code mort
6. **Infra** — Configurer un vrai mailer, ajouter du logging, rate limiting
