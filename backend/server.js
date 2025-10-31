const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL Connection Pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'biblioteca_academica',
    password: process.env.DB_PASSWORD || 'paocomovo234',
    port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Erro ao conectar no PostgreSQL:', err);
    } else {
        console.log('✅ Conectado ao PostgreSQL:', res.rows[0].now);
    }
});

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Busca usuário
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1 AND ativo = TRUE',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const user = result.rows[0];

        // Verifica senha (simplificado - em produção use bcrypt.compare)
        if (password !== user.senha_hash.replace('$2b$12$hashfake', '').slice(0, password.length)) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Busca pontos do usuário
        const pontosResult = await pool.query(
            'SELECT total_pontos FROM saldo_pontos WHERE usuario_id = $1',
            [user.id]
        );

        const userResponse = {
            id: user.id,
            name: user.nome,
            email: user.email,
            points: pontosResult.rows.length > 0 ? pontosResult.rows[0].total_pontos : 0,
            isAdmin: user.tipo_usuario === 'admin',
            modoFantasma: user.modo_fantasma
        };

        res.json(userResponse);
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// Registro
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Verifica se email já existe
        const checkEmail = await pool.query(
            'SELECT id FROM usuarios WHERE email = $1',
            [email]
        );

        if (checkEmail.rows.length > 0) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Cria hash simplificado (em produção use bcrypt.hash)
        const passwordHash = `$2b$12$hashfake${password}`;

        // Insere novo usuário
        const result = await pool.query(
            `INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, ativo) 
             VALUES ($1, $2, $3, 'usuario', TRUE) 
             RETURNING id, nome, email`,
            [name, email, passwordHash]
        );

        // Inicializa saldo de pontos
        await pool.query(
            'INSERT INTO saldo_pontos (usuario_id, total_pontos) VALUES ($1, 0)',
            [result.rows[0].id]
        );

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro ao criar conta' });
    }
});

// ==========================================
// ROTAS DE LIVROS
// ==========================================

// Listar todos os livros
app.get('/api/books', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                l.*,
                COALESCE(COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'ativo'), 0)::int as rented,
                COALESCE(SUM(a.nota), 0)::int as rating_sum,
                COALESCE(COUNT(DISTINCT a.id), 0)::int as rating_count
            FROM livros l
            LEFT JOIN emprestimos e ON l.id = e.livro_id AND e.status = 'ativo'
            LEFT JOIN avaliacoes a ON l.id = a.livro_id
            GROUP BY l.id
            ORDER BY l.id
        `);

        const books = result.rows.map(book => ({
            id: book.id,
            title: book.titulo,
            author: book.autor,
            category: book.categoria,
            copies: 5, // Valor fixo, ajuste conforme necessário
            rented: book.rented,
            cover: book.capa_url || `https://placehold.co/300x450/6366F1/FFFFFF?text=${encodeURIComponent(book.titulo)}`,
            ratingSum: book.rating_sum,
            ratingCount: book.rating_count
        }));

        res.json(books);
    } catch (error) {
        console.error('Erro ao buscar livros:', error);
        res.status(500).json({ error: 'Erro ao buscar livros' });
    }
});

// ==========================================
// ROTAS DE EMPRÉSTIMOS
// ==========================================

// Listar empréstimos do usuário
app.get('/api/rentals/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(`
            SELECT 
                e.*,
                l.titulo,
                t.nome as tier_nome
            FROM emprestimos e
            JOIN livros l ON e.livro_id = l.id
            LEFT JOIN tiers t ON e.tier_id = t.id
            WHERE e.usuario_id = $1
            ORDER BY e.data_emprestimo DESC
        `, [userId]);

        const rentals = result.rows.map(r => ({
            id: r.id,
            bookId: r.livro_id,
            userId: r.usuario_id,
            rentalDate: r.data_emprestimo,
            dueDate: r.data_devolucao_prevista,
            returnDate: r.data_devolucao_real,
            tier: r.tier_nome || 'Básico',
            title: r.titulo,
            status: r.status // Adicionar status para renderização no frontend
        }));

        res.json(rentals);
    } catch (error) {
        console.error('Erro ao buscar empréstimos:', error);
        res.status(500).json({ error: 'Erro ao buscar empréstimos' });
    }
});

// Todos os empréstimos (para admin)
app.get('/api/rentals', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                e.*,
                l.titulo,
                u.nome as usuario_nome,
                t.nome as tier_nome
            FROM emprestimos e
            JOIN livros l ON e.livro_id = l.id
            JOIN usuarios u ON e.usuario_id = u.id
            LEFT JOIN tiers t ON e.tier_id = t.id
            ORDER BY e.data_emprestimo DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar empréstimos:', error);
        res.status(500).json({ error: 'Erro ao buscar empréstimos' });
    }
});

// Criar empréstimo
app.post('/api/rentals', async (req, res) => {
    const client = await pool.connect();
    try {
        const { bookId, userId, tier, days } = req.body;

        await client.query('BEGIN');

        // Busca tier_id
        const tierResult = await client.query(
            'SELECT id FROM tiers WHERE dias_duracao = $1',
            [days]
        );

        const tierId = tierResult.rows.length > 0 ? tierResult.rows[0].id : 1;

        // Calcula data de devolução
        const dataEmprestimo = new Date();
        const dataDevolucao = new Date();
        dataDevolucao.setDate(dataDevolucao.getDate() + days);

        // Insere empréstimo
        const result = await client.query(`
            INSERT INTO emprestimos 
                (usuario_id, livro_id, tier_id, data_emprestimo, data_devolucao_prevista, status)
            VALUES ($1, $2, $3, $4, $5, 'ativo')
            RETURNING *
        `, [userId, bookId, tierId, dataEmprestimo, dataDevolucao]);

        await client.query('COMMIT');

        res.status(201).json({
            id: result.rows[0].id,
            bookId: result.rows[0].livro_id,
            userId: result.rows[0].usuario_id,
            rentalDate: result.rows[0].data_emprestimo,
            dueDate: result.rows[0].data_devolucao_prevista,
            returnDate: null,
            tier
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar empréstimo:', error);
        res.status(500).json({ error: 'Erro ao criar empréstimo' });
    } finally {
        client.release();
    }
});

// Devolver livro
app.put('/api/rentals/:rentalId/return', async (req, res) => {
    const client = await pool.connect();
    try {
        const { rentalId } = req.params;
        const { userId } = req.body;

        await client.query('BEGIN');

        // Busca empréstimo
        const rentalResult = await client.query(
            'SELECT * FROM emprestimos WHERE id = $1',
            [rentalId]
        );

        if (rentalResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Empréstimo não encontrado' });
        }

        const rental = rentalResult.rows[0];
        const dataDevolucao = new Date();

        // Atualiza empréstimo
        await client.query(
            `UPDATE emprestimos 
             SET data_devolucao_real = $1, status = 'devolvido'
             WHERE id = $2`,
            [dataDevolucao, rentalId]
        );

        // Verifica se devolveu no prazo para dar pontos
        if (dataDevolucao <= new Date(rental.data_devolucao_prevista)) {
            // Adiciona pontos
            await client.query(
                `INSERT INTO pontos (usuario_id, quantidade, motivo)
                 VALUES ($1, 25, 'Devolução no prazo - empréstimo #' || $2)`,
                [userId, rentalId]
            );
        }

        await client.query('COMMIT');

        res.json({ message: 'Livro devolvido com sucesso' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao devolver livro:', error);
        res.status(500).json({ error: 'Erro ao devolver livro' });
    } finally {
        client.release();
    }
});

// ==========================================
// ROTAS DE AVALIAÇÕES
// ==========================================

// Criar avaliação
app.post('/api/ratings', async (req, res) => {
    const client = await pool.connect();
    try {
        const { bookId, userId, rating, comment } = req.body;

        await client.query('BEGIN');

        // Verifica se já avaliou
        const checkRating = await client.query(
            'SELECT id FROM avaliacoes WHERE usuario_id = $1 AND livro_id = $2',
            [userId, bookId]
        );

        if (checkRating.rows.length > 0) {
            // Atualiza avaliação existente
            await client.query(
                'UPDATE avaliacoes SET nota = $1, comentario = $2 WHERE usuario_id = $3 AND livro_id = $4',
                [rating, comment, userId, bookId]
            );
        } else {
            // Insere nova avaliação
            await client.query(
                `INSERT INTO avaliacoes (usuario_id, livro_id, nota, comentario, visivel_publicamente)
                 VALUES ($1, $2, $3, $4, TRUE)`,
                [userId, bookId, rating, comment]
            );

            // Adiciona pontos
            await client.query(
                `INSERT INTO pontos (usuario_id, quantidade, motivo)
                 VALUES ($1, 10, 'Avaliação publicada - livro #' || $2)`,
                [userId, bookId]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({ message: 'Avaliação registrada com sucesso' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar avaliação:', error);
        res.status(500).json({ error: 'Erro ao criar avaliação' });
    } finally {
        client.release();
    }
});

// ==========================================
// ROTAS DE RANKINGS
// ==========================================

// Rankings
app.get('/api/rankings', async (req, res) => {
    try {
        // Leitor do mês (maior pontuação)
        const topUserResult = await pool.query(`
            SELECT u.nome, sp.total_pontos
            FROM usuarios u
            JOIN saldo_pontos sp ON u.id = sp.usuario_id
            WHERE u.tipo_usuario = 'usuario'
            ORDER BY sp.total_pontos DESC
            LIMIT 1
        `);

        // Livro mais popular (mais empréstimos)
        const mostReadResult = await pool.query(`
            SELECT l.titulo, COUNT(e.id) as total
            FROM livros l
            JOIN emprestimos e ON l.id = e.livro_id
            GROUP BY l.id, l.titulo
            ORDER BY total DESC
            LIMIT 1
        `);

        // Livro melhor avaliado
        const topRatedResult = await pool.query(`
            SELECT l.titulo, AVG(a.nota) as avg_rating, COUNT(a.id) as count
            FROM livros l
            JOIN avaliacoes a ON l.id = a.livro_id
            GROUP BY l.id, l.titulo
            HAVING COUNT(a.id) > 0
            ORDER BY avg_rating DESC
            LIMIT 1
        `);

        res.json({
            topUser: topUserResult.rows[0] || { nome: 'N/A', total_pontos: 0 },
            mostRead: mostReadResult.rows[0] || { titulo: 'N/A' },
            topRated: topRatedResult.rows[0] || { titulo: 'N/A', avg_rating: 0 }
        });
    } catch (error) {
        console.error('Erro ao buscar rankings:', error);
        res.status(500).json({ error: 'Erro ao buscar rankings' });
    }
});

// ==========================================
// ROTAS DE LISTA NEGRA
// ==========================================

// Listar usuários na lista negra com detalhes do empréstimo
// Listar usuários na lista negra com detalhes do empréstimo
app.get('/api/blacklist', async (req, res) => {
    try {
        const query = `
            SELECT 
                u.nome, 
                u.email,
                l.titulo AS titulo_livro,
                e.data_devolucao_prevista,
                e.data_emprestimo,
                -- CORREÇÃO: Subtração de Datas (DATE) retorna um INTEGER (número de dias)
                (CURRENT_DATE - e.data_devolucao_prevista) AS dias_atraso
            FROM 
                lista_negra ln
            JOIN 
                usuarios u ON ln.usuario_id = u.id
            JOIN 
                emprestimos e ON u.id = e.usuario_id
            JOIN 
                livros l ON e.livro_id = l.id
            WHERE 
                ln.ativo = TRUE AND e.status = 'atrasado'
            ORDER BY 
                e.data_devolucao_prevista ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        // Mantenha o console.error para ver logs
        console.error('❌ ERRO CRÍTICO ao buscar lista negra:', error);
        res.status(500).json({ error: 'Falha ao carregar lista negra' });
    }
});

/**
 * Resgata uma recompensa.
 * @param {string} rewardType - Tipo da recompensa ('expert_tier', 'extra_rental', 'ghost_mode', 'title_of_fame')
 * @param {number} userId - ID do usuário.
 */
app.post('/api/rewards/redeem', async (req, res) => {
    const { userId, rewardType, cost } = req.body;
    let client;

    // Garante que todos os campos necessários estão presentes
    if (!userId || !rewardType || cost === undefined) {
        return res.status(400).json({ error: 'Dados incompletos para resgate.' });
    }

    try {
        client = await pool.connect();
        await client.query('BEGIN'); // Inicia a transação

        // 1. Verificar saldo de pontos
        const balanceResult = await client.query(
            'SELECT total_pontos FROM saldo_pontos WHERE usuario_id = $1',
            [userId]
        );
        const currentPoints = balanceResult.rows[0]?.total_pontos || 0;

        if (currentPoints < cost) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: `Pontos insuficientes. Você tem ${currentPoints}, mas precisa de ${cost}.` });
        }

        let successMessage;

        // 2. Aplicar o benefício e registrar a transação
        if (rewardType === 'extra_rental') {
            successMessage = 'Você ganhou um Empréstimo Extra! Use-o na próxima vez.';
        } else if (rewardType === 'ghost_mode') {
            // Toggle do Modo Fantasma
            const result = await client.query(
                `UPDATE usuarios SET modo_fantasma = NOT modo_fantasma WHERE id = $1 RETURNING modo_fantasma`,
                [userId]
            );
            const isFantasma = result.rows[0].modo_fantasma;
            successMessage = `Modo Fantasma ${isFantasma ? 'ativado' : 'desativado'} com sucesso!`;
        } else if (rewardType === 'expert_tier') {
            successMessage = 'Tier Expert Resgatado! Aproveite 60 dias de aluguel.';
        } else if (rewardType === 'title_of_fame') {
            // Recompensa de Alto Valor: Título exclusivo ou Badge no perfil
            await client.query(
                `UPDATE ranking_leitores SET titulo_exclusivo = 'Lorde do Conhecimento' WHERE usuario_id = $1`, 
                [userId]
            );
            successMessage = 'Parabéns! Você resgatou o Título Exclusivo: Lorde do Conhecimento!';
        } else {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Recompensa desconhecida.' });
        }
        
        // 3. Subtrair pontos (registrar a despesa na tabela 'pontos')
        await client.query(
            'INSERT INTO pontos (usuario_id, quantidade, motivo) VALUES ($1, $2, $3)',
            [userId, -cost, `Resgate de Recompensa: ${rewardType}`]
        );

        await client.query('COMMIT'); // Finaliza a transação
        res.json({ success: true, message: successMessage });

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Erro ao resgatar recompensa:', error);
        res.status(500).json({ error: 'Erro interno ao tentar resgatar recompensa.' });
    } finally {
        if (client) client.release();
    }
});


// ==========================================
// ROTAS DE USUÁRIOS
// ==========================================

// Listar usuários (admin)
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id,
                u.nome,
                u.email,
                u.tipo_usuario,
                u.ativo,
                COALESCE(sp.total_pontos, 0) as points
            FROM usuarios u
            LEFT JOIN saldo_pontos sp ON u.id = sp.usuario_id
            ORDER BY u.id
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
});

// Buscar pontos do usuário
app.get('/api/users/:userId/points', async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            'SELECT total_pontos FROM saldo_pontos WHERE usuario_id = $1',
            [userId]
        );

        const points = result.rows.length > 0 ? result.rows[0].total_pontos : 0;
        res.json({ points });
    } catch (error) {
        console.error('Erro ao buscar pontos:', error);
        res.status(500).json({ error: 'Erro ao buscar pontos' });
    }
});

// ==========================================
// ROTAS DE POSTS (Feed Social)
// ==========================================

// Listar posts
app.get('/api/posts', async (req, res) => {
    try {
        // Aqui você pode criar uma tabela 'posts' no banco se quiser persistir
        // Por enquanto, vou retornar uma estrutura vazia para o frontend gerenciar
        res.json([]);
    } catch (error) {
        console.error('Erro ao buscar posts:', error);
        res.status(500).json({ error: 'Erro ao buscar posts' });
    }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 API disponível em http://localhost:${PORT}`);
});