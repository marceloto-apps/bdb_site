import '@testing-library/jest-dom';
import { beforeAll } from 'vitest';

beforeAll(() => {
  const url = process.env.DATABASE_URL ?? "";
  
  // A URL de teste local deve apontar para localhost:3307 (ou 127.0.0.1:3307) e usar o banco bdb_test.
  const ehBancoDeTeste = (url.includes("localhost:3307") || url.includes("127.0.0.1:3307")) && url.includes("bdb_test");
  const ehProducao = url.includes("br380.hostgator.com.br") || url.includes("bigda077_site");
  
  if (ehProducao || !ehBancoDeTeste) {
    throw new Error(
      `[TRAVA DE SEGURANÇA] ABORTADO: testes só podem rodar contra o MySQL de teste local no Docker (localhost:3307/bdb_test). URL atual: "${url}".`
    );
  }
});

