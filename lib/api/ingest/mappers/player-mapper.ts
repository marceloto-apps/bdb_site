export function mapPlayerFromMatchStats(playerData: any) {
  // Mapeia posição abreviada da API para o enum do Prisma
  const positionMap: Record<string, string> = {
    F: 'FORWARD',
    M: 'MIDFIELDER',
    D: 'DEFENDER',
    G: 'GOALKEEPER',
  }

  return {
    externalId: playerData.player_id,
    name: playerData.player_name,
    position: positionMap[playerData.position] || 'FORWARD',
    currentTeamId: null as string | null, // Preenchido depois de resolver teamId
  }
}
