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

// Middleware para atualizar status de empréstimos automaticamente
const atualizarStatusEmprestimos = async () => {
    try {
        await pool.query(`SELECT atualizar_status_emprestimos()`);
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
    }
};

// Executa a cada 1 hora
setInterval(atualizarStatusEmprestimos, 60 * 60 * 1000);
// Executa na inicialização
atualizarStatusEmprestimos();

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1 AND ativo = TRUE',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const user = result.rows[0];

        // Verifica senha (simplificado)
        if (password !== user.senha_hash.replace('$2b$12$hashfake', '').slice(0, password.length)) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

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

        const checkEmail = await pool.query(
            'SELECT id FROM usuarios WHERE email = $1',
            [email]
        );

        if (checkEmail.rows.length > 0) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        const passwordHash = `$2b$12$hashfake${password}`;

        const result = await pool.query(
            `INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, ativo) 
             VALUES ($1, $2, $3, 'usuario', TRUE) 
             RETURNING id, nome, email`,
            [name, email, passwordHash]
        );

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
            description: book.descricao,
            copies: 5,
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

// Buscar avaliações de um livro
app.get('/api/books/:bookId/ratings', async (req, res) => {
    try {
        const { bookId } = req.params;
        
        const result = await pool.query(`
            SELECT 
                a.*,
                u.nome as usuario_nome,
                u.modo_fantasma
            FROM avaliacoes a
            JOIN usuarios u ON a.usuario_id = u.id
            WHERE a.livro_id = $1 
              AND (a.visivel_publicamente = TRUE OR u.modo_fantasma = FALSE)
            ORDER BY a.data_avaliacao DESC
        `, [bookId]);

        const ratings = result.rows.map(r => ({
            id: r.id,
            userName: r.modo_fantasma ? 'Usuário Anônimo' : r.usuario_nome,
            rating: r.nota,
            comment: r.comentario,
            date: r.data_avaliacao
        }));

        res.json(ratings);
    } catch (error) {
        console.error('Erro ao buscar avaliações:', error);
        res.status(500).json({ error: 'Erro ao buscar avaliações' });
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
            status: r.status
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
            SELECT * FROM vw_emprestimos_completos
            ORDER BY data_emprestimo DESC
            LIMIT 100
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

        const tierResult = await client.query(
            'SELECT id FROM tiers WHERE dias_duracao = $1',
            [days]
        );

        const tierId = tierResult.rows.length > 0 ? tierResult.rows[0].id : 1;

        const dataEmprestimo = new Date();
        const dataDevolucao = new Date();
        dataDevolucao.setDate(dataDevolucao.getDate() + days);

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

        await client.query(
            `UPDATE emprestimos 
             SET data_devolucao_real = $1, status = 'devolvido'
             WHERE id = $2`,
            [dataDevolucao, rentalId]
        );

        if (dataDevolucao <= new Date(rental.data_devolucao_prevista)) {
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

        const checkRating = await client.query(
            'SELECT id FROM avaliacoes WHERE usuario_id = $1 AND livro_id = $2',
            [userId, bookId]
        );

        if (checkRating.rows.length > 0) {
            await client.query(
                'UPDATE avaliacoes SET nota = $1, comentario = $2 WHERE usuario_id = $3 AND livro_id = $4',
                [rating, comment, userId, bookId]
            );
        } else {
            await client.query(
                `INSERT INTO avaliacoes (usuario_id, livro_id, nota, comentario, visivel_publicamente)
                 VALUES ($1, $2, $3, $4, TRUE)`,
                [userId, bookId, rating, comment]
            );

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
        const topUserResult = await pool.query(`
            SELECT u.nome, sp.total_pontos
            FROM usuarios u
            JOIN saldo_pontos sp ON u.id = sp.usuario_id
            WHERE u.tipo_usuario = 'usuario'
            ORDER BY sp.total_pontos DESC
            LIMIT 1
        `);

        const mostReadResult = await pool.query(`
            SELECT l.titulo, COUNT(e.id) as total
            FROM livros l
            JOIN emprestimos e ON l.id = e.livro_id
            GROUP BY l.id, l.titulo
            ORDER BY total DESC
            LIMIT 1
        `);

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

// Lista negra
app.get('/api/blacklist', async (req, res) => {
    try {
        const query = `
            SELECT 
                u.nome, 
                u.email,
                l.titulo AS titulo_livro,
                e.data_devolucao_prevista,
                e.data_emprestimo,
                (CURRENT_DATE - e.data_devolucao_prevista) AS dias_atraso
            FROM lista_negra ln
            JOIN usuarios u ON ln.usuario_id = u.id
            JOIN emprestimos e ON u.id = e.usuario_id
            JOIN livros l ON e.livro_id = l.id
            WHERE ln.ativo = TRUE AND e.status = 'atrasado'
            ORDER BY e.data_devolucao_prevista ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ ERRO ao buscar lista negra:', error);
        res.status(500).json({ error: 'Falha ao carregar lista negra' });
    }
});

// ==========================================
// ROTAS DE RECOMPENSAS
// ==========================================

// Resgatar recompensa
app.post('/api/rewards/redeem', async (req, res) => {
    const { userId, rewardType, cost } = req.body;
    let client;

    if (!userId || !rewardType || cost === undefined) {
        return res.status(400).json({ error: 'Dados incompletos para resgate.' });
    }

    try {
        client = await pool.connect();
        await client.query('BEGIN');

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

        if (rewardType === 'extra_rental') {
            successMessage = 'Você ganhou um Empréstimo Extra! Use-o na próxima vez.';
        } else if (rewardType === 'ghost_mode') {
            const result = await client.query(
                `UPDATE usuarios SET modo_fantasma = NOT modo_fantasma WHERE id = $1 RETURNING modo_fantasma`,
                [userId]
            );
            const isFantasma = result.rows[0].modo_fantasma;
            successMessage = `Modo Fantasma ${isFantasma ? 'ativado' : 'desativado'} com sucesso!`;
        } else if (rewardType === 'expert_tier') {
            successMessage = 'Tier Expert Resgatado! Aproveite 60 dias de aluguel.';
        } else if (rewardType === 'title_of_fame') {
            await client.query(
                `UPDATE ranking_leitores SET titulo_exclusivo = 'Lorde do Conhecimento' WHERE usuario_id = $1`, 
                [userId]
            );
            successMessage = 'Parabéns! Você resgatou o Título Exclusivo: Lorde do Conhecimento!';
        } else {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Recompensa desconhecida.' });
        }
        
        await client.query(
            'INSERT INTO pontos (usuario_id, quantidade, motivo) VALUES ($1, $2, $3)',
            [userId, -cost, `Resgate de Recompensa: ${rewardType}`]
        );

        await client.query(
            'INSERT INTO recompensas_resgatadas (usuario_id, tipo_recompensa, custo_pontos) VALUES ($1, $2, $3)',
            [userId, rewardType, cost]
        );

        await client.query('COMMIT');
        res.json({ success: true, message: successMessage });

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Erro ao resgatar recompensa:', error);
        res.status(500).json({ error: 'Erro interno ao tentar resgatar recompensa.' });
    } finally {
        if (client) client.release();
    }
});

// Listar recompensas do usuário
app.get('/api/rewards/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const result = await pool.query(
            'SELECT * FROM recompensas_resgatadas WHERE usuario_id = $1 ORDER BY data_resgate DESC',
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar recompensas:', error);
        res.status(500).json({ error: 'Erro ao buscar recompensas' });
    }
});

// ==========================================
// ROTAS DE POSTS (Feed Social)
// ==========================================

// Listar posts
app.get('/api/posts', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.*,
                u.nome as usuario_nome
            FROM posts p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.ativo = TRUE
            ORDER BY p.data_criacao DESC
            LIMIT 50
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar posts:', error);
        res.status(500).json({ error: 'Erro ao buscar posts' });
    }
});

// Criar post
app.post('/api/posts', async (req, res) => {
    try {
        const { userId, content } = req.body;

        if (!content || !userId) {
            return res.status(400).json({ error: 'Conteúdo e usuário são obrigatórios' });
        }

        const result = await pool.query(
            'INSERT INTO posts (usuario_id, conteudo) VALUES ($1, $2) RETURNING *',
            [userId, content]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar post:', error);
        res.status(500).json({ error: 'Erro ao criar post' });
    }
});

// Votar em post
app.post('/api/posts/:postId/vote', async (req, res) => {
    const client = await pool.connect();
    try {
        const { postId } = req.params;
        const { userId, voteType } = req.body;

        await client.query('BEGIN');

        const existingVote = await client.query(
            'SELECT * FROM votos_posts WHERE post_id = $1 AND usuario_id = $2',
            [postId, userId]
        );

        if (existingVote.rows.length > 0) {
            if (existingVote.rows[0].tipo_voto === voteType) {
                await client.query(
                    'DELETE FROM votos_posts WHERE post_id = $1 AND usuario_id = $2',
                    [postId, userId]
                );
            } else {
                await client.query(
                    'UPDATE votos_posts SET tipo_voto = $1 WHERE post_id = $2 AND usuario_id = $3',
                    [voteType, postId, userId]
                );
            }
        } else {
            await client.query(
                'INSERT INTO votos_posts (post_id, usuario_id, tipo_voto) VALUES ($1, $2, $3)',
                [postId, userId, voteType]
            );
        }

        await client.query('COMMIT');

        const postResult = await pool.query(
            'SELECT likes, dislikes FROM posts WHERE id = $1',
            [postId]
        );

        res.json(postResult.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao votar:', error);
        res.status(500).json({ error: 'Erro ao votar' });
    } finally {
        client.release();
    }
});

// Buscar votos do usuário
app.get('/api/posts/votes/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const result = await pool.query(
            'SELECT post_id, tipo_voto FROM votos_posts WHERE usuario_id = $1',
            [userId]
        );

        const votes = {};
        result.rows.forEach(row => {
            votes[row.post_id] = row.tipo_voto;
        });

        res.json(votes);
    } catch (error) {
        console.error('Erro ao buscar votos:', error);
        res.status(500).json({ error: 'Erro ao buscar votos' });
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
                u.modo_fantasma,
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

// Toggle modo fantasma
app.put('/api/users/:userId/toggle-ghost', async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            'UPDATE usuarios SET modo_fantasma = NOT modo_fantasma WHERE id = $1 RETURNING modo_fantasma',
            [userId]
        );

        res.json({ modoFantasma: result.rows[0].modo_fantasma });
    } catch (error) {
        console.error('Erro ao alternar modo fantasma:', error);
        res.status(500).json({ error: 'Erro ao alternar modo fantasma' });
    }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 API disponível em http://localhost:${PORT}`);
});