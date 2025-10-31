// Configuração do Day.js
dayjs.extend(dayjs_plugin_relativeTime);
dayjs.extend(dayjs_plugin_utc);
dayjs.extend(dayjs_plugin_timezone);
dayjs.locale('pt-br');
dayjs.tz.setDefault("America/Sao_Paulo");

// API Base URL
const API_URL = 'http://localhost:3000/api';

// Lógica principal da aplicação
document.addEventListener('DOMContentLoaded', () => {
    // --- 3D Background Scene Management ---
    let loginScene, appScene;
    let loginAnimationId, appAnimationId;

    const initLogin3D = () => {
        const canvas = document.getElementById('login-bg-canvas');
        if (!canvas) return;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.position.z = 5;

        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.015 });
        const starVertices = [];
        for (let i = 0; i < 10000; i++) {
            starVertices.push((Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000);
        }
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);
        
        const animate = () => {
            loginAnimationId = requestAnimationFrame(animate);
            stars.rotation.x += 0.0001;
            stars.rotation.y += 0.0001;
            renderer.render(scene, camera);
        };
        animate();

        const onMouseMove = (event) => {
            stars.rotation.x = (-(event.clientY / window.innerHeight) * 2 + 1) * 0.1;
            stars.rotation.y = ((event.clientX / window.innerWidth) * 2 - 1) * 0.1;
        };
        document.addEventListener('mousemove', onMouseMove);

        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onResize);
        
        return {
            stop: () => {
                cancelAnimationFrame(loginAnimationId);
                document.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('resize', onResize);
            }
        };
    };
    
    const initApp3D = () => {
        const canvas = document.getElementById('app-bg-canvas');
        if (!canvas) return;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.position.z = 5;

        const PARTICLE_COUNT = 15000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const originalPositions = new Float32Array(PARTICLE_COUNT * 3);
        const velocities = new Float32Array(PARTICLE_COUNT * 3);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const x = (Math.random() - 0.5) * 20;
            const y = (Math.random() - 0.5) * 20;
            const z = (Math.random() - 0.5) * 20;
            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;
            originalPositions[i3] = x;
            originalPositions[i3 + 1] = y;
            originalPositions[i3 + 2] = z;
            velocities[i3] = 0;
            velocities[i3 + 1] = 0;
            velocities[i3 + 2] = 0;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0x222222,
            size: 0.02,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
        });
        const particles = new THREE.Points(geometry, material);
        scene.add(particles);

        const mouse = new THREE.Vector3(9999, 9999, 9999);
        const onMouseMove = (event) => {
            const vec = new THREE.Vector3();
            const pos = new THREE.Vector3();
            vec.set(
                (event.clientX / window.innerWidth) * 2 - 1,
                - (event.clientY / window.innerHeight) * 2 + 1,
                0.5
            );
            vec.unproject(camera);
            vec.sub(camera.position).normalize();
            const distance = -camera.position.z / vec.z;
            pos.copy(camera.position).add(vec.multiplyScalar(distance));
            mouse.copy(pos);
        };
        document.addEventListener('mousemove', onMouseMove);
        
        const onMouseLeave = () => {
            mouse.set(9999, 9999, 9999);
        }
        document.addEventListener('mouseleave', onMouseLeave);

        const animate = () => {
            appAnimationId = requestAnimationFrame(animate);
            const positions = geometry.attributes.position.array;

            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const i3 = i * 3;
                const dx = mouse.x - positions[i3];
                const dy = mouse.y - positions[i3 + 1];
                const distSq = dx * dx + dy * dy;
                const forceFactor = Math.max(0, 1 - distSq / 4);

                if (forceFactor > 0) {
                    velocities[i3] -= dx * forceFactor * 0.005;
                    velocities[i3 + 1] -= dy * forceFactor * 0.005;
                }

                velocities[i3] += (originalPositions[i3] - positions[i3]) * 0.001;
                velocities[i3 + 1] += (originalPositions[i3 + 1] - positions[i3 + 1]) * 0.001;
                velocities[i3 + 2] += (originalPositions[i3 + 2] - positions[i3 + 2]) * 0.001;

                velocities[i3] *= 0.95;
                velocities[i3 + 1] *= 0.95;
                velocities[i3 + 2] *= 0.95;

                positions[i3] += velocities[i3];
                positions[i3 + 1] += velocities[i3 + 1];
                positions[i3 + 2] += velocities[i3 + 2];
            }

            geometry.attributes.position.needsUpdate = true;
            renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onResize);

        return {
            stop: () => {
                cancelAnimationFrame(appAnimationId);
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseleave', onMouseLeave);
                window.removeEventListener('resize', onResize);
            }
        };
    };

    // --- STATE ---
    let books = [], rentals = [], posts = [], currentUser = null, rankings = null, blacklist = [];
    const rewardsList = [ 
        { id: 1, title: 'Aluguel Grátis por 1 Mês', cost: 1000 }, 
        { id: 2, title: 'Extensão de Prazo (+15 dias)', cost: 300 }, 
        { id: 3, title: 'Ícone de Perfil Exclusivo', cost: 500 }, 
    ];
    
    // Posts permanecem no localStorage por enquanto (podem ser migrados depois)
    posts = JSON.parse(localStorage.getItem('library_posts')) || [
        { id: 1, userName: 'Ana Clara', content: 'Acabei de ler "Código Limpo". Mudou minha perspectiva sobre programação! 10/10', timestamp: dayjs().subtract(2, 'hour').toISOString(), likes: 12, dislikes: 1, userVotes: {} },
        { id: 2, userName: 'Bruno Silva', content: 'Alguém tem recomendação de um bom livro de Ficção Científica? Já li 1984.', timestamp: dayjs().subtract(4, 'hour').toISOString(), likes: 5, dislikes: 0, userVotes: {} },
    ];
    
    posts.forEach(p => {
        if (p.likes === undefined) p.likes = 0;
        if (p.dislikes === undefined) p.dislikes = 0;
        if (!p.userVotes) p.userVotes = {};
    });
    
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const bookList = document.getElementById('book-list');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const bookModal = document.getElementById('book-modal');
    const adminFab = document.getElementById('admin-fab');
    const adminModal = document.getElementById('admin-modal');

    // --- API CALLS ---
    const api = {
        async login(email, password) {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) throw new Error('Login failed');
            return await res.json();
        },
        
        async register(name, email, password) {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Register failed');
            }
            return await res.json();
        },
        
        async getBooks() {
            const res = await fetch(`${API_URL}/books`);
            return await res.json();
        },
        
        async getUserRentals(userId) {
            const res = await fetch(`${API_URL}/rentals/user/${userId}`);
            return await res.json();
        },
        
        async getAllRentals() {
            const res = await fetch(`${API_URL}/rentals`);
            return await res.json();
        },
        
        async createRental(bookId, userId, tier, days) {
            const res = await fetch(`${API_URL}/rentals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId, userId, tier, days })
            });
            return await res.json();
        },
        
        async returnBook(rentalId, userId) {
            const res = await fetch(`${API_URL}/rentals/${rentalId}/return`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            return await res.json();
        },
        
        async rateBook(bookId, userId, rating, comment = '') {
            const res = await fetch(`${API_URL}/ratings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId, userId, rating, comment })
            });
            return await res.json();
        },
        
        async getRankings() {
            const res = await fetch(`${API_URL}/rankings`);
            return await res.json();
        },
        
        async getBlacklist() {
            const res = await fetch(`${API_URL}/blacklist`);
            return await res.json();
        },
        
        async getUserPoints(userId) {
            const res = await fetch(`${API_URL}/users/${userId}/points`);
            return await res.json();
        },
        
        async getUsers() {
            const res = await fetch(`${API_URL}/users`);
            return await res.json();
        }
    };

    window.toggleAuthForms = () => { 
        loginForm.classList.toggle('hidden'); 
        registerForm.classList.toggle('hidden'); 
    };
    
    window.handleLogin = async (event) => {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error');
        
        try {
            const user = await api.login(email, password);
            currentUser = user;
            sessionStorage.setItem('library_currentUser', JSON.stringify(user));
            
            if (loginScene) loginScene.stop();
            document.getElementById('login-bg-canvas').style.display = 'none';

            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            
            appScene = initApp3D();
            await initializeApp();
        } catch (error) {
            errorDiv.textContent = 'Credenciais inválidas. Tente novamente.';
            errorDiv.classList.remove('hidden');
        }
    };
    
    window.handleRegister = async (event) => {
        event.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const errorDiv = document.getElementById('register-error');
        const successDiv = document.getElementById('register-success');
        
        try {
            await api.register(name, email, password);
            errorDiv.classList.add('hidden');
            successDiv.textContent = 'Conta criada com sucesso! Você já pode fazer o login.';
            successDiv.classList.remove('hidden');
            event.target.reset();
            setTimeout(() => { 
                toggleAuthForms(); 
                successDiv.classList.add('hidden'); 
            }, 2000);
        } catch (error) {
            successDiv.classList.add('hidden');
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        }
    };

    const logout = () => {
        currentUser = null;
        sessionStorage.removeItem('library_currentUser');
        
        if (appScene) appScene.stop();
        document.getElementById('app-bg-canvas').style.display = 'none';
        
        authContainer.style.display = 'flex';
        appContainer.style.display = 'none';
        adminFab.style.display = 'none';
        
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';

        document.getElementById('login-bg-canvas').style.display = 'block';
        loginScene = initLogin3D();
    };

    const getBookStatus = (book) => {
        if (book.rented >= book.copies) return { text: 'Alugado', class: 'status-alugado' };
        return { text: 'Disponível', class: 'status-disponivel' };
    };
    
    const getUserRentalStatus = (rental) => {
        if (rental.returnDate) return { text: `Devolvido em ${dayjs(rental.returnDate).format('DD/MM/YYYY')}`, class: 'text-gray-500' };
        if (dayjs().isAfter(dayjs(rental.dueDate))) return { text: 'Atrasado', class: 'status-atrasado' };
        return { text: `Devolver em ${dayjs(rental.dueDate).format('DD/MM/YYYY')}`, class: 'status-alugado' };
    };
    
    const renderBooks = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const filteredBooks = books.filter(book => 
            (book.title.toLowerCase().includes(searchTerm) || book.author.toLowerCase().includes(searchTerm)) && 
            (selectedCategory === 'all' || book.category === selectedCategory)
        );
        
        bookList.innerHTML = filteredBooks.map((book, index) => {
            const status = getBookStatus(book);
            const availability = book.copies - book.rented;
            const avgRating = book.ratingCount > 0 ? (book.ratingSum / book.ratingCount).toFixed(1) : 'N/A';
            return `<div class="bg-white/80 backdrop-blur-sm rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 book-card-enter" style="animation-delay: ${index * 50}ms" onclick="openBookModal(${book.id})"><img src="${book.cover}" alt="${book.title}" class="w-full h-64 object-cover"><div class="p-4"><h3 class="text-lg font-bold truncate">${book.title}</h3><p class="text-gray-600">${book.author}</p><div class="flex justify-between items-center mt-4"><span class="font-semibold ${status.class}">${status.text}</span><div class="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg><span>${avgRating}</span></div></div><p class="text-sm text-gray-500 mt-1">${availability} de ${book.copies} disponíveis</p></div></div>`;
        }).join('');
    };
    
    window.openBookModal = (bookId) => {
        const book = books.find(b => b.id === bookId);
        const status = getBookStatus(book);
        const avgRating = book.ratingCount > 0 ? (book.ratingSum / book.ratingCount).toFixed(1) : 'N/A';
        const userHasRented = rentals.some(r => r.userId === currentUser.id && r.bookId === book.id && !r.returnDate);
        const availability = book.copies - book.rented;
        
        let actionButton = userHasRented 
            ? `<button class="bg-green-500 text-white w-full py-2 rounded-lg hover:bg-green-600 transition-all duration-200 transform active:scale-95" onclick="returnBook(${book.id})">Devolver Livro</button>` 
            : availability > 0 
            ? `<div class="grid grid-cols-1 sm:grid-cols-3 gap-2"><button onclick="rentBook(${book.id}, 'Básico', 15)" class="bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-600 transition-all duration-200 transform active:scale-95 text-sm">Alugar Básico (15d)</button><button onclick="rentBook(${book.id}, 'Avançado', 30)" class="bg-cyan-500 text-white py-2 rounded-lg hover:bg-cyan-600 transition-all duration-200 transform active:scale-95 text-sm">Avançado (30d)</button><button onclick="rentBook(${book.id}, 'Expert', 60)" class="bg-sky-500 text-white py-2 rounded-lg hover:bg-sky-600 transition-all duration-200 transform active:scale-95 text-sm">Expert (60d)</button></div>` 
            : `<button class="bg-gray-400 text-white w-full py-2 rounded-lg cursor-not-allowed">Indisponível</button>`;
        
        bookModal.firstElementChild.innerHTML = `<button onclick="closeModal('book-modal')" class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-transform duration-200 hover:rotate-90"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button><div class="grid grid-cols-1 md:grid-cols-3 gap-6"><img src="${book.cover}" alt="${book.title}" class="rounded-lg shadow-lg w-full md:w-auto"><div class="md:col-span-2"><h2 class="text-2xl sm:text-3xl font-bold">${book.title}</h2><p class="text-lg text-gray-600 mt-1">${book.author}</p><span class="inline-block bg-teal-100 text-teal-800 text-sm font-semibold mt-2 px-2.5 py-0.5 rounded-full">${book.category}</span><div class="flex items-center mt-4"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-400 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg><span class="text-xl font-bold">${avgRating}</span><span class="text-gray-500 ml-2">(${book.ratingCount} avaliações)</span></div><div class="mt-4"><p><span class="font-semibold">Status:</span> <span class="${status.class}">${status.text}</span> (${availability} de ${book.copies} disp.)</p></div><div class="mt-6">${actionButton}</div><div class="mt-6 border-t pt-4"><h4 class="font-bold mb-2">Avaliar este livro:</h4><div class="flex items-center space-x-2">${[1,2,3,4,5].map(star => `<svg onclick="rateBook(${book.id}, ${star})" class="h-8 w-8 text-gray-300 hover:text-yellow-400 cursor-pointer transition-transform hover:scale-125" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>`).join('')}</div></div></div></div>`;
        bookModal.style.display = 'flex';
    };

    window.closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        modal.style.animation = 'fadeOut 0.3s ease-out forwards';
        modal.firstElementChild.style.animation = 'scaleDown 0.3s ease-out forwards';
        setTimeout(() => { 
            modal.style.display = 'none'; 
            modal.style.animation = ''; 
            modal.firstElementChild.style.animation = ''; 
        }, 300);
    };

    window.rentBook = async (bookId, tier, days) => {
        try {
            await api.createRental(bookId, currentUser.id, tier, days);
            closeModal('book-modal');
            await updateAll();
        } catch (error) {
            alert('Erro ao alugar livro: ' + error.message);
        }
    };
    
    window.returnBook = async (bookId) => {
        try {
            const rental = rentals.find(r => r.userId === currentUser.id && r.bookId === bookId && !r.returnDate);
            if (!rental) return;
            
            await api.returnBook(rental.id, currentUser.id);
            closeModal('book-modal');
            await updateAll();
        } catch (error) {
            alert('Erro ao devolver livro: ' + error.message);
        }
    };

    window.rateBook = async (bookId, rating) => {
        try {
            await api.rateBook(bookId, currentUser.id, rating);
            closeModal('book-modal');
            await updateAll();
        } catch (error) {
            alert('Erro ao avaliar livro: ' + error.message);
        }
    };

    const populateCategories = () => {
        const categories = [...new Set(books.map(book => book.category))];
        categoryFilter.innerHTML = '<option value="all">Todas as Categorias</option>';
        categories.forEach(cat => { 
            categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`; 
        });
    };
    
    const renderUserProfile = async () => {
        if (!currentUser) return;
        
        // Atualiza pontos do usuário
        try {
            const pointsData = await api.getUserPoints(currentUser.id);
            currentUser.points = pointsData.points;
        } catch (error) {
            console.error('Erro ao buscar pontos:', error);
        }
        
        document.getElementById('user-profile').innerHTML = `<span class="font-semibold mr-2 sm:mr-4 hidden md:inline">Olá, ${currentUser.name}</span><span class="bg-teal-100 text-teal-800 text-xs sm:text-sm font-semibold px-2 py-0.5 sm:px-2.5 rounded-full">${currentUser.points} Pts</span>${currentUser.isAdmin ? '<span class="ml-2 bg-yellow-100 text-yellow-800 text-xs sm:text-sm font-semibold px-2 py-0.5 sm:px-2.5 rounded-full">Admin</span>' : ''}`;
    };

    const renderRankings = () => {
        if (!rankings) return;
        
        document.getElementById('rankings-content').innerHTML = `
            <div><p class="font-semibold">🏆 Leitor do Mês</p><p class="text-sm text-gray-600">${rankings.topUser.nome} (${rankings.topUser.total_pontos} pts)</p></div>
            <div><p class="font-semibold">📖 Livro Mais Popular</p><p class="text-sm text-gray-600">${rankings.mostRead.titulo}</p></div>
            <div><p class="font-semibold">⭐ Livro Melhor Avaliado</p><p class="text-sm text-gray-600">${rankings.topRated.titulo} (${rankings.topRated.avg_rating ? Number(rankings.topRated.avg_rating).toFixed(1) : 'N/A'})</p></div>
        `;
    };
    
    const renderBlacklist = () => {
        if (blacklist.length === 0) { 
            document.getElementById('blacklist-content').innerHTML = `<p class="text-sm text-gray-500">Nenhum usuário na lista negra.</p>`; 
            return; 
        }
        
        document.getElementById('blacklist-content').innerHTML = blacklist.map(user => {
            return `<div class="text-sm"><p class="font-semibold">${user.nome} <span class="text-xs text-gray-400">(${user.email})</span></p><p class="text-xs text-gray-500">${user.motivo || 'Inadimplência'}</p></div>`;
        }).join('');
    };

    // --- POSTS (localStorage) ---
    const renderPosts = () => {
        const postsContainer = document.getElementById('posts-list');
        if (!postsContainer) return;
        posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        postsContainer.innerHTML = posts.map(p => {
            const timeAgo = dayjs(p.timestamp).fromNow();
            return `
                <div class="bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-semibold">${p.userName}</div>
                            <div class="text-xs text-gray-500">${timeAgo}</div>
                        </div>
                        <div class="text-sm text-gray-500">👍 ${p.likes} · 👎 ${p.dislikes}</div>
                    </div>
                    <p class="mt-2 text-sm">${p.content}</p>
                    <div class="mt-3 flex items-center space-x-2">
                        <button class="text-xs px-2 py-1 rounded bg-teal-50 hover:bg-teal-100" onclick="likePost(${p.id})">Curtir</button>
                        <button class="text-xs px-2 py-1 rounded bg-red-50 hover:bg-red-100" onclick="dislikePost(${p.id})">Não curti</button>
                    </div>
                </div>
            `;
        }).join('');
    };

    window.likePost = (postId) => {
        const p = posts.find(x => x.id === postId);
        if (!p || !currentUser) return alert('Faça login para interagir.');
        if (p.userVotes[currentUser.id] === 'like') return;
        if (p.userVotes[currentUser.id] === 'dislike') {
            p.dislikes = Math.max(0, p.dislikes - 1);
        }
        p.likes = (p.likes || 0) + 1;
        p.userVotes[currentUser.id] = 'like';
        localStorage.setItem('library_posts', JSON.stringify(posts));
        renderPosts();
    };

    window.dislikePost = (postId) => {
        const p = posts.find(x => x.id === postId);
        if (!p || !currentUser) return alert('Faça login para interagir.');
        if (p.userVotes[currentUser.id] === 'dislike') return;
        if (p.userVotes[currentUser.id] === 'like') {
            p.likes = Math.max(0, p.likes - 1);
        }
        p.dislikes = (p.dislikes || 0) + 1;
        p.userVotes[currentUser.id] = 'dislike';
        localStorage.setItem('library_posts', JSON.stringify(posts));
        renderPosts();
    };

    window.createPost = (evt) => {
        evt.preventDefault();
        if (!currentUser) return alert('Faça login para postar.');
        const content = document.getElementById('post-content').value.trim();
        if (!content) return;
        const newPost = {
            id: posts.length ? Math.max(...posts.map(p => p.id)) + 1 : 1,
            userName: currentUser.name || currentUser.nome || 'Usuário',
            content,
            timestamp: new Date().toISOString(),
            likes: 0,
            dislikes: 0,
            userVotes: {}
        };
        posts.unshift(newPost);
        localStorage.setItem('library_posts', JSON.stringify(posts));
        document.getElementById('post-content').value = '';
        renderPosts();
    };

    // --- ATUALIZAÇÃO GLOBAL E INICIALIZAÇÃO ---
    const updateAll = async () => {
        try {
            // busca livros
            books = await api.getBooks();
            // adapta nomes/fields se backend usar português/inglês
            books = books.map(b => ({
                id: b.id,
                title: b.title || b.titulo || b.name || b.title,
                titleLower: (b.title || b.titulo || '').toLowerCase(),
                author: b.author || b.autor || '',
                category: b.category || b.categoria || 'Geral',
                cover: b.cover || b.capa_url || b.cover || '/default-cover.png',
                copies: typeof b.copies === 'number' ? b.copies : (b.totalCopies || 1),
                rented: typeof b.rented === 'number' ? b.rented : (b.currentlyRented || 0),
                ratingSum: b.ratingSum || b.rating_sum || b.rating_sum_db || (b.avgRating ? b.avgRating * (b.ratingCount || 1) : 0),
                ratingCount: b.ratingCount || b.rating_count || b.numRatings || 0
            }));

            // buscar todos os empréstimos (ou apenas do usuário, dependendo de permissão)
            try {
                rentals = await api.getAllRentals();
            } catch (err) {
                // se rota não disponível, solicita só do usuário
                if (currentUser && currentUser.id) {
                    rentals = await api.getUserRentals(currentUser.id);
                } else {
                    rentals = [];
                }
            }

            // rankings e blacklist
            try {
                rankings = await api.getRankings();
            } catch (e) {
                rankings = null;
            }
            try {
                blacklist = await api.getBlacklist();
            } catch (e) {
                blacklist = [];
            }

            // atualiza UI
            populateCategories();
            renderBooks();
            renderPosts();
            renderRankings();
            renderBlacklist();
            await renderUserProfile();

        } catch (error) {
            console.error('Erro no updateAll:', error);
        }
    };

    const initializeApp = async () => {
        // mostra admin controls se admin
        if (currentUser && (currentUser.isAdmin || currentUser.tipo_usuario === 'admin' || currentUser.admin)) {
            adminFab.style.display = 'block';
        } else {
            adminFab.style.display = 'none';
        }

        // event listeners básicos
        searchInput.addEventListener('input', () => renderBooks());
        categoryFilter.addEventListener('change', () => renderBooks());

        // hooks de botões (assume existência no HTML)
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.addEventListener('click', logout);

        const postForm = document.getElementById('post-form');
        if (postForm) postForm.addEventListener('submit', createPost);

        const adminOpenBtn = adminFab;
        if (adminOpenBtn) adminOpenBtn.addEventListener('click', openAdminModal);

        // atualiza dados iniciais
        await updateAll();

        // polling ou intervalo para atualizar periodicamente (ex: a cada 60s)
        setInterval(() => updateAll().catch(e => console.error(e)), 60000);
    };

    // --- ADMIN HANDLERS SIMPLES ---
    const openAdminModal = async () => {
        // preenche modal com usuários e ações administrativas básicas
        try {
            const users = await api.getUsers();
            const booksForAdmin = await api.getBooks();
            const modalBody = adminModal.querySelector('.modal-body') || adminModal;
            modalBody.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 class="font-bold mb-2">Usuários</h3>
                        <div id="admin-users-list" class="space-y-2 max-h-64 overflow-auto"></div>
                    </div>
                    <div>
                        <h3 class="font-bold mb-2">Livros</h3>
                        <div id="admin-books-list" class="space-y-2 max-h-64 overflow-auto"></div>
                    </div>
                </div>
            `;

            const usersList = modalBody.querySelector('#admin-users-list');
            usersList.innerHTML = users.map(u => {
                const active = u.ativo === undefined ? (u.active !== undefined ? u.active : true) : u.ativo;
                return `<div class="p-2 bg-white/80 rounded flex justify-between items-center text-sm">
                    <div>
                        <div class="font-semibold">${u.name || u.nome}</div>
                        <div class="text-xs text-gray-500">${u.email}</div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="px-2 py-1 rounded text-xs border" onclick="toggleUserActive(${u.id}, ${active})">${active ? 'Desativar' : 'Ativar'}</button>
                        <button class="px-2 py-1 rounded text-xs border" onclick="forceRemoveFromBlacklist(${u.id})">Remover da Lista Negra</button>
                    </div>
                </div>`;
            }).join('');

            const booksList = modalBody.querySelector('#admin-books-list');
            booksList.innerHTML = booksForAdmin.map(b => {
                const available = b.disponivel === undefined ? (b.available !== undefined ? b.available : true) : b.disponivel;
                return `<div class="p-2 bg-white/80 rounded flex justify-between items-center text-sm">
                    <div>
                        <div class="font-semibold">${b.titulo || b.title}</div>
                        <div class="text-xs text-gray-500">${b.autor || b.author}</div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="px-2 py-1 rounded text-xs border" onclick="toggleBookAvailability(${b.id}, ${available})">${available ? 'Marcar Indisponível' : 'Marcar Disponível'}</button>
                    </div>
                </div>`;
            }).join('');

            adminModal.style.display = 'flex';
        } catch (error) {
            alert('Erro ao abrir painel admin: ' + error.message);
        }
    };

    window.closeAdminModal = () => {
        adminModal.style.display = 'none';
    };

    window.toggleUserActive = async (userId, currentlyActive) => {
        try {
            // endpoint hipotético de admin: /api/users/:id/activate (PUT)
            const res = await fetch(`${API_URL}/users/${userId}/activate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !currentlyActive })
            });
            if (!res.ok) throw new Error('Falha ao alterar status do usuário');
            await updateAll();
            openAdminModal(); // refresh modal
        } catch (err) {
            alert(err.message);
        }
    };

    window.forceRemoveFromBlacklist = async (userId) => {
        try {
            const res = await fetch(`${API_URL}/blacklist/${userId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Falha ao remover da lista negra');
            await updateAll();
            openAdminModal();
        } catch (err) {
            alert(err.message);
        }
    };

    window.toggleBookAvailability = async (bookId, currentlyAvailable) => {
        try {
            const res = await fetch(`${API_URL}/books/${bookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ disponivel: !currentlyAvailable })
            });
            if (!res.ok) throw new Error('Falha ao atualizar disponibilidade');
            await updateAll();
            openAdminModal();
        } catch (err) {
            alert(err.message);
        }
    };

    // --- RESTORE SESSION ON LOAD / START 3D LOGIN ---
    (function start() {
        // tenta restaurar sessão
        const saved = sessionStorage.getItem('library_currentUser');
        if (saved) {
            try {
                currentUser = JSON.parse(saved);
            } catch (e) {
                currentUser = null;
            }
        }

        // inicializa cena de login
        loginScene = initLogin3D();

        // se já estiver logado, pula para app
        if (currentUser && currentUser.id) {
            // some backends return name, outros nome; normalize
            currentUser.name = currentUser.name || currentUser.nome || currentUser.email;
            document.getElementById('login-bg-canvas').style.display = 'none';
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            if (loginScene) loginScene.stop();
            appScene = initApp3D();
            initializeApp().catch(e => console.error(e));
        } else {
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
        }
    })();

    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
        if (appScene) appScene.stop();
        if (loginScene) loginScene.stop();
    });

}); // fim DOMContentLoaded