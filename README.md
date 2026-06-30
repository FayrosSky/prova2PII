# 🔧 OficinaOS — Sistema de Gestão de Oficina Mecânica

> Trabalho Final — ADS | Programação Para a Internet I | Prof. Ely

---

## 📁 Estrutura do Projeto

```
oficina/
├── index.html          ← Front-end (GitHub Pages — raiz /)
├── css/style.css
├── js/app.js
├── CNAME               ← Domínio customizado (www.oficinaos.com)
├── .nojekyll           ← Evita processamento Jekyll no GitHub Pages
├── README.md
└── backend/            ← API Express (Render ou local)
    ├── server.js
    ├── dados.json
    └── package.json
```

---

## 🚀 Como rodar localmente

### 1. Backend
```bash
cd backend
npm install
node server.js
# Servidor em http://localhost:3001
```

### 2. Front-end
Abra `index.html` no navegador ou use Live Server.

---

## 🌐 Hospedagem

| Parte | Onde | URL |
|-------|------|-----|
| **Front-end** | GitHub Pages (pasta `/` root) | https://www.oficinaos.com |
| **Back-end** | Render | https://oficinaos-backend.onrender.com |

### GitHub Pages (front-end)

1. Repositório: `FayrosSky/prova2PII`
2. **Settings → Pages**
3. **Source:** Deploy from branch `master`
4. **Folder:** `/ (root)`
5. **Custom domain:** `www.oficinaos.com`
6. Marque **Enforce HTTPS** após o DNS validar

### DNS do domínio (corrigir erro InvalidDNSError)

No painel do registrador do domínio `oficinaos.com`:

**Subdomínio www (obrigatório para o CNAME do projeto):**

| Tipo | Nome | Valor |
|------|------|-------|
| CNAME | `www` | `fayrossky.github.io` |

**Domínio raiz (opcional, para `oficinaos.com` sem www):**

| Tipo | Nome | Valor |
|------|------|-------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

> A propagação DNS pode levar de alguns minutos até 24 horas.  
> O erro *"DNS check unsuccessful"* aparece enquanto o registro CNAME/A ainda não existir ou estiver incorreto no registrador.

### Render (back-end)

1. Crie um **Web Service** apontando para a pasta `backend/`
2. **Build command:** `npm install`
3. **Start command:** `node server.js`
4. Atualize a URL em `js/app.js` se for diferente de `oficinaos-backend.onrender.com`

---

## ✅ Requisitos Atendidos

| # | Requisito | Como foi implementado |
|---|-----------|----------------------|
| 1 | **Duas entidades 1:N** | `Veículo` → `Ordens de Serviço` |
| 2 | **Validações cliente + servidor** | Campos obrigatórios validados no JS antes do envio; servidor valida novamente ao receber o JSON |
| 3 | **Todos os métodos HTTP** | GET, POST, PUT, PATCH, DELETE em ambas as entidades |
| 4 | **Critérios de ordenação no servidor** | Veículos: modelo/marca/ano/proprietário/placa; OS: data_entrada/status |
| 5 | **Local Storage** | Tema dark/light, cache offline das entidades, última ordenação usada |

---

## 🔗 Rotas da API

### Veículos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/veiculos?ordenar=modelo` | Listar (ordenado) |
| GET | `/veiculos/:id` | Buscar por ID |
| POST | `/veiculos` | Cadastrar |
| PUT | `/veiculos/:id` | Atualizar completo |
| PATCH | `/veiculos/:id` | Atualizar parcial |
| DELETE | `/veiculos/:id` | Remover |

### Ordens de Serviço
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/ordens?ordenar=data_entrada` | Listar (ordenado) |
| GET | `/ordens/:id` | Buscar por ID |
| POST | `/ordens` | Abrir nova OS |
| PUT | `/ordens/:id` | Atualizar completo |
| PATCH | `/ordens/:id` | Atualizar status/campos |
| DELETE | `/ordens/:id` | Remover |

---

## 🏗️ Regras de Negócio

- **Placa única**: não é possível cadastrar dois veículos com a mesma placa.
- **OS única por veículo**: um veículo não pode ter duas ordens de serviço com status `aberta` ou `em_andamento` ao mesmo tempo.
- **Validações de placa**: aceita formato antigo (ABC1234) e Mercosul (ABC1D23).
- **Cascade delete**: ao remover um veículo, todas as suas OS são removidas junto.

---

## 💡 Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (DOM, Fetch API, Local Storage)
- **Backend**: Node.js + Express.js
- **Dados**: JSON (dados.json)
