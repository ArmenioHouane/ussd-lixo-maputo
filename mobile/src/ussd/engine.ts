import type { Report, ReportStatus } from '../types';
import { DEFAULT_STATUS, NEIGHBORHOODS, OCCURRENCE_TYPES } from '../data/catalog';
import type { CatalogEntry } from '../types';

/**
 * Motor de menus USSD em TypeScript — porta fiel de app/UssdService.php.
 * Devolve as mesmas respostas CON/END do protocolo Africa's Talking,
 * permitindo reutilizar a lógica do protótipo PHP no simulador da app.
 */

export interface UssdRequest {
  phoneNumber: string;
  text: string;
}

export interface UssdResponse {
  kind: 'CON' | 'END';
  text: string;
}

export interface CreateReportFn {
  (data: {
    telefone: string;
    bairro: string;
    tipo_ocorrencia: string;
    ponto_referencia: string;
    origem: 'USSD';
  }): Promise<Report>;
}

const sanitize = (value: string, max = 180): string =>
  value.replace(/\s+/g, ' ').trim().slice(0, max);

export const renderMenu = (list: CatalogEntry[]): string =>
  list.map((o) => `${o.key}. ${o.label}`).join('\n');

export const buildReportSummary = (r: Report): string =>
  `Estado da denuncia ${r.codigo}: ${r.estado}\n` +
  `Bairro: ${r.bairro}\n` +
  `Tipo: ${r.tipo_ocorrencia}\n` +
  `Registada em: ${r.created_at}`;

const con = (text: string): UssdResponse => ({ kind: 'CON', text });
const end = (text: string): UssdResponse => ({ kind: 'END', text });

/**
 * handle() — equivalente directo de UssdService::handle() do PHP.
 * Recebe o texto acumulado da sessão ("1*2*3*texto") e devolve CON/END.
 */
export const handle = async (
  request: UssdRequest,
  createReport: CreateReportFn,
  findReportByCode: (code: string) => Promise<Report | null>,
): Promise<UssdResponse> => {
  const text = (request.text ?? '').trim();
  const tokens = text === '' ? [] : text.split('*').map((t) => t.trim());

  if (tokens.length === 0) {
    return con(
      'Bem-vindo ao Sistema de Denuncia de Lixo Urbano\n' +
        '1. Denunciar lixo\n' +
        '2. Consultar denuncia\n' +
        '3. Informacoes\n' +
        '4. Sair',
    );
  }

  switch (tokens[0]) {
    case '1':
      return handleReport(tokens, request.phoneNumber, createReport);
    case '2':
      return handleStatusQuery(tokens, findReportByCode);
    case '3':
      return end(
        'Este servico permite denunciar focos de lixo urbano e consultar o estado da denuncia. Nao necessita de internet.',
      );
    case '4':
      return end('Obrigado por usar o Sistema de Denuncia de Lixo Urbano.');
    default:
      return end('Opcao invalida. Volte a marcar o codigo USSD e tente novamente.');
  }
};

async function handleReport(
  tokens: string[],
  phoneNumber: string,
  createReport: CreateReportFn,
): Promise<UssdResponse> {
  let index = 1;

  if (!tokens[index]) {
    return con(`Seleccione o bairro/zona:\n${renderMenu(NEIGHBORHOODS)}`);
  }

  const bairroToken = tokens[index];
  const neighborhood = NEIGHBORHOODS.find((n) => n.key === bairroToken);
  if (!neighborhood) {
    return end('Bairro invalido. Volte a iniciar e escolha uma opcao valida.');
  }

  let bairro: string;
  if (bairroToken === '5') {
    index += 1;
    if (!tokens[index] || tokens[index].trim() === '') {
      return con('Digite o nome do bairro ou zona:');
    }
    bairro = sanitize(tokens[index]);
    index += 1;
  } else {
    bairro = neighborhood.label;
    index += 1;
  }

  if (!tokens[index]) {
    return con(`Seleccione o tipo de ocorrencia:\n${renderMenu(OCCURRENCE_TYPES)}`);
  }

  const typeToken = tokens[index];
  const occurrence = OCCURRENCE_TYPES.find((t) => t.key === typeToken);
  if (!occurrence) {
    return end('Tipo de ocorrencia invalido. Volte a iniciar e tente novamente.');
  }

  let tipo: string;
  if (typeToken === '5') {
    index += 1;
    if (!tokens[index] || tokens[index].trim() === '') {
      return con('Descreva o tipo de problema:');
    }
    tipo = sanitize(tokens[index]);
    index += 1;
  } else {
    tipo = occurrence.label;
    index += 1;
  }

  if (!tokens[index] || tokens[index].trim() === '') {
    return con('Informe um ponto de referencia. Exemplo: perto do mercado, escola ou paragem:');
  }

  const pontoReferencia = sanitize(tokens[index]);
  index += 1;

  if (!tokens[index]) {
    return con(`Confirme a denuncia:\nBairro: ${bairro}\nTipo: ${tipo}\nLocal: ${pontoReferencia}\n1. Confirmar\n2. Cancelar`);
  }

  if (tokens[index] === '2') {
    return end('Denuncia cancelada. Nenhum registo foi gravado.');
  }

  if (tokens[index] !== '1') {
    return end('Opcao de confirmacao invalida. A denuncia nao foi gravada.');
  }

  const report = await createReport({
    telefone: phoneNumber,
    bairro,
    tipo_ocorrencia: tipo,
    ponto_referencia: pontoReferencia,
    origem: 'USSD',
  });

  return end(
    `Denuncia registada com sucesso. Codigo: ${report.codigo}. Use a opcao 2 para consultar o estado.`,
  );
}

async function handleStatusQuery(
  tokens: string[],
  findReportByCode: (code: string) => Promise<Report | null>,
): Promise<UssdResponse> {
  if (!tokens[1] || tokens[1].trim() === '') {
    return con('Digite o codigo da denuncia. Exemplo: DLX-260426-ABC123');
  }

  const report = await findReportByCode(tokens[1]);
  if (!report) {
    return end('Nenhuma denuncia encontrada com o codigo informado.');
  }

  return end(buildReportSummary(report));
}

export const defaultStatus = (): ReportStatus => DEFAULT_STATUS;
