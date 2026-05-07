import { prisma } from '../lib/prisma';

async function main() {
  const league = await prisma.league.findUnique({ where: { slug: 'brasileirao-serie-a' } });
  if (!league) throw new Error('League not found');

  const matches = await prisma.match.findMany({
    where: {
      leagueId: league.id,
      fthg: { not: null },
      ftag: { not: null }
    }
  });

  if (matches.length === 0) {
    console.log('No matches found');
    return;
  }

  let totalHomeGoals = 0;
  let totalAwayGoals = 0;

  for (const m of matches) {
    totalHomeGoals += m.fthg!;
    totalAwayGoals += m.ftag!;
  }

  const mu_h = totalHomeGoals / matches.length;
  const mu_a = totalAwayGoals / matches.length;

  console.log(`Total Matches: ${matches.length}`);
  console.log(`μ_h (Média FTHG): ${mu_h.toFixed(2)} (Ground Truth: 1.57)`);
  console.log(`μ_a (Média FTAG): ${mu_a.toFixed(2)} (Ground Truth: 1.05)`);

  // Forças do Athletico-PR
  // μ_h_team = média de gols do time em casa
  // força de ataque em casa = μ_h_team / μ_h
  const athleticoHome = matches.filter(m => m.homeTeamId === 'tm_36261'); // athletico-pr external id is tm_36261? let's query its id
  const athletico = await prisma.team.findFirst({ where: { name: 'Athletico-PR' } });
  
  if (athletico) {
    const athleticoHomeMatches = matches.filter(m => m.homeTeamId === athletico.id);
    const athleticoAwayMatches = matches.filter(m => m.awayTeamId === athletico.id);

    const athHomeGoalsScored = athleticoHomeMatches.reduce((acc, m) => acc + m.fthg!, 0);
    const athHomeGoalsConceded = athleticoHomeMatches.reduce((acc, m) => acc + m.ftag!, 0);
    const athAwayGoalsScored = athleticoAwayMatches.reduce((acc, m) => acc + m.ftag!, 0);
    const athAwayGoalsConceded = athleticoAwayMatches.reduce((acc, m) => acc + m.fthg!, 0);

    const athMuHome = athHomeGoalsScored / athleticoHomeMatches.length || 0;
    const athMuAway = athAwayGoalsScored / athleticoAwayMatches.length || 0;
    const athDefHome = athHomeGoalsConceded / athleticoHomeMatches.length || 0;
    const athDefAway = athAwayGoalsConceded / athleticoAwayMatches.length || 0;

    const atkHome = athMuHome / mu_h;
    const atkAway = athMuAway / mu_a;
    const defHome = athDefHome / mu_a;
    const defAway = athDefAway / mu_h;

    console.log(`\nAthletico-PR:`);
    console.log(`Ataque Casa: ${atkHome.toFixed(2)}`);
    console.log(`Defesa Casa: ${defHome.toFixed(2)}`);
    console.log(`Ataque Fora: ${atkAway.toFixed(2)}`);
    console.log(`Defesa Fora: ${defAway.toFixed(2)}`);
  }
}

main().finally(() => prisma.$disconnect());
