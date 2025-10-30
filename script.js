// Configuração do Day.js (movida do <head>)
dayjs.extend(dayjs_plugin_relativeTime);
dayjs.extend(dayjs_plugin_utc);
dayjs.extend(dayjs_plugin_timezone);
dayjs.locale('pt-br');
dayjs.tz.setDefault("America/Sao_Paulo");

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
                const forceFactor = Math.max(0, 1 - distSq / 4); // Radius of 2

                // Repulsion from mouse
                if (forceFactor > 0) {
                    velocities[i3] -= dx * forceFactor * 0.005;
                    velocities[i3 + 1] -= dy * forceFactor * 0.005;
                }

                // Spring back to original position
                velocities[i3] += (originalPositions[i3] - positions[i3]) * 0.001;
                velocities[i3 + 1] += (originalPositions[i3 + 1] - positions[i3 + 1]) * 0.001;
                velocities[i3 + 2] += (originalPositions[i3 + 2] - positions[i3 + 2]) * 0.001;

                // Damping
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


    // --- STATE & LOCAL STORAGE ---
    let books = [], users = [], rentals = [], posts = [], currentUser = null;
    const rewardsList = [ { id: 1, title: 'Aluguel Grátis por 1 Mês', cost: 1000 }, { id: 2, title: 'Extensão de Prazo (+15 dias)', cost: 300 }, { id: 3, title: 'Ícone de Perfil Exclusivo', cost: 500 }, ];
    
    const loadDataFromStorage = () => {
        books = JSON.parse(localStorage.getItem('library_books')) || [ { id: 1, title: 'Engenharia de Software', author: 'Ian Sommerville', category: 'Tecnologia', copies: 3, rented: 1, cover: 'https://placehold.co/300x450/6366F1/FFFFFF?text=Eng.+Software', ratingSum: 18, ratingCount: 4 }, { id: 2, title: 'Código Limpo', author: 'Robert C. Martin', category: 'Tecnologia', copies: 2, rented: 2, cover: 'https://placehold.co/300x450/10B981/FFFFFF?text=C%C3%B3digo+Limpo', ratingSum: 25, ratingCount: 5 }, { id: 3, title: 'O Programador Pragmático', author: 'Andrew Hunt', category: 'Tecnologia', copies: 4, rented: 0, cover: 'https://placehold.co/300x450/F59E0B/FFFFFF?text=Prog.+Pragm%C3%A1tico', ratingSum: 38, ratingCount: 8 }, { id: 4, title: 'Sapiens', author: 'Yuval Noah Harari', category: 'História', copies: 5, rented: 1, cover: 'https://placehold.co/300x450/8B5CF6/FFFFFF?text=Sapiens', ratingSum: 48, ratingCount: 10 }, { id: 5, title: '1984', author: 'George Orwell', category: 'Ficção', copies: 3, rented: 3, cover: 'https://placehold.co/300x450/EF4444/FFFFFF?text=1984', ratingSum: 19, ratingCount: 4 }, { id: 6, title: 'A Revolução dos Bichos', author: 'George Orwell', category: 'Ficção', copies: 6, rented: 1, cover: 'https://placehold.co/300x450/3B82F6/FFFFFF?text=Revolu%C3%A7%C3%A3o+Bichos', ratingSum: 29, ratingCount: 6 }, { id: 7, title: 'O Hobbit', author: 'J.R.R. Tolkien', category: 'Fantasia', copies: 4, rented: 1, cover: 'https://placehold.co/300x450/14B8A6/FFFFFF?text=O+Hobbit', ratingSum: 44, ratingCount: 9 }, { id: 8, title: 'Inteligência Artificial', author: 'Stuart Russell', category: 'Tecnologia', copies: 2, rented: 0, cover: 'https://placehold.co/300x450/EC4899/FFFFFF?text=IA', ratingSum: 13, ratingCount: 3 }, ];
        users = JSON.parse(localStorage.getItem('library_users')) || [{ id: 1, name: 'Administrador', email: 'admin', password: 'admin', points: 9999, isAdmin: true, rewards: [] }];
        rentals = JSON.parse(localStorage.getItem('library_rentals')) || [ { id: 1, bookId: 2, userId: 1, rentalDate: dayjs().subtract(10, 'day').format('YYYY-MM-DD'), dueDate: dayjs().add(5, 'day').format('YYYY-MM-DD'), returnDate: null, tier: 'Básico' }, { id: 2, bookId: 4, userId: 1, rentalDate: dayjs().subtract(25, 'day').format('YYYY-MM-DD'), dueDate: dayjs().add(5, 'day').format('YYYY-MM-DD'), returnDate: null, tier: 'Avançado' }, { id: 3, bookId: 5, userId: 1, rentalDate: dayjs().subtract(100, 'day').format('YYYY-MM-DD'), dueDate: dayjs().subtract(85, 'day').format('YYYY-MM-DD'), returnDate: null, tier: 'Básico' },];
        posts = JSON.parse(localStorage.getItem('library_posts')) || [ { id: 1, userName: 'Ana Clara', content: 'Acabei de ler "Código Limpo". Mudou minha perspectiva sobre programação! 10/10', timestamp: dayjs().subtract(2, 'hour').toISOString(), likes: 12, dislikes: 1, userVotes: { 1: 'like'} }, { id: 2, userName: 'Bruno Silva', content: 'Alguém tem recomendação de um bom livro de Ficção Científica? Já li 1984.', timestamp: dayjs().subtract(4, 'hour').toISOString(), likes: 5, dislikes: 0, userVotes: {} }, { id: 3, userName: 'Administrador', content: 'Bem-vindos à nova seção da Comunidade! Sintam-se à vontade para compartilhar suas leituras.', timestamp: dayjs().subtract(1, 'day').toISOString(), likes: 2, dislikes: 2, userVotes: { 1: 'dislike' } } ];
        
        // Garante que posts antigos ou novos tenham a estrutura de dados correta
        posts.forEach(p => {
            if (p.likes === undefined) p.likes = 0;
            if (p.dislikes === undefined) p.dislikes = 0;
            if (!p.userVotes) p.userVotes = {};
        });
    };
    
    const saveDataToStorage = () => {
        localStorage.setItem('library_books', JSON.stringify(books));
        localStorage.setItem('library_users', JSON.stringify(users));
        localStorage.setItem('library_rentals', JSON.stringify(rentals));
        localStorage.setItem('library_posts', JSON.stringify(posts));
    };
    
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


    window.toggleAuthForms = () => { loginForm.classList.toggle('hidden'); registerForm.classList.toggle('hidden'); };
    
    window.handleLogin = (event) => {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error');
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            currentUser = user;
            sessionStorage.setItem('library_currentUser', JSON.stringify(user));
            
            if (loginScene) loginScene.stop();
            document.getElementById('login-bg-canvas').style.display = 'none';

            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            
            appScene = initApp3D();
            initializeApp();
        } else {
            errorDiv.textContent = 'Credenciais inválidas. Tente novamente.';
            errorDiv.classList.remove('hidden');
        }
    };
    
    window.handleRegister = (event) => {
        event.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const errorDiv = document.getElementById('register-error');
        const successDiv = document.getElementById('register-success');
        if (users.some(u => u.email === email)) {
            successDiv.classList.add('hidden');
            errorDiv.textContent = 'Este email já está em uso.';
            errorDiv.classList.remove('hidden');
            return;
        }
        const newUser = { id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1, name, email, password, points: 0, isAdmin: false, rewards: [] };
        users.push(newUser);
        saveDataToStorage();
        errorDiv.classList.add('hidden');
        successDiv.textContent = 'Conta criada com sucesso! Você já pode fazer o login.';
        successDiv.classList.remove('hidden');
        event.target.reset();
        setTimeout(() => { toggleAuthForms(); successDiv.classList.add('hidden'); }, 2000);
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
        if (rentals.filter(r => r.bookId === book.id && !r.returnDate).length >= book.copies) return { text: 'Alugado', class: 'status-alugado' };
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
        const filteredBooks = books.filter(book => (book.title.toLowerCase().includes(searchTerm) || book.author.toLowerCase().includes(searchTerm)) && (selectedCategory === 'all' || book.category === selectedCategory));
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
        let actionButton = userHasRented ? `<button class="bg-green-500 text-white w-full py-2 rounded-lg hover:bg-green-600 transition-all duration-200 transform active:scale-95" onclick="returnBook(${book.id})">Devolver Livro</button>` : availability > 0 ? `<div class="grid grid-cols-1 sm:grid-cols-3 gap-2"><button onclick="rentBook(${book.id}, 'Básico', 15)" class="bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-600 transition-all duration-200 transform active:scale-95 text-sm">Alugar Básico (15d)</button><button onclick="rentBook(${book.id}, 'Avançado', 30)" class="bg-cyan-500 text-white py-2 rounded-lg hover:bg-cyan-600 transition-all duration-200 transform active:scale-95 text-sm">Avançado (30d)</button><button onclick="rentBook(${book.id}, 'Expert', 60)" class="bg-sky-500 text-white py-2 rounded-lg hover:bg-sky-600 transition-all duration-200 transform active:scale-95 text-sm">Expert (60d)</button></div>` : `<button class="bg-gray-400 text-white w-full py-2 rounded-lg cursor-not-allowed">Indisponível</button>`;
        bookModal.firstElementChild.innerHTML = `<button onclick="closeModal('book-modal')" class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-transform duration-200 hover:rotate-90"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button><div class="grid grid-cols-1 md:grid-cols-3 gap-6"><img src="${book.cover}" alt="${book.title}" class="rounded-lg shadow-lg w-full md:w-auto"><div class="md:col-span-2"><h2 class="text-2xl sm:text-3xl font-bold">${book.title}</h2><p class="text-lg text-gray-600 mt-1">${book.author}</p><span class="inline-block bg-teal-100 text-teal-800 text-sm font-semibold mt-2 px-2.5 py-0.5 rounded-full">${book.category}</span><div class="flex items-center mt-4"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-400 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg><span class="text-xl font-bold">${avgRating}</span><span class="text-gray-500 ml-2">(${book.ratingCount} avaliações)</span></div><div class="mt-4"><p><span class="font-semibold">Status:</span> <span class="${status.class}">${status.text}</span> (${availability} de ${book.copies} disp.)</p></div><div class="mt-6">${actionButton}</div><div class="mt-6 border-t pt-4"><h4 class="font-bold mb-2">Avaliar este livro:</h4><div class="flex items-center space-x-2">${[1,2,3,4,5].map(star => `<svg onclick="rateBook(${book.id}, ${star})" class="h-8 w-8 text-gray-300 hover:text-yellow-400 cursor-pointer transition-transform hover:scale-125" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>`).join('')}</div></div></div></div>`;
        bookModal.style.display = 'flex';
    };

    window.closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        modal.style.animation = 'fadeOut 0.3s ease-out forwards';
        modal.firstElementChild.style.animation = 'scaleDown 0.3s ease-out forwards';
        setTimeout(() => { modal.style.display = 'none'; modal.style.animation = ''; modal.firstElementChild.style.animation = ''; }, 300);
    }

    window.rentBook = (bookId, tier, days) => {
        const book = books.find(b => b.id === bookId); book.rented++;
        rentals.push({ id: rentals.length > 0 ? Math.max(...rentals.map(r => r.id)) + 1 : 1, bookId, userId: currentUser.id, rentalDate: dayjs().format('YYYY-MM-DD'), dueDate: dayjs().add(days, 'day').format('YYYY-MM-DD'), returnDate: null, tier });
        closeModal('book-modal'); updateAll();
    };
    
    window.returnBook = (bookId) => {
        const rental = rentals.find(r => r.userId === currentUser.id && r.bookId === bookId && !r.returnDate); if (!rental) return;
        const book = books.find(b => b.id === bookId);
        rental.returnDate = dayjs().format('YYYY-MM-DD'); book.rented--;
        if (dayjs(rental.returnDate).isBefore(dayjs(rental.dueDate).add(1, 'day'))) {
            currentUser.points += 25; users.find(u => u.id === currentUser.id).points = currentUser.points;
        }
        closeModal('book-modal'); updateAll();
    };

    window.rateBook = (bookId, rating) => {
        const book = books.find(b => b.id === bookId); book.ratingSum += rating; book.ratingCount++;
        currentUser.points += 10; users.find(u => u.id === currentUser.id).points = currentUser.points;
        closeModal('book-modal'); updateAll();
    }

    const populateCategories = () => {
        const categories = [...new Set(books.map(book => book.category))];
        categoryFilter.innerHTML = '<option value="all">Todas as Categorias</option>';
        categories.forEach(cat => { categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`; });
    };
    
    const renderUserProfile = () => {
        if (!currentUser) return;
        document.getElementById('user-profile').innerHTML = `<span class="font-semibold mr-2 sm:mr-4 hidden md:inline">Olá, ${currentUser.name}</span><span class="bg-teal-100 text-teal-800 text-xs sm:text-sm font-semibold px-2 py-0.5 sm:px-2.5 rounded-full">${currentUser.points} Pts</span>${currentUser.isAdmin ? '<span class="ml-2 bg-yellow-100 text-yellow-800 text-xs sm:text-sm font-semibold px-2 py-0.5 sm:px-2.5 rounded-full">Admin</span>' : ''}`;
    };

    const renderRankings = () => {
        const topUser = [...users].filter(u => !u.isAdmin).sort((a, b) => b.points - a.points)[0] || { name: 'N/A', points: 0 };
        const rentalCounts = rentals.reduce((acc, r) => { acc[r.bookId] = (acc[r.bookId] || 0) + 1; return acc; }, {});
        const mostReadBookId = Object.keys(rentalCounts).sort((a,b) => rentalCounts[b] - rentalCounts[a])[0];
        const mostReadBook = books.find(b => b.id == mostReadBookId) || { title: 'N/A' };
        const topRatedBook = [...books].filter(b => b.ratingCount > 0).sort((a, b) => (b.ratingSum/b.ratingCount) - (a.ratingSum/a.ratingCount))[0] || { title: 'N/A', ratingSum: 0, ratingCount: 1 };
        const topRating = (topRatedBook.ratingSum / topRatedBook.ratingCount).toFixed(1);
        document.getElementById('rankings-content').innerHTML = `<div><p class="font-semibold">🏆 Leitor do Mês</p><p class="text-sm text-gray-600">${topUser.name} (${topUser.points} pts)</p></div><div><p class="font-semibold">📖 Livro Mais Popular</p><p class="text-sm text-gray-600">${mostReadBook.title}</p></div><div><p class="font-semibold">⭐ Livro Melhor Avaliado</p><p class="text-sm text-gray-600">${topRatedBook.title} (${topRating})</p></div>`;
    };
    
    const renderBlacklist = () => {
        const blacklistUsers = rentals.filter(r => !r.returnDate && dayjs().diff(dayjs(r.dueDate), 'day') > 90).map(r => users.find(u => u.id === r.userId)).filter((v, i, a) => v && a.findIndex(u => u.id === v.id) === i);
        if (blacklistUsers.length === 0) { document.getElementById('blacklist-content').innerHTML = `<p class="text-sm text-gray-500">Nenhum usuário na lista negra.</p>`; return; }
        document.getElementById('blacklist-content').innerHTML = blacklistUsers.map(user => {
            const overdueDays = dayjs().diff(dayjs(rentals.find(r => r.userId === user.id && !r.returnDate && dayjs().diff(dayjs(r.dueDate), 'day') > 90).dueDate), 'day');
            return `<div class="text-sm"><p class="font-semibold">${user.name}</p><p class="text-red-500">Atraso de ${overdueDays} dias.</p></div>`;
        }).join('');
    };

    const renderMyBooks = () => {
        if(!currentUser) return;
        const myActiveRentals = rentals.filter(r => r.userId === currentUser.id && !r.returnDate);
        if (myActiveRentals.length === 0) { document.getElementById('my-books-content').innerHTML = `<p class="text-sm text-gray-500">Você não possui livros alugados.</p>`; return; }
        document.getElementById('my-books-content').innerHTML = myActiveRentals.map(rental => {
            const book = books.find(b => b.id === rental.bookId); const status = getUserRentalStatus(rental);
            return `<div class="text-sm cursor-pointer hover:bg-white p-2 rounded-lg transition-colors" onclick="openBookModal(${book.id})"><p class="font-semibold truncate">${book.title}</p><p class="${status.class}">${status.text}</p></div>`;
        }).join('');
    };
    
    const renderRewards = () => {
        const storeDiv = document.getElementById('rewards-store-content');
        if (!currentUser) return;
        storeDiv.innerHTML = rewardsList.map(reward => {
            const hasReward = currentUser.rewards && currentUser.rewards.includes(reward.id);
            const canAfford = currentUser.points >= reward.cost;
            let button;
            if (hasReward) {
                button = `<button onclick="useReward(${reward.id})" class="mt-2 w-full text-sm bg-green-500 text-white py-1 px-2 rounded-md hover:bg-green-600 transition-all transform active:scale-95">Usar</button>`;
            } else {
                button = `<button ${canAfford ? '' : 'disabled'} onclick="redeemReward(${reward.id})" class="mt-2 w-full text-sm ${canAfford ? 'bg-teal-500 hover:bg-teal-600' : 'bg-gray-400 cursor-not-allowed'} text-white py-1 px-2 rounded-md transition-all transform active:scale-95">Resgatar</button>`;
            }
            return `<div class="p-3 bg-gray-50/80 rounded-lg"><p class="font-semibold">${reward.title}</p><p class="text-sm text-teal-700">${reward.cost} pontos</p>${button}</div>`;
        }).join('');
    };
    
    const renderCommunityFeed = () => {
        const feed = document.getElementById('post-feed');
        if (!currentUser) return;
        
        feed.innerHTML = posts.map((post, index) => {
            const postTime = dayjs(post.timestamp).fromNow();
            const userVote = post.userVotes[currentUser.id];
            
            return `
            <div class="bg-white/80 backdrop-blur-sm rounded-lg shadow-md overflow-hidden post-card-enter" style="animation-delay: ${index * 50}ms">
                <div class="p-5">
                    <div class="flex items-center space-x-3">
                        <div class="flex-shrink-0 w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center font-bold text-white text-lg">
                            ${post.userName.charAt(0)}
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900">${post.userName}</h3>
                            <p class="text-xs text-gray-500">${postTime}</p>
                        </div>
                    </div>
                    <p class="text-gray-700 mt-4 whitespace-pre-wrap">${post.content}</p>
                    
                    <div class="border-t border-gray-300/70 mt-4 pt-3 flex items-center space-x-6">
                        <button onclick="voteOnPost(${post.id}, 'like')" class="flex items-center space-x-1 group transition-transform duration-200 active:scale-95 ${userVote === 'like' ? 'text-teal-600' : 'text-gray-500 hover:text-teal-600'}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h6.364a1 1 0 00.949-.707l2.716-6.839A.5.5 0 0016.5 9.5H13V6a1 1 0 00-1-1h-1.48a1 1 0 00-.986.838L8.43 9.5H6.5a.5.5 0 00-.5.5v.333z" /></svg>
                            <span class="text-sm font-medium ${userVote === 'like' ? 'text-teal-600' : 'text-gray-600 group-hover:text-teal-600'}">${post.likes}</span>
                        </button>
                        <button onclick="voteOnPost(${post.id}, 'dislike')" class="flex items-center space-x-1 group transition-transform duration-200 active:scale-95 ${userVote === 'dislike' ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667V3a1 1 0 00-1-1h-6.364a1 1 0 00-.949.707l-2.716 6.839A.5.5 0 003.5 10.5H7v7a1 1 0 001 1h1.48a1 1 0 00.986-.838L11.57 10.5h1.93a.5.5 0 00.5-.5v-.333z" /></svg>
                            <span class="text-sm font-medium ${userVote === 'dislike' ? 'text-red-600' : 'text-gray-600 group-hover:text-red-600'}">${post.dislikes}</span>
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    };
    
    const handleNewPost = (event) => {
        event.preventDefault();
        const contentEl = document.getElementById('new-post-content');
        const content = contentEl.value;
        if (!content.trim() || !currentUser) return;
        
        const newPost = { 
            id: Date.now(), 
            userName: currentUser.name, 
            content: content, 
            timestamp: new Date().toISOString(),
            likes: 0,
            dislikes: 0,
            userVotes: {}
        };
        
        posts.unshift(newPost);
        updateAll(); // Use updateAll to save and re-render
        contentEl.value = '';
    };

    window.voteOnPost = (postId, voteType) => {
        const post = posts.find(p => p.id === postId);
        if (!post || !currentUser) return;

        const userId = currentUser.id;
        const currentVote = post.userVotes[userId];

        if (currentVote === voteType) {
            // Clicou no mesmo botão (remover voto)
            delete post.userVotes[userId];
            if (voteType === 'like') post.likes--;
            else post.dislikes--;
        } else if (currentVote) {
            // Mudou o voto
            post.userVotes[userId] = voteType;
            if (voteType === 'like') {
                post.likes++;
                post.dislikes--;
            } else {
                post.likes--;
                post.dislikes++;
            }
        } else {
            // Novo voto
            post.userVotes[userId] = voteType;
            if (voteType === 'like') post.likes++;
            else post.dislikes++;
        }
        
        updateAll(); // Re-render o feed e salva no localStorage
    };

    window.redeemReward = (rewardId) => {
        const reward = rewardsList.find(r => r.id === rewardId);
        if (currentUser.points >= reward.cost) {
            currentUser.points -= reward.cost;
            if (!currentUser.rewards) currentUser.rewards = [];
            currentUser.rewards.push(rewardId);
            users.find(u => u.id === currentUser.id).points = currentUser.points;
            users.find(u => u.id === currentUser.id).rewards = currentUser.rewards;
            updateAll();
        }
    };
    
    window.useReward = (rewardId) => {
        currentUser.rewards = currentUser.rewards.filter(id => id !== rewardId);
        users.find(u => u.id === currentUser.id).rewards = currentUser.rewards;
        alert(`Recompensa "${rewardsList.find(r=>r.id===rewardId).title}" utilizada!`);
        updateAll();
    };

    const renderDbTable = (tableId, headers, data, renderer) => {
        const table = document.getElementById(tableId);
        table.innerHTML = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${data.map(renderer).join('')}</tbody>`;
    };

    const toggleView = (view) => {
        const libraryView = document.getElementById('library-view');
        const communityView = document.getElementById('community-view');
        const navLibrary = document.getElementById('nav-library');
        const navCommunity = document.getElementById('nav-community');
        
        const activeClasses = ['font-semibold', 'text-teal-600'];
        const inactiveClasses = ['font-medium', 'text-gray-500', 'hover:bg-teal-50', 'hover:text-teal-600'];

        if (view === 'community') {
            libraryView.classList.add('hidden');
            communityView.classList.remove('hidden');
            navLibrary.classList.remove(...activeClasses);
            navLibrary.classList.add(...inactiveClasses);
            navCommunity.classList.add(...activeClasses);
            navCommunity.classList.remove(...inactiveClasses);
        } else {
            libraryView.classList.remove('hidden');
            communityView.classList.add('hidden');
            navCommunity.classList.remove(...activeClasses);
            navCommunity.classList.add(...inactiveClasses);
            navLibrary.classList.add(...activeClasses);
            navLibrary.classList.remove(...inactiveClasses);
        }
    };
    
    const setupEventListeners = () => {
        document.getElementById('logout-btn').addEventListener('click', logout);
        searchInput.addEventListener('input', renderBooks);
        categoryFilter.addEventListener('change', renderBooks);
        adminFab.addEventListener('click', () => adminModal.style.display = 'flex');
        
        // Main navigation
        document.getElementById('nav-library').addEventListener('click', () => toggleView('library'));
        document.getElementById('nav-community').addEventListener('click', () => toggleView('community'));
        
        // New post form
        document.getElementById('new-post-form').addEventListener('submit', handleNewPost);

        // Admin modal tabs
        const dbTabs = document.querySelectorAll('.db-tab');
        dbTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                dbTabs.forEach(t => t.classList.remove('text-teal-600', 'border-teal-600', 'font-semibold') || t.classList.add('text-gray-500'));
                tab.classList.add('text-teal-600', 'border-teal-600', 'font-semibold');
                tab.classList.remove('text-gray-500');
                document.querySelectorAll('.db-tab-content').forEach(c => c.classList.add('hidden'));
                document.getElementById(`${tab.dataset.tab}-content`).classList.remove('hidden');
            });
        });
    };

    const updateAll = () => {
        renderBooks(); 
        renderUserProfile(); 
        renderRankings(); 
        renderBlacklist(); 
        renderMyBooks(); 
        renderRewards();
        renderCommunityFeed();
        
        // Admin DB Tables
        renderDbTable('db-books-table', ['ID', 'Título', 'Autor', 'Categoria', 'Cópias', 'Alugados', 'Rating Sum', 'Rating Count'], books, b => `<tr><td>${b.id}</td><td>${b.title}</td><td>${b.author}</td><td>${b.category}</td><td>${b.copies}</td><td>${b.rented}</td><td>${b.ratingSum}</td><td>${b.ratingCount}</td></tr>`);
        renderDbTable('db-users-table', ['ID', 'Nome', 'Email', 'Pontos', 'Admin'], users, u => `<tr><td>${u.id}</td><td>${u.name}</td><td>${u.email}</td><td>${u.points}</td><td>${u.isAdmin}</td></tr>`);
        renderDbTable('db-rentals-table', ['ID', 'Book ID', 'User ID', 'Data Aluguel', 'Data Devolução', 'Data Retorno', 'Tier'], rentals, r => `<tr><td>${r.id}</td><td>${r.bookId}</td><td>${r.userId}</td><td>${r.rentalDate}</td><td>${r.dueDate}</td><td>${r.returnDate || 'N/A'}</td><td>${r.tier}</td></tr>`);
        renderDbTable('db-posts-table', ['ID', 'Usuário', 'Conteúdo', 'Likes', 'Dislikes', 'Timestamp'], posts, p => `<tr><td>${p.id}</td><td>${p.userName}</td><td class="whitespace-pre-wrap">${p.content}</td><td>${p.likes}</td><td>${p.dislikes}</td><td>${p.timestamp}</td></tr>`);

        saveDataToStorage();
    }

    const initializeApp = () => {
        if (currentUser && currentUser.isAdmin) adminFab.style.display = 'flex';
        populateCategories(); 
        setupEventListeners(); 
        updateAll();
        toggleView('library'); // Start on library view
    };

    // --- Inicialização ---
    loadDataFromStorage();
    const sessionUser = sessionStorage.getItem('library_currentUser');
    if (sessionUser) {
        currentUser = JSON.parse(sessionUser);
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        appScene = initApp3D();
        initializeApp();
    } else {
        authContainer.style.display = 'flex';
        appContainer.style.display = 'none';
        loginScene = initLogin3D();
    }
});
