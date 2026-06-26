// tests/ferramentas/backtest/leakage.test.ts
import { describe, it, expect } from "vitest";
import { obterPartidasPassadasValidas, calcularStatsParaTime, MatchData } from "@/lib/ferramentas/backtest/backfill-logic";

describe("Anti-Leakage e Isolamento Temporada/Partida", () => {
  const t1 = "team-1";
  const t2 = "team-2";
  const s2024 = "season-2024";
  const s2025 = "season-2025";
  const comp = "competition-1";

  // Mock de matches histórico
  const mockMatches: MatchData[] = [
    // Temporada 2024
    { id: "m1", seasonId: s2024, competitionId: comp, homeTeamId: t1, awayTeamId: t2, status: "FINISHED", utcDate: new Date("2024-01-10T15:00:00Z"), fthg: 2, ftag: 1 },
    { id: "m2", seasonId: s2024, competitionId: comp, homeTeamId: t2, awayTeamId: t1, status: "FINISHED", utcDate: new Date("2024-01-17T15:00:00Z"), fthg: 3, ftag: 0 },
    { id: "m3", seasonId: s2024, competitionId: comp, homeTeamId: t1, awayTeamId: t2, status: "FINISHED", utcDate: new Date("2024-01-24T15:00:00Z"), fthg: 1, ftag: 1 },
    { id: "m4", seasonId: s2024, competitionId: comp, homeTeamId: t2, awayTeamId: t1, status: "FINISHED", utcDate: new Date("2024-01-31T15:00:00Z"), fthg: 0, ftag: 2 },
    { id: "m5", seasonId: s2024, competitionId: comp, homeTeamId: t1, awayTeamId: t2, status: "FINISHED", utcDate: new Date("2024-02-07T15:00:00Z"), fthg: 4, ftag: 2 },

    // Temporada 2025 (Jogos sequenciais)
    { id: "m6", seasonId: s2025, competitionId: comp, homeTeamId: t1, awayTeamId: t2, status: "FINISHED", utcDate: new Date("2025-01-10T15:00:00Z"), fthg: 1, ftag: 0 },
    { id: "m7", seasonId: s2025, competitionId: comp, homeTeamId: t2, awayTeamId: t1, status: "FINISHED", utcDate: new Date("2025-01-17T15:00:00Z"), fthg: 2, ftag: 2 },
    { id: "m8", seasonId: s2025, competitionId: comp, homeTeamId: t1, awayTeamId: t2, status: "FINISHED", utcDate: new Date("2025-01-24T15:00:00Z"), fthg: 3, ftag: 1 },
    { id: "m9", seasonId: s2025, competitionId: comp, homeTeamId: t2, awayTeamId: t1, status: "FINISHED", utcDate: new Date("2025-01-31T15:00:00Z"), fthg: 0, ftag: 1 }, // jogo atual a testar na Season 2025
    { id: "m10", seasonId: s2025, competitionId: comp, homeTeamId: t1, awayTeamId: t2, status: "FINISHED", utcDate: new Date("2025-02-07T15:00:00Z"), fthg: 5, ftag: 5 }, // Jogo futuro na Season 2025
    { id: "m11", seasonId: s2025, competitionId: comp, homeTeamId: t1, awayTeamId: t2, status: "SCHEDULED", utcDate: new Date("2025-01-15T15:00:00Z"), fthg: null, ftag: null }, // Jogo não finalizado no passado
  ];

  it("não deve incluir a própria partida nos cálculos (exclusão por ID)", () => {
    const partidaRef = mockMatches.find((m) => m.id === "m9")!; // Jogo m9
    const validMatches = obterPartidasPassadasValidas(partidaRef, mockMatches);
    expect(validMatches.find((m) => m.id === "m9")).toBeUndefined();
  });

  it("não deve incluir partidas com data futura ou igual à data de corte (exclusão por utcDate)", () => {
    const partidaRef = mockMatches.find((m) => m.id === "m9")!; // 2025-01-31
    const validMatches = obterPartidasPassadasValidas(partidaRef, mockMatches);

    // m10 ocorre no futuro (2025-02-07), não deve constar
    expect(validMatches.find((m) => m.id === "m10")).toBeUndefined();
    // m9 ocorre no mesmo horário da ref, não deve constar (excluído também por utcDate >= ref)
    expect(validMatches.find((m) => m.id === "m9")).toBeUndefined();
  });

  it("não deve incluir partidas com status diferente de FINISHED", () => {
    const partidaRef = mockMatches.find((m) => m.id === "m9")!;
    const validMatches = obterPartidasPassadasValidas(partidaRef, mockMatches);
    expect(validMatches.find((m) => m.id === "m11")).toBeUndefined();
  });

  it("não vaza estatísticas entre temporadas diferentes (reset de acumuladores cross-season)", () => {
    // Jogo na rodada 4 da Season 2025 (m9)
    const partidaRef = mockMatches.find((m) => m.id === "m9")!;
    const validMatches = obterPartidasPassadasValidas(partidaRef, mockMatches);

    // Deve conter apenas partidas válidas concluídas da Temporada 2025 (m6, m7, m8)
    const matches2024 = validMatches.filter((m) => m.seasonId === s2024);
    expect(matches2024.length).toBe(0);

    const matches2025 = validMatches.filter((m) => m.seasonId === s2025);
    expect(matches2025.length).toBe(3); // m6, m7, m8
    expect(matches2025.map((m) => m.id)).toEqual(["m6", "m7", "m8"]);
  });

  it("deve exigir um mínimo de 4 partidas passadas para computar estatísticas do time", () => {
    const partidaRef = mockMatches.find((m) => m.id === "m9")!; // m9 tem 3 jogos passados de t1 na temporada 2025 (m6, m7, m8)
    const validMatches = obterPartidasPassadasValidas(partidaRef, mockMatches);

    const stats = calcularStatsParaTime(t1, validMatches, null);
    expect(stats).toBeNull(); // Nossos 3 jogos de amostra (m6, m7, m8) são menos que o limite de 4
  });

  it("deve calcular estatísticas válidas se houver dados históricos suficientes na temporada", () => {
    // Vamos usar m5 na Temporada 2024 (m1, m2, m3, m4 são jogos passados de t1 na temporada 2024, total de 4 jogos)
    const partidaRef = mockMatches.find((m) => m.id === "m5")!;
    const validMatches = obterPartidasPassadasValidas(partidaRef, mockMatches);

    const stats = calcularStatsParaTime(t1, validMatches, null);
    expect(stats).not.toBeNull();

    // t1 em m1 (casa, scored 2, conceded 1)
    // t1 em m2 (fora, scored 0, conceded 3)
    // t1 em m3 (casa, scored 1, conceded 1)
    // t1 em m4 (fora, scored 2, conceded 0)
    // scored: [2, 0, 1, 2] -> sum = 5, avg = 1.25
    // conceded: [1, 3, 1, 0] -> sum = 5, avg = 1.25
    expect(stats!.avgGoalsScored).toBe(1.25);
    expect(stats!.avgGoalsConceded).toBe(1.25);
  });
});
