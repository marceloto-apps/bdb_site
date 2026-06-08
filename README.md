# Big Data Bet (BDB) — Plataforma

Este repositório contém a plataforma web da **Big Data Bet (BDB)**, desenvolvida com Next.js, TypeScript, TailwindCSS, Prisma ORM e MySQL.

---

## 🛠️ Tecnologias e Dependências Principais

- **Core**: Next.js 14 (App Router) + React 18
- **Idioma/Estilos**: TypeScript strict + TailwindCSS + shadcn/ui
- **Banco de Dados**: Prisma ORM + MySQL (Produção Hostgator / Testes Docker)
- **Autenticação**: Auth.js (NextAuth v5)
- **Email**: Brevo API
- **Analytics/Telemetria**: PostHog

---

## 🚀 Como Executar o Projeto Localmente

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente**:
   Crie um arquivo `.env.local` na raiz e preencha as credenciais correspondentes (veja `.env.example` como guia).

3. **Gerar o Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Rodar o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🧪 Ambiente de Testes (Isolado via Docker)

Para evitar qualquer escrita ou alteração indesejada no banco de dados de produção (Hostgator), a suíte de testes locais roda obrigatoriamente em um container Docker isolado.

### ⚠️ Trava de Segurança
O arquivo `vitest.setup.ts` possui uma trava de segurança atômica que aborta os testes imediatamente se a `DATABASE_URL` não apontar estritamente para o host local e banco de testes (`127.0.0.1:3307/bdb_test`).

### Como rodar os testes:

1. **Iniciar o container MySQL local**:
   Certifique-se de que o Docker Desktop está ativo na sua máquina e execute:
   ```bash
   npm run test:db:up
   ```
   *Isso subirá um container chamado `bdb-test-mysql` mapeado na porta `3307`.*

2. **Executar as migrations no banco de testes vazio**:
   ```powershell
   $env:DATABASE_URL="mysql://root:testpwd@127.0.0.1:3307/bdb_test"; npx prisma migrate deploy
   ```

3. **Executar a suíte de testes**:
   - Para rodar **todos os testes** (incluindo os testes de integração do banco de dados):
     ```bash
     npm run test
     ```
   - Para rodar **apenas os testes unitários** (sem depender do container ativo):
     ```bash
     npx vitest run --exclude tests/points/domain.test.ts --exclude tests/api/previsao-route.test.ts
     ```

4. **Derrubar e remover o container**:
   ```bash
   npm run test:db:down
   ```

---

## 📂 Estrutura de Diretórios Recentes (Onda A)

- `lib/points/`: Camada de domínio do sistema de pontos (saldo event-sourced, status de fidelidade, controle FIFO e expiração).
- `lib/courses/`: Controle e server actions da estrutura de cursos.
- `app/api/points/`: Endpoints de balance, histórico, rewards e resgate.
- `app/(dashboard)/dashboard/bdb-points/`: Área do usuário para gamificação.
- `app/(cms)/cms/admin/points/` & `/courses/`: Painel CMS do administrador.
- `scripts/_local/`: Diretório ignorado pelo git contendo scripts locais de auditoria e limpeza.
