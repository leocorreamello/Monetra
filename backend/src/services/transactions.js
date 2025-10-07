const Transaction = require('../../models/Transaction');

const normalize = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const parseMonetaryValue = (valorStr) => {
  if (!valorStr) {
    return null;
  }

  const sanitized = valorStr.trim().replace(/\./g, '').replace(',', '.');
  const parsed = Number.parseFloat(sanitized);

  return Number.isNaN(parsed) ? null : parsed;
};

const buildDescricaoCompleta = (historico, descricao) => {
  const historicoLimpo = historico?.trim() ?? '';
  const descricaoLimpa = descricao?.trim() ?? '';

  if (!historicoLimpo) {
    return descricaoLimpa;
  }

  if (!descricaoLimpa) {
    return historicoLimpo;
  }

  if (descricaoLimpa && historicoLimpo && descricaoLimpa.toLowerCase() === historicoLimpo.toLowerCase()) {
    return descricaoLimpa;
  }

  return `${historicoLimpo} ${descricaoLimpa}`.trim();
};

const categorizarTransacao = (descricao, valor) => {
  const text = normalize(descricao);

  if (
    text.includes('salario') ||
    text.includes('remuneracao') ||
    text.includes('deposito') ||
    (text.includes('credito') && valor > 0)
  ) {
    return 'renda';
  }

  if (
    text.includes('mercado') ||
    text.includes('supermercado') ||
    text.includes('padaria') ||
    text.includes('restaurante') ||
    text.includes('lanchonete') ||
    text.includes('food') ||
    text.includes('ifood') ||
    text.includes('delivery')
  ) {
    return 'alimentacao';
  }

  if (
    text.includes('uber') ||
    text.includes('99') ||
    text.includes('posto') ||
    text.includes('combustivel') ||
    text.includes('gasolina') ||
    text.includes('metro') ||
    text.includes('onibus') ||
    text.includes('trem')
  ) {
    return 'transporte';
  }

  if (
    text.includes('farmacia') ||
    text.includes('medico') ||
    text.includes('hospital') ||
    text.includes('clinica') ||
    text.includes('laboratorio') ||
    text.includes('odont')
  ) {
    return 'saude';
  }

  if (
    text.includes('escola') ||
    text.includes('faculdade') ||
    text.includes('universidade') ||
    text.includes('curso') ||
    text.includes('livro') ||
    text.includes('apostila')
  ) {
    return 'educacao';
  }

  if (
    text.includes('cinema') ||
    text.includes('jogo') ||
    text.includes('game') ||
    text.includes('netflix') ||
    text.includes('spotify') ||
    text.includes('prime') ||
    text.includes('lazer') ||
    text.includes('show')
  ) {
    return 'lazer';
  }

  if (
    text.includes('aluguel') ||
    text.includes('condominio') ||
    text.includes('energia') ||
    text.includes('luz') ||
    text.includes('agua') ||
    text.includes('gas') ||
    text.includes('internet') ||
    text.includes('telefone')
  ) {
    return 'casa';
  }

  if (
    text.includes('pix') ||
    text.includes('transfer') ||
    text.includes('ted') ||
    text.includes('doc')
  ) {
    return 'transferencia';
  }

  if (
    text.includes('aplicacao') ||
    text.includes('investimento') ||
    text.includes('poupanca') ||
    text.includes('tesouro') ||
    text.includes('cdb')
  ) {
    return 'investimento';
  }

  if (
    text.includes('roupa') ||
    text.includes('calcado') ||
    text.includes('moda') ||
    text.includes('vestuario') ||
    text.includes('loja')
  ) {
    return 'vestuario';
  }

  if (text.includes('saque') || text.includes('caixa eletronico') || text.includes('atm')) {
    return 'saque';
  }

  if (
    text.includes('tarifa') ||
    text.includes('taxa') ||
    text.includes('anuidade') ||
    text.includes('juros') ||
    text.includes('servico') ||
    text.includes('iof')
  ) {
    return 'taxas';
  }

  return 'outros';
};

const parseData = (dataStr) => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
    return null;
  }

  const [dia, mes, ano] = dataStr.split('/').map(Number);
  return {
    data: dataStr,
    mes: String(mes).padStart(2, '0'),
    ano: String(ano),
    dataDate: new Date(Date.UTC(ano, mes - 1, dia))
  };
};

const parseCsvContent = (buffer) => {
  const content = buffer.toString('utf8');
  const linhas = content
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0);

  let inicioTransacoes = -1;
  for (let i = 0; i < linhas.length; i += 1) {
    const linhaNormalizada = normalize(linhas[i]);
    if (linhaNormalizada.includes('data lancamento') && linhaNormalizada.includes('valor')) {
      inicioTransacoes = i + 1;
      break;
    }
  }

  if (inicioTransacoes === -1) {
    throw new Error('Cabeçalho das transações não encontrado no CSV.');
  }

  const transacoes = [];

  for (let i = inicioTransacoes; i < linhas.length; i += 1) {
    const linha = linhas[i];
    if (!linha) continue;

    const campos = linha.split(';');
    if (campos.length < 4) continue;

    const dataBruta = campos[0];
    const historico = campos[1] ?? '';
    const descricao = campos[2] ?? '';
    const valorStr = campos[3];

    const valores = parseData(dataBruta);
    if (!valores) continue;

    const valor = parseMonetaryValue(valorStr);
    if (valor === null) continue;

    const descricaoCompleta = buildDescricaoCompleta(historico, descricao);
    const tipo = valor < 0 ? 'saida' : 'entrada';
    const categoria = categorizarTransacao(descricaoCompleta, valor);

    transacoes.push({
      ...valores,
      descricao: descricaoCompleta,
      valor,
      tipo,
      categoria
    });
  }

  return transacoes;
};

const parseTxtContent = (buffer) => {
  const content = buffer.toString('utf8');
  const linhas = content
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0);

  const transacoes = [];

  for (let i = 0; i < linhas.length; i += 1) {
    const linha = linhas[i];
    if (!linha) continue;

    const campos = linha.split(';');
    if (campos.length < 3) continue;

    const dataBruta = campos[0];
    const descricao = campos[1] ?? '';
    const valorStr = campos[2];

    const valores = parseData(dataBruta);
    if (!valores) continue;

    const valor = parseMonetaryValue(valorStr);
    if (valor === null) continue;

    const tipo = valor < 0 ? 'saida' : 'entrada';
    const categoria = categorizarTransacao(descricao, valor);

    transacoes.push({
      ...valores,
      descricao: descricao.trim(),
      valor,
      tipo,
      categoria
    });
  }

  return transacoes;
};

const detectarDiasExtrato = (transacoes) => {
  if (!transacoes || transacoes.length === 0) {
    return null;
  }

  const dias = new Set();
  let menor = null;
  let maior = null;

  transacoes.forEach((transacao) => {
    dias.add(transacao.data);
    if (!menor || transacao.dataDate < menor) {
      menor = transacao.dataDate;
    }
    if (!maior || transacao.dataDate > maior) {
      maior = transacao.dataDate;
    }
  });

  const formatarData = (data) => {
    const dia = String(data.getUTCDate()).padStart(2, '0');
    const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
    const ano = String(data.getUTCFullYear());
    return `${dia}/${mes}/${ano}`;
  };

  return {
    diasUnicos: Array.from(dias).sort(),
    dataInicio: menor ? formatarData(menor) : null,
    dataFim: maior ? formatarData(maior) : null
  };
};

const removerTransacoesDias = async (diasEspecificos, userId) => {
  if (!diasEspecificos || diasEspecificos.length === 0) {
    return 0;
  }

  const resultado = await Transaction.deleteMany({
    user: userId,
    data: { $in: diasEspecificos }
  });

  return resultado.deletedCount ?? 0;
};

const salvarTransacoes = async (transacoes, userId) => {
  if (!transacoes || transacoes.length === 0) {
    return 0;
  }

  const registros = transacoes.map((transacao) => ({
    ...transacao,
    user: userId
  }));

  const resultado = await Transaction.insertMany(registros, { ordered: false });
  return resultado.length;
};

const listarTransacoes = async (userId) => {
  const registros = await Transaction.find({ user: userId })
    .sort({ dataDate: -1, _id: -1 })
    .lean();

  return registros.map(
    ({
      _id,
      user,
      data,
      dataDate,
      descricao,
      valor,
      tipo,
      categoria,
      mes,
      ano,
      createdAt,
      updatedAt
    }) => ({
      id: _id,
      user,
      data,
      dataDate,
      descricao,
      valor,
      tipo,
      categoria,
      mes,
      ano,
      createdAt,
      updatedAt
    })
  );
};

const listarCategorias = async (userId) => {
  const categorias = await Transaction.distinct('categoria', { user: userId });
  return categorias.sort();
};

const removerPorMes = async (userId, mes, ano) => {
  const resultado = await Transaction.deleteMany({
    user: userId,
    mes,
    ano
  });

  return resultado.deletedCount ?? 0;
};

const removerTudo = async (userId) => {
  const resultado = await Transaction.deleteMany({ user: userId });
  return resultado.deletedCount ?? 0;
};

module.exports = {
  detectarDiasExtrato,
  listarCategorias,
  listarTransacoes,
  parseCsvContent,
  parseTxtContent,
  removerPorMes,
  removerTransacoesDias,
  removerTudo,
  salvarTransacoes
};
