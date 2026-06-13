# SCHEMA

# SCHEMA.md — Big Data Bet

> **Versão:** 2.2 | **Atualizado:** 03/05/2026
**Banco:** MySQL (Hostgator) | **ORM:** Prisma
**Regra:** Nunca usar SQL raw, exceto em casos de performance crítica documentados aqui.
> 

---

## Visão Geral

```
User ──────────────< Account         (OAuth NextAuth)
User ──────────────< Session         (sessões ativas)
User ──────────────< Article         (como autor)
User ──────────────< ArticleRevision (como editor/revisor)
User ──────────────< Favorite        (artigos favoritados)
User ──────────────< ReadHistory     (histórico de leitura)
User ──────────────< MatchImport     (auditoria de imports/syncs)

Article ───────────< ArticleRevision
Article ───────────< ArticleTag >─── Tag
Article >──────────  Category
Article ───────────< Favorite
Article ───────────< ReadHistory
```

---

## Enums

```
enum Role {
  ADMIN    // acesso total
  EDITOR   // publica artigos, gerencia CMS
  REVISOR  // revisa artigos, devolve ou aprova
  AUTOR    // cria e edita seus próprios artigos
  MEMBRO   // usuário comum, acesso à área logada
}

enum ArticleStatus {
  RASCUNHO   // criado pelo autor, ainda não enviado
  REVISAO    // enviado para revisão
  PUBLICADO  // visível no site
}

enum ArticleType {
  ESTUDO   // Exibido em /artigos (com filtro)
  ANALISE  // Exibido em /artigos (com filtro)
}
```

---

## Modelos

---

### `User`

Usuário da plataforma. Cobre todos os roles: membros, autores, revisores, editores e admins.

```
model User {
  id              String    @id @default(cuid())
  name            String?
  email           String    @unique
  emailVerified   DateTime?
  image           String?                    // avatar (URL ou upload)
  password        String?                    // null se autenticação OAuth
  role            Role      @default(MEMBRO)
  newsletterOptIn Boolean   @default(false)  // opt-in LGPD
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relações
  accounts        Account[]
  sessions        Session[]
  articles        Article[]         @relation("AutorArticles")
  revisions       ArticleRevision[]
  favorites       Favorite[]
  readHistory     ReadHistory[]
  matchImports    MatchImport[]   // Fase 2 — auditoria de imports
  legacyAccess    LegacyAccess?   // Fase 4 — flag de assinante vitalício Hubla
}
```

**Índices implícitos:** `email` (unique)

**Regras de negócio:**

- Todo cadastro nasce com `role: MEMBRO`
- `password` é armazenado com hash bcrypt (nunca plain text)
- `newsletterOptIn` deve ser registrado no momento do cadastro (checkbox explícito)
- `image` aceita URL externa (Google OAuth) ou path de upload interno

---

### `Account`

Contas OAuth vinculadas ao usuário. Modelo padrão NextAuth v5.

```
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String                   // ex: "google"
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  // Relações
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}
```

**Regras de negócio:**

- Um `User` pode ter múltiplas contas OAuth (Google + futuras)
- Cascade delete: se o usuário for removido, as contas OAuth são removidas junto

---

### `Session`

Sessões ativas. Modelo padrão NextAuth v5.

```
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  // Relações
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

### `VerificationToken`

Tokens de verificação de email. Modelo padrão NextAuth v5.

```
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

---

### `Article`

Conteúdo principal da plataforma. Cobre estudos e análises.

```
model Article {
  id          String        @id @default(cuid())
  title       String
  slug        String        @unique
  excerpt     String?       @db.Text       // resumo para listagem e SEO
  content     String        @db.LongText   // Markdown
  thumbnail   String?                      // URL da imagem de capa
  type        ArticleType                  // ESTUDO | ANALISE
  status      ArticleStatus @default(RASCUNHO)
  authorId    String
  categoryId  String?
  publishedAt DateTime?                    // preenchido ao publicar
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  // Relações
  author      User          @relation("AutorArticles", fields: [authorId], references: [id])
  category    Category?     @relation(fields: [categoryId], references: [id])
  tags        ArticleTag[]
  revisions   ArticleRevision[]
  favorites   Favorite[]
  readHistory ReadHistory[]
}
```

**Índices implícitos:** `slug` (unique)

**Índices recomendados para queries frequentes:**

```
@@index([status, type])      // listagens filtradas por status e tipo
@@index([authorId])          // artigos por autor (CMS)
@@index([categoryId])        // artigos por categoria
@@index([publishedAt])       // ordenação por data de publicação
```

**Regras de negócio:**

- `slug` é gerado automaticamente a partir do `title` e validado como único antes de salvar
- `publishedAt` é preenchido automaticamente quando `status` muda para `PUBLICADO`
- `publishedAt` é zerado (`null`) se o artigo for despublicado
- Apenas artigos com `status: PUBLICADO` aparecem nas páginas públicas
- `content` armazena Markdown puro; a renderização acontece no frontend
- `excerpt` é usado em listagens e como `description` no Open Graph

---

### `Category`

Categorias de artigos. Gerenciadas por EDITOR/ADMIN.

```
model Category {
  id        String    @id @default(cuid())
  name      String
  slug      String    @unique
  createdAt DateTime  @default(now())

  // Relações
  articles  Article[]
}
```

**Regras de negócio:**

- Um artigo pertence a no máximo uma categoria
- Categoria não pode ser deletada se houver artigos vinculados (restrição via Prisma)

---

### `Tag`

Tags livres para classificação cruzada de artigos.

```
model Tag {
  id        String       @id @default(cuid())
  name      String
  slug      String       @unique
  createdAt DateTime     @default(now())

  // Relações
  articles  ArticleTag[]
}
```

**Regras de negócio:**

- Um artigo pode ter múltiplas tags (N:N via `ArticleTag`)
- Tags são criadas on-the-fly no editor do CMS se não existirem

---

### `ArticleTag`

Tabela de junção N:N entre `Article` e `Tag`.

```
model ArticleTag {
  articleId String
  tagId     String

  // Relações
  article   Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([articleId, tagId])
}
```

---

### `ArticleRevision`

Histórico de cada mudança de status no CMS. Rastreabilidade completa do workflow.

```
model ArticleRevision {
  id         String        @id @default(cuid())
  articleId  String
  editorId   String                        // quem fez a ação
  fromStatus ArticleStatus                 // status anterior
  toStatus   ArticleStatus                 // novo status
  note       String?       @db.Text        // comentário (obrigatório ao devolver)
  createdAt  DateTime      @default(now())

  // Relações
  article    Article       @relation(fields: [articleId], references: [id], onDelete: Cascade)
  editor     User          @relation(fields: [editorId], references: [id])
}
```

**Índices recomendados:**

```
@@index([articleId])   // buscar histórico de um artigo
@@index([editorId])    // ações por usuário
```

**Regras de negócio:**

- Registrado automaticamente a cada mudança de status (nunca manual)
- `note` é obrigatório quando `toStatus: RASCUNHO` (devolução com comentário)
- Registros são imutáveis — nunca atualizar, apenas inserir

---

### `Favorite`

Artigos salvos pelo usuário.

```
model Favorite {
  id        String   @id @default(cuid())
  userId    String
  articleId String
  createdAt DateTime @default(now())

  // Relações
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  article   Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([userId, articleId])   // um usuário não pode favoritar o mesmo artigo duas vezes
}
```

---

### `ReadHistory`

Histórico de leitura do usuário.

```
model ReadHistory {
  id        String   @id @default(cuid())
  userId    String
  articleId String
  readAt    DateTime @default(now())

  // Relações
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  article   Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([userId, articleId])   // upsert: atualiza readAt se já leu antes
}
```

**Regras de negócio:**

- Registrado via `upsert` — se o usuário reler o mesmo artigo, atualiza `readAt`
- Dashboard exibe últimos 30 registros ordenados por `readAt DESC`

---

## Mapa de Permissões por Modelo

| Operação | MEMBRO | AUTOR | REVISOR | EDITOR | ADMIN |
| --- | --- | --- | --- | --- | --- |
| Ler artigos publicados | ✅ | ✅ | ✅ | ✅ | ✅ |
| Criar artigo | ❌ | ✅ | ✅ | ✅ | ✅ |
| Editar próprio artigo | ❌ | ✅ | ✅ | ✅ | ✅ |
| Editar artigo alheio | ❌ | ❌ | ❌ | ✅ | ✅ |
| Enviar para revisão | ❌ | ✅ | ✅ | ✅ | ✅ |
| Aprovar / Devolver | ❌ | ❌ | ✅ | ✅ | ✅ |
| Publicar | ❌ | ❌ | ❌ | ✅ | ✅ |
| Despublicar | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gerenciar categorias/tags | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gerenciar usuários | ❌ | ❌ | ❌ | ❌ | ✅ |
| Favoritar / Histórico | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Seed Inicial

```tsx
// prisma/seed.ts

// Categorias padrão
const categorias = [
  { name: 'Estatística',      slug: 'estatistica' },
  { name: 'Mercados',         slug: 'mercados' },
  { name: 'Futebol',          slug: 'futebol' },
  { name: 'Metodologia',      slug: 'metodologia' },
  { name: 'Análise de Dados', slug: 'analise-de-dados' },
]

// Usuário admin inicial
const admin = {
  name:  'Admin BDB',
  email: 'admin@bigdatabet.com.br',
  role:  'ADMIN',
  // senha definida via variável de ambiente SEED_ADMIN_PASSWORD
}
```

---

## Evoluções Previstas por Fase

| Fase | Modelos novos |
| --- | --- |
| Fase 2 | Competition, Season, Team (expandido), Match, MatchStats, MatchOdds, PlayerMatchStats, Shot, TeamAlias, TeamSeason, Bookmaker, Market, Player, MatchImport, ApiQuotaLog |
| Fase 3 | (sem modelos novos — ferramentas client-side) |
| Fase 4 | LegacyAccess, Plan, Subscription, StripeWebhookEvent |
| Fase 5 | Backtest, BacktestResult, Course, Lesson, LessonProgress |
| Fase 6 | Job, índices de performance em tabelas históricas |

---

> **Regra para evoluções:** Nenhum modelo novo adicionado sem PRD da fase correspondente aprovado. Migrations sempre versionadas e nunca revertidas em produção sem backup confirmado.
>

---

## Modelos da Fase 2 (Schema Normalizado)

### Enums

```prisma
enum CompetitionTier {
  FREE      // Brasileirão A (MVP)
  VIP       // demais 25+ ligas
}

enum MatchStatus {
  SCHEDULED
  LIVE
  IN_PLAY
  PAUSED
  FINISHED
  POSTPONED
  SUSPENDED
  CANCELED
}

enum MatchResult {
  H   // Home win
  D   // Draw
  A   // Away win
}

enum DataSource {
  THESTATSAPI     // dados ingeridos via API
  FOOTBALL_DATA   // dados importados via CSV football-data.co.uk
  MANUAL          // dados inseridos manualmente
}

enum OddsType {
  PREMATCH_OPENING
  PREMATCH_CLOSING
  LIVE
}

enum PlayerPosition {
  FORWARD
  MIDFIELDER
  DEFENDER
  GOALKEEPER
}

enum ShotResult {
  GOAL
  SAVED
  POST
  MISSED
  BLOCKED
}

enum ShotSituation {
  OPEN_PLAY
  SET_PIECE
  CORNER
  FREE_KICK
  PENALTY
}

enum ShotBodyPart {
  RIGHT_FOOT
  LEFT_FOOT
  HEAD
  OTHER
}
```

### `Competition` & `Season`

```prisma
model Competition {
  id         String          @id @default(cuid())
  externalId String          @unique // ex: "comp_4795"
  name       String
  country    String?
  slug       String          @unique
  tier       CompetitionTier @default(FREE)
  active     Boolean         @default(true)
  logoUrl    String?
  createdAt  DateTime        @default(now())
  updatedAt  DateTime        @updatedAt

  seasons    Season[]
  imports    MatchImport[]

  @@index([country])
}

model Season {
  id            String   @id @default(cuid())
  competitionId String
  externalId    String   @unique // ex: "season_2026_4795"
  year          String   // ex: "2026", "2026/2027"
  startDate     DateTime?
  endDate       DateTime?
  isCurrent     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  competition   Competition  @relation(fields: [competitionId], references: [id], onDelete: Cascade)
  matches       Match[]
  teamSeasons   TeamSeason[]

  @@unique([competitionId, year])
}
```

### `Team`, `TeamAlias` & `TeamSeason`

```prisma
model Team {
  id              String       @id @default(cuid())
  externalId      String       @unique
  name            String
  shortName       String?
  country         String?
  stadiumName     String?
  stadiumCity     String?
  stadiumCapacity Int?
  logoUrl         String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  aliases         TeamAlias[]
  teamSeasons     TeamSeason[]
  homeMatches     Match[]      @relation("HomeTeam")
  awayMatches     Match[]      @relation("AwayTeam")

  @@index([country])
}

model TeamAlias {
  id        String   @id @default(cuid())
  teamId    String
  alias     String   @unique
  createdAt DateTime @default(now())

  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
}

model TeamSeason {
  id        String   @id @default(cuid())
  teamId    String
  seasonId  String
  createdAt DateTime @default(now())

  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  season    Season   @relation(fields: [seasonId], references: [id], onDelete: Cascade)

  @@unique([teamId, seasonId])
}
```

### `Match`, `MatchStats` & `MatchOdds`

```prisma
model Match {
  id              String       @id @default(cuid())
  externalId      String       @unique // ID da TheStatsAPI
  seasonId        String
  homeTeamId      String
  awayTeamId      String
  round           Int?
  status          MatchStatus  @default(SCHEDULED)
  utcDate         DateTime
  fthg            Int?
  ftag            Int?
  ftr             MatchResult?

  venueName       String?
  venueCity       String?
  refereeName     String?

  xgAvailable     Boolean      @default(false)
  oddsAvailable   Boolean      @default(false)

  dataSource      DataSource   @default(THESTATSAPI)
  sourceFile      String?
  syncedAt        DateTime?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  season          Season       @relation(fields: [seasonId], references: [id], onDelete: Cascade)
  homeTeam        Team         @relation("HomeTeam", fields: [homeTeamId], references: [id])
  awayTeam        Team         @relation("AwayTeam", fields: [awayTeamId], references: [id])
  
  stats           MatchStats?
  odds            MatchOdds[]
  playerStats     PlayerMatchStats[]
  shots           Shot[]

  @@index([seasonId, utcDate])
  @@index([homeTeamId])
  @@index([awayTeamId])
  @@index([utcDate])
  @@index([dataSource])
}

model MatchStats {
  id                  String   @id @default(cuid())
  matchId             String   @unique

  homeXg              Float?
  awayXg              Float?
  
  homePossession      Float?
  awayPossession      Float?
  
  homeShotsTotal      Int?
  awayShotsTotal      Int?
  homeShotsOnTarget   Int?
  awayShotsOnTarget   Int?
  homeShotsOffTarget  Int?
  awayShotsOffTarget  Int?
  homeShotsBlocked    Int?
  awayShotsBlocked    Int?

  homeCorners         Int?
  awayCorners         Int?
  homeCrosses         Int?
  awayCrosses         Int?
  homeDribbles        Int?
  awayDribbles        Int?

  homePassesTotal     Int?
  awayPassesTotal     Int?
  homePassesAccurate  Int?
  awayPassesAccurate  Int?

  homeDuelsTotal      Int?
  awayDuelsTotal      Int?
  homeDuelsWon        Int?
  awayDuelsWon        Int?

  homeClearances      Int?
  awayClearances      Int?
  homeInterceptions   Int?
  awayInterceptions   Int?
  homeTackles         Int?
  awayTackles         Int?

  homeSaves           Int?
  awaySaves           Int?

  homeFouls           Int?
  awayFouls           Int?
  homeYellowCards     Int?
  awayYellowCards     Int?
  homeRedCards        Int?
  awayRedCards        Int?
  homeOffsides        Int?
  awayOffsides        Int?

  syncedAt            DateTime?
  createdAt           DateTime @default(now())

  match               Match  @relation(fields: [matchId], references: [id], onDelete: Cascade)
}

model Bookmaker {
  id        String  @id @default(cuid())
  name      String  @unique
  slug      String  @unique
  isSharp   Boolean @default(false)
  active    Boolean @default(true)

  odds      MatchOdds[]
}

model Market {
  id        String  @id @default(cuid())
  key       String  @unique
  name      String
  category  String

  odds      MatchOdds[]
}

model MatchOdds {
  id            String    @id @default(cuid())
  matchId       String
  bookmakerId   String
  marketId      String
  selection     String
  line          Float?
  oddsType      OddsType  @default(PREMATCH_CLOSING)
  odds          Float

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  match         Match     @relation(fields: [matchId], references: [id], onDelete: Cascade)
  bookmaker     Bookmaker @relation(fields: [bookmakerId], references: [id], onDelete: Cascade)
  market        Market    @relation(fields: [marketId], references: [id], onDelete: Cascade)

  @@unique([matchId, bookmakerId, marketId, selection, line, oddsType], name: "match_odd_unique")
  @@index([matchId])
  @@index([bookmakerId])
  @@index([marketId])
  @@index([matchId, bookmakerId])
  @@index([matchId, marketId])
}
```

### `Player`, `PlayerMatchStats` & `Shot`

```prisma
model Player {
  id            String          @id @default(cuid())
  externalId    String          @unique
  name          String
  firstName     String?
  lastName      String?
  position      PlayerPosition?
  dateOfBirth   String?
  age           Int?
  nationality   String?
  heightCm      Int?
  currentTeamId String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  matchStats      PlayerMatchStats[]
  shots           Shot[]

  @@index([currentTeamId])
  @@index([nationality])
  @@index([position])
}

model PlayerMatchStats {
  id                  String   @id @default(cuid())
  matchId             String
  teamId              String
  playerId            String

  rating              Float?
  minutesPlayed       Int?
  started             Boolean  @default(false)
  played              Boolean  @default(false)

  // ── PASSING ──
  passesTotal         Int?
  passesAccurate      Int?
  keyPasses           Int?
  assists             Int?
  crossesTotal        Int?
  crossesAccurate     Int?
  longBallsTotal      Int?
  longBallsAccurate   Int?

  // ── SHOOTING ──
  shotsTotal          Int?
  shotsOnTarget       Int?
  shotsOffTarget      Int?
  shotsBlocked        Int?
  goals               Int?
  expectedGoals       Float?
  expectedAssists     Float?
  npExpectedGoals     Float?
  bigChancesCreated   Int?

  // ── DUELS ──
  duelsTotal          Int?
  duelsWon            Int?
  aerialsWon          Int?
  challengesLost      Int?
  dispossessed        Int?
  dribblesAttempted   Int?
  dribblesSucceeded   Int?

  // ── DEFENDING ──
  tackles             Int?
  interceptions       Int?
  clearances          Int?

  // ── GOALKEEPING ──
  saves               Int?

  // ── GENERAL ──
  touches             Int?
  offsides            Int?
  possessionLost      Int?
  foulsDrawn          Int?
  foulsCommitted      Int?
  yellowCards         Int?
  redCards            Int?

  createdAt           DateTime @default(now())

  match               Match   @relation(fields: [matchId], references: [id], onDelete: Cascade)
  team                Team     @relation(fields: [teamId], references: [id])
  player              Player   @relation(fields: [playerId], references: [id])

  @@unique([matchId, playerId])
  @@index([matchId])
  @@index([playerId])
  @@index([teamId])
}

model Shot {
  id                String         @id @default(cuid())
  externalId        String         @unique
  matchId           String
  teamId            String
  playerId          String

  x                 Float
  y                 Float
  minute            Int
  result            ShotResult
  expectedGoals     Float?
  situation         ShotSituation?
  bodyPart          ShotBodyPart?

  isGoal            Boolean        @default(false)
  isOnTarget        Boolean        @default(false)
  isHeaded          Boolean        @default(false)
  isOutsideBox      Boolean        @default(false)
  isPenalty         Boolean        @default(false)
  
  goalMouthLocation String?

  createdAt         DateTime       @default(now())

  match             Match   @relation(fields: [matchId], references: [id], onDelete: Cascade)
  player            Player  @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@index([matchId])
  @@index([playerId])
  @@index([teamId])
}
```

### `MatchImport`

Auditoria de importações de CSV pelo admin.

```prisma
model MatchImport {
  id            String   @id @default(cuid())
  competitionId String
  importedById  String
  fileName      String
  rowsProcessed Int
  rowsCreated   Int
  rowsUpdated   Int
  rowsSkipped   Int
  notes         String?  @db.Text
  createdAt     DateTime @default(now())

  competition  Competition @relation(fields: [competitionId], references: [id], onDelete: Cascade)
  importedBy   User   @relation(fields: [importedById], references: [id])

  @@index([competitionId])
  @@index([importedById])
}
```

**Regras de negócio:**
- Registro imutável (auditoria)
- Apenas usuários com role ADMIN podem disparar importação
- `rowsProcessed = created + updated + skipped`

---

### `ApiQuotaLog`

Controle de consumo da quota mensal da TheStatsAPI.

```prisma
model ApiQuotaLog {
  id           String   @id @default(cuid())
  endpoint     String   // ex: "/matches", "/matches/{id}/odds"
  competitionId String? // ex: "comp_4795"
  requestCount Int      @default(1)
  responseStatus Int?   // HTTP status code
  month        String   // "2026-05" — partition por mês
  createdAt    DateTime @default(now())

  @@index([month])
  @@index([endpoint, month])
}
```

**Regras de negócio:**
- Registro imutável (auditoria de consumo)
- `month` formatado como "YYYY-MM" para facilitar agregação
- Dashboard admin exibe: total do mês / 100.000 limite
- Se quota atingir 90% (90.000), exibir alerta no admin
- Se quota atingir 100%, bloquear novas chamadas à API (usar apenas banco)

---

## Modelos de Cursos e BDB Points — Onda A

### Cursos

#### `Course`
Estrutura dos cursos da plataforma (metadados).
```prisma
model Course {
  id               String           @id @default(cuid())
  slug             String           @unique
  title            String
  description      String?          @db.Text
  coverUrl         String?
  access           CourseAccess
  priceCents       Int?
  pointsUnlockCost Int?
  published        Boolean          @default(false)
  order            Int              @default(0)
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  modules          Module[]

  @@index([published])
}
```

#### `Module`
Módulos do curso.
```prisma
model Module {
  id       String   @id @default(cuid())
  courseId String
  title    String
  order    Int      @default(0)
  course   Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons  Lesson[]

  @@index([courseId])
}
```

#### `Lesson`
Aulas de cada módulo.
```prisma
model Lesson {
  id             String           @id @default(cuid())
  moduleId       String
  title          String
  order          Int              @default(0)
  videoUrl       String?
  contentHtml    String?          @db.Text
  durationSec    Int?
  module         Module           @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  progress       LessonProgress[]
  quiz           Quiz?

  @@index([moduleId])
}
```

#### `LessonProgress`
Progresso de aula por usuário.
```prisma
model LessonProgress {
  id          String    @id @default(cuid())
  userId      String
  lessonId    String
  watchedPct  Double    @default(0)
  completed   Boolean   @default(false)
  completedAt DateTime?
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson      Lesson    @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@unique([userId, lessonId])
}
```

#### `Quiz`
Quiz associado a uma aula.
```prisma
model Quiz {
  id          String        @id @default(cuid())
  lessonId    String        @unique
  passScore   Int           @default(70)
  questions   Json
  lesson      Lesson        @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  attempts    QuizAttempt[]
}
```

#### `QuizAttempt`
Tentativa de quiz por usuário.
```prisma
model QuizAttempt {
  id        String   @id @default(cuid())
  userId    String
  quizId    String
  score     Int
  passed    Boolean
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  quiz      Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)

  @@index([userId, quizId])
}
```

### BDB Points

#### `PointRule`
Regras de concessão de pontos por ações na plataforma.
```prisma
model PointRule {
  id          String   @id @default(cuid())
  action      String   @unique
  label       String
  points      Int
  dailyCap    Int?
  monthlyCap  Int?
  countsToCap Boolean  @default(true)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### `PointTransaction`
Transações de pontos do usuário (Event Sourcing puro).
```prisma
model PointTransaction {
  id             String      @id @default(cuid())
  userId         String
  type           PointTxType
  amount         Int
  reason         String
  refType        String?
  refId          String?
  expiresAt      DateTime?
  reverted       Boolean     @default(false)
  idempotencyKey String?     @unique
  createdAt      DateTime    @default(now())
  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@index([userId, type])
}
```

#### `Coupon`
Cupons gerados a partir do resgate de recompensas.
```prisma
model Coupon {
  id             String    @id @default(cuid())
  code           String    @unique
  userId         String
  discountPct    Int
  appliesTo      String
  pointsCost     Int
  expiresAt      DateTime
  usedAt         DateTime?
  stripeCouponId String?
  createdAt      DateTime  @default(now())
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

#### `RewardOption`
Catálogo de opções de recompensa para troca por pontos.
```prisma
model RewardOption {
  id                 String  @id @default(cuid())
  label              String
  pointsCost         Int
  discountPct        Int
  appliesTo          String
  couponValidityDays Int     @default(15)
  active             Boolean @default(true)
  order              Int     @default(0)
}
```

### Modelos do Bolão (Copa 2026)

Modelos adicionados para a feature de Bolão da Copa do Mundo 2026, integrando com as tabelas de partidas (`Match`) e usuários (`User`).

#### Enums

```prisma
enum BolaoStatus {
  ABERTO
  ENCERRADO
}

enum PalpiteOverUnder {
  OVER   // mais de 2.5 gols
  UNDER  // menos de 2.5 gols
}
```

#### `Bolao`
Representa um bolão ativo ou encerrado para uma competição e temporada específica.
```prisma
model Bolao {
  id            String         @id @default(uuid())
  nome          String
  competitionId String         // ex: comp_6107
  seasonId      String         // ex: sn_118868
  status        BolaoStatus    @default(ABERTO)
  premiacao     Json?
  palpites      BolaoPalpite[]
  scores        BolaoScore[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@map("boloes")
}
```

#### `BolaoPalpite`
Armazena os palpites individuais dos usuários para cada partida do bolão.
```prisma
model BolaoPalpite {
  id               String           @id @default(uuid())
  bolaoId          String
  userId           String
  matchId          String           // FK -> tabela matches existente

  golsMandante     Int
  golsVisitante    Int
  palpiteOverUnder PalpiteOverUnder // manual, independente do placar

  pontos           Int              @default(0)
  acertouPlacar    Boolean          @default(false)
  acertouResultado Boolean          @default(false)
  acertouOverUnder Boolean          @default(false)
  avaliado         Boolean          @default(false)

  lockedAt         DateTime         // utc_date - 1h, congelado na criação
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  bolao            Bolao            @relation(fields: [bolaoId], references: [id], onDelete: Cascade)
  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  match            Match            @relation(fields: [matchId], references: [id], onDelete: Cascade)

  @@unique([bolaoId, userId, matchId])
  @@index([matchId])
  @@index([bolaoId, userId])
  @@map("bolao_palpites")
}
```

#### `BolaoScore`
Consolida a pontuação total e estatísticas de acerto de cada usuário por bolão.
```prisma
model BolaoScore {
  id                 String   @id @default(uuid())
  bolaoId            String
  userId             String
  pontosTotal        Float    @default(0) // Mudado para Float para média simples
  quantidadePalpites Int      @default(0) // Quantidade de palpites avaliados
  acertosPlacar      Int      @default(0)
  acertosResultado   Int      @default(0)
  acertosOverUnder   Int      @default(0)
  updatedAt          DateTime @updatedAt

  bolao            Bolao    @relation(fields: [bolaoId], references: [id], onDelete: Cascade)
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([bolaoId, userId])
  @@index([bolaoId, pontosTotal, quantidadePalpites, acertosPlacar, acertosResultado])
  @@map("bolao_scores")
}
```

### Regras Críticas e Decisões de Design (Onda A)
1. **User.plan é Cache/Fallback:** O campo `User.plan` funciona nesta fase apenas como um cache e fallback para determinar o cap mensal de pontos por plano. Na Onda B, a fonte de verdade para assinaturas passará a ser o modelo `Subscription`.
2. **Convenção de Sinal do Amount:** 
   - `GANHO` e `AJUSTE` positivo gravam `amount > 0`.
   - `RESGATE`, `EXPIRACAO`, `ESTORNO` e `AJUSTE` negativo gravam `amount < 0`.
   - O saldo do usuário é obtido através de `SUM(amount)` de todas as transações ativas, de forma direta e sem ramificação.
3. **reverted é Apenas Auditoria:** O campo `reverted` serve exclusivamente para auditoria. Ele **NÃO** entra nos cálculos de saldo ou status. A neutralização de transações passadas ocorre puramente pelo lançamento de uma nova transação do tipo `ESTORNO` com valor negativo correspondente.
4. **Critérios Divergentes:**
   - **Saldo:** Soma de todas as transações do usuário onde `expiresAt IS NULL OR expiresAt > now()`.
   - **Status:** Soma apenas de transações do tipo `GANHO` onde `createdAt >= now() - 12 meses`.
5. **Garantia de Idempotência:** Controlada no banco através do campo `idempotencyKey` único e tratamento de erro de violação de restrição única `P2002` no Prisma, impedindo duplicidades.