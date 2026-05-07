# Deploy Checklist — Fase 2

## Pré-deploy

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
