import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Categorias padrão do PRD
  const categorias = [
    { name: "Fundamentos", slug: "fundamentos" },
    { name: "Estatística e Modelos", slug: "estatistica-e-modelos" },
    { name: "Mercados", slug: "mercados" },
    { name: "Ferramentas", slug: "ferramentas" },
    { name: "Análises", slug: "analises" },
    { name: "Mentalidade", slug: "mentalidade" },
  ];

  for (const cat of categorias) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // Remove categorias antigas que não estão mais na lista oficial
  await prisma.category.deleteMany({
    where: { slug: { notIn: categorias.map(c => c.slug) } }
  });

  console.log("✅ Categorias criadas/atualizadas");

  // Usuário Admin (mesmo email do OAuth)
  await prisma.user.upsert({
    where: { email: "captariatech@gmail.com" },
    update: { role: "ADMIN", plan: "VIP_PRO" },
    create: {
      email: "captariatech@gmail.com",
      name: "Marcelo",
      role: "ADMIN",
      plan: "VIP_PRO",
    },
  });

  console.log("✅ Admin criado/atualizado com plano VIP_PRO");

  // 1. Regras de Pontos
  const pointRules = [
    { action: "CRIAR_CONTA", label: "Criar conta", points: 50, dailyCap: null, monthlyCap: null, countsToCap: true },
    { action: "CONFIRMAR_EMAIL", label: "Confirmar e-mail", points: 20, dailyCap: null, monthlyCap: null, countsToCap: true },
    { action: "COMPLETAR_PERFIL", label: "Completar perfil", points: 30, dailyCap: null, monthlyCap: null, countsToCap: true },
    { action: "LER_ESTUDO", label: "Ler estudo", points: 10, dailyCap: 5, monthlyCap: null, countsToCap: true },
    { action: "LER_ANALISE", label: "Ler análise", points: 10, dailyCap: 5, monthlyCap: null, countsToCap: true },
    { action: "FAVORITAR_CONTEUDO", label: "Favoritar conteúdo", points: 5, dailyCap: 10, monthlyCap: null, countsToCap: true }
  ];

  for (const rule of pointRules) {
    await prisma.pointRule.upsert({
      where: { action: rule.action },
      update: {
        label: rule.label,
        points: rule.points,
        dailyCap: rule.dailyCap,
        monthlyCap: rule.monthlyCap,
        countsToCap: rule.countsToCap,
      },
      create: rule,
    });
  }
  console.log("✅ Regras de pontos criadas/atualizadas");

  // 2. Opções de Recompensa
  const rewardOptions = [
    { label: "10% off na assinatura", pointsCost: 500, discountPct: 10, appliesTo: "SUBSCRIPTION", couponValidityDays: 15, active: true },
    { label: "20% off na assinatura", pointsCost: 1000, discountPct: 20, appliesTo: "SUBSCRIPTION", couponValidityDays: 15, active: true },
    { label: "15% off em curso avulso", pointsCost: 750, discountPct: 15, appliesTo: "COURSE", couponValidityDays: 30, active: true }
  ];

  for (const reward of rewardOptions) {
    const existing = await prisma.rewardOption.findFirst({
      where: { label: reward.label }
    });
    if (existing) {
      await prisma.rewardOption.update({
        where: { id: existing.id },
        data: reward,
      });
    } else {
      await prisma.rewardOption.create({
        data: reward,
      });
    }
  }
  console.log("✅ Opções de recompensa criadas/atualizadas");

  // Tags
  const tags = [
    { name: "Futebol", slug: "futebol-tag" },
    { name: "Estatística", slug: "estatistica" },
    { name: "Planilhas", slug: "planilhas-tag" },
    { name: "Estratégia", slug: "estrategia" },
  ];

  for (const t of tags) {
    await prisma.tag.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
  }
  console.log("✅ Tags criadas");

  const admin = await prisma.user.findUnique({ where: { email: "captariatech@gmail.com" } });

  if (admin) {
    const analisesCat = await prisma.category.findUnique({ where: { slug: "analises" } });
    const estudosCat = await prisma.category.findUnique({ where: { slug: "estatistica-e-modelos" } });

    const articles = [
      {
        title: "Como usar médias ponderadas para prever resultados",
        slug: "como-usar-medias-ponderadas",
        excerpt: "Neste estudo, demonstramos como o uso de médias ponderadas pode melhorar a precisão em mercados de over/under.",
        content: "## Introdução\n\nA maioria dos apostadores olha apenas para a média simples de gols. Porém, dar pesos diferentes para os jogos mais recentes (forma recente) é crucial.\n\n### O Método\n\nAplicando um peso de 50% para os últimos 5 jogos, 30% para os 5 anteriores e 20% para o restante da temporada, conseguimos uma curva muito mais ajustada à realidade do momento das equipes.",
        status: "PUBLICADO",
        type: "ESTUDO",
        authorId: admin.id,
        categoryId: estudosCat?.id,
        publishedAt: new Date(),
      },
      {
        title: "Análise estatística: Premier League 2025/26",
        slug: "analise-premier-league-2025-26",
        excerpt: "Um panorama detalhado dos números da temporada atual da liga mais disputada do mundo.",
        content: "## Premier League 2025/26\n\nNesta temporada, notamos um aumento significativo no `Expected Goals (xG)` médio por partida.\n\n- O Arsenal lidera em xG criado.\n- O Manchester City tem a melhor conversão.\n- Times como o Everton têm overperformado defensivamente.\n\nEsses dados abrem excelentes oportunidades em mercados asiáticos.",
        status: "PUBLICADO",
        type: "ANALISE",
        authorId: admin.id,
        categoryId: analisesCat?.id,
        publishedAt: new Date(),
      }
    ];

    for (const art of articles) {
      await prisma.article.upsert({
        where: { slug: art.slug },
        update: {},
        create: art as any,
      });
    }
    console.log("✅ Artigos mock criados");
  }

  // Planilhas
  await prisma.spreadsheet.deleteMany();
  const spreadsheets = [
    {
      name: "Brasileirão Série A",
      description: "Estatísticas completas do Campeonato Brasileiro Série A com xG, médias de gols e cantos.",
      league: "Série A",
      country: "Brasil",
      fileUrl: "/planilhas/brasileirao-serie-a.xlsx",
      fileName: "brasileirao-serie-a.xlsx",
      fileSize: "1.2 MB",
      isPremium: false,
      order: 1,
    },
    {
      name: "Premier League",
      description: "Dados avançados da liga inglesa, incluindo match odds justas e modelagem de Poisson.",
      league: "Premier League",
      country: "Inglaterra",
      fileUrl: "/planilhas/premier-league.xlsx",
      fileName: "premier-league.xlsx",
      fileSize: "1.5 MB",
      isPremium: false,
      order: 2,
    },
    {
      name: "La Liga",
      description: "Cobertura completa da liga espanhola com detalhamento de posse e finalizações.",
      league: "La Liga",
      country: "Espanha",
      fileUrl: "/planilhas/la-liga.xlsx",
      fileName: "la-liga.xlsx",
      fileSize: "1.1 MB",
      isPremium: false,
      order: 3,
    },
    {
      name: "Pacote 40+ Ligas",
      description: "Acesso integral a todas as mais de 40 ligas globais atualizadas diariamente, com macros automatizadas e dashboards embutidos.",
      league: "Múltiplas",
      country: "Global",
      fileUrl: "https://hub.la/g/QjzvY65eA2zEHmrpcXct",
      fileName: "Acesso Hubla",
      fileSize: "-",
      isPremium: true,
      order: 4,
    }
  ];

  for (const sheet of spreadsheets) {
    await prisma.spreadsheet.create({
      data: sheet,
    });
  }
  console.log("✅ Planilhas mock criadas");

  // 3. Planos Padrão (Fase 4 - Dynamic Config)
  const defaultPlans = [
    {
      name: "VIP Básico",
      priceCents: 3990,
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_VIP_BASICO || "",
      description: "Acesso total às análises das ligas VIP",
      features: JSON.stringify([
        "Todas as 25+ ligas VIP inclusas",
        "Previsões Dixon-Coles e NB",
        "Filtros avançados (Odds, Rodadas, Meses)",
        "Dados de xG e Mapa de Valor (Expected Value)"
      ]),
      order: 1,
      active: false
    },
    {
      name: "VIP Pro",
      priceCents: 6990,
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_VIP_PRO || "",
      description: "Ferramentas avançadas de precificação",
      features: JSON.stringify([
        "Tudo do plano VIP Básico",
        "Calculadora Poisson-2.5 integrada",
        "Juice Tracker e ferramentas adicionais",
        "Suporte prioritário via WhatsApp"
      ]),
      order: 2,
      active: false
    }
  ];

  for (const plan of defaultPlans) {
    await prisma.planConfig.upsert({
      where: { name: plan.name },
      update: {
        priceCents: plan.priceCents,
        stripePriceId: plan.stripePriceId,
        description: plan.description,
        features: plan.features,
        order: plan.order,
      },
      create: plan,
    });
  }
  console.log("✅ Planos padrão criados/atualizados (inativos por padrão)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
