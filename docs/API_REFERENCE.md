# API Reference — Fase 2

Base URL: `https://bigdatabet.com.br/api` (produção) ou `http://localhost:3000/api` (dev)

Todas as rotas exigem autenticação via cookie de sessão NextAuth.js.

---

## Ligas

### GET /api/ligas/[slug]/info

Retorna metadados da liga, temporada ativa, lista de times e médias da liga.

**Params:**
- `slug` (path) — slug da competição (ex: `brasileirao-serie-a`)

**Response 200:**
```json
{
  "data": {
    "competition": {
      "id": "clx...",
      "name": "Brasileirão Série A",
      "slug": "brasileirao-serie-a",
      "country": "Brasil",
      "tier": "FREE"
    },
    "season": {
      "id": "clx...",
      "year": "2026",
      "isCurrent": true
    },
    "times": [
      { "id": "clx...", "name": "Flamengo", "shortName": "FLA", "logoUrl": null }
    ],
    "medias": {
      "muH": 1.57,
      "muA": 1.05,
      "totalJogos": 117
    },
    "suficiente": true
  }
}
```

**Errors:** 401, 404

---

### GET /api/ligas/[slug]/times

Retorna lista de times da temporada ativa.

**Response 200:**
```json
{
  "data": [
    { "id": "clx...", "name": "Flamengo", "shortName": "FLA", "logoUrl": null }
  ]
}
```

---

### GET /api/ligas/[slug]/partidas

Retorna partidas com filtros opcionais.

**Query params:**
| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `homeTeamId` | string | — | Filtrar por mandante |
| `awayTeamId` | string | — | Filtrar por visitante |
| `roundFrom` | number | 1 | Rodada inicial |
| `roundTo` | number | max | Rodada final |
| `months` | string | — | Meses separados por vírgula (1-12) |
| `status` | string | FINISHED | Status da partida |
| `limit` | number | 100 | Máximo de resultados |

**Response 200:**
```json
{
  "data": [
    {
      "id": "clx...",
      "round": 15,
      "utcDate": "2026-06-15T20:00:00Z",
      "homeTeamId": "clx...",
      "awayTeamId": "clx...",
      "fthg": 2,
      "ftag": 1,
      "ftr": "H",
      "status": "FINISHED",
      "homeTeam": { "name": "Flamengo", "shortName": "FLA" },
      "awayTeam": { "name": "Palmeiras", "shortName": "PAL" }
    }
  ],
  "meta": { "total": 117 }
}
```

---

### GET /api/ligas/[slug]/previsao

Calcula previsão estatística para um confronto específico.

**Query params (obrigatórios):**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `homeTeamId` | string | ID do time mandante |
| `awayTeamId` | string | ID do time visitante |

**Query params (opcionais):**
| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `modelo` | string | AUTO | POISSON, NB, ZIP, ZINB ou AUTO |
| `roundFrom` | number | 1 | Rodada inicial do filtro |
| `roundTo` | number | max | Rodada final do filtro |
| `months` | string | — | Meses (1-12, separados por vírgula) |

**Response 200:**
```json
{
  "data": {
    "modelo": "POISSON",
    "lambdas": { "home": 2.04, "away": 0.54 },
    "medias": {
      "home": { "mgc": 1.95, "mgsc": 0.67, "mgv": 0.84, "mgsv": 1.65, "jogosCasa": 10, "jogosFora": 9 },
      "away": { "...": "..." },
      "liga": { "muH": 1.57, "muA": 1.05, "totalJogos": 117 }
    },
    "forcas": {
      "home": { "fcAtC": 1.24, "fcDfC": 0.64, "fcAtV": 0.80, "fcDfV": 1.05 },
      "away": { "...": "..." }
    },
    "matrizPlacares": [[0.0725, 0.1140, "..."], "..."],
    "mercados": {
      "casa": { "prob": 0.6648, "oddJusta": 1.504 },
      "empate": { "prob": 0.2135, "oddJusta": 4.684 },
      "visitante": { "prob": 0.1217, "oddJusta": 8.214 },
      "btts": { "sim": 0.4002, "nao": 0.5998 },
      "overUnder": {
        "0.5": { "over": 0.9275, "under": 0.0725 },
        "1.5": { "over": 0.7372, "under": 0.2628 },
        "2.5": { "over": 0.4876, "under": 0.5124 },
        "3.5": { "over": 0.2692, "under": 0.7308 },
        "4.5": { "over": 0.1265, "under": 0.8735 }
      },
      "handicaps": [
        { "linha": -1.5, "casa": 0.354, "visitante": 0.646 },
        { "linha": -0.5, "casa": 0.558, "visitante": 0.442 }
      ]
    },
    "modeloAuto": {
      "ranking": [
        { "modelo": "POISSON", "aic": 234.5, "confianca": "ALTA" },
        { "modelo": "NB", "aic": 248.2, "confianca": null }
      ]
    },
    "evPorMercado": null,
    "warnings": []
  }
}
```

**Errors:** 400 (params inválidos), 401, 404, 422 (dados insuficientes)

---

### GET /api/ligas/[slug]/mapa-valor

Calcula ROI histórico por faixa de odds usando dados Pinnacle.

**Response 200:**
```json
{
  "data": {
    "casa": [
      { "faixa": { "label": "1.01-1.20", "min": 1.01, "max": 1.20 }, "totalApostas": 5, "acertos": 4, "roi": 12.5, "lucroPerda": 0.63 }
    ],
    "empate": ["..."],
    "visitante": ["..."]
  }
}
```

---

## Odds de Mercado

### GET /api/ligas/[slug]/odds-mercado

Busca as odds de mercado mais recentes ou de abertura para um determinado confronto e bookmaker.

**Query params:**
| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `homeTeamId` | string | — (obrigatório) | ID do time mandante |
| `awayTeamId` | string | — (obrigatório) | ID do time visitante |
| `bookmaker` | string | `bet365` | Slug do bookmaker (ex: `bet365`, `pinnacle`, `betfair-exchange`, `kambi`) |
| `oddsType` | string | `current` | Tipo de odd: `current` (atuais) ou `opening` (abertura) |

**Response 200:**
```json
{
  "data": {
    "matchId": "clx...",
    "utcDate": "2026-06-06T02:00:00.000Z",
    "round": 15,
    "status": "SCHEDULED",
    "bookmaker": "bet365",
    "mercados": {
      "x1x2": { "home": 1.85, "draw": 3.60, "away": 4.00 },
      "btts": { "yes": 1.67, "no": 2.10 },
      "overUnder": {
        "0.5": { "over": 1.01, "under": 89.57 },
        "1.5": { "over": 1.07, "under": 16.35 },
        "2.5": { "over": 1.80, "under": 2.00 },
        "3.5": { "over": 3.24, "under": 2.92 },
        "4.5": { "over": 5.76, "under": 1.88 }
      }
    }
  }
}
```

---

### GET /api/ligas/[slug]/odds-mercado/historico

Retorna a série temporal histórica das odds movimentadas (`OddsMovement`) desde a abertura até o momento atual para cada mercado.

**Query params:**
| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `homeTeamId` | string | — (obrigatório) | ID do time mandante |
| `awayTeamId` | string | — (obrigatório) | ID do time visitante |
| `bookmaker` | string | `bet365` | Slug do bookmaker |

**Response 200:**
```json
{
  "data": {
    "matchId": "clx...",
    "bookmaker": "bet365",
    "history": {
      "x1x2": [
        { "capturedAt": "2026-06-05T10:00:00.000Z", "home": 1.80, "draw": 3.40, "away": 4.20 },
        { "capturedAt": "2026-06-05T12:00:00.000Z", "home": 1.85, "draw": 3.60, "away": 4.00 }
      ],
      "btts": [
        { "capturedAt": "2026-06-05T10:00:00.000Z", "yes": 1.70, "no": 2.05 },
        { "capturedAt": "2026-06-05T12:00:00.000Z", "yes": 1.67, "no": 2.10 }
      ],
      "overUnder": {
        "2.5": [
          { "capturedAt": "2026-06-05T10:00:00.000Z", "over": 1.85, "under": 1.95 },
          { "capturedAt": "2026-06-05T12:00:00.000Z", "over": 1.80, "under": 2.00 }
        ]
      }
    }
  }
}
```

---

## Admin

### POST /api/admin/sync/partidas

Sincroniza partidas da API-Football. **ADMIN only.**

**Body:**
```json
{ "seasonId": "clx..." }
```

**Response 200:**
```json
{
  "data": {
    "total": 380,
    "created": 15,
    "updated": 3,
    "errors": [],
    "duration": 2340
  }
}
```

**Errors:** 401, 403, 409 (sync em andamento), 429 (rate limit)

---

### POST /api/admin/sync/odds

Sincroniza odds da API-Football. **ADMIN only.**

**Body:**
```json
{ "seasonId": "clx...", "maxPartidas": 10 }
```

---

### GET /api/admin/sync/status?seasonId={id}

Retorna últimos 20 logs de sincronização. **ADMIN only.**

---

### GET /api/admin/quota

Retorna uso atual da API-Football. **ADMIN only.**

**Response 200:**
```json
{
  "data": {
    "used": 62,
    "limit": 100,
    "remaining": 38,
    "percentage": 62,
    "lastUpdated": "2026-05-04T21:15:00Z"
  }
}
```
