/**
 * Leitura do dataset do Backtest Livre no Cloudflare R2 (D13), lado servidor.
 *
 * O site usa um token SOMENTE LEITURA restrito ao bucket. O navegador nunca vê a chave: recebe
 * URLs assinadas de curta duração para os grupos de colunas que a regra referencia.
 * Layout do bucket: docs/Backtest_Livre_Fase1.md e bdb_ingest/src/lib/laboratorio/storage.ts.
 */
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export interface LatestDataset {
  versao: string
  geradoEm: string
  totalLinhas: number
  catalogoVersao?: string
}

function cfg() {
  const accountId = process.env.R2_ACCOUNT_ID
  const bucket = process.env.R2_BUCKET
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) return null
  return { accountId, bucket, accessKeyId, secretAccessKey }
}

export function r2Configurado(): boolean {
  return cfg() !== null
}

let cliente: S3Client | null = null

function s3(): { client: S3Client; bucket: string } {
  const c = cfg()
  if (!c) throw new Error('R2 não configurado no site (R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)')
  if (!cliente) {
    cliente = new S3Client({
      region: 'auto',
      endpoint: `https://${c.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey },
    })
  }
  return { client: cliente, bucket: c.bucket }
}

/** Chaves aceitas: `latest.json`, `<versao>/manifest.json`, `<versao>/<comp>/<temporada>/<grupo>.bin|cobertura.json`. */
export function chaveValida(chave: string): boolean {
  if (chave === 'latest.json') return true
  return /^[0-9]{8}-[0-9]{4}\/([A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/([A-Za-z0-9_.-]+\.bin|cobertura\.json)|manifest\.json)$/.test(chave)
}

/** URL assinada de leitura (padrão 15 min). */
export async function assinarUrl(chave: string, ttlSegundos = 900): Promise<string> {
  if (!chaveValida(chave)) throw new Error(`Chave inválida: ${chave}`)
  const { client, bucket } = s3()
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: chave }), { expiresIn: ttlSegundos })
}

/** Lê um objeto pequeno (JSON) direto do bucket, no servidor. */
export async function lerJson<T>(chave: string): Promise<T> {
  if (!chaveValida(chave)) throw new Error(`Chave inválida: ${chave}`)
  const { client, bucket } = s3()
  const r = await client.send(new GetObjectCommand({ Bucket: bucket, Key: chave }))
  const texto = await r.Body?.transformToString('utf-8')
  if (!texto) throw new Error(`Objeto vazio: ${chave}`)
  return JSON.parse(texto) as T
}

export function lerLatest(): Promise<LatestDataset> {
  return lerJson<LatestDataset>('latest.json')
}

/** Lê os bytes de um objeto (chunk) direto do bucket, no servidor. */
export async function lerBytes(chave: string): Promise<Uint8Array> {
  if (!chaveValida(chave)) throw new Error(`Chave inválida: ${chave}`)
  const { client, bucket } = s3()
  const r = await client.send(new GetObjectCommand({ Bucket: bucket, Key: chave }))
  const bytes = await r.Body?.transformToByteArray()
  if (!bytes) throw new Error(`Objeto vazio: ${chave}`)
  return bytes
}

/** `Buscador` do dataset para o engine em Node (rota /api/laboratorio/run, CLI sem --dir). */
export const buscadorR2 = (chave: string): Promise<Uint8Array> => lerBytes(chave)
