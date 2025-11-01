# 📚 Sistema de Biblioteca Acadêmica

![Library System](https://img.shields.io/badge/Library-System-teal?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Uma plataforma moderna que combina gestão de biblioteca digital com rede social literária**

• [Documentação](https://docs.google.com/document/d/1PToJ3kzgytBEnweqFLogQD-0eG5USEUslSgHcSQ09s4/edit?usp=sharing) • [Reportar Bug](https://github.com/Herondsx/Site_Biblioteca/issues)

---

## 🎯 Sobre o Projeto

O **Sistema de Biblioteca Acadêmica** é uma aplicação web full-stack desenvolvida como projeto de Engenharia de Software pela FEI (Fundação Educacional Inaciana Padre Sabóia de Medeiros). O sistema une a eficiência de uma biblioteca digital moderna com recursos de rede social, criando uma comunidade vibrante de leitores.

### ✨ Principais Características

- 🎮 **Sistema de Gamificação** - Ganhe pontos por devoluções pontuais e avaliações
- 🏆 **Rankings em Tempo Real** - Acompanhe leitores mais ativos e livros mais populares
- 💬 **Feed Comunitário** - Compartilhe resenhas e interaja com outros leitores
- 🎨 **Interface 3D Interativa** - Background animado com Three.js
- 📱 **Design Responsivo** - Experiência otimizada para todos os dispositivos
- 🔐 **Sistema de Autenticação** - Login seguro com backend robusto
- ⚡ **Performance Otimizada** - Busca e filtragem instantânea de livros

---

## 🚀 Funcionalidades

### Para Usuários

#### 📖 Gestão de Livros
- Busca avançada por título, autor e categoria
- Visualização detalhada com capas e avaliações
- Sistema de reserva e empréstimo
- 3 tiers de aluguel (15, 30 ou 60 dias)
- Histórico de leituras

#### 🎯 Gamificação
- Ganhe 25 pontos por devolução pontual
- Ganhe 10 pontos por cada avaliação
- Troque pontos por recompensas
- Rankings de leitores
- Sistema de conquistas

#### 👥 Comunidade
- Feed social com posts de leitores
- Sistema de likes e dislikes
- Perfil público ou anônimo (modo fantasma)
- Compartilhamento de resenhas
- Interação em tempo real

#### ⚠️ Controle de Qualidade
- Lista negra automática (atraso maior que 90 dias)
- Notificações de prazos
- Sistema de avaliações por estrelas
- Histórico completo de atividades

### Para Administradores

- 🛠️ **Painel de Administração** - Gerenciamento completo do acervo
- 📊 **Visualização de Banco de Dados** - Tabelas em tempo real (livros, usuários, aluguéis, posts)
- 👤 **Gestão de Usuários** - Ativação/desativação de contas
- 📈 **Relatórios e Estatísticas** - Análise de uso da plataforma

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web minimalista
- **PostgreSQL** - Banco de dados relacional
- **bcrypt** - Criptografia de senhas
- **CORS** - Configuração de requisições cross-origin
- **dotenv** - Gerenciamento de variáveis de ambiente

### Frontend
- **HTML5** - Estrutura semântica
- **Tailwind CSS** - Estilização responsiva
- **JavaScript ES6** - Lógica da aplicação
- **Three.js** - Efeitos 3D e animações
- **Day.js** - Manipulação de datas

### Ferramentas de Desenvolvimento
- **Git/GitHub** - Controle de versão
- **nodemon** - Hot-reload em desenvolvimento
- **PostgreSQL** - Sistema de gerenciamento de banco de dados

---

## 📦 Instalação e Uso

### Pré-requisitos

```bash
Node.js >= 16.x
PostgreSQL >= 15.x
npm >= 8.x
```

### Instalação

**1. Clone o repositório**
```bash
git clone https://github.com/Herondsx/Site_Biblioteca.git
cd Site_Biblioteca
```

**2. Configure o Banco de Dados**
```bash
# Acessar PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE biblioteca_academica;

# Executar scripts de criação das tabelas (se disponível)
\i database/schema.sql
```

**3. Configure o Backend**
```bash
# Navegue até a pasta backend
cd backend

# Instale as dependências (apenas primeira vez)
npm install

# Configure o arquivo .env com suas credenciais do PostgreSQL
# Edite o arquivo .env e adicione:
# DB_USER=postgres
# DB_HOST=localhost
# DB_NAME=biblioteca_academica
# DB_PASSWORD=sua_senha_aqui
# DB_PORT=5432
# PORT=3000

# Inicie o servidor em modo desenvolvimento
npm run dev
```

**4. Configure o Frontend**
```bash
# Em outra janela do terminal, vá para a pasta frontend
cd frontend

# Abra o index.html com Live Server (extensão do VS Code)
# Ou clique com botão direito no index.html > "Open with Live Server"
```

**5. Acesse a aplicação**
```
Frontend: http://localhost:5500 (ou a porta do Live Server)
Backend API: http://localhost:3000
```

### Credenciais de Teste

**Administrador:**
- Email: `admin`
- Senha: `admin`

**Usuário Regular:**
- Crie uma nova conta através da interface de cadastro

---

## 💡 Como Usar

### Para Leitores

1. **Cadastro/Login** - Crie sua conta ou faça login
2. **Explorar Catálogo** - Navegue pelos livros disponíveis usando busca e filtros
3. **Alugar Livros** - Escolha seu tier preferido (Básico, Avançado ou Expert)
4. **Avaliar e Comentar** - Ganhe pontos compartilhando suas opiniões
5. **Interagir no Feed** - Publique posts e interaja com a comunidade
6. **Resgatar Recompensas** - Troque seus pontos por benefícios

### Para Administradores

1. **Acessar Painel Admin** - Clique no botão flutuante (FAB) no canto inferior direito
2. **Gerenciar Acervo** - Visualize e gerencie livros, usuários e aluguéis em tempo real
3. **Monitorar Atividades** - Acompanhe estatísticas e rankings
4. **Revisar Lista Negra** - Gerencie usuários inadimplentes

---

## 📊 Sistema de Pontuação

| Ação | Pontos |
|------|--------|
| Devolução no prazo | +25 pts |
| Avaliação de livro | +10 pts |
| Atraso na devolução | 0 pts |
| Lista negra (maior que 90 dias) | Bloqueio |

### Loja de Recompensas

- **50 pontos** - Modo Fantasma (perfil anônimo)
- **100 pontos** - Empréstimo Extra
- **250 pontos** - Tier Expert (60 dias permanente)
- **1000 pontos** - Título Exclusivo: "Lorde do Conhecimento"

---

## 📈 Análise de Custos

### Pequena Escala (menor que 5.000 usuários)
- Hospedagem em nuvem (VPS)
- CDN básico
- Banco de dados PostgreSQL gerenciado
- **Custo estimado:** aproximadamente R$ 300/mês

### Larga Escala (maior que 50.000 usuários)
- Servidores dedicados com load balancer
- CDN robusta e global
- Cluster de banco de dados PostgreSQL
- Sistema de cache (Redis)
- Monitoramento e backups
- **Custo estimado:** aproximadamente R$ 7.400/mês

---

## 👥 Equipe de Desenvolvimento

- **Eric Antunes Alves** - Desenvolvedor -  
- **Gustavo Matias Félix** - Desenvolvedor - [Github](https://github.com/Gustavo-Matias19)
- **Heron de Souza** - Desenvolvedor - [Github](https://github.com/Herondsx)
- **João Matheus E. B. da Silva** - Desenvolvedor - [Github](https://github.com/JoaoMateusSilva)
- **Lucas Galvano de Paula** - Desenvolvedor - [Github](https://github.com/LucasGalvano)
- **Vinicius T. Pereira** - Desenvolvedor

---

## 🔗 Links Úteis

- [📝 Documentação Completa](https://docs.google.com/document/d/1PToJ3kzgytBEnweqFLogQD-0eG5USEUslSgHcSQ09s4/edit?usp=sharing)
- [🌳 Árvore do Projeto](https://herondsx.github.io/Projeto_Eng/)

---

## 📄 Licença

Este projeto foi desenvolvido como trabalho acadêmico para a disciplina de Engenharia de Software da FEI.