# THESTATSAPI

# TheStatsAPI — Referência Completa para o Projeto BigDataBet

> Documento interno do projeto BigDataBet.
Fonte: [https://www.thestatsapi.com/docs](https://www.thestatsapi.com/docs)
Última atualização: 2026-05-04
> 

---

## Sumário

1. [Visão Geral](https://www.notion.so/THESTATSAPI-35645372e262806b9f4ac71a0c1dc180?pvs=21)
2. [Autenticação](https://www.notion.so/THESTATSAPI-35645372e262806b9f4ac71a0c1dc180?pvs=21)
3. [Base URL e Versionamento](https://www.notion.so/THESTATSAPI-35645372e262806b9f4ac71a0c1dc180?pvs=21)
4. [Modelo de Dados](https://www.notion.so/THESTATSAPI-35645372e262806b9f4ac71a0c1dc180?pvs=21)
5. [Paginação](https://www.notion.so/THESTATSAPI-35645372e262806b9f4ac71a0c1dc180?pvs=21)
6. [Erros](https://www.notion.so/THESTATSAPI-35645372e262806b9f4ac71a0c1dc180?pvs=21)
7. [Endpoints — Competitions](https://www.notion.so/THESTATSAPI-35645372e262806b9f4ac71a0c1dc180?pvs=21)
8. [Endpoints — Teams](https://www.notion.so/THESTATSAPI-35645372e262806b9f4ac71a0c1dc180?pvs=21)
9. [Endpoints — Matches](https://www.notion.so/THESTATSAPI-35645372e262806b9f4ac71a0c1dc180?pvs=21)
10. [Endpoints — Players](https://www.notion.so/THESTATSAPI-35645372e262806b9f4ac71a0c1dc180?pvs=21)
11. [Flags de Disponibilidade](https://www.notion.so/THESTATSAPI-35645372e262806b9f4ac71a0c1dc180?pvs=21)
12. [Bookmakers e Mercados de Odds](https://www.notion.so/THESTATSAPI-35645372e262806b9f4ac71a0c1dc180?pvs=21)
13. [Cobertura e Limites](https://www.notion.so/THESTATSAPI-35645372e262806b9f4ac71a0c1dc180?pvs=21)
14. [Mapa de Ingestão — BigDataBet](https://www.notion.so/THESTATSAPI-35645372e262806b9f4ac71a0c1dc180?pvs=21)
15. [Estimativa de Consumo de Requests](https://www.notion.so/THESTATSAPI-35645372e262806b9f4ac71a0c1dc180?pvs=21)

---

## 1. Visão Geral

TheStatsAPI é uma REST API de dados de futebol que cobre:

| Categoria | Descrição |
| --- | --- |
| Competitions & Seasons | Ligas, copas e torneios internacionais com metadados de temporada |
| Teams | Perfis de clubes e seleções, elencos, estatísticas por temporada |
| Players | Perfis de jogadores, dados biográficos, stats por temporada |
| Matches | Resultados históricos, placares ao vivo, fixtures futuros |
| Match Statistics | Chutes, passes, duelos, posse, defesas, xG (npxG) |
| Player Match Statistics | Stats individuais por partida (minutos, gols, assists, rating) |
| Shotmaps | Registro individual de cada chute com coordenadas, xG, resultado |
| Betting Odds | Odds pré-jogo e in-play de múltiplos bookmakers e mercados |

**Dados-chave:**

- 80 competições padrão (até 1.196 sob demanda)
- 84.000+ jogadores
- 10-20 anos de histórico (ligas principais)
- 100+ países
- Dados pós-jogo disponíveis 1-2h após o apito final

---

## 2. Autenticação

**Método:** Bearer Token no header `Authorization`.

```
Authorization: Bearer YOUR_API_KEY
```

**Regras:**

- Toda request (exceto `/health`) exige o header
- A chave é gerada no dashboard da conta, exibida **uma única vez**
- **Nunca** expor em código client-side, repositórios públicos ou versionamento
- Usar variáveis de ambiente (`STATS_API_KEY`) no servidor

**Erro de autenticação (401):**

```json
{
  "error": {
    "code": "unauthorized",
    "message": "Invalid or missing API key. Provide a valid Bearer token in the Authorization header.",
    "status_code": 401
  }
}
```

**Causas comuns de 401:**

- Header `Authorization` ausente
- Falta do prefixo `Bearer`  (com espaço)
- Chave revogada, expirada ou com typo

---

## 3. Base URL e Versionamento

```
<https://api.thestatsapi.com/api>
```

Todos os endpoints são prefixados por `/football/`. Exemplo completo:

```
<https://api.thestatsapi.com/api/football/competitions>
```

**Versão atual:** `v1.0.0`
Breaking changes serão comunicados com período de depreciação antes da remoção.

**Health check (sem auth):**

```
GET /api/health
```

```json
{
  "status": "healthy",
  "timestamp": "2026-04-20T10:00:00Z"
}
```

---

## 4. Modelo de Dados

### 4.1 Hierarquia

```
Competition
  └── Season
        ├── Team (N times por season)
        │     └── Player (N jogadores por time)
        └── Match (N partidas por season)
              ├── MatchStats
              ├── PlayerStats[]
              ├── Shotmap (Shot[])
              └── Odds (Bookmaker[] → Market[])
```

### 4.2 Formato de IDs

Todos os IDs são **strings estáveis** com prefixo de entidade. Não mudam entre versões da API.

| Entidade | Prefixo | Exemplo |
| --- | --- | --- |
| Competition | `comp_` | `comp_3879` |
| Season | `sn_` | `sn_7210` |
| Team | `tm_` | `tm_8923` |
| Player | `pl_` | `pl_6241` |
| Match | `mt_` | `mt_14502` |
| Shot | `sh_` | `sh_4812` |

> **Importante para o BigDataBet:** Esses IDs são usados como `externalId` no nosso schema Prisma.
O mapeamento é: `externalId = comp_3879` → `League.id = cuid()`.
> 

### 4.3 Entidades — Campos Completos

### Competition (listagem)

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | ID estável (`comp_XXXX`) |
| `name` | string | Nome completo ("Premier League") |
| `country` | string | País ("England") |
| `country_code` | string | ISO 3166-1 alpha-2 ("GB") |
| `type` | string | `league` | `cup` | `tournament` |
| `has_team_stats` | boolean | Se stats de time estão disponíveis |
| `has_player_stats` | boolean | Se stats de jogador estão disponíveis |
| `xg_available` | boolean | Se dados de xG estão disponíveis |

### CompetitionDetail (detalhe — campos adicionais)

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `current_season_id` | string | ID da temporada ativa (`sn_XXXX`) |
| `total_teams` | number | Quantidade de times na competição |

### Team (listagem)

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | ID estável (`tm_XXXX`) |
| `name` | string | Nome completo |
| `short_name` | string | Abreviação ("Man Utd") |
| `country` | string | País do time |
| `primary_competition` | object|null | `{ id, name }` da competição principal |

### TeamDetail (detalhe — campo adicional)

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `stadium` | object | `{ name, city, capacity }` — pode estar ausente |

### TeamStats (stats por temporada)

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `team_id` | string | ID do time |
| `season_id` | string | ID da temporada |
| `competition_id` | string | ID da competição |
| `matches_played` | integer | Jogos disputados |
| `wins` | integer | Vitórias |
| `draws` | integer | Empates |
| `losses` | integer | Derrotas |
| `points` | integer | Pontos |
| `position` | integer | Posição na tabela |
| `goals_for` | integer | Gols marcados |
| `goals_against` | integer | Gols sofridos |
| `goal_difference` | integer | Saldo de gols |
| `form` | string | Últimos 5 resultados ("WWDLW") |

### Match (listagem)

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | ID estável (`mt_XXXX`) |
| `competition_id` | string | ID da competição |
| `season_id` | string | ID da temporada |
| `matchday` | integer | Rodada |
| `status` | string | `scheduled` | `live` | `finished` | `postponed` | `cancelled` |
| `utc_date` | string | Horário kickoff ISO 8601 UTC |
| `home_team` | object | `{ id, name }` |
| `away_team` | object | `{ id, name }` |
| `score` | object | `{ home, away }` — contagem de gols FT |
| `xg_available` | boolean | Se dados de xG/shotmap estão disponíveis |

### MatchDetail (detalhe — campos adicionais)

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `competition_name` | string | Nome legível da competição |
| `venue` | object | `{ name, city }` |
| `referee` | object | `{ name }` |
| `odds_available` | boolean | `true` para jogos futuros em ligas suportadas ≤6 dias do kickoff |

### Player (listagem e detalhe)

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | ID estável (`pl_XXXX`) |
| `name` | string | Nome completo |
| `first_name` | string | Primeiro nome |
| `last_name` | string | Sobrenome |
| `position` | string | Posição (Forward, Midfielder, Defender, Goalkeeper) |
| `date_of_birth` | string | Data nascimento YYYY-MM-DD |
| `age` | integer | Idade atual |
| `nationality` | string | Nacionalidade |
| `height_cm` | integer | Altura em cm |
| `current_team` | object | `{ id, name }` |

---

## 5. Paginação

Todas as listagens retornam resultados paginados.

### Parâmetros de query

| Parâmetro | Tipo | Default | Max | Descrição |
| --- | --- | --- | --- | --- |
| `page` | integer | 1 | — | Número da página |
| `per_page` | integer | 20 | 100 | Resultados por página |

### Objeto `meta` (presente em toda listagem)

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### Iteração completa (exemplo para ingestão)

```tsx
// Padrão usado no sync engine do BigDataBet
async function fetchAllPages<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T[]> {
  const all: T[] = []
  let page = 1

  while (true) {
    const res = await statsApi.get(endpoint, {
      params: { ...params, page, per_page: 100 },
    })
    all.push(...res.data.data)

    if (page >= res.data.meta.total_pages) break
    page++
  }

  return all
}
```

> **Dica de performance:** Sempre usar `per_page=100` para reduzir requests.
`per_page > 100` retorna erro `400 invalid_request`.
> 

---

## 6. Erros

### Formato padrão (consistente em toda a API)

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "status_code": 400
  }
}
```

### Tabela de códigos

| HTTP Status | Code | Significado |
| --- | --- | --- |
| 400 | `invalid_request` | Request malformada ou parâmetro faltando |
| 401 | `unauthorized` | API key ausente, inválida ou revogada |
| 404 | `not_found` | Recurso não existe |

### Erros comuns no BigDataBet

| Cenário | Código | Causa |
| --- | --- | --- |
| Header sem prefixo `Bearer` | 401 | `Authorization: KEY` em vez de `Authorization: Bearer KEY` |
| `season_id` sem `competition_id` | 400 | Alguns endpoints exigem ambos juntos |
| `per_page=200` | 400 | Máximo é 100 |
| Match ID inexistente | 404 | ID com typo ou jogo removido da API |
| Shotmap de jogo sem xG | 200 | Retorna `data: []` (vazio, não erro!) — **verificar flag** |

---

## 7. Endpoints — Competitions

### 7.1 `GET /football/competitions` — Listar competições

**Uso no BigDataBet:** Descoberta de IDs de competição para popular tabela `League`.

| Parâmetro | Tipo | Default | Descrição |
| --- | --- | --- | --- |
| `page` | number | 1 | Página |
| `per_page` | number | 20 | Resultados por página (max 100) |
| `country` | string | — | Filtro por país (case-sensitive, exato) |
| `country_code` | string | — | Filtro por código ISO alpha-2 |
| `type` | string | — | `league` | `cup` | `tournament` |
| `search` | string | — | Busca parcial por nome (case-insensitive) |

**Request:**

```bash
GET /api/football/competitions?country=England&type=league
```

**Response:**

```json
{
  "data": [
    {
      "id": "comp_3879",
      "name": "Premier League",
      "country": "England",
      "country_code": "GB",
      "type": "league",
      "has_team_stats": true,
      "has_player_stats": true,
      "xg_available": true
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 45, "total_pages": 3 }
}
```

### 7.2 `GET /football/competitions/{competition_id}` — Detalhe da competição

**Uso no BigDataBet:** Obter `current_season_id` para usar nos demais endpoints.

| Parâmetro | Tipo | Local | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `competition_id` | string | path | sim | Ex: `comp_3879` |

**Response (campos adicionais vs listagem):**

```json
{
  "data": {
    "id": "comp_3879",
    "name": "Premier League",
    "country": "England",
    "country_code": "GB",
    "type": "league",
    "has_team_stats": true,
    "has_player_stats": true,
    "xg_available": true,
    "current_season_id": "sn_7210",
    "total_teams": 20
  }
}
```

> **Fluxo BigDataBet:** `GET /competitions` → para cada competição relevante →
`GET /competitions/{id}` → extrair `current_season_id` → usar como `season_id` nos demais endpoints.
> 

---

## 8. Endpoints — Teams

### 8.1 `GET /football/teams` — Listar times

**Uso no BigDataBet:** Popular tabela `Team` e `TeamSeason`.

| Parâmetro | Tipo | Default | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `page` | number | 1 | não | Página |
| `per_page` | number | 20 | não | Resultados por página (max 100) |
| `competition_id` | string | — | não | Filtrar por competição |
| `season_id` | string | — | não* | Filtrar por temporada |
| `country` | string | — | não | Filtrar por país |
| `search` | string | — | não | Busca parcial por nome |

> *`season_id` **exige** `competition_id`. Enviar sozinho retorna erro 400.
> 

**Response:**

```json
{
  "data": [
    {
      "id": "tm_8923",
      "name": "Manchester United",
      "short_name": "Man Utd",
      "country": "England",
      "primary_competition": { "id": "comp_3879", "name": "Premier League" }
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 20, "total_pages": 1 }
}
```

### 8.2 `GET /football/teams/{team_id}` — Detalhe do time

**Uso no BigDataBet:** Obter dados de estádio para páginas de perfil de time.

**Response (campo adicional: `stadium`):**

```json
{
  "data": {
    "id": "tm_8923",
    "name": "Manchester United",
    "short_name": "Man Utd",
    "country": "England",
    "primary_competition": { "id": "comp_3879", "name": "Premier League" },
    "stadium": { "name": "Old Trafford", "city": "Manchester", "capacity": 74140 }
  }
}
```

### 8.3 `GET /football/teams/{team_id}/stats` — Stats do time na temporada

**Uso no BigDataBet:** Popular tabela `Standing` e exibir classificação.

| Parâmetro | Tipo | Local | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `team_id` | string | path | sim | Ex: `tm_8923` |
| `season_id` | string | query | sim | Ex: `sn_7210` |

> ⚠️ Só retorna dados se `has_team_stats = true` na competição.
> 

**Response:**

```json
{
  "data": {
    "team_id": "tm_8923",
    "season_id": "sn_7210",
    "competition_id": "comp_3879",
    "matches_played": 38,
    "wins": 23,
    "draws": 6,
    "losses": 9,
    "points": 75,
    "position": 3,
    "goals_for": 58,
    "goals_against": 43,
    "goal_difference": 15,
    "form": "WWDLW"
  }
}
```

---

## 9. Endpoints — Matches

### 9.1 `GET /football/matches` — Listar partidas

**Uso no BigDataBet:** Endpoint principal de ingestão de jogos (full sync e incremental).

| Parâmetro | Tipo | Default | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `page` | number | 1 | não | Página |
| `per_page` | number | 20 | não | Resultados por página (max 100) |
| `competition_id` | string | — | não | Filtrar por competição |
| `season_id` | string | — | não* | Filtrar por temporada (requer `competition_id`) |
| `team_id` | string | — | não | Jogos deste time (casa ou fora) |
| `date_from` | string | — | não | Data início (`YYYY-MM-DD`) |
| `date_to` | string | — | não | Data fim (`YYYY-MM-DD`) |
| `utc_offset` | string | `+00:00` | não | Offset UTC para interpretar datas |
| `status` | string | — | não | `scheduled` | `live` | `finished` | `postponed` | `cancelled` |

**Request típico BigDataBet (sync semanal):**

```bash
GET /api/football/matches?competition_id=comp_3879&season_id=sn_7210&status=finished&per_page=100
```

**Response:**

```json
{
  "data": [
    {
      "id": "mt_14502",
      "competition_id": "comp_3879",
      "season_id": "sn_7210",
      "matchday": 20,
      "status": "finished",
      "utc_date": "2024-01-15T15:00:00.000Z",
      "home_team": { "id": "tm_8923", "name": "Manchester United" },
      "away_team": { "id": "tm_4512", "name": "Arsenal" },
      "score": { "home": 2, "away": 1 },
      "xg_available": true
    }
  ],
  "meta": { "page": 1, "per_page": 100, "total": 190, "total_pages": 2 }
}
```

### 9.2 `GET /football/matches/{match_id}` — Detalhe da partida

**Uso no BigDataBet:** Obter venue, referee e verificar flags antes de enriquecer.

**Campos adicionais vs listagem:**

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `competition_name` | string | Nome legível da competição |
| `venue` | object | `{ name, city }` |
| `referee` | object | `{ name }` |
| `odds_available` | boolean | `true` se odds estão disponíveis (≤6 dias do kickoff) |

**Response:**

```json
{
  "data": {
    "id": "mt_14502",
    "competition_id": "comp_3879",
    "competition_name": "Premier League",
    "season_id": "sn_7210",
    "matchday": 20,
    "status": "finished",
    "utc_date": "2024-01-15T15:00:00.000Z",
    "home_team": { "id": "tm_8923", "name": "Manchester United" },
    "away_team": { "id": "tm_4512", "name": "Arsenal" },
    "score": { "home": 2, "away": 1 },
    "venue": { "name": "Old Trafford", "city": "Manchester" },
    "referee": { "name": "Michael Oliver" },
    "odds_available": false,
    "xg_available": true
  }
}
```

### 9.3 `GET /football/matches/{match_id}/stats` — Estatísticas da partida

**Uso no BigDataBet:** Popular tabela `MatchStats`.

**Estrutura de cada stat item:**

```json
{
  "all":         { "home": <number>, "away": <number> },
  "first_half":  { "home": <number>, "away": <number> },
  "second_half": { "home": <number>, "away": <number> }
}
```

**Categorias disponíveis:**

| Categoria | Stats incluídas |
| --- | --- |
| `overview` | possession, fouls, yellow/red cards, offsides |
| `shots` | total, on_target, off_target, blocked |
| `attack` | corners, crosses, dribbles |
| `passes` | total, accurate |
| `duels` | total, won (ground + aerial) |
| `defending` | clearances, interceptions, tackles |
| `goalkeeping` | saves, punches, high claims |
| `np_expected_goals` | npxG por time (all, first_half, second_half) |

**Response completa:**

```json
{
  "data": {
    "match_id": "mt_14502",
    "overview": {
      "possession": { "all": { "home": 54, "away": 46 } },
      "fouls":      { "all": { "home": 11, "away": 13 } }
    },
    "shots": {
      "total":     { "all": { "home": 14, "away": 9 } },
      "on_target": { "all": { "home": 6, "away": 4 } }
    },
    "attack": {
      "corners": { "all": { "home": 7, "away": 3 } }
    },
    "passes": {
      "total":    { "all": { "home": 512, "away": 438 } },
      "accurate": { "all": { "home": 461, "away": 389 } }
    },
    "duels": {
      "total": { "all": { "home": 102, "away": 98 } },
      "won":   { "all": { "home": 55, "away": 47 } }
    },
    "defending": {
      "clearances": { "all": { "home": 18, "away": 22 } }
    },
    "goalkeeping": {
      "saves": { "all": { "home": 4, "away": 6 } }
    },
    "np_expected_goals": {
      "all":         { "home": 1.82, "away": 0.94 },
      "first_half":  { "home": 0.76, "away": 0.41 },
      "second_half": { "home": 1.06, "away": 0.53 }
    }
  }
}
```

> ⚠️ `np_expected_goals` só é populado quando `xg_available = true` no match.
> 

### 9.4 `GET /football/matches/{match_id}/player-stats` — Stats de jogadores na partida

**Uso no BigDataBet:** Fase futura — stats individuais para análises avançadas.

| Parâmetro | Tipo | Local | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `match_id` | string | path | sim | ID do jogo |
| `player_ids` | string | query | não | IDs separados por vírgula para filtrar |

**Response (por jogador):**

```json
{
  "data": [
    {
      "player_id": "pl_6241",
      "player_name": "Mohamed Salah",
      "team_id": "tm_8923",
      "position": "F",
      "rating": 8.2,
      "minutes_played": 90,
      "started": true,
      "played": true,
      "passing": { "total": 42, "accurate": 38, "key_passes": 3 },
      "shooting": { "total": 5, "on_target": 3, "goals": 1 },
      "duels": { "total": 12, "won": 8 },
      "defending": { "tackles": 2, "interceptions": 1 },
      "goalkeeping": null,
      "general": {
        "dribbles_attempted": 6,
        "dribbles_succeeded": 4,
        "fouls_drawn": 3,
        "fouls_committed": 1,
        "yellow_cards": 0,
        "red_cards": 0
      }
    }
  ]
}
```

**Campos de cada jogador:**

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `player_id` | string | ID do jogador |
| `player_name` | string | Nome completo |
| `team_id` | string | Time que representou nesta partida |
| `position` | string | `F` | `M` | `D` | `G` |
| `rating` | number|null | Nota de desempenho (ex: 8.2) |
| `minutes_played` | integer | Minutos em campo |
| `started` | boolean | Se foi titular |
| `played` | boolean | Se entrou em campo (inclui subs) |
| `passing` | object | `total`, `accurate`, `key_passes` |
| `shooting` | object | `total`, `on_target`, `goals`, `expected_goals` |
| `duels` | object | `total`, `won` |
| `defending` | object | `tackles`, `interceptions`, `clearances` |
| `goalkeeping` | object|null | Só para goleiros |
| `general` | object | Dribles, faltas, cartões, impedimentos |

### 9.5 `GET /football/matches/{match_id}/shotmap` — Mapa de chutes com xG

**Uso no BigDataBet:** Visualizações de xG, gráficos de timeline xG, pitch maps.

| Parâmetro | Tipo | Local | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `match_id` | string | path | sim | ID do jogo |
| `player_id` | string | query | não | Filtrar chutes de um jogador |

> ⚠️ Só funciona se `xg_available = true` no match. Caso contrário retorna `data: []`.
> 

**Response:**

```json
{
  "match_id": "mt_14502",
  "event": {
    "id": "mt_14502",
    "home_team_id": "tm_8923",
    "away_team_id": "tm_4512"
  },
  "data": [
    {
      "id": "sh_4812",
      "player_id": "pl_6241",
      "player_name": "Mohamed Salah",
      "team_id": "tm_8923",
      "team_name": "Liverpool",
      "x": 88.4,
      "y": 51.2,
      "minute": 24,
      "result": "goal",
      "expected_goals": 0.32,
      "situation": "regular",
      "body_part": "right-foot",
      "goal_type": "regular",
      "goal_mouth_location": "high-left",
      "is_blocked_shot": false,
      "blocked_by_player_id": null,
      "goalkeeper": { "id": "pl_8959", "name": "Manuel Neuer" },
      "is_goal": true,
      "is_on_target": true,
      "is_headed": false,
      "is_outside_box": false,
      "is_penalty": false
    }
  ],
  "np_xg_summary": {
    "live":   { "home_team": 1.45, "away_team": 0.82 },
    "stored": { "home_team": 1.45, "away_team": 0.82 }
  }
}
```

**Campos de cada Shot:**

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | ID do chute (`sh_XXXX`) |
| `player_id` | string | Quem chutou |
| `player_name` | string | Nome do atirador |
| `team_id` | string | Time do atirador |
| `x` | number | Coord X (0–100, gol em x≈100) |
| `y` | number | Coord Y (0–100, centro em y=50) |
| `minute` | integer | Minuto do chute |
| `result` | string | `goal` | `saved` | `miss` | `block` | `post` |
| `expected_goals` | number|null | xG do chute individual |
| `situation` | string|null | `regular` | `set_piece` | `fast_break` |
| `body_part` | string|null | `right-foot` | `left-foot` | `head` |
| `goal_type` | string|null | Só para gols: `regular` | `own` | `penalty` |
| `goal_mouth_location` | string|null | Onde acertou o gol: `high-left`, etc. |
| `is_goal` | boolean | Se resultou em gol |
| `is_on_target` | boolean | Se foi no alvo |
| `is_headed` | boolean | Se foi cabeceio |
| `is_outside_box` | boolean | Se foi fora da área |
| `is_penalty` | boolean | Se foi pênalti |
| `is_blocked_shot` | boolean | Se foi bloqueado |
| `blocked_by_player_id` | string|null | Quem bloqueou |
| `goalkeeper` | object|null | `{ id, name }` do goleiro |

**`np_xg_summary`:**

| Campo | Descrição |
| --- | --- |
| `live` | npxG calculado em tempo real |
| `stored` | npxG pré-computado (armazenado) |

### 9.6 `GET /football/matches/{match_id}/odds` — Odds pré-jogo

**Uso no BigDataBet:** Popular tabela `MatchOdds` para backtests e value analysis.

> ⚠️ Disponível apenas para jogos futuros em competições suportadas, **até 6 dias antes do kickoff**.
Verificar `odds_available = true` no match detail antes de chamar.
> 

**Response:**

```json
{
  "data": {
    "match_id": "mt_14502",
    "bookmakers": [
      {
        "bookmaker": "Pinnacle",
        "markets": {
          "match_odds": {
            "home":  { "opening": "2.100", "last_seen": "2.050" },
            "draw":  { "opening": "3.400", "last_seen": "3.500" },
            "away":  { "opening": "3.200", "last_seen": "3.300" }
          },
          "btts": {
            "yes": { "opening": "1.750", "last_seen": "1.810" },
            "no":  { "opening": "2.100", "last_seen": "2.050" }
          },
          "total_goals": {
            "over_2_5": {
              "over":  { "opening": "1.850", "last_seen": "1.870" },
              "under": { "opening": "2.000", "last_seen": "1.980" }
            }
          },
          "match_corners": {
            "over_9_5": {
              "over":  { "opening": "1.900", "last_seen": "1.920" },
              "under": { "opening": "1.920", "last_seen": "1.900" }
            }
          },
          "asian_handicap": {
            "home": { "opening": "1.950", "last_seen": "1.960" },
            "away": { "opening": "1.930", "last_seen": "1.940" }
          }
        }
      }
    ]
  }
}
```

**Estrutura de odds:**

| Nível | Descrição |
| --- | --- |
| `bookmakers` | Array — cada item é um bookmaker com seus mercados |
| `bookmaker` | Nome: "Pinnacle", "Bet365", "Betfair Exchange", "Kambi" |
| `markets` | Objeto com os mercados disponíveis (varia por bookmaker) |
| Cada seleção | `{ "opening": "2.100", "last_seen": "2.050" }` |

**Mercados disponíveis:**

| Market Key | Seleções | Descrição |
| --- | --- | --- |
| `match_odds` | `home`, `draw`, `away` | 1X2 |
| `btts` | `yes`, `no` | Ambas marcam |
| `total_goals` | `over_X_Y` → `over`, `under` | Over/Under (ex: 2.5) |
| `match_corners` | `over_X_Y` → `over`, `under` | Escanteios Over/Under |
| `asian_handicap` | `home`, `away` | Handicap Asiático |

> **Nota:** Valores de odds são **strings** (ex: `"2.100"`), não numbers. Converter com `parseFloat()`.
Comparar `opening` vs `last_seen` para detectar line movement pré-kickoff.
> 

---

## 10. Endpoints — Players

### 10.1 `GET /football/players` — Listar jogadores

| Parâmetro | Tipo | Default | Descrição |
| --- | --- | --- | --- |
| `page` | number | 1 | Página |
| `per_page` | number | 20 | Resultados por página (max 100) |
| `team_id` | string | — | Filtrar por time |
| `position` | string | — | `Forward` | `Midfielder` | `Defender` | `Goalkeeper` |
| `search` | string | — | Busca parcial por nome |
| `player_ids` | string | — | IDs separados por vírgula (batch fetch) |

### 10.2 `GET /football/players/{player_id}` — Perfil do jogador

Retorna os mesmos campos da listagem para um jogador específico.

### 10.3 `GET /football/players/{player_id}/stats` — Stats da temporada

| Parâmetro | Tipo | Local | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `player_id` | string | path | sim | ID do jogador |
| `season_id` | string | query | sim | Temporada |
| `competition_id` | string | query | não | Filtrar por competição |

> ⚠️ Só retorna dados se `has_player_stats = true` na competição.
> 

**Response:**

```json
{
  "data": {
    "player_id": "pl_6241",
    "season_id": "sn_7210",
    "team_id": "tm_8923",
    "position": "F",
    "rating": 7.84,
    "appearances": 37,
    "starts": 35,
    "minutes_played": 3060,
    "scoring": {
      "goals": 19,
      "assists": 10,
      "expected_goals": 16.2,
      "expected_assists": 8.5
    },
    "shooting": {
      "total_shots": 98,
      "shots_on_target": 52,
      "shot_accuracy": 53.1
    },
    "passing": {
      "total_passes": 1420,
      "accurate_passes": 1210,
      "pass_accuracy": 85.2,
      "key_passes": 72
    },
    "defending": {
      "tackles": 28,
      "interceptions": 14,
      "clearances": 3
    },
    "duels": {
      "total": 310,
      "won": 168,
      "win_rate": 54.2
    },
    "discipline": {
      "yellow_cards": 3,
      "red_cards": 0,
      "fouls_committed": 24,
      "fouls_drawn": 67
    }
  }
}
```

---

## 11. Flags de Disponibilidade

Flags são booleanos que indicam se determinada categoria de dados existe.
**Sempre checar antes de chamar o endpoint correspondente.**

| Flag | Presente em | Governa | Se `false` |
| --- | --- | --- | --- |
| `has_team_stats` | Competition | `/teams/{id}/stats` | Retorna vazio |
| `has_player_stats` | Competition | `/players/{id}/stats` | Retorna vazio |
| `xg_available` | Competition, Match | `/matches/{id}/shotmap`, `/matches/{id}/stats` (npxG) | `data: []` ou npxG null |
| `odds_available` | MatchDetail | `/matches/{id}/odds` | Retorna vazio |

> **Cuidado:** Endpoints com dados indisponíveis retornam **200 OK com array/objeto vazio**,
não 404. Sem checar a flag, parece que o jogo não tem dados quando na verdade o dado
simplesmente não existe para aquela competição/partida.
> 

---

## 12. Bookmakers e Mercados de Odds

### Bookmakers

| Nome | Tipo | Perfil |
| --- | --- | --- |
| **Pinnacle** | Sharp | Referência para CLV, aceita winners |
| **Bet365** | Retail | Maior cobertura, preço varejo |
| **Betfair Exchange** | Exchange | Preço de mercado peer-to-peer, no-vig benchmark |
| **Kambi** | B2B | Engine de odds para dezenas de operadores |

### Mercados

| Mercado | Key no JSON | Seleções |
| --- | --- | --- |
| 1X2 | `match_odds` | home, draw, away |
| Ambas Marcam | `btts` | yes, no |
| Over/Under Gols | `total_goals` | over_X_Y → over, under |
| Over/Under Corners | `match_corners` | over_X_Y → over, under |
| Handicap Asiático | `asian_handicap` | home, away |
| Draw No Bet | (a confirmar) | home, away |

### Formato de cada preço

```json
{ "opening": "2.100", "last_seen": "2.050" }
```

- **`opening`**: Primeira odd publicada pelo bookmaker
- **`last_seen`**: Última odd antes do kickoff (snapshot final)
- **Tipo:** string (converter com `parseFloat()`)

---

## 13. Cobertura e Limites

### Cobertura

| Métrica | Valor |
| --- | --- |
| Competições padrão | 80 |
| Competições sob demanda | Até 1.196 |
| Jogadores rastreados | 84.000+ |
| Histórico | 10-20 anos (ligas top) |
| Países | 100+ |
| Bookmakers | 4 |
| Mercados de odds | 5+ |

### Timing de atualização

| Dado | Disponibilidade |
| --- | --- |
| Resultado e placar | Minutos após apito final |
| Stats completas + eventos | 1-2 horas |
| Player stats atualizadas | 1-2 horas |
| Odds (pré-jogo) | Antes do kickoff |
| xG data | 1-2 horas |

### Rate limits (plano Starter, $50/mês)

| Métrica | Limite |
| --- | --- |
| Requests/minuto | 30 |
| Requests/mês | 100.000 |
| `per_page` máximo | 100 |

### Em desenvolvimento (roadmap)

| Feature | Status |
| --- | --- |
| Live Scores | Em breve |
| Inplay Odds | Em breve |
| Player Heatmaps | Em breve |
| Lineups confirmadas | Em breve |

---

## 14. Mapa de Ingestão — BigDataBet

### Fluxo completo de sync para uma liga

```
1. GET /competitions?search=Premier → comp_3879
2. GET /competitions/comp_3879     → current_season_id = sn_7210
3. GET /teams?competition_id=comp_3879&season_id=sn_7210 → [tm_...]
4. GET /matches?competition_id=comp_3879&season_id=sn_7210&status=finished&per_page=100
   → paginar até total_pages → [mt_...]
5. Para cada match:
   5a. GET /matches/{mt_id}         → venue, referee, flags
   5b. GET /matches/{mt_id}/stats   → MatchStats (se finished)
   5c. GET /matches/{mt_id}/odds    → MatchOdds (se odds_available)
   5d. GET /matches/{mt_id}/shotmap → xG individual (se xg_available)
6. GET /teams/{tm_id}/stats?season_id=sn_7210 → Standing (para cada time)
```

### Endpoint → Tabela Prisma

| Endpoint | Tabelas populadas | Req/jogo |
| --- | --- | --- |
| `GET /competitions` | `League` | — |
| `GET /competitions/{id}` | `League` (season), `Season` | — |
| `GET /teams` | `Team`, `TeamSeason`, `TeamAlias` | — |
| `GET /teams/{id}` | `Team` (stadium) | — |
| `GET /teams/{id}/stats` | `Standing` | — |
| `GET /matches` (listagem) | `Match` (core) | — |
| `GET /matches/{id}` | `Match` (venue, referee) | 1 |
| `GET /matches/{id}/stats` | `MatchStats` | 1 |
| `GET /matches/{id}/odds` | `MatchOdds[]` | 1 |
| `GET /matches/{id}/shotmap` | `MatchRaw` (payload), xG nos stats | 1 |
| `GET /matches/{id}/player-stats` | (Fase futura) | 1 |

---

## 15. Estimativa de Consumo de Requests

### Full sync — 1 liga, 1 temporada (380 jogos)

| Operação | Requests |
| --- | --- |
| Listar competições | 1 |
| Detalhe da competição | 1 |
| Listar times | 1 |
| Listar matches (380/100 = 4 páginas) | 4 |
| Match detail × 380 | 380 |
| Match stats × 380 | 380 |
| Match odds × 380 | 380 |
| Match shotmap × 380 | 380 |
| Team stats × 20 times | 20 |
| **Total** | **~1.547** |

### Incremental semanal (1 rodada, 10 jogos)

| Operação | Requests |
| --- | --- |
| Listar matches (filtro data) | 1 |
| Match detail × 10 | 10 |
| Match stats × 10 | 10 |
| Match odds × 10 | 10 |
| Match shotmap × 10 | 10 |
| **Total** | **~41** |

### Budget mensal (plano 100k req/mês)

| Cenário | Requests/mês | % do plano |
| --- | --- | --- |
| 5 ligas full sync (inicial) | ~7.735 | 7.7% |
| 20 ligas full sync (inicial) | ~30.940 | 30.9% |
| 60 ligas full sync (Fase 4) | ~92.820 | 92.8% |
| Incremental semanal, 10 ligas × 4 sem | ~1.640 | 1.6% |
| **Full sync 20 ligas + incremental** | **~32.580** | **32.6%** |

> **Recomendação:** Full sync inicial de até 20 ligas cabe no plano.
Para 60+ ligas, fazer em 2 meses ou pedir upgrade temporário.
Incremental semanal consome quase nada — priorizar este modo pós-sync inicial.
> 

---

## Notas para Desenvolvimento

### Variáveis de ambiente necessárias

```
STATS_API_KEY=your_bearer_token_here
STATS_API_BASE_URL=https://api.thestatsapi.com/api
```

### Headers padrão para o client

```tsx
// lib/api/statsapi-client.ts
const HEADERS = {
  'Authorization': `Bearer ${process.env.STATS_API_KEY}`,
  'Content-Type': 'application/json',
} as const
```

### Conversões importantes

| Dado da API | Conversão necessária | Motivo |
| --- | --- | --- |
| Odds values | `parseFloat("2.100")` → `2.1` | Vêm como string |
| IDs | Armazenar como `externalId` (string) | Prefixados (`comp_`, `tm_`) |
| `utc_date` | `new Date("2024-01-15T15:00:00.000Z")` | ISO 8601 UTC |
| `score.home` | Mapear para `fthg` (int) | Schema BigDataBet |
| `matchday` | Mapear para `round` (int) | Schema BigDataBet |

### Checklist pré-request

1. ✅ `STATS_API_KEY` configurada no `.env`
2. ✅ Header `Authorization: Bearer ...` presente
3. ✅ Verificar flags antes de enriquecer (`xg_available`, `odds_available`, `has_team_stats`)
4. ✅ Usar `per_page=100` para minimizar requests
5. ✅ Respeitar rate limit de 30 req/min (throttle no sync engine)
6. ✅ Logar requests no `ApiQuotaLog` para controle de consumo