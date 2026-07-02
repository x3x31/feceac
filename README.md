# FECEAC - Sistema Web para Gerenciamento da Feira de Ciências

Sistema web para gerenciamento da Feira de Ciências FECEAC, com autenticação, cadastro de projetos, alunos, áreas, usuários, critérios, avaliações e notas.

## Tecnologias

- HTML5, CSS3 e Bootstrap 5.3
- JavaScript ES6 Modules, sem jQuery e sem frameworks SPA
- Supabase: PostgreSQL, Authentication, Storage, API REST e Row Level Security
- GitHub Pages para hospedagem do frontend

## Estrutura

```text
feceac/
├── index.html
├── login.html
├── painel.html
├── projetos.html
├── cadastrar-projeto.html
├── editar-projeto.html
├── avaliacoes.html
├── usuarios.html
├── areas.html
├── criterios.html
├── css/
├── js/
│   ├── services/
│   └── controllers/
├── assets/
└── supabase/schema.sql
```

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. Acesse SQL Editor e execute `supabase/schema.sql`.
3. Em Authentication, crie os usuários de acesso.
4. Copie o UUID de cada usuário criado no Auth.
5. Insira ou cadastre o respectivo perfil na tabela `usuarios`.
6. Edite `js/config.js`:

```js
export const SUPABASE_URL = 'https://seu-projeto.supabase.co';
export const SUPABASE_ANON_KEY = 'sua-anon-key-publica';
```

Use somente a anon key no frontend. Nunca coloque a Service Role Key em arquivos públicos.

## Como Criar o Banco

Execute todo o conteúdo de `supabase/schema.sql`. O script cria:

- Tabelas relacionais
- Dados iniciais de áreas do conhecimento
- Critérios iniciais
- Funções auxiliares de perfil
- Políticas RLS por tipo de usuário
- Bucket privado `feceac` no Supabase Storage

## Execução Local

Por usar ES Modules, abra o projeto por um servidor local:

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

Se o comando for executado dentro da pasta `feceac`, acesse `http://localhost:8000/login.html`.

## Deploy no GitHub Pages

1. Envie a pasta `feceac` para um repositório GitHub.
2. No GitHub, acesse Settings > Pages.
3. Selecione a branch principal e a pasta raiz ou `/docs`, conforme sua organização.
4. Publique e acesse a URL gerada.

## Perfis e Permissões

- Administrador: acesso completo.
- Professor: cadastro e edição de projetos e alunos.
- Avaliador: registro de avaliações e notas.
- Aluno: leitura dos dados permitidos.

As permissões são aplicadas no banco por Row Level Security.

## Observações

- Usuários de autenticação devem ser criados no Supabase Authentication.
- A tela de usuários gerencia o perfil público vinculado ao UUID do Auth.
- O frontend está pronto para expansão por módulos, mantendo controllers, services, utilitários e UI separados.

## Licença

Este projeto pode ser utilizado para fins educacionais e adaptado conforme as necessidades da FECEAC.

