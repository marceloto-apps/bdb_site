import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getBalance } from '@/lib/points/balance';
import { getStatus } from '@/lib/points/status';
import { awardPoints } from '@/lib/points/award';
import { redeemReward } from '@/lib/points/redeem';
import { expirePoints } from '@/lib/points/expire';

describe('BDB Points - Testes do Domínio', () => {
  let testUser: any;
  let testRule: any;
  let testReward: any;

  beforeEach(async () => {
    // Limpeza profunda de tabelas para isolamento total entre os testes
    await prisma.pointTransaction.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.pointRule.deleteMany();
    await prisma.rewardOption.deleteMany();
    await prisma.user.deleteMany();

    // 1. Criar usuário de teste padrão
    testUser = await prisma.user.create({
      data: {
        name: 'Test Points User',
        email: `test-points-${Date.now()}@example.com`,
        role: 'MEMBRO',
        plan: 'FREE',
      },
    });

    // 2. Criar regra de pontos de teste padrão
    testRule = await prisma.pointRule.create({
      data: {
        action: 'TEST_ACTION',
        label: 'Test Action Label',
        points: 100,
        active: true,
        countsToCap: true,
      },
    });

    // 3. Criar opção de recompensa de teste padrão
    testReward = await prisma.rewardOption.create({
      data: {
        label: 'Test Reward 10%',
        pointsCost: 50,
        discountPct: 10,
        appliesTo: 'SUBSCRIPTION',
        couponValidityDays: 15,
        active: true,
      },
    });
  });

  it('1. Cálculo de saldo (Event Sourcing puro - sinais)', async () => {
    // Inicialmente saldo deve ser 0
    expect(await getBalance(testUser.id)).toBe(0);

    // Conceder GANHO +100
    await prisma.pointTransaction.create({
      data: {
        userId: testUser.id,
        type: 'GANHO',
        amount: 100,
        reason: 'Ganho teste',
      },
    });
    expect(await getBalance(testUser.id)).toBe(100);

    // Lançar RESGATE -30
    await prisma.pointTransaction.create({
      data: {
        userId: testUser.id,
        type: 'RESGATE',
        amount: -30,
        reason: 'Resgate teste',
      },
    });
    expect(await getBalance(testUser.id)).toBe(70);

    // Lançar ESTORNO -20
    await prisma.pointTransaction.create({
      data: {
        userId: testUser.id,
        type: 'ESTORNO',
        amount: -20,
        reason: 'Estorno teste',
      },
    });
    expect(await getBalance(testUser.id)).toBe(50);
  }, 30000);

  it('2. Cálculo de status (Móvel 12m, ignora resgates)', async () => {
    // Inserir transações de ganho dentro e fora dos 12 meses
    const now = new Date();
    
    // GANHO +1000 hoje
    await prisma.pointTransaction.create({
      data: {
        userId: testUser.id,
        type: 'GANHO',
        amount: 1000,
        reason: 'Ganho hoje',
        createdAt: now,
      },
    });

    // GANHO +2000 de 13 meses atrás
    const thirteenMonthsAgo = new Date();
    thirteenMonthsAgo.setFullYear(now.getFullYear() - 1);
    thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 1);
    await prisma.pointTransaction.create({
      data: {
        userId: testUser.id,
        type: 'GANHO',
        amount: 2000,
        reason: 'Ganho antigo',
        createdAt: thirteenMonthsAgo,
      },
    });

    // RESGATE -300 hoje (deve ser ignorado no cálculo de status)
    await prisma.pointTransaction.create({
      data: {
        userId: testUser.id,
        type: 'RESGATE',
        amount: -300,
        reason: 'Resgate',
        createdAt: now,
      },
    });

    const statusInfo = await getStatus(testUser.id);
    // Deve considerar apenas o GANHO de hoje (1000 pts)
    expect(statusInfo.pointsInPeriod).toBe(1000);
    expect(statusInfo.currentStatus).toBe('Prata'); // Prata é de 500 a 1999
  }, 30000);

  it('3. Limite diário, mensal e cap de plano (com truncamento)', async () => {
    // Criar regra com dailyCap = 2 usando prefixo de teste (__TEST_CAPPED__)
    const cappedRule = await prisma.pointRule.create({
      data: {
        action: '__TEST_CAPPED__',
        label: 'Capped Action Test',
        points: 40,
        dailyCap: 2,
        countsToCap: true,
      },
    });

    // Executar 3 concessões consecutivas
    const tx1 = await awardPoints(testUser.id, '__TEST_CAPPED__', 'r1');
    const tx2 = await awardPoints(testUser.id, '__TEST_CAPPED__', 'r2');
    const tx3 = await awardPoints(testUser.id, '__TEST_CAPPED__', 'r3');

    expect(tx1).not.toBeNull();
    expect(tx2).not.toBeNull();
    expect(tx3).toBeNull(); // Terceira concessão bate no dailyCap e retorna null

    // Testar teto do plano FREE (limite 300 pts)
    // Já acumulou 80 pts (40 + 40). Vamos tentar conceder mais 250 pts.
    const bigRule = await prisma.pointRule.create({
      data: {
        action: '__TEST_BIG__',
        label: 'Big Action Test',
        points: 250,
        countsToCap: true,
      },
    });

    const txBig = await awardPoints(testUser.id, '__TEST_BIG__', 'ref-big');
    expect(txBig).not.toBeNull();
    // Como 80 + 250 = 330, e o limite é 300, os pontos devem ser truncados para 300 - 80 = 220
    expect(txBig!.amount).toBe(220);

    // Tentar conceder mais pontos (já está no limite de 300)
    const txExtra = await awardPoints(testUser.id, '__TEST_BIG__', 'ref-extra');
    expect(txExtra).toBeNull(); // Deve retornar null (teto mensal atingido)
  }, 30000);

  it('4. Concorrência: Idempotência paralela com idempotencyKey', async () => {
    const action = 'TEST_ACTION';
    const refId = 'concurrency-ref';

    // Executar chamadas em paralelo
    const results = await Promise.all([
      awardPoints(testUser.id, action, refId),
      awardPoints(testUser.id, action, refId),
      awardPoints(testUser.id, action, refId),
    ]);

    // Apenas uma das chamadas deve criar a transação, as outras devem retornar null (idempotência)
    const successCount = results.filter(r => r !== null).length;
    expect(successCount).toBe(1);

    const count = await prisma.pointTransaction.count({
      where: { userId: testUser.id, refType: action, refId },
    });
    expect(count).toBe(1);
  }, 30000);

  it('5. Expiração de pontos e idempotência de expirePoints', async () => {
    // Criar um ganho expirado (expiresAt no passado)
    const expiredDate = new Date();
    expiredDate.setMonth(expiredDate.getMonth() - 1);

    const expiredGain = await prisma.pointTransaction.create({
      data: {
        userId: testUser.id,
        type: 'GANHO',
        amount: 80,
        reason: 'Ganho a expirar',
        expiresAt: expiredDate,
        idempotencyKey: `TEST_EXPIRE_GAIN:${Date.now()}`,
      },
    });

    // Rodar expiração pela primeira vez
    const expiredCountFirst = await expirePoints();
    expect(expiredCountFirst).toBe(1);

    // Verificar se a transação de EXPIRACAO foi criada
    const expirationTx = await prisma.pointTransaction.findUnique({
      where: { idempotencyKey: `EXPIRACAO:${expiredGain.id}` },
    });
    expect(expirationTx).not.toBeNull();
    expect(expirationTx!.amount).toBe(-80);

    // Rodar expiração pela segunda vez (deve ser idempotente, ou seja, no-op)
    const expiredCountSecond = await expirePoints();
    expect(expiredCountSecond).toBe(0); // Não deve criar transação duplicada
  }, 30000);

  it('6. Concorrência COMPLETAR_PERFIL: idempotência paralela no endpoint', async () => {
    // Criar a regra de pontos COMPLETAR_PERFIL
    await prisma.pointRule.create({
      data: {
        action: 'COMPLETAR_PERFIL',
        label: 'Completar Perfil',
        points: 30,
        active: true,
        countsToCap: true,
      },
    });

    // Disparar 5 chamadas simultâneas (Promise.all)
    const results = await Promise.all([
      awardPoints(testUser.id, 'COMPLETAR_PERFIL'),
      awardPoints(testUser.id, 'COMPLETAR_PERFIL'),
      awardPoints(testUser.id, 'COMPLETAR_PERFIL'),
      awardPoints(testUser.id, 'COMPLETAR_PERFIL'),
      awardPoints(testUser.id, 'COMPLETAR_PERFIL'),
    ]);

    // Apenas uma das chamadas deve criar a transação com sucesso
    const successCount = results.filter(r => r !== null).length;
    expect(successCount).toBe(1);

    // Verificar se existe apenas 1 transação no banco
    const count = await prisma.pointTransaction.count({
      where: { userId: testUser.id, refType: 'COMPLETAR_PERFIL' },
    });
    expect(count).toBe(1);

    // Garantir que a idempotencyKey criada é exatamente a esperada
    const tx = await prisma.pointTransaction.findFirst({
      where: { userId: testUser.id, refType: 'COMPLETAR_PERFIL' },
    });
    expect(tx!.idempotencyKey).toBe(`COMPLETAR_PERFIL:${testUser.id}`);
  }, 30000);
});
