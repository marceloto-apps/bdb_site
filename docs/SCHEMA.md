# SCHEMA

# SCHEMA.md — Big Data Bet

> **Versão:** 1.0 | **Atualizado:** 24/04/2026
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
| Fase 2 | `ToolUsage` — controle de uso das ferramentas por usuário |
| Fase 3 | `Plan`, `Subscription`, `Backtest`, `BacktestResult` |
| Fase 4 | `Course`, `Lesson`, `LessonProgress` |
| Fase 5 | `MatchData`, `Job`, índices de performance em tabelas históricas |

---

> **Regra para evoluções:** Nenhum modelo novo adicionado sem PRD da fase correspondente aprovado. Migrations sempre versionadas e nunca revertidas em produção sem backup confirmado.
>