// ════════════════════════════════════════════════════════════════════
//  CONFIGURAÇÃO
// ════════════════════════════════════════════════════════════════════
const API = (() => {
  const { hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  // Backend no Render — altere se usar outra URL
  return 'https://oficinaos-backend.onrender.com';
})();

// ════════════════════════════════════════════════════════════════════
//  LOCAL STORAGE  (Critério 5 do trabalho)
// ════════════════════════════════════════════════════════════════════
const LS = {
  get: (k, def = null)    => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v)             => localStorage.setItem(k, JSON.stringify(v)),
  // Salvar preferências de ordenação
  getOrdem: (entidade)    => LS.get(`ordem_${entidade}`, entidade === 'veiculos' ? 'modelo' : 'data_entrada'),
  setOrdem: (entidade, v) => LS.set(`ordem_${entidade}`, v),
  // Cache offline
  cacheVeiculos: (data)   => LS.set('cache_veiculos', data),
  cacheOrdens:   (data)   => LS.set('cache_ordens',   data),
  getCacheVeiculos: ()    => LS.get('cache_veiculos', []),
  getCacheOrdens:   ()    => LS.get('cache_ordens',   []),
  // Tema
  getTema: ()             => LS.get('tema', 'dark'),
  setTema: (t)            => LS.set('tema', t),
};

// ════════════════════════════════════════════════════════════════════
//  TEMA  (Critério 5 - local storage)
// ════════════════════════════════════════════════════════════════════
function aplicarTema(tema) {
  document.documentElement.setAttribute('data-theme', tema);
  const btn = document.getElementById('btn-tema');
  btn.innerHTML = tema === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Escuro';
  LS.setTema(tema);
}

document.getElementById('btn-tema').addEventListener('click', () => {
  const atual = LS.getTema();
  aplicarTema(atual === 'dark' ? 'light' : 'dark');
});

aplicarTema(LS.getTema());

// ════════════════════════════════════════════════════════════════════
//  ABAS
// ════════════════════════════════════════════════════════════════════
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'tab-veiculos') carregarVeiculos();
    if (btn.dataset.tab === 'tab-ordens')   carregarOrdens();
    if (btn.dataset.tab === 'tab-dashboard') carregarDashboard();
  });
});

// ════════════════════════════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════════════════════════════
function toast(msg, tipo = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast-${tipo}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ════════════════════════════════════════════════════════════════════
//  API HELPER
// ════════════════════════════════════════════════════════════════════
async function api(method, endpoint, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + endpoint, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro desconhecido');
  return data;
}

// ════════════════════════════════════════════════════════════════════
//  VALIDAÇÃO CLIENTE  (Critério 2 do trabalho)
// ════════════════════════════════════════════════════════════════════
function limparErros(form) {
  form.querySelectorAll('.erro').forEach(el => el.classList.remove('erro'));
  form.querySelectorAll('.msg-erro').forEach(el => el.remove());
}

function marcarErro(input, msg) {
  input.classList.add('erro');
  const span = document.createElement('span');
  span.className = 'msg-erro';
  span.textContent = msg;
  input.parentNode.appendChild(span);
  input.focus();
}

function validarVeiculo(form) {
  limparErros(form);
  let ok = true;

  const placa = form.placa.value.trim().toUpperCase();
  const regexPlaca = /^[A-Z]{3}[0-9]{1}[A-Z0-9]{1}[0-9]{2}$|^[A-Z]{3}[0-9]{4}$/;
  if (!placa) { marcarErro(form.placa, 'Placa é obrigatória.'); ok = false; }
  else if (!regexPlaca.test(placa)) { marcarErro(form.placa, 'Use ABC1234 ou ABC1D23.'); ok = false; }

  const modelo = form.modelo.value.trim();
  if (!modelo) { marcarErro(form.modelo, 'Modelo é obrigatório.'); ok = false; }

  const marca = form.marca.value.trim();
  if (!marca) { marcarErro(form.marca, 'Marca é obrigatória.'); ok = false; }

  const ano = parseInt(form.ano.value);
  const anoAtual = new Date().getFullYear();
  if (!form.ano.value || isNaN(ano) || ano < 1900 || ano > anoAtual + 1) {
    marcarErro(form.ano, `Ano entre 1900 e ${anoAtual + 1}.`);
    ok = false;
  }

  const proprietario = form.proprietario.value.trim();
  if (!proprietario) { marcarErro(form.proprietario, 'Proprietário é obrigatório.'); ok = false; }

  const telefone = form.telefone.value.trim();
  if (!telefone) { marcarErro(form.telefone, 'Telefone é obrigatório.'); ok = false; }

  return ok;
}

function validarOS(form) {
  limparErros(form);
  let ok = true;

  if (!form.veiculo_id.value) { marcarErro(form.veiculo_id, 'Selecione um veículo.'); ok = false; }

  const descricao = form.descricao.value.trim();
  if (!descricao) { marcarErro(form.descricao, 'Descrição é obrigatória.'); ok = false; }

  const mecanico = form.mecanico.value.trim();
  if (!mecanico) { marcarErro(form.mecanico, 'Mecânico é obrigatório.'); ok = false; }

  return ok;
}

// ════════════════════════════════════════════════════════════════════
//  VEÍCULOS
// ════════════════════════════════════════════════════════════════════
let veiculosCache = [];

async function carregarVeiculos() {
  const ordenar = LS.getOrdem('veiculos');
  document.getElementById('sort-veiculos').value = ordenar;

  try {
    veiculosCache = await api('GET', `/veiculos?ordenar=${ordenar}`);
    LS.cacheVeiculos(veiculosCache);
  } catch {
    toast('Sem conexão — usando cache local.', 'info');
    veiculosCache = LS.getCacheVeiculos();
  }

  renderVeiculos(veiculosCache);
  popularSelectVeiculos();
}

function renderVeiculos(lista) {
  const tbody = document.getElementById('tbody-veiculos');

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="7">
      <div class="empty">
        <div class="empty-icon">🚗</div>
        <p>Nenhum veículo cadastrado ainda.</p>
      </div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(v => `
    <tr>
      <td><strong>${v.placa}</strong></td>
      <td>${v.modelo}</td>
      <td>${v.marca}</td>
      <td>${v.ano}</td>
      <td>${v.proprietario}</td>
      <td>${v.telefone}</td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="abrirEditarVeiculo(${v.id})">✏️ Editar</button>
          <button class="btn btn-danger btn-sm" onclick="deletarVeiculo(${v.id},'${v.placa}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Ordenação salva no local storage (critério 5)
document.getElementById('sort-veiculos').addEventListener('change', e => {
  LS.setOrdem('veiculos', e.target.value);
  carregarVeiculos();
});

// ── Formulário cadastrar veículo ──────────────────────────────────
document.getElementById('form-veiculo').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  if (!validarVeiculo(form)) return;

  try {
    await api('POST', '/veiculos', {
      placa:        form.placa.value.trim().toUpperCase(),
      modelo:       form.modelo.value.trim(),
      marca:        form.marca.value.trim(),
      ano:          parseInt(form.ano.value),
      proprietario: form.proprietario.value.trim(),
      telefone:     form.telefone.value.trim()
    });
    toast('Veículo cadastrado com sucesso!');
    form.reset();
    carregarVeiculos();
  } catch (err) {
    toast(err.message, 'erro');
  }
});

// ── Modal editar veículo ──────────────────────────────────────────
function abrirEditarVeiculo(id) {
  const v = veiculosCache.find(x => x.id === id);
  if (!v) return;

  const form = document.getElementById('form-editar-veiculo');
  form.dataset.id = id;
  form['e-placa'].value = v.placa;
  form['e-modelo'].value = v.modelo;
  form['e-marca'].value = v.marca;
  form['e-ano'].value = v.ano;
  form['e-proprietario'].value = v.proprietario;
  form['e-telefone'].value = v.telefone;
  limparErros(form);

  document.getElementById('modal-veiculo').classList.add('open');
}

document.getElementById('fechar-modal-veiculo').addEventListener('click', () => {
  document.getElementById('modal-veiculo').classList.remove('open');
});

document.getElementById('form-editar-veiculo').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const id   = form.dataset.id;

  // Reutilizar validação adaptada
  const fakeForm = {
    placa:        form['e-placa'],
    modelo:       form['e-modelo'],
    marca:        form['e-marca'],
    ano:          form['e-ano'],
    proprietario: form['e-proprietario'],
    telefone:     form['e-telefone'],
    querySelectorAll: s => form.querySelectorAll(s)
  };
  limparErros(form);

  try {
    await api('PUT', `/veiculos/${id}`, {
      placa:        form['e-placa'].value.trim().toUpperCase(),
      modelo:       form['e-modelo'].value.trim(),
      marca:        form['e-marca'].value.trim(),
      ano:          parseInt(form['e-ano'].value),
      proprietario: form['e-proprietario'].value.trim(),
      telefone:     form['e-telefone'].value.trim()
    });
    toast('Veículo atualizado!');
    document.getElementById('modal-veiculo').classList.remove('open');
    carregarVeiculos();
  } catch (err) {
    toast(err.message, 'erro');
  }
});

async function deletarVeiculo(id, placa) {
  if (!confirm(`Excluir o veículo ${placa}? Todas as ordens de serviço vinculadas também serão removidas.`)) return;
  try {
    await api('DELETE', `/veiculos/${id}`);
    toast('Veículo removido.');
    carregarVeiculos();
    carregarOrdens();
  } catch (err) {
    toast(err.message, 'erro');
  }
}

// ════════════════════════════════════════════════════════════════════
//  ORDENS DE SERVIÇO
// ════════════════════════════════════════════════════════════════════
let ordensCache = [];

async function carregarOrdens() {
  const ordenar = LS.getOrdem('ordens');
  document.getElementById('sort-ordens').value = ordenar;

  try {
    ordensCache = await api('GET', `/ordens?ordenar=${ordenar}`);
    LS.cacheOrdens(ordensCache);
  } catch {
    toast('Sem conexão — usando cache local.', 'info');
    ordensCache = LS.getCacheOrdens();
  }

  renderOrdens(ordensCache);
}

function statusBadge(s) {
  const map = {
    aberta:       ['badge-aberta',    '🔵 Aberta'],
    em_andamento: ['badge-andamento', '🟡 Em andamento'],
    concluida:    ['badge-concluida', '🟢 Concluída'],
    cancelada:    ['badge-cancelada', '🔴 Cancelada']
  };
  const [cls, label] = map[s] || ['', s];
  return `<span class="badge ${cls}">${label}</span>`;
}

function renderOrdens(lista) {
  const tbody = document.getElementById('tbody-ordens');

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="7">
      <div class="empty">
        <div class="empty-icon">🔧</div>
        <p>Nenhuma ordem de serviço registrada.</p>
      </div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(os => `
    <tr>
      <td><strong>#${os.id}</strong></td>
      <td>
        <strong>${os.veiculo?.placa ?? '—'}</strong><br>
        <small style="color:var(--text-muted)">${os.veiculo?.modelo ?? ''} ${os.veiculo?.ano ?? ''}</small>
      </td>
      <td style="max-width:200px">${os.descricao}</td>
      <td>${os.mecanico}</td>
      <td>${statusBadge(os.status)}</td>
      <td>${os.valor != null ? 'R$ ' + Number(os.valor).toFixed(2) : '—'}</td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="abrirEditarOS(${os.id})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deletarOS(${os.id})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Ordenação salva no local storage (critério 5)
document.getElementById('sort-ordens').addEventListener('change', e => {
  LS.setOrdem('ordens', e.target.value);
  carregarOrdens();
});

// ── Popular select de veículos nos forms de OS ────────────────────
function popularSelectVeiculos() {
  const selects = document.querySelectorAll('.sel-veiculo');
  selects.forEach(sel => {
    const valorAtual = sel.value;
    sel.innerHTML = '<option value="">— Selecione o veículo —</option>' +
      veiculosCache.map(v =>
        `<option value="${v.id}">${v.placa} — ${v.modelo} (${v.proprietario})</option>`
      ).join('');
    sel.value = valorAtual;
  });
}

// ── Formulário nova OS ────────────────────────────────────────────
document.getElementById('form-os').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  if (!validarOS(form)) return;

  try {
    await api('POST', '/ordens', {
      veiculo_id: parseInt(form.veiculo_id.value),
      descricao:  form.descricao.value.trim(),
      mecanico:   form.mecanico.value.trim(),
      valor:      form.valor.value || null
    });
    toast('Ordem de serviço aberta!');
    form.reset();
    carregarOrdens();
  } catch (err) {
    toast(err.message, 'erro');
  }
});

// ── Modal editar OS ───────────────────────────────────────────────
function abrirEditarOS(id) {
  const os = ordensCache.find(x => x.id === id);
  if (!os) return;

  const form = document.getElementById('form-editar-os');
  form.dataset.id = id;
  form['e-os-veiculo'].value  = os.veiculo_id;
  form['e-os-descricao'].value = os.descricao;
  form['e-os-mecanico'].value  = os.mecanico;
  form['e-os-status'].value    = os.status;
  form['e-os-valor'].value     = os.valor ?? '';
  limparErros(form);

  document.getElementById('modal-os').classList.add('open');
}

document.getElementById('fechar-modal-os').addEventListener('click', () => {
  document.getElementById('modal-os').classList.remove('open');
});

document.getElementById('form-editar-os').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const id   = form.dataset.id;

  const descricao = form['e-os-descricao'].value.trim();
  const mecanico  = form['e-os-mecanico'].value.trim();
  if (!descricao) { toast('Descrição é obrigatória.', 'erro'); return; }
  if (!mecanico)  { toast('Mecânico é obrigatório.', 'erro'); return; }

  try {
    await api('PUT', `/ordens/${id}`, {
      veiculo_id:  parseInt(form['e-os-veiculo'].value),
      descricao,
      mecanico,
      status:      form['e-os-status'].value,
      valor:       form['e-os-valor'].value || null
    });
    toast('Ordem de serviço atualizada!');
    document.getElementById('modal-os').classList.remove('open');
    carregarOrdens();
  } catch (err) {
    toast(err.message, 'erro');
  }
});

async function deletarOS(id) {
  if (!confirm(`Excluir a OS #${id}?`)) return;
  try {
    await api('DELETE', `/ordens/${id}`);
    toast('Ordem de serviço removida.');
    carregarOrdens();
  } catch (err) {
    toast(err.message, 'erro');
  }
}

// ════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════════════════════════════
async function carregarDashboard() {
  try {
    const [veiculos, ordens] = await Promise.all([
      api('GET', '/veiculos'),
      api('GET', '/ordens')
    ]);

    document.getElementById('stat-veiculos').textContent = veiculos.length;
    document.getElementById('stat-abertas').textContent  = ordens.filter(o => o.status === 'aberta').length;
    document.getElementById('stat-andamento').textContent = ordens.filter(o => o.status === 'em_andamento').length;
    document.getElementById('stat-concluidas').textContent = ordens.filter(o => o.status === 'concluida').length;

    const receita = ordens
      .filter(o => o.status === 'concluida' && o.valor)
      .reduce((s, o) => s + o.valor, 0);
    document.getElementById('stat-receita').textContent = 'R$ ' + receita.toFixed(2);

    // Últimas 5 OS
    const recentes = [...ordens].slice(0, 5);
    document.getElementById('dash-recentes').innerHTML = recentes.length
      ? recentes.map(os => `
          <tr>
            <td><strong>#${os.id}</strong></td>
            <td>${os.veiculo?.placa ?? '—'}</td>
            <td>${os.mecanico}</td>
            <td>${statusBadge(os.status)}</td>
          </tr>`).join('')
      : `<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">Nenhuma OS registrada.</td></tr>`;

  } catch (err) {
    toast('Erro ao carregar dashboard.', 'erro');
  }
}

// ════════════════════════════════════════════════════════════════════
//  INICIALIZAÇÃO
// ════════════════════════════════════════════════════════════════════
(async () => {
  await carregarVeiculos();
  carregarDashboard();
})();
