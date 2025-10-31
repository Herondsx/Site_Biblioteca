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
let loginScene; // appScene removida
let loginAnimationId; // appAnimationId removida

// ==========================================
// 3D SCENE MANAGEMENT
// ==========================================

// Cena de login mantida
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

// Rosquinha 3D REMOVIDA - Funções para a cena da aplicação agora são vazias
const initApp3D = () => {
    // Retorna um objeto stop vazio, pois o canvas foi removido
    return { stop: () => { /* Nada a parar */ } };
};


// ==========================================
// GERAL / UTILITÁRIOS
// ==========================================

// Função para trocar de seção
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
};

const updateUserDataDisplay = (user) => {
    document.getElementById('userName').textContent = user.name;
    document.getElementById('welcomeName').textContent = user.name;
    document.getElementById('pointsValue').textContent = user.points;
    
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
        // Não precisamos inicializar o appScene, pois ele não faz mais nada
        
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
    
    // appScene não precisa ser parado
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
        
        // Atualiza os pontos no display
        if (currentUser.points >= cost) {
             currentUser.points -= cost;
        } else {
             // Seria ideal recarregar os dados do usuário do backend aqui para garantir a pontuação correta
             console.warn("Pontuação local incorreta. Atualizando display.");
        }
        updateUserDataDisplay(currentUser); 
        loadRankings(); 

    } catch (error) {
        console.error('Erro no resgate:', error);
        alert('Erro de conexão ou servidor ao tentar resgatar.');
    }
};


// ==========================================
// FUNÇÕES DE MODAL 
// ==========================================

const openBookDetailModal = (bookId) => {
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
        <div class="flex space-x-6">
            <img src="${book.cover}" alt="${book.title}" class="w-40 h-60 object-cover rounded-lg shadow-md">
            <div>
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

        <h3 class="font-bold text-xl mt-8 mb-3">Avaliações dos Usuários</h3>
        <div id="bookRatingsContainer" class="space-y-4">
            <p class="text-gray-500">Avaliações serão carregadas aqui...</p>
        </div>
        
    `;
    modal.classList.remove('hidden');
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

// Carrega e renderiza a lista negra 
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
            } else if (new Date(rental.dueDate) < new Date()) {
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

// Função principal chamada após login/carregamento inicial
const loadInitialData = (user) => {
    updateUserDataDisplay(user);
    
    loadBooks();
    loadRankings();
    loadRentals(user.id); 
    loadBlacklist(); 

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
        // appScene removida
        
        loadInitialData(currentUser).catch(e => console.error(e));
    } else {
        authContainer.style.display = 'flex';
        appContainer.style.display = 'none';
    }

    // appScene removida, cleanup é mais simples
    window.addEventListener('beforeunload', () => {
        if (loginScene && loginScene.stop) loginScene.stop();
    });
});