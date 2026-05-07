import { prisma } from '../prisma'

export const TEAM_ALIASES: Record<string, string> = {
  // O mapeamento exato vai crescer com o tempo
  // BDBRA1
  'Athletico Paranaense': 'Athletico-PR',
  'Athletico': 'Athletico-PR',
  'Atletico Mineiro': 'Atlético-MG',
  'Atlético Mineiro': 'Atlético-MG',
  'Red Bull Bragantino': 'Bragantino',
  'Botafogo': 'Botafogo',
  'Corinthians': 'Corinthians',
  'Cruzeiro': 'Cruzeiro',
  'Flamengo': 'Flamengo',
  'Fluminense': 'Fluminense',
  'Fortaleza': 'Fortaleza',
  'Gremio': 'Grêmio',
  'Internacional': 'Internacional',
  'Juventude': 'Juventude',
  'Palmeiras': 'Palmeiras',
  'Sao Paulo': 'São Paulo',
  'Vasco da Gama': 'Vasco',
  'Bahia': 'Bahia',
  'Vitoria': 'Vitória',
  'Criciuma': 'Criciúma',
  'Atletico Clube Goianiense': 'Atlético-GO',
  'Cuiaba': 'Cuiabá'
}

export function normalizeTeamName(rawName: string): string {
  // Remove acentuação e converte para uppercase/lowercase padrão ou mapeia via dictionary
  return TEAM_ALIASES[rawName] || rawName
}

export async function resolveTeamAliasAsync(rawName: string, source: string): Promise<string> {
  const localNormalized = normalizeTeamName(rawName)
  
  const alias = await prisma.teamAlias.findFirst({
    where: { alias: rawName, source: source as any },
    include: { team: true }
  })
  
  if (alias) {
    return alias.team.name
  }
  
  return localNormalized
}
