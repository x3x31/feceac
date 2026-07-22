# FECEAC - Análise Completa do Projeto

## 1. Descrição

**FECEAC** — **Feira de Ciências da Escola Abel Coelho** — é uma aplicação web full-stack para gerenciamento do ciclo completo de uma feira científica e mostra cultural escolar: cadastro de projetos, gestão de alunos/professores, avaliação por juízes, configuração de critérios, ranking e geração de relatórios em PDF.

O sistema foi construído para o contexto educacional brasileiro (idioma Português, locale `pt-BR`).

---

## 2. Tech Stack

| Camada           | Tecnologia                                                              |
| ---------------- | ----------------------------------------------------------------------- |
| **Frontend**     | HTML5, CSS3, Bootstrap 5.3, JavaScript ES6 Modules (vanilla, sem SPA)  |
| **Backend/BaaS** | Supabase (PostgreSQL, Auth, Storage, REST API, Row Level Security)     |
| **Bibliotecas**  | jQuery (DataTables apenas), jsPDF + AutoTable, DataTables + Bootstrap 5 |
| **Hospedagem**   | GitHub Pages (frontend estático)                                       |
| **CDN**          | Supabase JS v2 via `esm.sh`                                            |

---

## 3. Estrutura de Arquivos

```
feceac/
├── index.html                          (redirect → login.html)
├── login.html                          (login + modal de cadastro)
├── painel.html                         (painel admin com estatísticas)
├── projetos.html                       (listagem de projetos com filtros/ordenação)
├── cadastrar-projeto.html              (formulário de novo projeto)
├── editar-projeto.html                 (formulário de edição de projeto)
├── avaliacoes.html                     (formulário de avaliação + histórico)
├── ficha-avaliacao.html               (ficha de avaliação imprimível)
├── usuarios.html                       (gerenciamento de usuários + ativação)
├── professores.html                    (CRUD de professores)
├── alunos.html                         (CRUD de alunos)
├── areas.html                          (CRUD de áreas de conhecimento)
├── criterios.html                      (CRUD de critérios de avaliação)
├── ranking.html                        (ranking de projetos + relatório PDF)
├── boas-vindas.html                    (página de boas-vindas — Avaliadores)
├── professor-boas-vindas.html          (página de boas-vindas — Professores)
├── README.md
├── README2.md                          (esta análise)
├── .gitignore
│
├── css/
│   ├── bootstrap.min.css              (Bootstrap 5.3 vendored)
│   ├── style.css                      (estilos globais, sidebar, bottom nav, variáveis)
│   ├── login.css                      (background da página de login)
│   ├── painel.css                     (cards do dashboard, botões de ação)
│   ├── tabelas.css                    (cabeçalhos de tabela, indicadores de ordenação)
│   ├── boas-vindas.css                (cards da página de boas-vindas)
│   ├── ficha-avaliacao.css            (ficha de avaliação para impressão + @media print)
│   └── dataTables.bootstrap5.min.css  (tema DataTables para Bootstrap 5)
│
├── js/
│   ├── config.js                      (URL + anon key do Supabase + constantes)
│   ├── supabase.js                    (inicialização do cliente Supabase)
│   ├── auth.js                        (login, registro, logout, sessão, proteção de páginas)
│   ├── app.js                         (bootstrapper principal: auth guard, menus, permissões)
│   ├── util.js                        (qs, qsa, escapeHtml, getParam, redirect, debounce...)
│   ├── ui.js                          (toast, confirmar modal, setLoading, mensagemVazia)
│   ├── teste-relacionamento.js        (script de debug para testar joins do Supabase)
│   │
│   ├── controllers/                   (um controller por página HTML)
│   │   ├── login.controller.js
│   │   ├── painel.controller.js
│   │   ├── projeto.controller.js      (667 linhas — maior arquivo, lista + form + modal)
│   │   ├── avaliacao.controller.js
│   │   ├── ficha-avaliacao.controller.js
│   │   ├── usuario.controller.js
│   │   ├── area.controller.js
│   │   ├── criterio.controller.js
│   │   ├── aluno.controller.js
│   │   ├── professor.controller.js
│   │   ├── ranking.controller.js      (592 linhas — lógica de geração de PDF)
│   │   ├── boas-vindas.controller.js
│   │   └── professor-boas-vindas.controller.js
│   │
│   ├── services/                      (camada de acesso a dados — queries Supabase)
│   │   ├── usuario.service.js
│   │   ├── projeto.service.js
│   │   ├── avaliacao.service.js
│   │   ├── area.service.js
│   │   ├── aluno.service.js
│   │   └── professor.service.js
│   │
│   └── vendor/                        (bibliotecas de terceiros)
│       ├── bootstrap.bundle.min.js
│       ├── jquery.min.js
│       ├── dataTables.min.js
│       ├── dataTables.bootstrap5.min.js
│       ├── jspdf.umd.min.js
│       └── jspdf.plugin.autotable.min.js
│
├── assets/
│   └── logos/
│       ├── feceac.jpeg
│       ├── feceac-login.jpeg
│       ├── fundologin.png             (imagem de fundo)
│       └── logo-feceac.jpeg
│
└── supabase/
    ├── schema.sql                     (schema completo: tabelas, triggers, RLS, seed data)
    └── migrations/
        ├── 20260721_add_codigo_to_projetos.sql
        └── 20260722_trigger_delete_auth_user.sql
```

---

## 4. Funcionalidades por Página

| Página                      | Função                                                          | Roles Permitidos                   |
| --------------------------- | --------------------------------------------------------------- | ---------------------------------- |
| `login.html`                | Login por email/senha + modal de cadastro de nova conta         | Público                            |
| `painel.html`               | Dashboard admin com estatísticas e botões de acesso rápido      | Administrador                      |
| `projetos.html`             | Listagem completa de projetos com filtros e ordenação           | Administrador, Professor           |
| `cadastrar-projeto.html`    | Formulário de novo projeto (ano, código, título, tipo, área...) | Administrador, Professor, Aluno    |
| `editar-projeto.html`       | Edição de projeto existente (mesmo formulário do cadastro)      | Administrador, Professor           |
| `avaliacoes.html`           | Formulário de avaliação + histórico de avaliações              | Avaliador, Administrador, Professor |
| `ficha-avaliacao.html`      | Ficha de avaliação imprimível com dados do projeto e critérios  | Administrador                      |
| `usuarios.html`             | CRUD de usuários + modal de ativação em lote                    | Administrador                      |
| `professores.html`          | CRUD de professores (nome, matrícula)                           | Administrador                      |
| `alunos.html`               | CRUD de alunos (nome, matrícula, turma, turno)                  | Administrador                      |
| `areas.html`                | CRUD de áreas de conhecimento (vinculadas ao tipo de projeto)   | Administrador                      |
| `criterios.html`            | CRUD de critérios de avaliação (descrição, peso, observações)   | Administrador                      |
| `ranking.html`              | Ranking de projetos (DataTables) + geração de PDF               | Administrador                      |
| `boas-vindas.html`          | Página de boas-vindas para Avaliadores                          | Avaliador                          |
| `professor-boas-vindas.html`| Página de boas-vindas para Professores (nav inferior)           | Professor                          |

---

## 5. Autenticação e Controle de Acesso

### Fluxo de Autenticação

1. **Registro:** O usuário preenche nome, email, senha e perfil desejado (Aluno/Professor/Avaliador) em um modal no `login.html`. Chama `supabase.auth.signUp()` com `options.data.nome` e `options.data.tipo`. Uma linha é inserida na tabela `usuarios` com `ativo = false`. O usuário é imediatamente deslogado.

2. **Aprovação pelo Admin:** O Administrador acessa `usuarios.html`, onde um modal é aberto automaticamente mostrando usuários inativos. O admin pode filtrar por tipo, selecionar múltiplos usuários e clicar "Ativar selecionados" para definir `ativo = true` via `supabase.auth.update()`.

3. **Login:** O usuário fornece email/senha. `supabase.auth.signInWithPassword()` é chamado. Após autenticação bem-sucedida, `buscarUsuarioAtual()` busca o perfil na tabela `usuarios`. Se `ativo` for `false`, o usuário é deslogado com mensagem de erro.

4. **Gerenciamento de Sessão:** `supabase.auth.getSession()` com `persistSession: true` e `autoRefreshToken: true`. A sessão é armazenada no localStorage pelo cliente Supabase.

5. **Proteção de Páginas:** O módulo `app.js` roda em `DOMContentLoaded` para cada página (exceto login/index). Chama `protegerPagina()` que verifica sessão válida e perfil ativo.

6. **Controle por Roles:** `app.js` define mapas `acessoPorPagina` e `menusPorPerfil`. A sidebar e os links de navegação são renderizados dinamicamente com base no `tipo` do usuário. Acesso não autorizado redireciona para a landing page do perfil.

7. **Logout:** `supabase.auth.signOut()` + redirecionamento para `login.html`.

---

## 6. Banco de Dados (Supabase)

### Tabelas (10 no total)

| Tabela                | Função                                                | Relacionamentos Principais            |
| --------------------- | ----------------------------------------------------- | ------------------------------------- |
| `usuarios`            | Perfis de usuários (vinculados a `auth.users` via UUID) | FK para `auth.users(id)`             |
| `tipos_projeto`       | Tipos de projeto ("Feira de Ciências", "Mostra Cultural") | Pai de áreas e critérios             |
| `areas_conhecimento`  | Áreas de conhecimento (vinculadas ao tipo de projeto)  | FK para `tipos_projeto`               |
| `professores`         | Professores (nome, número de matrícula)                | Referenciados como orientadores       |
| `alunos`              | Alunos (nome, matrícula, turma, turno)                 | Muitos-para-muitos com projetos       |
| `projetos`            | Projetos (ano, código, título, tipo, área, orientador) | FK para áreas, tipos, professores     |
| `projeto_alunos`      | Tabela de junção projeto-aluno                         | PK composta (projeto_id, aluno_id)    |
| `criterios`           | Critérios de avaliação (descrição, peso, observações)  | FK para `tipos_projeto`               |
| `avaliacoes`          | Registros de avaliação (projeto, avaliador, data)      | Única em (projeto_id, avaliador_id)   |
| `notas`               | Notas individuais por critério por avaliação           | PK composta (avaliacao_id, criterio_id) |

### Dados Iniciais (Seed)

- **2** tipos de projeto: "Feira de Ciências" e "Mostra Cultural"
- **19** áreas de conhecimento distribuídas entre os dois tipos
- **45** professores com números de matrícula
- **11** critérios de avaliação (6 para feira científica, 5 para mostra cultural) com texto detalhado de observações
- Alunos carregados externamente (1052 registros)

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado. Funções auxiliares `get_tipo_usuario()` e `is_admin()` definidas como `SECURITY DEFINER`:

- **Admins** têm acesso total em todas as tabelas
- **Professores** podem inserir/atualizar projetos e gerenciar alunos
- **Avaliadores** podem inserir/atualizar suas próprias avaliações
- **Todos os usuários autenticados** podem fazer SELECT na maioria das tabelas
- Bucket de storage `feceac` é privado com acesso baseado em roles

### Cálculo de Nota Ponderada

A função `calcularNotaFinal()` em `avaliacao.service.js` calcula a média ponderada: para cada critério, multiplica a nota (5-10) pelo peso do critério, soma os resultados e divide pelo total de pesos. O resultado é armazenado como `nota_final` na linha de `avaliacoes`.

### Triggers

- `on_usuario_deleted`: Quando uma linha é deletada de `public.usuarios`, o registro correspondente em `auth.users` também é deletado (`SECURITY DEFINER`).

---

## 7. Arquitetura JavaScript

### Padrão: Service-Controller MVC (simplificado)

```
Página HTML
  ├── app.js              (auth guard, renderização de menus, verificação de permissões)
  ├── page.controller.js  (manipulação DOM, handlers de eventos, lógica da página)
  ├── services/*.service.js (queries Supabase, lógica de negócio)
  ├── supabase.js         (instância do cliente)
  ├── config.js           (URLs, keys, constantes)
  ├── util.js             (helpers de DOM, helpers de formulário, escaping)
  └── ui.js               (notificações toast, modais de confirmação, loading spinners)
```

### Decisões de Design

- **ES6 Modules** (`type="module"`) em todo o projeto — sem bundler, sem transpilador
- **Sem framework SPA** — cada página é um arquivo HTML separado
- **Scripts vendor carregados como globals** (Bootstrap, jQuery, DataTables, jsPDF) via `<script>` antes dos módulos ES
- **Componentes customizados** de dropdown/autocomplete para buscar professores, projetos e alunos
- **Input com debounce** para campos de busca (350ms padrão)
- **`Promise.allSettled`** no dashboard para carregamento paralelo resiliente
- **Event delegation** utilizado extensivamente (handlers de clique em corpos de tabela)

### Bibliotecas

| Biblioteca            | Uso                                       | Onde é usada                |
| --------------------- | ----------------------------------------- | --------------------------- |
| Supabase JS v2        | Cliente BaaS                              | `supabase.js` (via esm.sh)  |
| Bootstrap 5.3         | Componentes UI, modais, toasts            | Todas as páginas            |
| jQuery                | Dependência do DataTables                 | `ranking.html` apenas       |
| DataTables            | Tabela ordenável/pesquisável              | `ranking.html` apenas       |
| jsPDF + AutoTable     | Geração de relatórios PDF                 | `ranking.controller.js`     |

---

## 8. CSS e Design

### Framework e Abordagem

- **Bootstrap 5.3** (vendored localmente) como framework UI principal
- **CSS customizado** sobreposto via 7 stylesheets:
  - `style.css`: Design system global com CSS custom properties (`--feceac-primary`, `--feceac-accent`, `--feceac-ink`, `--feceac-muted`, `--feceac-bg`), sidebar responsiva, nav inferior, grid de formulário de alunos
  - `painel.css`: Cards do dashboard, ícones de estatísticas, botões de ação rápida, background gradiente
  - `login.css`: Overlay gradiente sobre imagem de fundo
  - `tabelas.css`: Estilo de cabeçalho de tabela, indicadores de coluna ordenável
  - `boas-vindas.css`: Design do card de boas-vindas com tema verde
  - `ficha-avaliacao.css`: Ficha de avaliação otimizada para impressão com extensas regras `@media print` (450 linhas)
  - `dataTables.bootstrap5.min.css`: Tema DataTables para Bootstrap 5

### Design

- Paleta verde primário (`#14532d`), teal de destaque (`#0f766e`), gradientes sutis
- Layout baseado em cards com sombras, bordas arredondadas, efeitos hover
- **Responsivo:** Sidebar colapsável com hamburger no mobile, grids empilhados, media queries em `991.98px` e `767.98px`
- **Suporte a impressão:** Regras `@media print` extensas na ficha de avaliação (oculta nav/sidebar, otimiza layout para A4)

---

## 9. Configuração e Ambiente

### Para rodar localmente

Requer um servidor HTTP local (módulos ES não suportam protocolo `file://`):

```bash
python -m http.server 8000
# Acesse http://localhost:8000/login.html
```

### Configuração do Supabase

1. Criar um projeto no Supabase
2. Executar `supabase/schema.sql` no SQL Editor
3. Executar os dois arquivos de migration em ordem
4. Atualizar `js/config.js` com sua `SUPABASE_URL` e `SUPABASE_ANON_KEY`

### Deploy

1. Push para o GitHub
2. Habilitar GitHub Pages na branch principal

---

## 10. Observações de Qualidade

### Pontos Fortes

1. **Arquitetura bem organizada:** Separação clara de responsabilidades com services, controllers e utilities. Cada página possui um controller dedicado.
2. **Conscientização de segurança:** Apenas anon key do Supabase, RLS em todas as tabelas, funções `SECURITY DEFINER`, escape HTML via `escapeHtml()`, senha tratada pelo Supabase Auth (nunca armazenada em texto plano), validação de sessão em cada carregamento de página.
3. **Boas práticas de UX:** Notificações toast, modais de confirmação, loading spinners, busca com debounce, dropdowns que se ocultam automaticamente.
4. **RBAC abrangente:** Menus baseados em roles, controle de acesso a nível de página e políticas RLS no banco de dados — tudo alinhado.
5. **Ficha de avaliação otimizada para impressão:** `ficha-avaliacao.css` possui extensa otimização para impressão (450 linhas de `@media print`).
6. **Geração de relatório PDF:** Relatório jsPDF sofisticado com KPIs, agrupamento por área, tabelas de distribuição, quebras de página e rodapés.
7. **Sistema de migrations:** SQL migrations para alterações incrementais do schema.
8. **Tratamento de erros:** Try/catch com mensagens amigáveis via toast em todo o projeto.

### Pontos Fracos e Riscos

1. **Credenciais Supabase expostas:** `js/config.js` contém a `SUPABASE_URL` e `SUPABASE_ANON_KEY` commitadas no repositório. Embora a anon key seja projetada para ser pública, ela revela o ID do projeto e deveria ser gerenciada via variáveis de ambiente.
2. **Sem `package.json` ou build tooling:** Sem npm/yarn, sem bundler (Vite, Webpack), sem linter, sem formatter. Tudo carregado via CDN ou arquivos vendored.
3. **`teste-relacionamento.js` é arquivo de debug:** Executa uma query do Supabase a cada carregamento de `avaliacoes.html` e apenas loga no console. Deve ser removido antes da produção.
4. **HTML duplicado:** Navbar, sidebar e botão de logout são copiados em cada arquivo HTML. Um sistema de templates ou injeção de layout via JS reduziria a duplicação.
5. **Sidebars inconsistentes:** Diferentes páginas possuem diferentes conjuntos de links hardcoded no HTML. O `app.js` sobrescreve dinamicamente para Admin, mas para roles não-admin o HTML hardcoded é usado, o que pode mostrar links incorretos.
6. **`editar-projeto.html` é idêntico a `cadastrar-projeto.html`:** Ambos possuem 114 linhas e estrutura idêntica. Compartilham o mesmo controller. Essa duplicação poderia ser eliminada.
7. **Formatação inconsistente:** `avaliacao.controller.js` possui estilo de formatação não-padrão com muitas linhas duplas e padrões de uma instrução por linha.
8. **Handler `onclick` inline:** `avaliacao.controller.js` usa um atributo `onclick` com `mostrarObservacoes()` definida no `window`, o que ignora o escopo do módulo.
9. **jQuery e vanilla JS misturados:** A página de ranking carrega jQuery apenas para integração com DataTables, enquanto o resto do app usa vanilla JS.
10. **Sem tratamento global de erros:** Promise rejections não tratadas em módulos falhariam silenciosamente.
11. **Dashboard busca listas completas apenas para contar:** `listarUsuarios()`, `listarAvaliacoes()`, `listarProfessores()` e `listarCriterios()` carregam todas as linhas apenas para obter `.length`. Deveriam usar queries `count: 'exact', head: true`.
12. **Sem proteção CSRF ou Content Security Policy headers.**
13. **Controller compartilhado entre cadastro e edição:** `projeto.controller.js` detecta a presença de `#projetoForm` ou `#projetosTabela` para decidir o modo. Funcional, mas frágil.

---

## 11. Melhorias Sugeridas

### Alta Prioridade

| #  | Melhoria                                                                 |
| -- | ------------------------------------------------------------------------ |
| 1  | **Remover `teste-relacionamento.js`** de `avaliacoes.html` e deletar o arquivo |
| 2  | **Usar queries COUNT** no dashboard ao invés de buscar listas completas para melhorar performance |
| 3  | **Criar template HTML base** (ou usar JS para injetar navbar/sidebar) eliminando 15+ cópias da mesma estrutura HTML |
| 4  | **Mesclar `cadastrar-projeto.html` e `editar-projeto.html`** em uma única `projeto-form.html` |

### Média Prioridade

| #  | Melhoria                                                                 |
| -- | ------------------------------------------------------------------------ |
| 5  | **Adicionar build tool** (mesmo simples como Vite) para minificação, tree-shaking e possível migração para TypeScript |
| 6  | **Adicionar ESLint + Prettier** para formatação consistente de código     |
| 7  | **Implementar lazy loading** para bibliotecas vendor (DataTables, jsPDF) apenas nas páginas que as utilizam |
| 8  | **Adicionar sanitização de input** no backend via constraints do banco ou Edge Functions |
| 9  | **Implementar paginação** para datasets grandes (alunos, projetos, avaliações) ao invés de carregar todos os registros |
| 10 | **Adicionar suporte a internacionalização (i18n)** já que o app está hardcoded em Português |

### Baixa Prioridade

| #  | Melhoria                                                                 |
| -- | ------------------------------------------------------------------------ |
| 11 | **Adicionar testes unitários** para funções da camada de service (especialmente `calcularNotaFinal`) |
| 12 | **Adicionar favicon** (`<link rel="icon">`)                              |
| 13 | **Implementar dark mode** usando as CSS custom properties já definidas   |
| 14 | **Adicionar atalhos de teclado** para ações comuns                        |
| 15 | **Considerar conversão para SPA** (ex: com router leve) para eliminar recarregamentos de página |
| 16 | **Adicionar rate limiting ou CAPTCHA** no registro para prevenir abusos   |
| 17 | **Verificar `.gitignore`** para garantir exclusões adequadas             |

---

## 12. Resumo

O FECEAC é um sistema web educacional bem estruturado e construído com propósito específico para gerenciamento de feira científica/mostra cultural. A base de demonstra sólido conhecimento de padrões modernos de desenvolvimento web (ES6 modules, camada de service, RBAC, RLS), boas práticas de segurança (Supabase Auth + RLS) e bom design de UX (layout responsivo, navegação baseada em roles, suporte a impressão, relatórios PDF).

As principais áreas de melhoria são: reduzir a duplicação de HTML, remover código de debug, otimizar queries do dashboard e adicionar build tooling. O projeto é funcional e pronto para deploy no seu caso de uso pretendido.
