import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/webhook/recalculate-bolao/route";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    match: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/bolao/avaliarPalpite", () => ({
  avaliarPalpitesDePartida: vi.fn(),
}));

describe("POST /api/webhook/recalculate-bolao", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.ADMIN_API_KEY = "test-secret-token";
  });

  it("deve retornar 500 se ADMIN_API_KEY nao estiver configurada", async () => {
    delete process.env.ADMIN_API_KEY;

    const req = new Request("http://localhost/api/webhook/recalculate-bolao", {
      method: "POST",
    });

    const res = await POST(req as any);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("INTERNAL_ERROR");
    expect(data.message).toBe("Configuração do servidor inválida");
  });

  it("deve retornar 401 se Authorization header estiver ausente", async () => {
    const req = new Request("http://localhost/api/webhook/recalculate-bolao", {
      method: "POST",
    });

    const res = await POST(req as any);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("UNAUTHORIZED");
  });

  it("deve retornar 401 se Authorization header for invalido", async () => {
    const req = new Request("http://localhost/api/webhook/recalculate-bolao", {
      method: "POST",
      headers: {
        Authorization: "Bearer wrong-token",
      },
    });

    const res = await POST(req as any);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("UNAUTHORIZED");
  });

  it("deve retornar 200 e processar partidas se token for correto", async () => {
    const req = new Request("http://localhost/api/webhook/recalculate-bolao", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-secret-token",
      },
    });

    // Mockar retorno de findMany com 2 partidas
    vi.mocked(prisma.match.findMany).mockResolvedValue([
      {
        id: "match-1",
        fthg: 2,
        ftag: 1,
        homeTeam: { name: "Brazil" },
        awayTeam: { name: "Argentina" },
      },
      {
        id: "match-2",
        fthg: 0,
        ftag: 0,
        homeTeam: { name: "Spain" },
        awayTeam: { name: "Italy" },
      },
    ] as any);

    const { avaliarPalpitesDePartida } = await import("@/lib/bolao/avaliarPalpite");

    const res = await POST(req as any);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.evaluated).toHaveLength(2);
    expect(data.evaluated[0]).toEqual({
      id: "match-1",
      match: "Brazil vs Argentina",
      score: "2x1",
    });

    expect(avaliarPalpitesDePartida).toHaveBeenCalledTimes(2);
    expect(avaliarPalpitesDePartida).toHaveBeenNthCalledWith(1, "match-1", 2, 1);
    expect(avaliarPalpitesDePartida).toHaveBeenNthCalledWith(2, "match-2", 0, 0);
  });
});
