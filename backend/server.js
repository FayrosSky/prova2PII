const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'dados.json');

const ORIGENS_PERMITIDAS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:5500',
  'https://www.oficinaos.com',
  'https://oficinaos.com',
  'https://fayrossky.github.io'
];

app.use(cors({ origin: ORIGENS_PERMITIDAS }));
app.use(express.json());

// ─── Helpers ────────────────────────────────────────────────────────────────

function lerDados() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function salvarDados(dados) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2), 'utf-8');
}

function agora() {
  return new Date().toISOString();
}

// ════════════════════════════════════════════════════════════════════════════
//  VEÍCULOS
// ════════════════════════════════════════════════════════════════════════════

// GET /veiculos?ordenar=modelo|marca|ano|proprietario
app.get('/veiculos', (req, res) => {
  const dados = lerDados();
  const { ordenar = 'modelo' } = req.query;

  const camposPermitidos = ['modelo', 'marca', 'ano', 'proprietario', 'placa'];
  const campo = camposPermitidos.includes(ordenar) ? ordenar : 'modelo';

  const lista = [...dados.veiculos].sort((a, b) => {
    if (typeof a[campo] === 'number') return a[campo] - b[campo];
    return String(a[campo]).localeCompare(String(b[campo]));
  });

  res.json(lista);
});

// GET /veiculos/:id
app.get('/veiculos/:id', (req, res) => {
  const dados = lerDados();
  const id = parseInt(req.params.id);
  const veiculo = dados.veiculos.find(v => v.id === id);

  if (!veiculo) return res.status(404).json({ erro: 'Veículo não encontrado.' });
  res.json(veiculo);
});

// POST /veiculos
app.post('/veiculos', (req, res) => {
  const { placa, modelo, marca, ano, proprietario, telefone } = req.body;

  // Validações servidor
  if (!placa || !modelo || !marca || !ano || !proprietario || !telefone) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  const placaFormatada = placa.trim().toUpperCase();
  const regexPlaca = /^[A-Z]{3}[0-9]{1}[A-Z0-9]{1}[0-9]{2}$|^[A-Z]{3}[0-9]{4}$/;
  if (!regexPlaca.test(placaFormatada)) {
    return res.status(400).json({ erro: 'Placa inválida. Use o formato ABC1234 ou ABC1D23.' });
  }

  const anoNum = parseInt(ano);
  const anoAtual = new Date().getFullYear();
  if (isNaN(anoNum) || anoNum < 1900 || anoNum > anoAtual + 1) {
    return res.status(400).json({ erro: `Ano inválido. Deve ser entre 1900 e ${anoAtual + 1}.` });
  }

  const dados = lerDados();

  // Regra de negócio: placa única
  const duplicado = dados.veiculos.find(v => v.placa === placaFormatada);
  if (duplicado) {
    return res.status(409).json({ erro: 'Já existe um veículo cadastrado com essa placa.' });
  }

  const novoVeiculo = {
    id: dados._nextIds.veiculos++,
    placa: placaFormatada,
    modelo: modelo.trim(),
    marca: marca.trim(),
    ano: anoNum,
    proprietario: proprietario.trim(),
    telefone: telefone.trim(),
    criado_em: agora()
  };

  dados.veiculos.push(novoVeiculo);
  salvarDados(dados);

  res.status(201).json(novoVeiculo);
});

// PUT /veiculos/:id  (atualização completa)
app.put('/veiculos/:id', (req, res) => {
  const { placa, modelo, marca, ano, proprietario, telefone } = req.body;

  if (!placa || !modelo || !marca || !ano || !proprietario || !telefone) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios para atualização completa.' });
  }

  const dados = lerDados();
  const id = parseInt(req.params.id);
  const idx = dados.veiculos.findIndex(v => v.id === id);
  if (idx === -1) return res.status(404).json({ erro: 'Veículo não encontrado.' });

  const placaFormatada = placa.trim().toUpperCase();
  const duplicado = dados.veiculos.find(v => v.placa === placaFormatada && v.id !== id);
  if (duplicado) {
    return res.status(409).json({ erro: 'Já existe outro veículo com essa placa.' });
  }

  const anoNum = parseInt(ano);
  const anoAtual = new Date().getFullYear();
  if (isNaN(anoNum) || anoNum < 1900 || anoNum > anoAtual + 1) {
    return res.status(400).json({ erro: `Ano inválido. Deve ser entre 1900 e ${anoAtual + 1}.` });
  }

  dados.veiculos[idx] = {
    ...dados.veiculos[idx],
    placa: placaFormatada,
    modelo: modelo.trim(),
    marca: marca.trim(),
    ano: anoNum,
    proprietario: proprietario.trim(),
    telefone: telefone.trim()
  };

  salvarDados(dados);
  res.json(dados.veiculos[idx]);
});

// PATCH /veiculos/:id  (atualização parcial)
app.patch('/veiculos/:id', (req, res) => {
  const dados = lerDados();
  const id = parseInt(req.params.id);
  const idx = dados.veiculos.findIndex(v => v.id === id);
  if (idx === -1) return res.status(404).json({ erro: 'Veículo não encontrado.' });

  const camposPermitidos = ['modelo', 'marca', 'ano', 'proprietario', 'telefone'];
  const atualizacao = {};

  for (const campo of camposPermitidos) {
    if (req.body[campo] !== undefined) {
      atualizacao[campo] = req.body[campo];
    }
  }

  if (atualizacao.ano) {
    const anoNum = parseInt(atualizacao.ano);
    const anoAtual = new Date().getFullYear();
    if (isNaN(anoNum) || anoNum < 1900 || anoNum > anoAtual + 1) {
      return res.status(400).json({ erro: `Ano inválido.` });
    }
    atualizacao.ano = anoNum;
  }

  dados.veiculos[idx] = { ...dados.veiculos[idx], ...atualizacao };
  salvarDados(dados);
  res.json(dados.veiculos[idx]);
});

// DELETE /veiculos/:id
app.delete('/veiculos/:id', (req, res) => {
  const dados = lerDados();
  const id = parseInt(req.params.id);
  const idx = dados.veiculos.findIndex(v => v.id === id);
  if (idx === -1) return res.status(404).json({ erro: 'Veículo não encontrado.' });

  // Remove OS vinculadas
  dados.ordens_servico = dados.ordens_servico.filter(os => os.veiculo_id !== id);
  dados.veiculos.splice(idx, 1);
  salvarDados(dados);

  res.json({ mensagem: 'Veículo e ordens de serviço removidos com sucesso.' });
});

// ════════════════════════════════════════════════════════════════════════════
//  ORDENS DE SERVIÇO
// ════════════════════════════════════════════════════════════════════════════

// GET /ordens?ordenar=data_entrada|status&veiculo_id=X
app.get('/ordens', (req, res) => {
  const dados = lerDados();
  const { ordenar = 'data_entrada', veiculo_id } = req.query;

  let lista = [...dados.ordens_servico];

  // Filtrar por veículo se solicitado
  if (veiculo_id) {
    lista = lista.filter(os => os.veiculo_id === parseInt(veiculo_id));
  }

  // Enriquecer com dados do veículo
  lista = lista.map(os => {
    const veiculo = dados.veiculos.find(v => v.id === os.veiculo_id);
    return { ...os, veiculo };
  });

  // Ordenação no servidor (critério 4 do trabalho)
  const ordemStatus = { aberta: 0, em_andamento: 1, concluida: 2, cancelada: 3 };

  if (ordenar === 'status') {
    lista.sort((a, b) => ordemStatus[a.status] - ordemStatus[b.status]);
  } else {
    // data_entrada (padrão) - mais recente primeiro
    lista.sort((a, b) => new Date(b.data_entrada) - new Date(a.data_entrada));
  }

  res.json(lista);
});

// GET /ordens/:id
app.get('/ordens/:id', (req, res) => {
  const dados = lerDados();
  const id = parseInt(req.params.id);
  const os = dados.ordens_servico.find(o => o.id === id);
  if (!os) return res.status(404).json({ erro: 'Ordem de serviço não encontrada.' });

  const veiculo = dados.veiculos.find(v => v.id === os.veiculo_id);
  res.json({ ...os, veiculo });
});

// POST /ordens
app.post('/ordens', (req, res) => {
  const { veiculo_id, descricao, mecanico, valor } = req.body;

  // Validações servidor
  if (!veiculo_id || !descricao || !mecanico) {
    return res.status(400).json({ erro: 'veiculo_id, descrição e mecânico são obrigatórios.' });
  }

  const dados = lerDados();

  // Validar veículo existe
  const veiculo = dados.veiculos.find(v => v.id === parseInt(veiculo_id));
  if (!veiculo) return res.status(404).json({ erro: 'Veículo não encontrado.' });

  // ★ Regra de negócio: veículo não pode ter duas OS abertas ao mesmo tempo
  const osAberta = dados.ordens_servico.find(
    os => os.veiculo_id === parseInt(veiculo_id) &&
          (os.status === 'aberta' || os.status === 'em_andamento')
  );
  if (osAberta) {
    return res.status(409).json({
      erro: `Este veículo já possui uma ordem de serviço ${osAberta.status === 'aberta' ? 'aberta' : 'em andamento'} (OS #${osAberta.id}). Conclua ou cancele antes de abrir uma nova.`
    });
  }

  const novaOS = {
    id: dados._nextIds.ordens_servico++,
    veiculo_id: parseInt(veiculo_id),
    descricao: descricao.trim(),
    mecanico: mecanico.trim(),
    status: 'aberta',
    valor: valor ? parseFloat(valor) : null,
    data_entrada: agora(),
    data_saida: null
  };

  dados.ordens_servico.push(novaOS);
  salvarDados(dados);

  res.status(201).json({ ...novaOS, veiculo });
});

// PUT /ordens/:id  (atualização completa)
app.put('/ordens/:id', (req, res) => {
  const { veiculo_id, descricao, mecanico, status, valor, data_saida } = req.body;

  if (!veiculo_id || !descricao || !mecanico || !status) {
    return res.status(400).json({ erro: 'veiculo_id, descrição, mecânico e status são obrigatórios.' });
  }

  const statusValidos = ['aberta', 'em_andamento', 'concluida', 'cancelada'];
  if (!statusValidos.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }

  const dados = lerDados();
  const id = parseInt(req.params.id);
  const idx = dados.ordens_servico.findIndex(o => o.id === id);
  if (idx === -1) return res.status(404).json({ erro: 'Ordem de serviço não encontrada.' });

  dados.ordens_servico[idx] = {
    ...dados.ordens_servico[idx],
    veiculo_id: parseInt(veiculo_id),
    descricao: descricao.trim(),
    mecanico: mecanico.trim(),
    status,
    valor: valor ? parseFloat(valor) : null,
    data_saida: (status === 'concluida' || status === 'cancelada') ? (data_saida || agora()) : null
  };

  salvarDados(dados);
  const veiculo = dados.veiculos.find(v => v.id === parseInt(veiculo_id));
  res.json({ ...dados.ordens_servico[idx], veiculo });
});

// PATCH /ordens/:id  (atualização parcial - principalmente status)
app.patch('/ordens/:id', (req, res) => {
  const dados = lerDados();
  const id = parseInt(req.params.id);
  const idx = dados.ordens_servico.findIndex(o => o.id === id);
  if (idx === -1) return res.status(404).json({ erro: 'Ordem de serviço não encontrada.' });

  const { status, descricao, mecanico, valor } = req.body;
  const statusValidos = ['aberta', 'em_andamento', 'concluida', 'cancelada'];

  if (status && !statusValidos.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido. Use: aberta, em_andamento, concluida ou cancelada.' });
  }

  const atualizacao = {};
  if (status) {
    atualizacao.status = status;
    if (status === 'concluida' || status === 'cancelada') {
      atualizacao.data_saida = agora();
    }
  }
  if (descricao) atualizacao.descricao = descricao.trim();
  if (mecanico) atualizacao.mecanico = mecanico.trim();
  if (valor !== undefined) atualizacao.valor = valor ? parseFloat(valor) : null;

  dados.ordens_servico[idx] = { ...dados.ordens_servico[idx], ...atualizacao };
  salvarDados(dados);

  const veiculo = dados.veiculos.find(v => v.id === dados.ordens_servico[idx].veiculo_id);
  res.json({ ...dados.ordens_servico[idx], veiculo });
});

// DELETE /ordens/:id
app.delete('/ordens/:id', (req, res) => {
  const dados = lerDados();
  const id = parseInt(req.params.id);
  const idx = dados.ordens_servico.findIndex(o => o.id === id);
  if (idx === -1) return res.status(404).json({ erro: 'Ordem de serviço não encontrada.' });

  dados.ordens_servico.splice(idx, 1);
  salvarDados(dados);

  res.json({ mensagem: 'Ordem de serviço removida com sucesso.' });
});

app.get('/', (req, res) => {
  res.json({
    messagem: 'API rodando',
    rotas: ['/veiculos', '/ordens']
  });
});


// ─── Start ───────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} já está em uso.`);
    console.error(`   Encerre o processo anterior: fuser -k ${PORT}/tcp`);
    console.error(`   Ou inicie em outra porta: PORT=3002 node server.js`);
    process.exit(1);
  }
  throw err;
});
