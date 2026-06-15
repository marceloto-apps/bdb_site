# Deploy Checklist

---

## 🟢 Fase 4 — Multi-Liga + Pagamentos

### Pré-deploy

#### Variáveis de ambiente (Vercel)
- [ ] `STRIPE_SECRET_KEY` configurada
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` configurada
- [ ] `STRIPE_WEBHOOK_SECRET` configurada (gerada no Stripe CLI localmente para testes ou painel do Stripe para prod)
- [ ] `NEXT_PUBLIC_STRIPE_PRICE_VIP_BASICO` configurada com o Price ID do plano Básico
- [ ] `NEXT_PUBLIC_STRIPE_PRICE_VIP_PRO` configurada com o Price ID do plano Pro

#### Banco de dados
- [ ] Realizar backup completo do banco de dados de produção do MySQL Hostgator (responsabilidade do Marcelo antes de rodar comandos DDL)
- [ ] Rodar `npx prisma migrate deploy` para criar as novas tabelas e colunas (rodará automaticamente via script postinstall/build na Vercel se configurado)

#### Verificações locais
- [ ] `npx tsc --noEmit` compilando sem qualquer erro
- [ ] `npm run test` com todas as suítes (incluindo testes de integração) passando com sucesso
- [ ] `npm run build` completando localmente sem avisos ou falhas

---

### Deploy

#### Vercel
- [ ] Mesclar as alterações para a branch principal (`main`) para disparar a compilação automática na Vercel
- [ ] Validar nos logs de compilação da Vercel que o build terminou sem erros e o deploy foi concluído

#### Stripe Dashboard (Produção)
- [ ] Criar os produtos e preços para os planos Básico e Pro
- [ ] Adicionar o endpoint de webhook apontando para: `https://bigdatabet.com.br/api/webhook/stripe`
- [ ] Ativar os seguintes eventos no webhook:
  - `checkout.session.completed`
  - `customer.subscription.created` (opcional/segurança)
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- [ ] Copiar a Signing Secret gerada no dashboard e cadastrar como `STRIPE_WEBHOOK_SECRET` nas envs da Vercel (se ainda não feito)

---

### Pós-deploy

#### Importação de Legados
- [ ] Executar o script CLI no servidor ou localmente conectado ao banco de produção:
  `npx ts-node scripts/import-legacy.ts`
  Passando a lista ou inserindo os e-mails dos assinantes legados do Hubla fornecidos pelo Marcelo.
- [ ] Validar no phpMyAdmin/Prisma Studio que os registros foram criados na tabela `legacy_access`.

#### Validação Funcional
- [ ] Efetuar login com uma conta sem acesso VIP.
- [ ] Acessar `/dashboard/ligas` e verificar que apenas a liga Brasileirão Série A está liberada, enquanto as outras ligas exibem cadeados.
- [ ] Tentar acessar `/dashboard/ligas/la-liga` e verificar o redirecionamento automático para `/planos`.
- [ ] Acessar `/planos` e clicar no botão de assinar o plano VIP Básico.
- [ ] Verificar redirecionamento ao Stripe Checkout e simular um pagamento com sucesso (usando dados de teste do Stripe ou chave de produção).
- [ ] Após o retorno para `/dashboard/plano`, verificar se o status atual da assinatura é exibido como "Ativa" e o plano do usuário é VIP Básico.
- [ ] Verificar que as ligas VIP agora estão destrancadas no dashboard.
- [ ] Acessar o Stripe Customer Portal clicando no botão "Gerenciar Assinatura" e verificar se o redirecionamento é efetuado corretamente.
- [ ] Testar cancelamento de assinatura no Stripe e verificar se o status do plano do usuário no site retorna a `FREE` (rebaixamento).
- [ ] Para contas cujo e-mail consta na lista de legados vitalícios, verificar se ao acessar `/dashboard/plano` o badge "Acesso Vitalício" é exibido e as ligas VIP continuam liberadas mesmo se a assinatura do Stripe for cancelada.

---

## 🟢 Fase 2 — Dashboards de Liga

### Pré-deploy

### Variáveis de ambiente (Vercel)
- [ ] `API_FOOTBALL_KEY` configurada
- [ ] `DATABASE_URL` apontando para MySQL Hostgator (produção)
- [ ] Todas as variáveis da Fase 1 mantidas

### Banco de dados
- [ ] Rodar `npx prisma db push` contra o banco de produção
  - Confirmar que tabelas `api_quotas` e `sync_logs` foram criadas
  - Confirmar que coluna `syncLogs` no model `Season` está refletida
- [ ] Verificar que dados existentes não foram afetados (backup antes!)

### Verificações locais
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npm test` todos passando
- [ ] `npm run build` completa sem erros
- [ ] Testar fluxo completo no localhost com dados de seed

---

## Deploy

### Vercel
- [ ] Push para branch `main` (ou branch de deploy)
- [ ] Verificar build logs na Vercel — sem erros
- [ ] Verificar que as novas rotas respondem:
  - [ ] GET `/api/ligas/brasileirao-serie-a/info` → 200 (ou 401 se não logado)
  - [ ] GET `/dashboard/ligas` → renderiza página
  - [ ] GET `/dashboard/ligas/brasileirao-serie-a` → renderiza página

---

## Pós-deploy

### Dados iniciais
- [ ] Login como ADMIN no site de produção
- [ ] Acessar `/dashboard/admin/sync`
- [ ] Selecionar temporada do Brasileirão 2026
- [ ] Clicar "Sincronizar Partidas" — aguardar conclusão
- [ ] Verificar resultado (X jogos criados, 0 erros)
- [ ] Clicar "Sincronizar Odds" (10 por vez) — repetir conforme quota
- [ ] Verificar quota em `/dashboard/admin/quota`

### Validação funcional
- [ ] Acessar `/dashboard/ligas` como usuário comum
- [ ] Verificar que Brasileirão aparece como card FREE
- [ ] Clicar no card → dashboard da liga carrega
- [ ] Selecionar 2 times quaisquer
- [ ] Clicar "Calcular Previsão"
- [ ] Verificar que os 5 painéis renderizam corretamente:
  - [ ] Médias e forças exibem valores numéricos coerentes
  - [ ] Matriz 11×11 com heatmap visível
  - [ ] Mercados com probabilidades que somam ~100%
  - [ ] Gráfico de evolução com linhas dos 2 times
  - [ ] Mapa de valor com tabs funcionais (se odds disponíveis)
- [ ] Trocar modelo → recalcula automaticamente
- [ ] Ajustar filtros → indicador "Filtros alterados" aparece
- [ ] Testar em mobile (375px) — layout responsivo
- [ ] Testar em desktop (1440px) — grid de colunas

### Verificações de segurança
- [ ] Usuário não-logado não acessa `/dashboard/ligas`
- [ ] Usuário MEMBRO não acessa `/dashboard/admin/sync`
- [ ] API `/api/admin/*` retorna 403 para não-admin
- [ ] Slug inválido retorna 404 (não erro 500)

### Performance
- [ ] Primeira carga da página da liga: < 3s
- [ ] Cálculo de previsão (click → resultado): < 2s
- [ ] Sem erros no console do browser
- [ ] Sem warnings de hidratação (SSR/CSR mismatch)

### Monitoramento
- [ ] Verificar PostHog recebendo eventos das novas páginas
- [ ] Verificar que errors são logados (Vercel logs)

---

## Rollback

Se algo der errado:
1. Reverter deploy na Vercel (dashboard → deployments → promote previous)
2. As tabelas novas (`api_quotas`, `sync_logs`) podem ficar — não afetam Fase 1
3. As rotas novas simplesmente não serão acessadas se o frontend reverter

---

## Contatos
- Deploy: Vercel Dashboard
- Banco: Hostgator cPanel → phpMyAdmin
- API-Football: https://dashboard.api-football.com/
- Docs: `/docs/` no repositório
