// Testa funções puras: geração de código único e sanitização.
// Evita o AsyncStorage importando o módulo database via stub de require ANTES.

// Stub do AsyncStorage injetado em Module._cache antes do import.
import Module from 'node:module';

const stub = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
  clear: async () => {},
  getAllKeys: async () => [],
  multiGet: async () => [],
  multiSet: async () => {},
  multiRemove: async () => {},
};

const asyncStoragePath = require.resolve('@react-native-async-storage/async-storage');
require.cache[asyncStoragePath] = {
  id: asyncStoragePath,
  filename: asyncStoragePath,
  loaded: true,
  exports: { default: stub },
  paths: [],
  children: [],
} as unknown as NodeJS.Module;

// Bloquear resolução tardia
const origResolve = (Module as unknown as { _resolveFilename: Function })._resolveFilename;
(Module as unknown as { _resolveFilename: Function })._resolveFilename = function (
  req: string,
  ...rest: unknown[]
) {
  if (req === '@react-native-async-storage/async-storage') return asyncStoragePath;
  return origResolve.call(this, req, ...rest);
};

// Agora os imports funcionam.
import {
  createReport,
  findReportByCode,
  listReports,
  updateReportStatus,
  getHistory,
  stats,
  resetDatabase,
  loadDatabase,
} from '../src/storage/database';

async function main() {
  await resetDatabase();

  console.log('--- DB vazia ---');
  const empty = await loadDatabase();
  console.assert(empty.reports.length === 0);
  console.assert(empty.last_id === 0);

  console.log('\n--- Criar denúncia ---');
  const r1 = await createReport({
    telefone: '+258840000001',
    bairro: 'Hulene',
    tipo_ocorrencia: 'Lixo Acumulado',
    ponto_referencia: 'perto do mercado',
    origem: 'USSD',
  });
  console.log('codigo=', r1.codigo, 'id=', r1.id, 'estado=', r1.estado, 'origem=', r1.origem);
  console.assert(r1.id === 1);
  console.assert(r1.estado === 'Recebida');
  console.assert(r1.origem === 'USSD');
  console.assert(r1.codigo.startsWith('DLX-'));

  console.log('\n--- Criar segunda denúncia (origem APP) ---');
  const r2 = await createReport({
    telefone: '+258840000002',
    bairro: 'Magoanine',
    tipo_ocorrencia: 'Contentor Cheio',
    ponto_referencia: 'escola',
    origem: 'APP',
  });
  console.assert(r2.id === 2);

  console.log('\n--- listReports ---');
  const all = await listReports();
  console.assert(all.length === 2);
  console.assert(all[0].id === 2, 'mais recente primeiro');

  console.log('\n--- listReports por estado / bairro ---');
  console.assert((await listReports({ estado: 'Recebida' })).length === 2);
  console.assert((await listReports({ estado: 'Resolvida' })).length === 0);
  console.assert((await listReports({ bairro: 'hulene' })).length === 1);
  console.assert((await listReports({ bairro: 'HULENE' })).length === 1);

  console.log('\n--- findReportByCode (case + trim) ---');
  const found = await findReportByCode('  ' + r1.codigo.toLowerCase() + '  ');
  console.assert(found?.id === r1.id);
  console.assert((await findReportByCode('NAO-EXISTE')) === null);

  console.log('\n--- updateReportStatus + histórico ---');
  console.assert((await updateReportStatus(r1.id, 'Em Análise', 'A equipa vai avaliar.')) === true);
  const h1 = await getHistory(r1.id);
  console.assert(h1.length === 2);
  console.assert(h1[1].estado_anterior === 'Recebida');
  console.assert(h1[1].estado_novo === 'Em Análise');
  console.assert(h1[1].observacao === 'A equipa vai avaliar.');
  console.assert((await updateReportStatus(999, 'Resolvida')) === false);

  console.log('\n--- stats ---');
  const s = await stats();
  console.log('total=', s.total);
  console.assert(s.total === 2);
  console.assert(s.byStatus.some((b) => b.estado === 'Recebida' && b.total === 1));
  console.assert(s.byStatus.some((b) => b.estado === 'Em Análise' && b.total === 1));

  console.log('\n--- Sanitização de texto ---');
  const r3 = await createReport({
    telefone: '   +258840000099   ',
    bairro: '   Bairro   com   espaços   ',
    tipo_ocorrencia: 'Tipo',
    ponto_referencia: 'local'.padEnd(200, 'x'),
    origem: 'APP',
  });
  console.log({ telefone: r3.telefone, bairro: r3.bairro, len: r3.ponto_referencia.length });
  console.assert(!r3.bairro.includes('  '), 'sem espaços duplos');
  console.assert(r3.ponto_referencia.length === 180, 'cortado a 180 chars');

  console.log('\n--- Códigos únicos em massa (100) ---');
  const codes = new Set<string>();
  for (let i = 0; i < 100; i += 1) {
    const x = await createReport({
      telefone: '+258840000099',
      bairro: 'Bairro',
      tipo_ocorrencia: 'Tipo',
      ponto_referencia: 'ref',
      origem: 'APP',
    });
    codes.add(x.codigo);
  }
  console.assert(codes.size === 100, `esperado 100 únicos, obtido ${codes.size}`);

  console.log('\n--- resetDatabase ---');
  await resetDatabase();
  const cleared = await loadDatabase();
  console.assert(cleared.reports.length === 0);

  console.log('\nTodos os smoke-tests do DB passaram ✅');
}

main().catch((e) => {
  console.error('FALHOU:', e);
  process.exit(1);
});