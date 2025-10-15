# 🏛️ Portal do Cidadão - Três Coroas/RS

Uma plataforma web responsiva para participação cidadã do município de Três Coroas, Rio Grande do Sul, permitindo que os cidadãos reportem problemas urbanos e acompanhem suas resoluções.

## 🚀 Funcionalidades

### Para Cidadãos
- **Cadastro de Demandas**: Reportar problemas com foto, categoria e localização
- **Visualização em Mapa**: Ver todas as demandas em um mapa interativo
- **Acompanhamento**: Verificar status das demandas (aberta, em andamento, resolvida)
- **Interface Responsiva**: Funciona perfeitamente em mobile e desktop

### Para Administradores
- **Dashboard Completo**: Estatísticas e métricas em tempo real
- **Gestão de Demandas**: Alterar status das demandas
- **Relatórios Visuais**: Gráficos de evolução e categorias
- **Tempo de Resolução**: Métricas de performance

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Supabase
- **Banco de Dados**: PostgreSQL (via Supabase)
- **Mapas**: Leaflet (OpenStreetMap)
- **Autenticação**: Supabase Auth
- **Gráficos**: Recharts
- **Upload de Arquivos**: Supabase Storage

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Supabase (gratuita)
- Git

## 🔧 Configuração

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd portal-cidadao
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá para Settings > API e copie:
   - Project URL
   - Anon public key
   - Service role key (para operações administrativas)

### 4. Configure as variáveis de ambiente

Copie o arquivo `.env.local.example` para `.env.local`:
```bash
cp .env.local.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Configure o banco de dados

Execute o script SQL no Supabase SQL Editor:
```bash
# Copie o conteúdo do arquivo supabase-migrations.sql
# e execute no SQL Editor do Supabase
```

### 6. Configure o Storage (opcional)

No Supabase Dashboard:
1. Vá para Storage
2. Crie um bucket chamado "fotos"
3. Configure as políticas de acesso público para leitura

## 🚀 Executando o projeto

### Desenvolvimento
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

### Produção
```bash
npm run build
npm start
```

## 👥 Usuários de Teste

Para testar o sistema administrativo, use:
- **Email**: admin@trescoroas.rs.gov.br
- **Senha**: 123456

(Configure este usuário no Supabase Auth)

## 📱 Uso da Aplicação

### Para Cidadãos

1. **Reportar Problema**:
   - Clique em "Reportar Problema"
   - Tire uma foto ou selecione da galeria
   - Escolha a categoria do problema
   - Permita acesso à localização ou selecione no mapa
   - Adicione uma descrição (opcional)
   - Envie a demanda

2. **Visualizar Demandas**:
   - Na página inicial, veja todas as demandas
   - Use filtros por status ou categoria
   - Alterne entre visualização em lista ou mapa

### Para Administradores

1. **Acesso ao Dashboard**:
   - Faça login em `/login`
   - Acesse o dashboard em `/dashboard`

2. **Gerenciar Demandas**:
   - Visualize estatísticas em tempo real
   - Altere status das demandas
   - Acompanhe métricas de resolução

## 🗂️ Estrutura do Projeto

```
src/
├── app/                    # Páginas Next.js
│   ├── dashboard/         # Dashboard administrativo
│   ├── login/            # Página de login
│   ├── nova-demanda/     # Formulário de nova demanda
│   └── page.tsx          # Página inicial
├── components/            # Componentes React
│   ├── auth/             # Componentes de autenticação
│   ├── dashboard/        # Componentes do dashboard
│   ├── forms/            # Formulários
│   ├── layout/           # Layout e navegação
│   ├── map/              # Componentes de mapa
│   └── ui/               # Componentes base (Button, Card, etc.)
├── lib/                  # Utilitários e configurações
│   ├── api.ts            # Cliente da API
│   ├── auth.ts           # Serviços de autenticação
│   ├── supabase.ts       # Configuração do Supabase
│   ├── types.ts          # Tipos TypeScript
│   └── utils.ts          # Funções utilitárias
└── styles/               # Estilos globais
```

## 🔒 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) no banco de dados
- Validação de dados com Zod
- Sanitização de uploads de arquivos

## 📊 Banco de Dados

### Tabelas Principais

- **demandas**: Armazena todas as demandas dos cidadãos
- **categorias**: Categorias predefinidas de problemas
- **auth.users**: Usuários do sistema (gerenciado pelo Supabase)

### Campos Temporais

- `data_criacao`: Timestamp de criação da demanda
- `data_resolucao`: Timestamp de resolução (quando aplicável)
- `created_at` / `updated_at`: Controle de auditoria

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Outras Plataformas
- Netlify
- Railway
- Heroku

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Abra uma issue no GitHub
3. Entre em contato com a equipe de desenvolvimento

---

Desenvolvido com ❤️ para melhorar nossa cidade através da participação cidadã.
