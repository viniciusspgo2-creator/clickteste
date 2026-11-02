/** R2 via HTTP assinado AWS SigV4 (Node), sem SDK adicional.
 * Armazenamento de conteudo administrativo SOMENTE; nunca enviar uploads dos clientes.
 */
import 'server-only';
import { createHash, createHmac } from 'node:crypto';

const sha = (v: Uint8Array | string) => createHash('sha256').update(v).digest('hex');
const hmac = (key: Buffer | string, value: string) => createHmac('sha256', key).update(value).digest();
function conf() {
  const account = process.env.R2_ACCOUNT_ID?.trim();
  const bucket = process.env.R2_CREATIVE_BUCKET?.trim();
  const access = process.env.R2_ACCESS_KEY_ID?.trim();
  const secret = process.env.R2_SECRET_ACCESS_KEY?.trim();
  if (!account || !bucket || !access || !secret) throw new Error('Configure R2_ACCOUNT_ID, R2_CREATIVE_BUCKET, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY no projeto de testes.');
  if (!/^[a-zA-Z0-9._-]+$/.test(bucket) || !/^[a-zA-Z0-9]+$/.test(account)) throw new Error('Configuração R2 inválida.');
  return { account, bucket, access, secret };
}
export async function r2Request(method: 'PUT' | 'GET' | 'DELETE', key: string, body?: Uint8Array, contentType?: string, range?: string): Promise<Response> {
  const {account,bucket,access,secret} = conf();
  if (!/^[a-z0-9][a-z0-9/_\-.]*$/i.test(key) || key.includes('..')) throw new Error('Chave inválida.');
  const path = `/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const url = `https://${account}.r2.cloudflarestorage.com${path}`;
  const now = new Date();
  const stamp = now.toISOString().replace(/[:-]|\.\d{3}/g,'');
  const day = stamp.slice(0,8);
  const payload = body ?? new Uint8Array();
  const hash = sha(payload);
  const host = `${account}.r2.cloudflarestorage.com`;
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${hash}\nx-amz-date:${stamp}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const request = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${hash}`;
  const scope = `${day}/auto/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${stamp}\n${scope}\n${sha(request)}`;
  const kDay = hmac(`AWS4${secret}`,day);
  const kRegion = hmac(kDay,'auto');
  const kService = hmac(kRegion,'s3');
  const signingKey = hmac(kService,'aws4_request');
  const signature = createHmac('sha256',signingKey).update(stringToSign).digest('hex');
  const headers: Record<string,string> = {
    'x-amz-date':stamp,
    'x-amz-content-sha256':hash,
    Authorization:`AWS4-HMAC-SHA256 Credential=${access}/${scope},SignedHeaders=${signedHeaders},Signature=${signature}`,
  };
  if (contentType && method==='PUT') headers['content-type']=contentType;
  if (range && method==='GET' && /^bytes=\d+-\d*$/.test(range)) headers['range']=range;
  const response = await fetch(url,{method,headers,body:method==='PUT' ? Buffer.from(payload):undefined,cache:'no-store'});
  if (!response.ok) throw new Error(`Falha no R2 (${response.status}). Confira credenciais, permissões e bucket.`);
  return response;
}
