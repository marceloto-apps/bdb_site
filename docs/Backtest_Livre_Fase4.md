# Backtest Livre — Fase 4: UI do Laboratório (25/09/2026)

Plano: `docs/Backtest_Livre_Plano.md` §7 (UI) e §8 (fases). Página `/dashboard/laboratorio` (D6), gate
igual ao backtest (D4), duas colunas como o backtest atual, Recharts + shadcn, Worker no navegador (D1).

## 1. O que foi construído

| Arquivo | Responsabilidade |
| --- | --- |
| `app/(dashboard)/dashboard/laboratorio/page.tsx` | Server component: sessão → `/login`; sem plano → `UpgradeBacktest` (o mesmo do backtest); passa `datasetDisponivel` (R2 configurado) |
| `components/laboratorio/LaboratorioClient.tsx` | Estado da estratégia (JSON do engine), ciclo do Worker (`criarLaboratorio` → `preparar` busca catálogo + manifesto), validação ao vivo com debounce (erros e unidades dos indicadores), execução com progresso, comparação (até 5 runs), salvar/carregar/duplicar/apagar estratégias, salvar run, salvar indicadores; toasts do shadcn |
| `PainelUniverso.tsx` | Ligas nos 5 modos (padrão, todas, continente, país, liga a liga — só não-femininas), temporadas por rótulo, datas, fontes núcleo/só-FPT, ligas/copas, rodadas iniciais, cobertura mínima (presets) |
| `PainelIndicadores.tsx` | Catálogo pesquisável por bloco (chave, unidade, rótulo, descrição; clique copia a chave), funções virtuais, indicadores da estratégia (editáveis, com unidade e erros), "meus indicadores" (servidor, + públicos) |
| `PainelRegras.tsx` | **Builder visual ↔ fórmula, mesmo AST** (D5): condições `campo/indicador op número/campo/seleção/texto` com negação e combinador E/OU; a fórmula é reconvertida para o builder quando é "plana"; senão fica só o modo fórmula (funções, `model()`, parênteses). Datalist com todos os campos e indicadores para autocomplete; validação ao vivo; contagem de jogos selecionados/universo do último run |
| `PainelEntradas.tsx` | Pernas (até 10): mercado (11), seleção fixa ou expressão, linha principal/fixa/expressão, preço de decisão e liquidação (só combinações que existem no catálogo: Pinnacle sem HT/DC/EH/CS; DC/EH/CS só fechamento), odd mín/máx, slippage %, multiplicador de stake, condição extra |
| `PainelStaking.tsx` | flat / % banco / Kelly (fração, cap, expressão de probabilidade) / to-win; banco inicial, exposição máxima por dia, stop de drawdown, referência de EV/CLV, bootstrap, semente, parâmetros `$p` |
| `Tearsheet.tsx` | Avisos (leakage em vermelho, amostra/referência em amarelo), 10 cards (apostas, yield, ROI banco, hit rate, MDD, CLV no-vig, yield esperado, p-valor, IC95, Sharpe/PF), gráfico banco real × esperado × CLV acumulado (amostrado a 800 pontos) + underwater, abas: Segmentos (9 dimensões), Mensal (heatmap ano × mês), Risco (inferência + caminho + 5 maiores drawdowns), Apostas (paginada, CSV com todas as colunas + extras), Comparar (até 5 runs) |
| `EstrategiasSalvas.tsx` | Diálogo salvar/atualizar/salvar como nova (nome, descrição, pública), lista (minhas + públicas: carregar, duplicar, apagar), runs salvos da estratégia com tentativas |
| `lib/laboratorio/ui/builder.ts` | Modelo do builder ↔ AST/fórmula (usa `parseExpressao`/`imprimir` do engine) |
| `lib/laboratorio/ui/{formato,csv,continentes,tipos}.ts` | Formatadores pt-BR, CSV (`;`, BOM, decimais com vírgula), continente por país (tabela do backtest atual), tipos do resultado serializado |
| Navegação | Entrada "Laboratório" (badge Novo) no grupo Ferramentas da sidebar (aparece também no menu mobile) e card nos acessos rápidos |

Decisão de implementação: em vez de `react-querybuilder` (sugestão da §7), o builder é próprio, sem
dependência nova, porque precisa gerar exatamente o AST do engine (campo × campo, seleções, negação) e
ler a fórmula de volta; o que não cabe no builder continua disponível no modo fórmula.

## 2. Testes e build

- `npm run lab:test` → **190 testes** (13 arquivos): +7 em `ui.test.ts` (builder ↔ fórmula ida e volta com and/or, negação, número negativo e campo × campo; fórmulas fora do formato plano; CSV com BOM/`;`/vírgula decimal/extras; formatadores; continentes).
- `npx tsc --noEmit` limpo; `npx next build` passa com a página `/dashboard/laboratorio` e o Worker empacotado pelo webpack (`new Worker(new URL('./laboratorio.worker.ts', import.meta.url))`).
- Teste manual no navegador (usuário VIP PRO) ainda **pendente** — não há Playwright no projeto; ver §3.

## 3. Roteiro de teste ponta a ponta (para o usuário)

1. Abrir `/dashboard/laboratorio` logado com VIP PRO: o cabeçalho mostra "Dataset 2026…", o botão vira "Executar".
2. Executar a estratégia inicial (edge bet365 vs Pinnacle no mandante, ligas padrão): progresso "Baixando dados…", depois tearsheet com cards, gráfico e abas. Toast informa blocos/MB/ms.
3. Executar de novo: o toast deve mostrar "(N do cache)" e a carga cair para dezenas de ms.
4. Em "3. Regra": alternar Builder ↔ Fórmula; adicionar uma condição; ver a fórmula gerada e a validação ao vivo; digitar um campo inexistente e ver o erro.
5. Em "4. Entradas": trocar para Over/Under linha principal, Pinnacle fechamento; executar; conferir que a referência não é "soft".
6. Perna na abertura com regra que lê o fechamento → aviso vermelho de leakage no topo do tearsheet.
7. "6. Salvar": salvar estratégia, recarregar a página, carregar, salvar run, ver runs salvos e tentativas.
8. Aba Apostas → CSV abre no Excel com colunas e decimais pt-BR.
9. Celular: colunas empilham, tabelas rolam horizontalmente, botão Executar fica fixo no topo do formulário.

## 4. Pendências

0. ~~Rótulos de temporada mistos ("24/25" no núcleo, "2024/2025" na FPT)~~ — unificado na fonte em 26/09/2026 (`rotuloTemporada` no loader do `bdb_ingest`, commit `c7c5249`); vale a partir do próximo build da feature store.

1. Validar no navegador (roteiro acima); ajustar Lighthouse/mobile se algo regredir.
2. Fase 5 (validação avançada) entra como novas abas do tearsheet: Validação (folds, walk-forward, holdout selado), Monte Carlo, Varredura (`$p`), Calibração.
3. Contagem de jogos selecionados "ao vivo" hoje é a do último run; um `contar` no Worker (sem métricas) pode atualizar ao digitar quando os chunks já estão em cache.
4. Autocomplete da fórmula usa `datalist` nativo (funciona no input do builder; no `textarea` do modo fórmula é só via catálogo/cópia).
