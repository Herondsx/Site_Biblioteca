// Configuração do Day.js
dayjs.extend(dayjs_plugin_relativeTime);
dayjs.extend(dayjs_plugin_utc);
dayjs.extend(dayjs_plugin_timezone);
dayjs.locale('pt-br');
dayjs.tz.setDefault("America/Sao_Paulo");

// API Base URL
const API_URL = 'http://localhost:3000/api';

// Estado global e variáveis de cena
let currentUser = null;
let allBooks = [];
let allPosts = [];
let userVotes = {}; // Armazena votos do usuário {postId: 'like'/'dislike'}
let loginScene;
let loginAnimationId;

// ==========================================
// 3D SCENE MANAGEMENT
// ==========================================

const initLogin3D = () => {
    const canvas = document.getElementById('login-bg-canvas');
    if (!canvas) return { stop: () => {} };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 5;

    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.015 });
    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        starVertices.push((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    const animate = () => {
        loginAnimationId = requestAnimationFrame(animate);
        stars.rotation.y += 0.0005;
        renderer.render(scene, camera);
    };

    const resize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', resize);
    animate();

    return { stop: () => { cancelAnimationFrame(loginAnimationId); window.removeEventListener('resize', resize); } };
};

const initApp3D = () => {
    return { stop: () => {} };
};

// ==========================================
// GERAL / UTILITÁRIOS
// ==========================================

const showSection = (sectionId) => {
    document.querySelectorAll('main section').forEach(section => {
        section.classList.add('hidden');
    });

    const sectionToShow = document.getElementById(sectionId);
    if (sectionToShow) {
        sectionToShow.classList.remove('hidden');
    }
    
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    if (sectionId === 'myRentals' && currentUser) {
        loadRentals(currentUser.id); 
    }
    if (sectionId === 'books') {
        loadBooks(); 
    }
    if (sectionId === 'feed') {
        loadPosts();
    }
    if (sectionId === 'adminSection') {
        loadAdminData();
    }
};

const updateUserDataDisplay = async (user) => {
    document.getElementById('userName').textContent = user.name;
    document.getElementById('welcomeName').textContent = user.name;
    
    // Atualiza pontos em tempo real
    try {
        const pointsRes = await fetch(`${API_URL}/users/${user.id}/points`);
        const pointsData = await pointsRes.json();
        currentUser.points = pointsData.points;
        document.getElementById('pointsValue').textContent = pointsData.points;
    } catch (error) {
        document.getElementById('pointsValue').textContent = user.points;
    }
    
    const adminButton = document.getElementById('adminButton');
    adminButton.classList.toggle('hidden', !user.isAdmin);
    
    const adminSection = document.getElementById('adminSection');
    if (!user.isAdmin) {
        adminSection.classList.add('hidden');
    }

    const fantasmaToggle = document.getElementById('modoFantasma');
    if (fantasmaToggle) {
        fantasmaToggle.checked = user.modoFantasma;
    }
};

// ==========================================
// AUTENTICAÇÃO
// ==========================================

const saveUserSession = (user) => {
    sessionStorage.setItem('library_currentUser', JSON.stringify(user));
    currentUser = user;
    currentUser.name = currentUser.name || currentUser.nome || currentUser.email; 
};

const showRegister = () => {
    document.getElementById('registerModal').classList.remove('hidden');
};

const hideRegister = () => {
    document.getElementById('registerModal').classList.add('hidden');
    document.getElementById('registerMessage').textContent = '';
};

const handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageEl = document.getElementById('loginMessage');
    messageEl.textContent = 'Autenticando...';

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            messageEl.textContent = data.error || 'Erro ao fazer login. Tente novamente.';
            return;
        }

        saveUserSession(data);
        document.getElementById('login-bg-canvas').style.display = 'none';
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        
        if (loginScene && loginScene.stop) loginScene.stop();
        
        loadInitialData(data).catch(e => console.error("Erro ao carregar dados iniciais:", e));

    } catch (error) {
        console.error('Login error:', error);
        messageEl.textContent = 'Erro de conexão ou servidor.';
    }
};

const handleRegister = async (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const messageEl = document.getElementById('registerMessage');
    messageEl.textContent = 'Registrando...';

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            messageEl.textContent = data.error || 'Erro ao criar conta. Tente um email diferente.';
            return;
        }

        messageEl.textContent = 'Conta criada com sucesso! Faça login.';
        messageEl.classList.remove('text-red-500');
        messageEl.classList.add('text-green-500');
        document.getElementById('registerForm').reset();
        
        setTimeout(() => {
            hideRegister();
            messageEl.textContent = '';
            messageEl.classList.remove('text-green-500');
            messageEl.classList.add('text-red-500');
        }, 3000);

    } catch (error) {
        console.error('Register error:', error);
        messageEl.textContent = 'Erro de conexão ou servidor.';
    }
};

const handleLogout = () => {
    sessionStorage.removeItem('library_currentUser');
    currentUser = null;
    
    if (loginScene && loginScene.stop) loginScene.stop();
    loginScene = initLogin3D();

    document.getElementById('login-bg-canvas').style.display = 'block';
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginForm').reset();
    document.getElementById('loginMessage').textContent = '';
    showSection('home');
};

// ==========================================
// TOGGLE MODO FANTASMA
// ==========================================

const toggleModoFantasma = async () => {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_URL}/users/${currentUser.id}/toggle-ghost`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        
        if (response.ok) {
            currentUser.modoFantasma = data.modoFantasma;
            saveUserSession(currentUser);
            alert(`Modo Fantasma ${data.modoFantasma ? 'ATIVADO' : 'DESATIVADO'}!`);
        }
    } catch (error) {
        console.error('Erro ao alternar modo fantasma:', error);
        alert('Erro ao alternar modo fantasma.');
    }
};

// ==========================================
// FUNÇÕES DE AÇÃO 
// ==========================================

const handleRental = async (bookId, days) => {
    if (!currentUser) {
        alert("Você precisa estar logado para alugar um livro.");
        return;
    }

    try {
        const book = allBooks.find(b => b.id === bookId);
        if (!book || (book.copies - book.rented) <= 0) {
            alert("Desculpe, este livro não está disponível no momento.");
            return;
        }

        const confirmRental = confirm(`Deseja alugar "${book.title}" por ${days} dias?`);
        if (!confirmRental) return;

        const response = await fetch(`${API_URL}/rentals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                bookId: bookId, 
                userId: currentUser.id, 
                days: days 
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(`Erro ao alugar: ${data.error || 'Tente novamente.'}`);
            return;
        }

        alert(`Livro "${book.title}" alugado com sucesso por ${days} dias!`);
        closeBookDetailModal();
        loadBooks(); 
        loadRentals(currentUser.id); 
        showSection('myRentals'); 

    } catch (error) {
        console.error('Erro no aluguel:', error);
        alert('Erro de conexão ou servidor ao tentar alugar.');
    }
};

const handleReturn = async (rentalId, rentalTitle) => {
    if (!currentUser) {
        alert("Você precisa estar logado para devolver um livro.");
        return;
    }

    const confirmReturn = confirm(`Tem certeza que deseja devolver o livro "${rentalTitle}"?`);
    if (!confirmReturn) return;

    try {
        const response = await fetch(`${API_URL}/rentals/${rentalId}/return`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(`Erro na devolução: ${data.error || 'Tente novamente.'}`);
            return;
        }

        alert(`Livro "${rentalTitle}" devolvido com sucesso!`);
        await updateUserDataDisplay(currentUser);
        loadBooks();
        loadRentals(currentUser.id); 
        loadBlacklist(); 

    } catch (error) {
        console.error('Erro na devolução:', error);
        alert('Erro de conexão ou servidor ao tentar devolver.');
    }
};

const handleRewardRedeem = async (rewardType, cost, description) => {
    if (!currentUser) {
        alert("Você precisa estar logado para resgatar recompensas.");
        return;
    }

    const confirmRedeem = confirm(`Tem certeza que deseja resgatar "${description}" por ${cost} pontos?`);
    if (!confirmRedeem) return;

    try {
        const response = await fetch(`${API_URL}/rewards/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: currentUser.id, 
                rewardType: rewardType,
                cost: cost 
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(`Erro no resgate: ${data.error || 'Tente novamente.'}`);
            return;
        }

        alert(data.message);
        await updateUserDataDisplay(currentUser);
        loadRankings(); 

    } catch (error) {
        console.error('Erro no resgate:', error);
        alert('Erro de conexão ou servidor ao tentar resgatar.');
    }
};

const handleRating = async (bookId, rating) => {
    if (!currentUser) {
        alert("Você precisa estar logado para avaliar.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/ratings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                bookId, 
                userId: currentUser.id, 
                rating,
                comment: '' 
            })
        });

        if (response.ok) {
            alert('Avaliação registrada! Você ganhou 10 pontos.');
            await updateUserDataDisplay(currentUser);
            loadBooks();
            openBookDetailModal(bookId); // Recarrega o modal
        }
    } catch (error) {
        console.error('Erro ao avaliar:', error);
    }
};

// ==========================================
// FUNÇÕES DE MODAL 
// ==========================================

const openBookDetailModal = async (bookId) => {
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;

    const modal = document.getElementById('bookDetailModal');
    const content = document.getElementById('bookDetailContent');
    
    const availableCopies = book.copies - book.rented;
    const avgRating = book.ratingCount > 0 ? (book.ratingSum / book.ratingCount).toFixed(1) : 'N/A';
    const availabilityText = availableCopies > 0 
        ? `<span class="text-green-600 font-semibold">${availableCopies} Cópia(s) disponíveis</span>`
        : `<span class="text-red-600 font-semibold">Indisponível no momento</span>`;
    
    const rentalButton = availableCopies > 0 
        ? `
            <h4 class="font-bold text-lg mt-6 mb-3">Opções de Aluguel</h4>
            <div class="flex flex-wrap gap-3">
                <button onclick="handleRental(${book.id}, 15)" class="flex-1 min-w-[150px] bg-gray-500 text-white p-3 rounded-lg font-semibold hover:bg-gray-600 disabled:bg-gray-400" ${!currentUser ? 'disabled' : ''}>
                    15 dias (Básico)
                </button>
                <button onclick="handleRental(${book.id}, 30)" class="flex-1 min-w-[150px] bg-teal-600 text-white p-3 rounded-lg font-semibold hover:bg-teal-700 disabled:bg-gray-400" ${!currentUser ? 'disabled' : ''}>
                    30 dias (Avançado)
                </button>
                <button onclick="handleRental(${book.id}, 60)" class="flex-1 min-w-[150px] bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400" ${!currentUser ? 'disabled' : ''}>
                    60 dias (Expert)
                </button>
            </div>
            ${!currentUser ? '<p class="text-sm text-red-500 mt-2">Faça login para alugar.</p>' : ''}
          `
        : '';

    content.innerHTML = `
        <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
            <img src="${book.cover}" alt="${book.title}" class="w-full md:w-40 h-60 object-cover rounded-lg shadow-md">
            <div class="flex-1">
                <h2 class="text-3xl font-bold text-gray-900">${book.title}</h2>
                <p class="text-xl text-gray-600 mb-4">Autor: ${book.author}</p>
                <p class="text-md font-medium mb-2">Categoria: <span class="text-teal-600">${book.category}</span></p>
                
                <div class="flex items-center space-x-4 mb-4">
                    <span class="text-yellow-500 text-2xl font-bold">${avgRating} ★</span>
                    <span class="text-sm text-gray-500">(${book.ratingCount} avaliações)</span>
                </div>
                
                <p>${availabilityText}</p>
            </div>
        </div>
        
        <h3 class="font-bold text-xl mt-6 mb-3">Sinopse/Detalhes</h3>
        <p class="text-gray-700">${book.description || 'Nenhuma sinopse disponível.'}</p>

        ${rentalButton}

        <h3 class="font-bold text-xl mt-8 mb-3">Avaliar este Livro</h3>
        <div class="flex items-center space-x-2">
            ${[1,2,3,4,5].map(star => 
                `<button onclick="handleRating(${book.id}, ${star})" class="text-3xl text-gray-300 hover:text-yellow-400 transition-all">★</button>`
            ).join('')}
        </div>

        <h3 class="font-bold text-xl mt-8 mb-3">Avaliações dos Usuários</h3>
        <div id="bookRatingsContainer" class="space-y-4">
            <p class="text-gray-500">Carregando avaliações...</p>
        </div>
    `;
    
    modal.classList.remove('hidden');
    
    // Carrega avaliações
    loadBookRatings(bookId);
};

const loadBookRatings = async (bookId) => {
    const container = document.getElementById('bookRatingsContainer');
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/books/${bookId}/ratings`);
        const ratings = await response.json();

        if (ratings.length === 0) {
            container.innerHTML = '<p class="text-gray-500">Nenhuma avaliação ainda. Seja o primeiro!</p>';
            return;
        }

        container.innerHTML = ratings.map(r => `
            <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex justify-between items-start mb-2">
                    <p class="font-semibold">${r.userName}</p>
                    <span class="text-yellow-500">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                </div>
                ${r.comment ? `<p class="text-sm text-gray-700">${r.comment}</p>` : ''}
                <p class="text-xs text-gray-400 mt-2">${dayjs(r.date).format('DD/MM/YYYY HH:mm')}</p>
            </div>
        `).join('');

    } catch (error) {
        console.error('Erro ao carregar avaliações:', error);
        container.innerHTML = '<p class="text-red-500">Erro ao carregar avaliações.</p>';
    }
};

const closeBookDetailModal = () => {
    document.getElementById('bookDetailModal').classList.add('hidden');
};

// ==========================================
// FUNÇÕES DE DADOS (RENDERIZAÇÃO)
// ==========================================

const loadBooks = async () => {
    const container = document.getElementById('bookListContainer');
    if (!container) return;
    container.innerHTML = 'Carregando livros...';
    try {
        const response = await fetch(`${API_URL}/books`);
        if (!response.ok) throw new Error('Falha ao carregar livros');
        
        const books = await response.json();
        allBooks = books; 
        container.innerHTML = '';
        
        books.forEach(book => {
            const availableCopies = book.copies - book.rented;
            const avgRating = book.ratingCount > 0 ? (book.ratingSum / book.ratingCount).toFixed(1) : 'N/A';

            const bookCard = `
                <div class="book-card bg-white rounded-lg shadow-lg overflow-hidden transition duration-300 hover:shadow-xl cursor-pointer" onclick="openBookDetailModal(${book.id})">
                    <img src="${book.cover}" alt="${book.title}" class="w-full h-48 object-cover">
                    <div class="p-4">
                        <h3 class="font-semibold text-lg truncate">${book.title}</h3>
                        <p class="text-sm text-gray-500">${book.author}</p>
                        <div class="mt-2 flex justify-between items-center">
                            <span class="text-xs font-bold ${availableCopies > 0 ? 'text-green-600' : 'text-red-600'}">
                                ${availableCopies} Cópia${availableCopies !== 1 ? 's' : ''}
                            </span>
                            <span class="text-yellow-500 text-sm font-semibold">${avgRating} ★</span>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += bookCard;
        });

    } catch (error) {
        console.error('Erro ao carregar livros:', error);
        container.innerHTML = `<p class="text-red-500">Erro ao carregar o catálogo. ${error.message}</p>`;
    }
};

const loadBlacklist = async () => {
    const container = document.getElementById('blacklistContainer');
    if (!container) return; 
    container.innerHTML = '<p class="text-center text-gray-500">Carregando Lista Negra...</p>';

    try {
        const response = await fetch(`${API_URL}/blacklist`);
        if (!response.ok) throw new Error('Falha ao carregar lista negra');

        const blacklistUsers = await response.json();
        container.innerHTML = ''; 

        if (blacklistUsers.length === 0) {
            container.innerHTML = '<p class="text-gray-500 col-span-full">Nenhum usuário atualmente na Lista Negra. Parabéns!</p>';
            return;
        }
        
        container.classList.add('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6');

        blacklistUsers.forEach(user => {
            const daysInBlacklist = user.dias_atraso ? Math.floor(user.dias_atraso) : 'N/A'; 
            
            const userCard = `
                <div class="p-4 bg-white rounded-lg shadow-lg border border-red-400 hover:shadow-2xl transition duration-300">
                    <h3 class="font-bold text-lg text-red-700">${user.nome}</h3>
                    <p class="text-sm text-gray-700 truncate">Email: ${user.email}</p>
                    <p class="mt-2 text-red-700 font-semibold">Atraso: ${daysInBlacklist} dias</p>
                    <p class="text-xs text-gray-500">Livro: ${user.titulo_livro || 'Múltiplos'}</p>
                    <p class="text-xs text-gray-400">Previsto em: ${new Date(user.data_devolucao_prevista).toLocaleDateString()}</p>
                </div>
            `;
            container.innerHTML += userCard;
        });

    } catch (error) {
        console.error('Erro ao carregar lista negra:', error);
        container.innerHTML = `<p class="text-red-500 col-span-full">Erro ao carregar a Lista Negra: ${error.message}</p>`;
    }
};

const loadRentals = async (userId) => {
    const container = document.getElementById('rentalListContainer');
    if (!container) return;
    container.innerHTML = 'Carregando seus empréstimos...';
    
    try {
        const response = await fetch(`${API_URL}/rentals/user/${userId}`);
        if (!response.ok) throw new Error('Falha ao carregar empréstimos');

        const rentals = await response.json();
        container.innerHTML = ''; 

        if (rentals.length === 0) {
            container.innerHTML = '<p class="text-gray-500 col-span-full">Você não possui livros alugados no momento.</p>';
            return;
        }

        rentals.forEach(rental => {
            let statusText = 'Ativo';
            let statusClass = 'bg-blue-100 text-blue-800';
            
            if (rental.status === 'devolvido') {
                statusText = 'Devolvido';
                statusClass = 'bg-green-100 text-green-800';
            } else if (rental.status === 'atrasado') {
                statusText = 'ATRASADO';
                statusClass = 'bg-red-100 text-red-800 font-bold';
            }

            const returnButton = rental.status === 'ativo' 
                ? `<button onclick="handleReturn(${rental.id}, '${rental.title.replace(/'/g, "\\'")}')" class="w-full mt-3 bg-teal-500 text-white p-2 rounded-lg text-sm hover:bg-teal-600">Devolver</button>` 
                : '';

            const rentalCard = `
                <div class="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <h3 class="font-bold text-lg truncate">${rental.title}</h3>
                    <p class="text-sm text-gray-500">Tier: ${rental.tier || 'Básico'}</p>
                    <div class="mt-2 text-sm space-y-1">
                        <p>Início: ${new Date(rental.rentalDate).toLocaleDateString()}</p>
                        <p>Previsão: ${new Date(rental.dueDate).toLocaleDateString()}</p>
                    </div>
                    <span class="inline-block mt-3 px-2 py-1 text-xs rounded-full ${statusClass}">
                        ${statusText}
                    </span>
                    ${returnButton}
                </div>
            `;
            container.innerHTML += rentalCard;
        });

    } catch (error) {
        console.error('Erro ao carregar empréstimos:', error);
        container.innerHTML = `<p class="text-red-500 col-span-full">Erro ao carregar empréstimos: ${error.message}</p>`;
    }
};

const loadRankings = async () => {
    try {
        const response = await fetch(`${API_URL}/rankings`);
        if (!response.ok) throw new Error('Falha ao carregar rankings');
        
        const rankings = await response.json();
        
        document.getElementById('topUserName').textContent = rankings.topUser.nome || 'N/A';
        document.getElementById('topUserPoints').textContent = `${rankings.topUser.total_pontos || 0} pontos`;

        document.getElementById('mostReadTitle').textContent = rankings.mostRead.titulo || 'N/A';
        document.getElementById('mostReadCount').textContent = `${rankings.mostRead.total || 0} empréstimos`;

        document.getElementById('topRatedTitle').textContent = rankings.topRated.titulo || 'N/A';
        const avgRating = parseFloat(rankings.topRated.avg_rating).toFixed(1);
        document.getElementById('topRatedRating').textContent = `${avgRating} / 5.0 ★`;

    } catch (error) {
        console.error('Erro ao carregar rankings:', error);
    }
};

// ==========================================
// FEED SOCIAL (POSTS)
// ==========================================

const loadPosts = async () => {
    const container = document.getElementById('postsContainer');
    if (!container) return;
    
    container.innerHTML = '<p class="text-gray-500">Carregando posts...</p>';

    try {
        // Carrega posts
        const postsResponse = await fetch(`${API_URL}/posts`);
        const posts = await postsResponse.json();
        allPosts = posts;

        // Carrega votos do usuário
        if (currentUser) {
            const votesResponse = await fetch(`${API_URL}/posts/votes/user/${currentUser.id}`);
            userVotes = await votesResponse.json();
        }

        if (posts.length === 0) {
            container.innerHTML = '<p class="text-gray-500">Nenhum post ainda. Seja o primeiro a postar!</p>';
            return;
        }

        container.innerHTML = posts.map(post => {
            const userVote = userVotes[post.id];
            const likeClass = userVote === 'like' ? 'text-teal-600' : 'text-gray-500 hover:text-teal-600';
            const dislikeClass = userVote === 'dislike' ? 'text-red-600' : 'text-gray-500 hover:text-red-600';
            const timeAgo = dayjs(post.data_criacao).fromNow();

            return `
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <div class="flex items-center space-x-3 mb-4">
                        <div class="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                            ${post.usuario_nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p class="font-semibold text-gray-900">${post.usuario_nome}</p>
                            <p class="text-xs text-gray-500">${timeAgo}</p>
                        </div>
                    </div>
                    <p class="text-gray-700 whitespace-pre-wrap mb-4">${post.conteudo}</p>
                    <div class="flex items-center space-x-6 border-t pt-3">
                        <button onclick="voteOnPost(${post.id}, 'like')" class="flex items-center space-x-1 ${likeClass} transition-all">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h6.364a1 1 0 00.949-.707l2.716-6.839A.5.5 0 0016.5 9.5H13V6a1 1 0 00-1-1h-1.48a1 1 0 00-.986.838L8.43 9.5H6.5a.5.5 0 00-.5.5v.333z"/>
                            </svg>
                            <span class="font-medium">${post.likes}</span>
                        </button>
                        <button onclick="voteOnPost(${post.id}, 'dislike')" class="flex items-center space-x-1 ${dislikeClass} transition-all">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667V3a1 1 0 00-1-1h-6.364a1 1 0 00-.949.707l-2.716 6.839A.5.5 0 003.5 10.5H7v7a1 1 0 001 1h1.48a1 1 0 00.986-.838L11.57 10.5h1.93a.5.5 0 00.5-.5v-.333z"/>
                            </svg>
                            <span class="font-medium">${post.dislikes}</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Erro ao carregar posts:', error);
        container.innerHTML = '<p class="text-red-500">Erro ao carregar feed.</p>';
    }
};

const createPost = async (content) => {
    if (!currentUser || !content.trim()) return;

    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, content })
        });

        if (response.ok) {
            loadPosts();
        }
    } catch (error) {
        console.error('Erro ao criar post:', error);
        alert('Erro ao publicar. Tente novamente.');
    }
};

const voteOnPost = async (postId, voteType) => {
    if (!currentUser) {
        alert('Faça login para votar.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts/${postId}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, voteType })
        });

        if (response.ok) {
            loadPosts(); // Recarrega os posts
        }
    } catch (error) {
        console.error('Erro ao votar:', error);
    }
};

// ==========================================
// PAINEL ADMIN
// ==========================================

const loadAdminData = async () => {
    if (!currentUser || !currentUser.isAdmin) return;

    await loadAdminUsers();
    await loadGlobalRentals();
};

const loadAdminUsers = async () => {
    const container = document.getElementById('userListContainer');
    if (!container) return;

    container.innerHTML = '<p class="text-gray-500">Carregando usuários...</p>';

    try {
        const response = await fetch(`${API_URL}/users`);
        const users = await response.json();

        container.innerHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pontos</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fantasma</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${users.map(user => `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">${user.id}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${user.nome}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">${user.email}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.tipo_usuario === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                                    ${user.tipo_usuario}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">${user.points}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">${user.modo_fantasma ? '👻' : '—'}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                    ${user.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        container.innerHTML = '<p class="text-red-500">Erro ao carregar usuários.</p>';
    }
};

const loadGlobalRentals = async () => {
    const container = document.getElementById('globalRentalsContainer');
    if (!container) return;

    container.innerHTML = '<p class="text-gray-500">Carregando empréstimos...</p>';

    try {
        const response = await fetch(`${API_URL}/rentals`);
        const rentals = await response.json();

        container.innerHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Livro</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Empréstimo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Devolução Prevista</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atraso (dias)</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${rentals.slice(0, 50).map(rental => {
                        let statusClass = 'bg-blue-100 text-blue-800';
                        if (rental.status === 'devolvido') statusClass = 'bg-green-100 text-green-800';
                        if (rental.status === 'atrasado') statusClass = 'bg-red-100 text-red-800';
                        
                        return `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">${rental.id}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">${rental.usuario_nome}</td>
                            <td class="px-6 py-4 text-sm">${rental.livro_titulo}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">${rental.tier_nome}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">${new Date(rental.data_emprestimo).toLocaleDateString()}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">${new Date(rental.data_devolucao_prevista).toLocaleDateString()}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                                    ${rental.status}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm ${rental.dias_atraso > 0 ? 'text-red-600 font-bold' : ''}">${rental.dias_atraso || 0}</td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
        `;

    } catch (error) {
        console.error('Erro ao carregar empréstimos globais:', error);
        container.innerHTML = '<p class="text-red-500">Erro ao carregar empréstimos.</p>';
    }
};

// ==========================================
// FEED - FORMULÁRIO DE NOVO POST
// ==========================================

const setupFeedForm = () => {
    const feedSection = document.getElementById('feed');
    if (!feedSection) return;

    const formHtml = `
        <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
            <h3 class="text-xl font-bold mb-4 text-teal-600">Compartilhe suas Opiniões</h3>
            <form id="newPostForm" onsubmit="handleNewPostSubmit(event)">
                <textarea 
                    id="newPostContent" 
                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 resize-none" 
                    rows="3" 
                    placeholder="O que você está lendo? Compartilhe suas impressões..."
                    required
                ></textarea>
                <div class="flex justify-end mt-3">
                    <button type="submit" class="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded-lg transition-all">
                        Publicar
                    </button>
                </div>
            </form>
        </div>
    `;

    const postsContainer = document.getElementById('postsContainer');
    if (postsContainer && !document.getElementById('newPostForm')) {
        postsContainer.insertAdjacentHTML('beforebegin', formHtml);
    }
};

const handleNewPostSubmit = (event) => {
    event.preventDefault();
    const content = document.getElementById('newPostContent').value;
    
    if (!currentUser) {
        alert('Faça login para publicar.');
        return;
    }

    createPost(content).then(() => {
        document.getElementById('newPostContent').value = '';
    });
};

// ==========================================
// INICIALIZAÇÃO - Função Principal
// ==========================================

const loadInitialData = async (user) => {
    await updateUserDataDisplay(user);
    
    loadBooks();
    loadRankings();
    loadRentals(user.id); 
    loadBlacklist();
    setupFeedForm();

    showSection('home');
};

// ==========================================
// INICIALIZAÇÃO DO DOM
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Listener para modo fantasma
    const fantasmaToggle = document.getElementById('modoFantasma');
    if (fantasmaToggle) {
        fantasmaToggle.addEventListener('change', toggleModoFantasma);
    }
    
    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('appContainer');

    const saved = sessionStorage.getItem('library_currentUser');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
        } catch (e) {
            currentUser = null;
        }
    }

    loginScene = initLogin3D();

    if (currentUser && currentUser.id) {
        currentUser.name = currentUser.name || currentUser.nome || currentUser.email;
        document.getElementById('login-bg-canvas').style.display = 'none';
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        
        if (loginScene && loginScene.stop) loginScene.stop();
        
        loadInitialData(currentUser).catch(e => console.error(e));
    } else {
        authContainer.style.display = 'flex';
        appContainer.style.display = 'none';
    }

    window.addEventListener('beforeunload', () => {
        if (loginScene && loginScene.stop) loginScene.stop();
    });
});