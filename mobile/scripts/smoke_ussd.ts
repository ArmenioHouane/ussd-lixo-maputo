// Smoke-test do motor USSD em Node puro.
// Executa: npx tsx scripts/smoke_ussd.ts
// (Não depende de React Native.)
import { handle, renderMenu } from '../src/ussd/engine';
import { NEIGHBORHOODS, OCCURRENCE_TYPES, SERVICE_CODE } from '../src/data/catalog';
import type { Report } from '../src/types';

let lastCreated: Report | null = null;
const fakeDb: Report[] = [];

async function main() {
  const phone = '+258840000001';
  const create = async (data: {
    telefone: string;
    bairro: string;
    tipo_ocorrencia: string;
    ponto_referencia: string;
    origem: 'USSD';
  }): Promise<Report> => {
    const now = new Date().toISOString();
    const report: Report = {
      id: fakeDb.length + 1,
      codigo: `DLX-TEST-${fakeDb.length + 1}`,
      telefone: data.telefone,
      bairro: data.bairro,
      tipo_ocorrencia: data.tipo_ocorrencia,
      ponto_referencia: data.ponto_referencia,
      estado: 'Recebida',
      origem: 'USSD',
      created_at: now,
      updated_at: now,
    };
    fakeDb.push(report);
    lastCreated = report;
    return report;
  };
  const find = async (code: string): Promise<Report | null> =>
    fakeDb.find((r) => r.codigo === code) ?? null;

  console.log('--- Menu inicial ---');
  const r0 = await handle({ phoneNumber: phone, text: '' }, create, find);
  console.log(r0.kind, JSON.stringify(r0.text));
  console.assert(r0.kind === 'CON', 'menu inicial devia ser CON');

  console.log('\n--- Opção 4 (sair) ---');
  const r4 = await handle({ phoneNumber: phone, text: '4' }, create, find);
  console.log(r4.kind, JSON.stringify(r4.text));
  console.assert(r4.kind === 'END', 'opção 4 devia ser END');

  console.log('\n--- Opção 3 (info) ---');
  const r3 = await handle({ phoneNumber: phone, text: '3' }, create, find);
  console.log(r3.kind, JSON.stringify(r3.text));
  console.assert(r3.kind === 'END', 'opção 3 devia ser END');

  console.log('\n--- Opção inválida ---');
  const rX = await handle({ phoneNumber: phone, text: '9' }, create, find);
  console.log(rX.kind, JSON.stringify(rX.text));
  console.assert(rX.kind === 'END', 'opção inválida devia ser END');

  console.log('\n--- Denúncia bairro listado ---');
  console.log(await handle({ phoneNumber: phone, text: '1' }, create, find));
  console.log(await handle({ phoneNumber: phone, text: '1*1' }, create, find));
  console.log(await handle({ phoneNumber: phone, text: '1*1*2' }, create, find));
  console.log(
    await handle({ phoneNumber: phone, text: '1*1*2*perto do mercado' }, create, find),
  );
  const confirmed = await handle(
    { phoneNumber: phone, text: '1*1*2*perto do mercado*1' },
    create,
    find,
  );
  console.log(confirmed.kind, confirmed.text);
  console.assert(confirmed.kind === 'END', 'fim da denúncia devia ser END');
  console.assert(lastCreated !== null, 'denúncia devia ter sido criada');
  console.assert(fakeDb.length === 1, 'deveria haver 1 denúncia na fake db');

  console.log('\n--- Denúncia bairro "Outro" (5) ---');
  console.log(await handle({ phoneNumber: phone, text: '1*5' }, create, find));
  console.log(await handle({ phoneNumber: phone, text: '1*5*Polana' }, create, find));
  console.log(await handle({ phoneNumber: phone, text: '1*5*Polana*3' }, create, find));
  console.log(
    await handle({ phoneNumber: phone, text: '1*5*Polana*3*perto da escola' }, create, find),
  );
  const c2 = await handle(
    { phoneNumber: phone, text: '1*5*Polana*3*perto da escola*1' },
    create,
    find,
  );
  console.log(c2.kind, c2.text);
  console.assert(fakeDb.length === 2, 'deveria haver 2 denúncias agora');

  console.log('\n--- Cancelar (1*1*1*ref*2) ---');
  const cCancel = await handle(
    { phoneNumber: phone, text: '1*1*1*local cancelado*2' },
    create,
    find,
  );
  console.log(cCancel.kind, cCancel.text);
  console.assert(cCancel.kind === 'END', 'cancelar devia ser END');
  console.assert(fakeDb.length === 2, 'cancelar não devia criar denúncia');

  console.log('\n--- Bairro inválido ---');
  const rBadBairro = await handle(
    { phoneNumber: phone, text: '1*99' },
    create,
    find,
  );
  console.log(rBadBairro.kind, rBadBairro.text);
  console.assert(rBadBairro.kind === 'END', 'bairro inválido devia ser END');

  console.log('\n--- Tipo inválido ---');
  const rBadTipo = await handle(
    { phoneNumber: phone, text: '1*1*9' },
    create,
    find,
  );
  console.log(rBadTipo.kind, rBadTipo.text);
  console.assert(rBadTipo.kind === 'END', 'tipo inválido devia ser END');

  console.log('\n--- Consulta código ---');
  if (lastCreated) {
    const q1 = await handle(
      { phoneNumber: phone, text: '2' },
      create,
      find,
    );
    console.log(q1.kind, JSON.stringify(q1.text));
    console.assert(q1.kind === 'CON', 'consulta sem código devia ser CON');

    const q2 = await handle(
      { phoneNumber: phone, text: `2*${lastCreated.codigo}` },
      create,
      find,
    );
    console.log(q2.kind, q2.text.split('\n')[0]);
    console.assert(q2.kind === 'END', 'consulta encontrada devia ser END');

    const q3 = await handle(
      { phoneNumber: phone, text: '2*NAO-EXISTE' },
      create,
      find,
    );
    console.log(q3.kind, q3.text);
    console.assert(q3.kind === 'END', 'consulta inexistente devia ser END');
  }

  console.log('\n--- renderMenu() ---');
  console.log(renderMenu(NEIGHBORHOODS));
  console.log(renderMenu(OCCURRENCE_TYPES));

  console.log('\nSERVICE_CODE:', SERVICE_CODE);
  console.log('\nTodos os smoke-tests passaram ✅');
}

main().catch((e) => {
  console.error('FALHOU:', e);
  process.exit(1);
});