# Runbook de Go-Live — Fase 4 (Stripe + Multi-Liga)

Sequência **ordenada e segura**. Não pule etapas: cada bloco depende do anterior. Os itens marcados com 🔴 são pontos sem retorno fácil (exigem backup/atenção).

---

## Pré-requisitos
- Acesso admin ao **painel Stripe** (modo Live)
- Acesso ao **Vercel** (projeto bigdatabet)
- Acesso ao **phpMyAdmin / SSH do Hostgator** (MySQL)
- Base de e-mails legados do Hubla em `.csv` ou `.json`
- Branch de produção mergeada e build passando no CI

---

## Etapa 1 — Stripe: produtos e Price IDs (modo Live)

> [!IMPORTANT]
> Confirme que o toggle do painel está em **Live**, não em **Test**. Os IDs são diferentes entre os modos.

1. **Produtos** → criar dois produtos:
   - `VIP Básico` → adicionar preço **recorrente mensal** → copiar o `price_...`
   - `VIP Pro` → adicionar preço **recorrente mensal** → copiar o `price_...`
2. Ativar o **Customer Billing Portal**:
   - Settings → Billing → Customer portal → **Activate**
   - Marcar permissões: cancelar assinatura, atualizar cartão, ver faturas
   - Definir os produtos elegíveis a upgrade/downgrade (Básico ↔ Pro)
3. Guardar os dois `price_...` para a Etapa 2.

---

## Etapa 2 — Webhook no Stripe (gera o secret de produção)

1. Developers → **Webhooks** → **Add endpoint**
2. URL: `https://bigdatabet.com.br/api/webhook/stripe`
3. Selecionar os eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Salvar → clicar no endpoint → **Reveal** no *Signing secret* → copiar o `whsec_...`

> [!WARNING]
> Esse `whsec_...` é **diferente** do gerado pelo `stripe listen` local. Usar o errado faz **todos** os eventos falharem com assinatura inválida.

---

## Etapa 3 — Variáveis de ambiente no Vercel

Settings → Environment Variables → adicionar nos escopos **Production** e **Preview**:

| Variável | Valor | Origem |
|----------|-------|--------|
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe → API keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Etapa 2 |
| `NEXT_PUBLIC_STRIPE_PRICE_VIP_BASICO` | `price_...` | Etapa 1 |
| `NEXT_PUBLIC_STRIPE_PRICE_VIP_PRO` | `price_...` | Etapa 1 |

> [!NOTE]
> Confira os nomes exatos lidos em `app/api/checkout/route.ts` e `lib/stripe.ts` antes de salvar — uma typo aqui só aparece em runtime. **Não** faça redeploy ainda (Etapa 5).

---

## Etapa 4 — 🔴 Backup do MySQL (Hostgator)

> [!CAUTION]
> Regra do projeto: **nunca** rodar migrate sem backup. Sem isso, não há rollback seguro.

**Via SSH:**
```bash
mysqldump -u SEU_USUARIO -p NOME_DO_BANCO > backup_pre_fase4_$(date +%Y%m%d_%H%M).sql
```

**Via phpMyAdmin:** selecionar o banco → aba **Exportar** → método *Personalizado* → formato SQL → salvar o arquivo.

Validar que o arquivo tem tamanho coerente (não 0 KB) antes de prosseguir.

---

## Etapa 5 — 🔴 Aplicar a migration em produção

Com a `DATABASE_URL` apontando para o MySQL Hostgator:

```bash
npx prisma migrate deploy
```

> [!IMPORTANT]
> Use `migrate deploy`, **nunca** `migrate dev` em produção — `dev` pode tentar resetar/gerar migrations e corromper o estado.

Verificar saída esperada:
```bash
Applying migration `XXXX_fase4_stripe_legacy`
✓ All migrations have been applied
```

Conferência rápida das 3 mudanças:
```sql
-- stripeCustomerId no User
DESCRIBE User;
-- novas tabelas
SHOW TABLES LIKE 'LegacyAccess';
SHOW TABLES LIKE 'StripeWebhookEvent';
```

---

## Etapa 6 — Deploy da aplicação

1. Disparar redeploy no Vercel (agora com env vars + schema já no banco).
2. Aguardar build verde (deve bater os mesmos 69 estáticos do CI).

---

## Etapa 7 — Importar legados do Hubla

```bash
npx tsx scripts/import-legacy.ts caminho/para/legados.csv
```

Validar no banco:
```sql
SELECT COUNT(*) FROM LegacyAccess;
```

> [!NOTE]
> Lembre que o **auto-linking** resolve quem ainda não tem conta: o vínculo por `userId` acontece no primeiro `hasVipAccess`. Por isso, importar por **e-mail** já é suficiente aqui.

---

## Etapa 8 — Smoke tests em produção (live de verdade)

> [!WARNING]
> Use um cartão real de baixo valor ou o seu próprio — em modo Live os cartões de teste `4242...` **não funcionam**.

| # | Teste | Esperado |
|---|-------|----------|
| 1 | Usuário Free vê `/dashboard/ligas` | Ligas VIP **trancadas** com cadeado |
| 2 | Free tenta abrir liga VIP por URL direta | Redirect para `/planos` |
| 3 | Checkout VIP Básico | Paga → volta logado → plano atualizado |
| 4 | Conferir Stripe → Webhooks | Evento `checkout.session.completed` **200** |
| 5 | `/dashboard/plano` | Plano correto + data de renovação |
| 6 | Billing Portal | Abre, mostra fatura, permite cancelar |
| 7 | Cancelar no portal | `subscription.deleted` → rebaixa p/ FREE |
| 8 | Login de legado do Hubla | Badge **VIP Vitalício** + acesso liberado |
| 9 | API liga VIP sem acesso (Free) | `403 Forbidden` |
| 10 | API `brasileirao-serie-a` (Free) | `200 OK` (exceção gratuita) |

---

## Etapa 9 — Monitoramento pós-go-live (primeiras 24h)
- **Stripe → Webhooks:** taxa de entrega deve ser ~100%. Qualquer `4xx/5xx` recorrente = secret ou runtime errado.
- **Vercel → Logs:** filtrar por `/api/webhook/stripe` e `/api/checkout`.
- **Posthog:** acompanhar funil `/planos` → checkout → sucesso.
- **MySQL:** conferir se `StripeWebhookEvent` está populando (idempotência activa).

---

## 🔙 Plano de rollback

| Problema | Ação |
|----------|------|
| App quebrada pós-deploy | Vercel → **Instant Rollback** para o deploy anterior |
| Migration corrompeu dados | Restaurar dump da Etapa 4: `mysql -u USER -p BANCO < backup_pre_fase4_*.sql` |
| Webhook falhando em massa | Conferir `STRIPE_WEBHOOK_SECRET`; reenviar eventos via painel Stripe (botão *Resend*) |
| Checkout com price inválido | Revisar `NEXT_PUBLIC_STRIPE_PRICE_*` no Vercel → redeploy |

---

## Ordem-resumo (cola rápida)

```text
1. Stripe: produtos + price IDs (Live)
2. Stripe: webhook → whsec_
3. Vercel: 4 env vars (Prod + Preview)
4. 🔴 Backup MySQL
5. 🔴 prisma migrate deploy
6. Redeploy Vercel
7. Importar legados
8. Smoke tests (cartão real)
9. Monitorar 24h
```
