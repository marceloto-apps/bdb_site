# Testes de Ground Truth — Big Data Bet

Estes testes garantem que a implementação em TypeScript dos modelos estatísticos corresponde perfeitamente ao *Ground Truth* validado na planilha legada em Excel (`BRA1DASHv261.xlsx`).

## Processo de Atualização do Ground Truth

Atualmente, o *Ground Truth* está baseado nos dados do Brasileirão Série A 2026 (após 117 jogos). Estes valores não são dinâmicos; eles são fixos nos testes para atuar como uma regressão matemática estrita.

**Como atualizar o Ground Truth (se necessário):**
1. Abra a versão mais atualizada da planilha `BRA1DASH` e defina um *snapshot* fixo de jogos.
2. Copie os valores estáticos de `μ_h` e `μ_a` da aba `DASH`.
3. Verifique a aba `CS` para os resultados dos cálculos dos 5 casos de teste.
4. Atualize o arquivo `bra1-2026.ts` com os novos valores base (incluindo os totais nos casos principais e as forças extraídas da aba `BDBRA1`).
5. Execute os testes `npm run test` e confirme que a nova base não introduz erros nos testes de regressão, tolerando desvios inferiores a 0.5% (ou conforme documentado em `MODELOS_ESTATISTICOS.md`).
