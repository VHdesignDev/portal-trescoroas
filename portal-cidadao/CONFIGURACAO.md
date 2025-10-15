# 🚀 Configuração Completa do Portal do Cidadão

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuita)
- Git instalado

## 🛠️ Passo a Passo da Configuração

### 1. **Configurar o Supabase**

1. **Acesse** [supabase.com](https://supabase.com) e crie uma conta
2. **Clique em "New Project"**
3. **Preencha os dados:**
   - Nome do projeto: `portal-cidadao-tres-coroas`
   - Senha do banco: (escolha uma senha forte)
   - Região: `South America (São Paulo)` (mais próxima do RS)
4. **Aguarde** a criação do projeto (2-3 minutos)

### 2. **Executar Scripts SQL**

1. **Vá para "SQL Editor"** no menu lateral
2. **Execute primeiro** o arquivo `supabase-migrations.sql`:
   - Copie todo o conteúdo do arquivo
   - Cole no editor SQL
   - Clique em "Run"

3. **Execute depois** o arquivo `supabase-storage-setup.sql`:
   - Copie todo o conteúdo do arquivo
   - Cole no editor SQL
   - Clique em "Run"

### 3. **Configurar Storage**

1. **Vá para "Storage"** no menu lateral
2. **Verifique se o bucket "fotos" foi criado**
3. **Se não existir, crie manualmente:**
   - Clique em "Create a new bucket"
   - Nome: `fotos`
   - Marque como "Public bucket"
   - Clique em "Create bucket"

### 4. **Obter Credenciais**

1. **Vá para "Settings" > "API"**
2. **Copie as seguintes informações:**
   - Project URL
   - Anon public key
   - Service role key (opcional, para funcionalidades administrativas)

### 5. **Configurar Variáveis de Ambiente**

1. **No projeto, renomeie** `.env.local.example` para `.env.local`
2. **Substitua os valores** pelas suas credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_project_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. **Instalar e Executar**

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Ou fazer build para produção
npm run build
npm start
```

### 7. **Criar Usuário Administrador**

1. **Vá para "Authentication" > "Users"** no Supabase
2. **Clique em "Add user"**
3. **Preencha:**
   - Email: `admin@trescoroas.rs.gov.br`
   - Password: `123456` (ou sua preferência)
   - Email Confirm: `true`
4. **Clique em "Create user"**

## 🎯 Testando a Aplicação

### **Como Cidadão:**
1. Acesse http://localhost:3000
2. Clique em "Reportar Problema"
3. Teste o upload de foto
4. Teste a geolocalização
5. Envie uma demanda

### **Como Administrador:**
1. Acesse http://localhost:3000/login
2. Use: `admin@trescoroas.rs.gov.br` / `123456`
3. Acesse o dashboard
4. Teste alterar status das demandas

## 🔧 Funcionalidades Implementadas

### ✅ **Melhorias Recentes:**

1. **Contraste Melhorado:**
   - Textos mais escuros e legíveis
   - Melhor acessibilidade visual

2. **Upload de Imagens Funcional:**
   - Validação de tipo e tamanho
   - Preview da imagem
   - Feedback visual durante upload
   - Integração com Supabase Storage

3. **Sistema de Navegação Completo:**
   - Header com links para todas as páginas
   - Autenticação integrada
   - Menu responsivo para mobile

4. **Cadastro de Usuários:**
   - Formulário completo com validação
   - Campos: email, senha, nome, telefone, endereço, bairro
   - Integração com sistema de bairros

5. **Geolocalização Avançada:**
   - Geocoding reverso (coordenadas → endereço)
   - Confirmação visual no mapa
   - Detecção automática de bairro
   - Interface intuitiva de confirmação

6. **Banco de Dados Atualizado:**
   - Tabela de usuários com perfis
   - Tabela de bairros pré-populada
   - Campos de endereço nas demandas
   - Políticas de segurança (RLS)

## 📱 Páginas Disponíveis

- **`/`** - Página inicial com lista de demandas
- **`/nova-demanda`** - Formulário para reportar problemas
- **`/acompanhar`** - Acompanhar status das demandas
- **`/login`** - Login para administradores
- **`/registro`** - Cadastro de novos usuários
- **`/dashboard`** - Dashboard administrativo (requer login)

## 🗂️ Estrutura de Dados

### **Tabelas Criadas:**
- `demandas` - Problemas reportados pelos cidadãos
- `categorias` - Tipos de problemas (lâmpada, buraco, etc.)
- `user_profiles` - Perfis dos usuários cadastrados
- `bairros` - Lista de bairros da cidade
- `auth.users` - Usuários do sistema (Supabase Auth)

### **Storage:**
- `fotos` - Bucket para armazenar fotos das demandas

## 🚨 Solução de Problemas

### **Erro de CORS:**
- Verifique se as URLs estão corretas no `.env.local`
- Certifique-se de que o Supabase está configurado corretamente

### **Upload não funciona:**
- Verifique se o bucket "fotos" existe e é público
- Execute o script `supabase-storage-setup.sql`

### **Geolocalização não funciona:**
- Use HTTPS em produção (obrigatório para geolocalização)
- Verifique permissões do navegador

### **Erro de autenticação:**
- Verifique as chaves no `.env.local`
- Certifique-se de que o usuário admin foi criado

## 🌐 Deploy em Produção

### **Vercel (Recomendado):**
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### **Outras opções:**
- Netlify
- Railway
- Heroku

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console do navegador
2. Verifique os logs do Supabase
3. Consulte a documentação do Next.js e Supabase

---

**🎉 Parabéns! Seu Portal do Cidadão está pronto para uso!**
