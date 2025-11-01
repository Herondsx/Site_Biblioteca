# 📚 Sistema de Biblioteca Acadêmica

![Library System](https://img.shields.io/badge/Library-System-teal?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Uma plataforma moderna que combina gestão de biblioteca digital com rede social literária**

[Demo ao Vivo](https://herondsx.github.io/Site_Biblioteca/) • [Documentação](https://docs.google.com/document/d/1PToJ3kzgytBEnweqFLogQD-0eG5USEUslSgHcSQ09s4/edit?usp=sharing) • [Reportar Bug](https://github.com/Herondsx/Projeto_Eng/issues)

---

## 🎯 Sobre o Projeto

O **Sistema de Biblioteca Acadêmica** é uma aplicação web inovadora desenvolvida como projeto de Engenharia de Software pela FEI (Fundação Educacional Inaciana Padre Sabóia de Medeiros). O sistema une a eficiência de uma biblioteca digital moderna com recursos de rede social, criando uma comunidade vibrante de leitores.

### ✨ Principais Características

- 🎮 **Sistema de Gamificação** - Ganhe pontos por devoluções pontuais e avaliações
- 🏆 **Rankings em Tempo Real** - Acompanhe leitores mais ativos e livros mais populares
- 💬 **Feed Comunitário** - Compartilhe resenhas e interaja com outros leitores
- 🎨 **Interface 3D Interativa** - Background animado com Three.js
- 📱 **Design Responsivo** - Experiência otimizada para todos os dispositivos
- 🔐 **Sistema de Autenticação** - Login seguro com hash de senhas
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

### Frontend
- **HTML5** - Estrutura semântica
- **Tailwind CSS** - Estilização responsiva
- **JavaScript ES6** - Lógica da aplicação
- **Three.js** - Efeitos 3D e animações
- **Day.js** - Manipulação de datas

### Armazenamento
- **LocalStorage** - Persistência de dados no navegador
- **SessionStorage** - Gerenciamento de sessão de usuário

### Ferramentas de Desenvolvimento
- **Git/GitHub** - Controle de versão
- **Google Forms** - Pesquisa com usuários

---

## 📦 Instalação e Uso

### Pré-requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor web local (opcional, para desenvolvimento)

### Instalação

**1. Clone o repositório**
```bash
git clone https://github.com/Herondsx/Projeto_Eng.git
cd Site_Biblioteca
```

**2. Abra o arquivo HTML**
```bash
# Abra index.html diretamente no navegador ou use um servidor local
python -m http.server 8000
# ou
npx serve
```

**3. Acesse a aplicação**
```
http://localhost:8000
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

- **1000 pontos** - Aluguel Grátis por 1 Mês
- **500 pontos** - Ícone de Perfil Exclusivo
- **300 pontos** - Extensão de Prazo (+15 dias)

---

## 📈 Análise de Custos

### Pequena Escala (menor que 5.000 usuários)
- Hospedagem em nuvem
- CDN básico
- Banco de dados compartilhado
- **Custo estimado:** aproximadamente R$ 300/mês

### Larga Escala (maior que 50.000 usuários)
- Servidores dedicados
- CDN robusta
- Cluster de banco de dados
- Sistema de busca otimizado
- **Custo estimado:** aproximadamente R$ 7.400/mês

---

## 👥 Equipe de Desenvolvimento

- **Eric Antunes Alves** - Desenvolvedor
- **Gustavo Matias Félix** - Desenvolvedor
- **Heron de Souza** - Desenvolvedor
- **João Matheus E. B. da Silva** - Desenvolvedor
- **Lucas Galvano de Paula** - Desenvolvedor
- **Vinicius T. Pereira** - Desenvolvedor

---


## 🔗 Links Úteis

- [📝 Documentação Completa](https://docs.google.com/document/d/1PToJ3kzgytBEnweqFLogQD-0eG5USEUslSgHcSQ09s4/edit?usp=sharing)
- [🌐 Demo ao Vivo](https://herondsx.github.io/Site_Biblioteca/)
---

## 📄 Licença

Este projeto foi desenvolvido como trabalho acadêmico para a disciplina de Engenharia de Software da FEI.
