document.addEventListener('DOMContentLoaded', () => {
  // =========================
  // 3D BACKGROUND (login/app)
  // =========================
  let loginScene, appScene;
  let loginAnimationId, appAnimationId;

  const initLogin3D = () => {
    const canvas = document.getElementById('login-bg-canvas');
    if (!canvas) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
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

    const onMouseMove = (e) => {
      stars.rotation.x = (-(e.clientY / window.innerHeight) * 2 + 1) * 0.1;
      stars.rotation.y = ((e.clientX / window.innerWidth) * 2 - 1) * 0.1;
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
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
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
      positions[i3] = x; positions[i3 + 1] = y; positions[i3 + 2] = z;
      originalPositions[i3] = x; originalPositions[i3 + 1] = y; originalPositions[i3 + 2] = z;
      velocities[i3] = velocities[i3 + 1] = velocities[i3 + 2] = 0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0x222222, size: 0.02, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const mouse = new THREE.Vector3(9999, 9999, 9999);
    const onMouseMove = (event) => {
      const vec = new THREE.Vector3();
      const pos = new THREE.Vector3();
      vec.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
      vec.unproject(camera); vec.sub(camera.position).normalize();
      const distance = -camera.position.z / vec.z; pos.copy(camera.position).add(vec.multiplyScalar(distance));
      mouse.copy(pos);
    };
    const onMouseLeave = () => { mouse.set(9999, 9999, 9999); };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);

    const animate = () => {
      appAnimationId = requestAnimationFrame(animate);
      const p = geometry.attributes.position.array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const dx = mouse.x - p[i3], dy = mouse.y - p[i3 + 1];
        const distSq = dx * dx + dy * dy;
        const f = Math.max(0, 1 - distSq / 4); // raio ~2
        if (f > 0) { velocities[i3] -= dx * f * 0.005; velocities[i3 + 1] -= dy * f * 0.005; }
        velocities[i3] += (originalPositions[i3] - p[i3]) * 0.001;
        velocities[i3 + 1] += (originalPositions[i3 + 1] - p[i3 + 1]) * 0.001;
        velocities[i3 + 2] += (originalPositions[i3 + 2] - p[i3 + 2]) * 0.001;
        velocities[i3] *= 0.95; velocities[i3 + 1] *= 0.95; velocities[i3 + 2] *= 0.95;
        p[i3] += velocities[i3]; p[i3 + 1] += velocities[i3 + 1]; p[i3 + 2] += velocities[i3 + 2];
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

  // =========================
  // ESTADO & STORAGE
  // =========================
  let books = [], users = [], rentals = [], posts = [], currentUser = null;

  const rewardsList = [
    { id: 1, title: 'Aluguel Grátis por 1 Mês', cost: 1000 },
    { id: 2, title: 'Extensão de Prazo (+15 dias)', cost: 300 },
    { id: 3, title: 'Ícone de Perfil Exclusivo', cost: 500 },
  ];

  const loadDataFromStorage = () => {
    const defaultBooks = [
      { id: 1, title: 'Engenharia de Software', author: 'Ian Sommerville', category: 'Tecnologia', copies: 3, rented: 1, cover: 'https://placehold.co/300x450/6366F1/FFFFFF?text=Eng.+Software', ratingSum: 18, ratingCount: 4 },
      { id: 2, title: 'Código Limpo', author: 'Robert C. Martin', category: 'Tecnologia', copies: 2, rented: 2, cover: 'https://placehold.co/300x450/10B981/FFFFFF?text=C%C3%B3digo+Limpo', ratingSum: 25, ratingCount: 5 },
      { id: 3, title: 'O Programador Pragmático', author: 'Andrew Hunt', category: 'Tecnologia', copies: 4, rented: 0, cover: 'https://placehold.co/300x450/F59E0B/FFFFFF?text=Prog.+Pragm%C3%A1tico', ratingSum: 38, ratingCount: 8 },
      { id: 4, title: 'Sapiens', author: 'Yuval Noah Harari', category: 'História', copies: 5, rented: 1, cover: 'https://placehold.co/300x450/8B5CF6/FFFFFF?text=Sapiens', ratingSum: 48, ratingCount: 10 },
      { id: 5, title: '1984', author: 'George Orwell', category: 'Ficção', copies: 3, rented: 3, cover: 'https://placehold.co/300x450/EF4444/FFFFFF?text=1984', ratingSum: 19, ratingCount: 4 },
      { id: 6, title: 'A Revolução dos Bichos', author: 'George Orwell', category: 'Ficção', copies: 6, rented: 1, cover: 'https://placehold.co/300x450/3B82F6/FFFFFF?text=Revolu%C3%A7%C3%A3o+Bichos', ratingSum: 29, ratingCount: 6 },
      { id: 7, title: 'O Hobbit', author: 'J.R.R. Tolkien', category: 'Fantasia', copies: 4, rented: 1, cover: 'https://placehold.co/300x450/14B8A6/FFFFFF?text=O+Hobbit', ratingSum: 44, ratingCount: 9 },
      { id: 8, title: 'Inteligência Artificial', author: 'Stuart Russell', category: 'Tecnologia', copies: 2, rented: 0, cover: 'https://placehold.co/300x450/EC4899/FFFFFF?text=IA', ratingSum: 13, ratingCount: 3 },
    ];
    const defaultUsers = [
      { id: 1, name: 'Administrador', email: 'admin', password: 'admin', points: 9999, isAdmin: true, rewards: [] },
    ];
    const defaultRentals = [
      { id: 1, bookId: 2, userId: 1, rentalDate: dayjs().subtract(10, 'day').format('YYYY-MM-DD'), dueDate: dayjs().add(5, 'day').format('YYYY-MM-DD'), returnDate: null, tier: 'Básico' },
      { id: 2, bookId: 4, userId: 1, rentalDate: dayjs().subtract(25, 'day').format('YYYY-MM-DD'), dueDate: dayjs().add(5, 'day').format('YYYY-MM-DD'), returnDate: null, tier: 'Avançado' },
      { id: 3, bookId: 5, userId: 1, rentalDate: dayjs().subtract(100, 'day').format('YYYY-MM-DD'), dueDate: dayjs().subtract(85, 'day').format('YYYY-MM-DD'), returnDate: null, tier: 'Básico' },
    ];
    const defaultPosts = [
      { id: 1, userId: 1, content: 'Alguém recomenda por onde começar em Engenharia de Software (Sommerville)?', bookId: 1, createdAt: dayjs().subtract(2, 'hour').toISOString(), likes: [], bookmarks: [], reposts: 1, comments: [] },
      { id: 2, userId: 1, content: 'Terminei “Código Limpo”. As práticas de refatoração mudaram meu jeito de pensar.', bookId: 2, createdAt: dayjs().subtract(1, 'day').toISOString(), likes: [], bookmarks: [], reposts: 0, comments: [] },
    ];

    books   = JSON.parse(localStorage.getItem('library_books'))   || defaultBooks;
    users   = JSON.parse(localStorage.getItem('library_users'))   || defaultUsers;
    rentals = JSON.parse(localStorage.getItem('library_rentals')) || defaultRentals;
    posts   = JSON.parse(localStorage.getItem('library_posts'))   || defaultPosts;
  };

  const saveDataToStorage = () => {
    localStorage.setItem('library_books', JSON.stringify(books));
    localStorage.setItem('library_users', JSON.stringify(users));
    localStorage.setItem('library_rentals', JSON.stringify(rentals));
    localStorage.setItem('library_posts', JSON.stringify(posts));
  };

  // =========================
  // ELEMENTOS
  // =========================
  const authContainer = document.getElementById('auth-container');
  const appContainer  = document.getElementById('app-container');

  const loginForm     = document.getElementById('login-form');
  const registerForm  = document.getElementById('register-form');

  const bookList      = document.getElementById('book-list');
  const searchInput   = document.getElementById('search-input');
  const categoryFilter= document.getElementById('category-filter');

  const bookModal     = document.getElementById('book-modal');
  const bookModalContent = document.getElementById('book-modal-content');

  const adminFab      = document.getElementById('admin-fab');
  const adminModal    = document.getElementById('admin-modal');

  // Tabs
  const tabCatalog = document.getElementById('tab-catalog');
  const tabSocial  = document.getElementById('tab-social');
  const viewCatalog= document.getElementById('catalog-view');
  const viewSocial = document.getElementById('social-view');

  // Rede social
  const postText    = document.getElementById('post-text');
  const postBookSel = document.getElementById('post-book');
  const publishPost = document.getElementById('publish-post');
  const feedList    = document.getElementById('feed-list');

  // =========================
  // AUTENTICAÇÃO
  // =========================
  const toggleAuthForms = () => { loginForm.classList.toggle('hidden'); registerForm.classList.toggle('hidden'); };
  document.getElementById('show-register-form').addEventListener('click', (e) => { e.preventDefault(); toggleAuthForms(); });
  document.getElementById('show-login-form').addEventListener('click', (e) => { e.preventDefault(); toggleAuthForms(); });

  const handleLogin = (e) => {
    e.preventDefault();
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
      appContainer.style.display  = 'block';

      appScene = initApp3D();
      initializeApp();
    } else {
      errorDiv.textContent = 'Credenciais inválidas. Tente novamente.';
      errorDiv.classList.remove('hidden');
    }
  };
  loginForm.addEventListener('submit', handleLogin);

  const handleRegister = (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    const errorDiv = document.getElementById('register-error');
    const successDiv = document.getElementById('register-success');

    if (users.some(u => u.email === email)) {
      successDiv.classList.add('hidden');
      errorDiv.textContent = 'Este email já está em uso.';
      errorDiv.classList.remove('hidden');
      return;
    }
    const newUser = { id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1, name, email, password, points: 0, isAdmin: false, rewards: [] };
    users.push(newUser);
    saveDataToStorage();
    errorDiv.classList.add('hidden');
    successDiv.textContent = 'Conta criada com sucesso! Você já pode fazer o login.';
    successDiv.classList.remove('hidden');
    e.target.reset();
    setTimeout(() => { toggleAuthForms(); successDiv.classList.add('hidden'); }, 1500);
  };
  registerForm.addEventListener('submit', handleRegister);

  document.getElementById('logout-btn').addEventListener('click', () => {
    currentUser = null;
    sessionStorage.removeItem('library_currentUser');

    if (appScene) appScene.stop();
    document.getElementById('app-bg-canvas').style.display = 'none';

    authContainer.style.display = 'flex';
    appContainer.style.display  = 'none';
    adminFab.style.display = 'none';

    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';

    document.getElementById('login-bg-canvas').style.display = 'block';
    loginScene = initLogin3D();
  });

  // =========================
  // RENDER: CATÁLOGO & LATERAIS
  // =========================
  const populateCategories = () => {
    const cats = [...new Set(books.map(b => b.category))].sort();
    categoryFilter.innerHTML = `<option value="all">Todas as Categorias</option>` + cats.map(c => `<option value="${c}">${c}</option>`).join('');
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
    const searchTerm = (searchInput?.value || '').toLowerCase();
    const selectedCategory = categoryFilter?.value || 'all';
    const filteredBooks = books.filter(book =>
      (book.title.toLowerCase().includes(searchTerm) || book.author.toLowerCase().includes(searchTerm)) &&
      (selectedCategory === 'all' || book.category === selectedCategory)
    );
    bookList.innerHTML = filteredBooks.map((book, index) => {
      const status = getBookStatus(book);
      const availability = book.copies - book.rented;
      const avgRating = book.ratingCount > 0 ? (book.ratingSum / book.ratingCount).toFixed(1) : 'N/A';
      return `
      <div class="bg-white/80 backdrop-blur-sm rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 book-card-enter cursor-pointer"
           style="animation-delay: ${index * 50}ms" data-book-id="${book.id}">
        <img src="${book.cover}" alt="${book.title}" class="w-full h-64 object-cover pointer-events-none">
        <div class="p-4 pointer-events-none">
          <h3 class="text-lg font-bold truncate">${book.title}</h3>
          <p class="text-gray-600">${book.author}</p>
          <div class="flex justify-between items-center mt-4">
            <span class="font-semibold ${status.class}">${status.text}</span>
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <span>${avgRating}</span>
            </div>
          </div>
          <p class="text-sm text-gray-500 mt-1">${availability} de ${book.copies} disponíveis</p>
        </div>
      </div>`;
    }).join('');
  };

  const renderUserProfile = () => {
    if (!currentUser) return;
    document.getElementById('user-profile').innerHTML =
      `<span class="font-semibold mr-2 sm:mr-4 hidden md:inline">Olá, ${currentUser.name}</span>
       <span class="bg-teal-100 text-teal-800 text-xs sm:text-sm font-semibold px-2 py-0.5 sm:px-2.5 rounded-full">${currentUser.points} Pts</span>
       ${currentUser.isAdmin ? '<span class="ml-2 bg-yellow-100 text-yellow-800 text-xs sm:text-sm font-semibold px-2 py-0.5 sm:px-2.5 rounded-full">Admin</span>' : ''}`;
  };

  const renderRankings = () => {
    const topUser = [...users].filter(u => !u.isAdmin).sort((a, b) => b.points - a.points)[0] || { name: 'N/A', points: 0 };
    const rentalCounts = rentals.reduce((acc, r) => { acc[r.bookId] = (acc[r.bookId] || 0) + 1; return acc; }, {});
    const mostReadBookId = Object.keys(rentalCounts).sort((a,b) => rentalCounts[b] - rentalCounts[a])[0];
    const mostReadBook = books.find(b => b.id == mostReadBookId) || { title: 'N/A' };
    const topRatedBook = [...books].filter(b => b.ratingCount > 0).sort((a, b) => (b.ratingSum/b.ratingCount) - (a.ratingSum/a.ratingCount))[0] || { title: 'N/A', ratingSum: 0, ratingCount: 1 };
    const topRating = (topRatedBook.ratingSum / topRatedBook.ratingCount).toFixed(1);
    document.getElementById('rankings-content').innerHTML =
      `<div><p class="font-semibold">🏆 Leitor do Mês</p><p class="text-sm text-gray-600">${topUser.name} (${topUser.points} pts)</p></div>
       <div><p class="font-semibold">📖 Livro Mais Popular</p><p class="text-sm text-gray-600">${mostReadBook.title}</p></div>
       <div><p class="font-semibold">⭐ Livro Melhor Avaliado</p><p class="text-sm text-gray-600">${topRatedBook.title} (${topRating})</p></div>`;
  };

  const renderBlacklist = () => {
    const list = rentals
      .filter(r => !r.returnDate && dayjs().diff(dayjs(r.dueDate), 'day') > 90)
      .map(r => users.find(u => u.id === r.userId))
      .filter((v, i, a) => v && a.findIndex(u => u.id === v.id) === i);
    if (list.length === 0) { document.getElementById('blacklist-content').innerHTML = `<p class="text-sm text-gray-500">Nenhum usuário na lista negra.</p>`; return; }
    document.getElementById('blacklist-content').innerHTML = list.map(user => {
      const rent = rentals.find(r => r.userId === user.id && !r.returnDate && dayjs().diff(dayjs(r.dueDate), 'day') > 90);
      const overdueDays = dayjs().diff(dayjs(rent.dueDate), 'day');
      return `<div class="text-sm"><p class="font-semibold">${user.name}</p><p class="text-red-500">Atraso de ${overdueDays} dias.</p></div>`;
    }).join('');
  };

  const renderMyBooks = () => {
    if (!currentUser) return;
    const myActive = rentals.filter(r => r.userId === currentUser.id && !r.returnDate);
    if (myActive.length === 0) { document.getElementById('my-books-content').innerHTML = `<p class="text-sm text-gray-500">Você não possui livros alugados.</p>`; return; }
    document.getElementById('my-books-content').innerHTML = myActive.map(r => {
      const b = books.find(bk => bk.id === r.bookId); const s = getUserRentalStatus(r);
      return `<div class="text-sm cursor-pointer hover:bg-white p-2 rounded-lg transition-colors" data-book-id="${b.id}">
        <p class="font-semibold truncate">${b.title}</p>
        <p class="${s.class}">${s.text}</p>
      </div>`;
    }).join('');
  };

  const renderRewards = () => {
    const div = document.getElementById('rewards-store-content');
    if (!currentUser) return;
    div.innerHTML = rewardsList.map(reward => {
      const hasReward = currentUser.rewards && currentUser.rewards.includes(reward.id);
      const can = currentUser.points >= reward.cost;
      let btn = hasReward
        ? `<button data-action="use-reward" data-reward-id="${reward.id}" class="mt-2 w-full text-sm bg-green-500 text-white py-1 px-2 rounded-md hover:bg-green-600 transition-all transform active:scale-95">Usar</button>`
        : `<button ${can ? '' : 'disabled'} data-action="redeem-reward" data-reward-id="${reward.id}" class="mt-2 w-full text-sm ${can ? 'bg-teal-500 hover:bg-teal-600' : 'bg-gray-400 cursor-not-allowed'} text-white py-1 px-2 rounded-md transition-all transform active:scale-95">Resgatar</button>`;
      return `<div class="p-3 bg-gray-50/80 rounded-lg"><p class="font-semibold">${reward.title}</p><p class="text-sm text-teal-700">${reward.cost} pontos</p>${btn}</div>`;
    }).join('');
  };

  // =========================
  // MODAL DO LIVRO (com discussões)
  // =========================
  const openBookModal = (bookId) => {
    const book = books.find(b => b.id === bookId);
    const status = getBookStatus(book);
    const avgRating = book.ratingCount > 0 ? (book.ratingSum / book.ratingCount).toFixed(1) : 'N/A';
    const userHasRented = rentals.some(r => r.userId === currentUser.id && r.bookId === book.id && !r.returnDate);
    const availability = book.copies - book.rented;

    const actionButton = userHasRented
      ? `<button data-action="return-book" data-book-id="${book.id}" class="bg-green-500 text-white w-full py-2 rounded-lg hover:bg-green-600 transition-all duration-200 transform active:scale-95">Devolver Livro</button>`
      : availability > 0
        ? `<div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button data-action="rent-book" data-book-id="${book.id}" data-tier="Básico"  data-days="15" class="bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-600 transition-all duration-200 transform active:scale-95 text-sm">Alugar Básico (15d)</button>
            <button data-action="rent-book" data-book-id="${book.id}" data-tier="Avançado" data-days="30" class="bg-cyan-500 text-white py-2 rounded-lg hover:bg-cyan-600 transition-all duration-200 transform active:scale-95 text-sm">Avançado (30d)</button>
            <button data-action="rent-book" data-book-id="${book.id}" data-tier="Expert"   data-days="60" class="bg-sky-500  text-white py-2 rounded-lg hover:bg-sky-600  transition-all duration-200 transform active:scale-95 text-sm">Expert (60d)</button>
          </div>`
        : `<button class="bg-gray-400 text-white w-full py-2 rounded-lg cursor-not-allowed">Indisponível</button>`;

    // Discussões do livro
    const bookPosts = posts.filter(p => p.bookId === book.id).sort((a,b)=> dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
    const discussion = bookPosts.length
      ? bookPosts.map(p => renderPostHtml(p)).join('')
      : `<p class="text-sm text-gray-500">Ainda não há discussões sobre este livro.</p>`;

    bookModalContent.innerHTML = `
      <button data-action="close-modal" data-target="book-modal" class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-transform duration-200 hover:rotate-90">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <img src="${book.cover}" alt="${book.title}" class="rounded-lg shadow-lg w-full md:w-auto">
        <div class="md:col-span-2">
          <h2 class="text-2xl sm:text-3xl font-bold">${book.title}</h2>
          <p class="text-lg text-gray-600 mt-1">${book.author}</p>
          <span class="inline-block bg-teal-100 text-teal-800 text-sm font-semibold mt-2 px-2.5 py-0.5 rounded-full">${book.category}</span>

          <div class="flex items-center mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-400 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292z"/></svg>
            <span class="text-xl font-bold">${avgRating}</span>
            <span class="text-gray-500 ml-2">(${book.ratingCount} avaliações)</span>
          </div>

          <div class="mt-4"><p><span class="font-semibold">Status:</span> <span class="${status.class}">${status.text}</span> (${availability} de ${book.copies} disp.)</p></div>

          <div class="mt-6">${actionButton}</div>

          <div class="mt-6 border-t pt-4">
            <h4 class="font-bold mb-2">Avaliar este livro:</h4>
            <div class="flex items-center space-x-2">
              ${[1,2,3,4,5].map(star => `<svg data-action="rate-book" data-book-id="${book.id}" data-rating="${star}" class="h-8 w-8 text-gray-300 hover:text-yellow-400 cursor-pointer transition-transform hover:scale-125" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`).join('')}
            </div>
          </div>

          <div class="mt-8 border-t pt-4">
            <h4 class="font-bold mb-2">Discussões sobre este livro</h4>
            <div class="mb-3">
              <textarea id="book-post-text" rows="2" class="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="Comece uma discussão sobre este livro..."></textarea>
              <div class="text-right mt-2">
                <button class="btn-primary" data-action="publish-book-post" data-book-id="${book.id}">Publicar</button>
              </div>
            </div>
            <div id="book-discussions">${discussion}</div>
          </div>
        </div>
      </div>`;
    bookModal.style.display = 'flex';
  };

  const closeModal = (id) => { const m = document.getElementById(id); m.style.display = 'none'; };

  // =========================
  // AÇÕES: LIVROS & AVALIAÇÕES
  // =========================
  const rentBook = (bookId, tier, days) => {
    const book = books.find(b => b.id === bookId); book.rented++;
    rentals.push({ id: rentals.length ? Math.max(...rentals.map(r => r.id)) + 1 : 1, bookId, userId: currentUser.id, rentalDate: dayjs().format('YYYY-MM-DD'), dueDate: dayjs().add(days, 'day').format('YYYY-MM-DD'), returnDate: null, tier });
    closeModal('book-modal'); updateAll();
  };

  const returnBook = (bookId) => {
    const rental = rentals.find(r => r.userId === currentUser.id && r.bookId === bookId && !r.returnDate); if (!rental) return;
    const book = books.find(b => b.id === bookId);
    rental.returnDate = dayjs().format('YYYY-MM-DD'); book.rented--;
    // Pontos por devolver no prazo
    if (dayjs(rental.returnDate).isBefore(dayjs(rental.dueDate).add(1, 'day'))) {
      currentUser.points += 25; users.find(u => u.id === currentUser.id).points = currentUser.points;
    }
    closeModal('book-modal'); updateAll();
  };

  const rateBook = (bookId, rating) => {
    const book = books.find(b => b.id === bookId); book.ratingSum += rating; book.ratingCount++;
    // Pontos por avaliar (previsto no projeto)
    currentUser.points += 10; users.find(u => u.id === currentUser.id).points = currentUser.points;
    closeModal('book-modal'); updateAll();
  };

  // =========================
  // REDE SOCIAL
  // =========================
  const nextPostId = () => posts.length ? Math.max(...posts.map(p => p.id)) + 1 : 1;

  const postUserName = (uId) => (users.find(u => u.id === uId)?.name || 'Usuário');

  // HTML do post (usado no feed e no modal do livro)
  const renderPostHtml = (p) => {
    const youLiked = p.likes.includes(currentUser?.id);
    const youSaved  = p.bookmarks.includes(currentUser?.id);
    const bookRef = p.bookId ? books.find(b => b.id === p.bookId) : null;
    const since = dayjs(p.createdAt).fromNow();

    return `
      <article class="feed-card" data-post-id="${p.id}">
        <div class="feed-header">
          <div class="feed-avatar">${postUserName(p.userId).charAt(0).toUpperCase()}</div>
          <div>
            <div class="feed-name">${postUserName(p.userId)}</div>
            <div class="feed-time">${since}</div>
          </div>
        </div>
        <div class="feed-content">${escapeHtml(p.content)}</div>
        ${bookRef ? `
          <div class="post-bookref mt-2">
            <img src="${bookRef.cover}" alt="${bookRef.title}">
            <div>
              <div class="font-semibold">${bookRef.title}</div>
              <div class="text-sm text-gray-600">${bookRef.author}</div>
              <button class="mt-2 text-teal-700 hover:underline" data-action="open-book" data-book-id="${bookRef.id}">Ver livro</button>
            </div>
          </div>
        ` : ''}

        <div class="reaction-bar">
          <button class="reaction-btn ${youLiked ? 'active':''}" data-action="like"><svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.343l-6.828-6.829a4 4 0 010-5.656z"/></svg><span class="like-count">${p.likes.length}</span></button>
          <button class="reaction-btn" data-action="comment"><svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M18 10c0 3.866-3.582 7-8 7a8.94 8.94 0 01-3.95-.917L2 17l.999-3.002A7.003 7.003 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7z"/></svg><span>${p.comments.length}</span></button>
          <button class="reaction-btn" data-action="repost"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h8a4 4 0 014 4v1h-2v-1a2 2 0 00-2-2H7l3 3-1.4 1.4L3.2 8l5.4-5.4L10 4 7 7zm10 10H9a4 4 0 01-4-4v-1h2v1a2 2 0 002 2h8l-3-3 1.4-1.4 5.4 5.4-5.4 5.4L14 20l3-3z"/></svg><span class="repost-count">${p.reposts}</span></button>
          <button class="reaction-btn ${youSaved ? 'active':''}" data-action="save"><svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v12l7-3 7 3V5a2 2 0 00-2-2H5z"/></svg></button>
        </div>

        <div class="comment-box hidden">
          <div class="c-avatar">U</div>
          <input class="comment-input" type="text" placeholder="Escreva um comentário e pressione Enter"/>
        </div>

        <div class="mt-2">
          ${p.comments.map(c => `
            <div class="comment">
              <div class="c-avatar">${postUserName(c.userId).charAt(0).toUpperCase()}</div>
              <div class="c-bubble">
                <div class="text-sm font-semibold">${postUserName(c.userId)} <span class="text-gray-500 font-normal">· ${dayjs(c.createdAt).fromNow()}</span></div>
                <div class="text-sm">${escapeHtml(c.content)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </article>
    `;
  };

  const renderFeed = () => {
    postBookSel.innerHTML = `<option value="">Vincular livro (opcional)</option>` + books.map(b => `<option value="${b.id}">${b.title}</option>`).join('');
    const ordered = [...posts].sort((a,b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
    feedList.innerHTML = ordered.map(p => renderPostHtml(p)).join('');
  };

  const createPost = (content, bookId) => {
    if (!currentUser) return;
    const p = { id: nextPostId(), userId: currentUser.id, content: content.trim(), bookId: bookId || null,
      createdAt: dayjs().toISOString(), likes: [], bookmarks: [], reposts: 0, comments: [] };
    if (!p.content) return;
    posts.unshift(p);
    // Pontos por publicar
    currentUser.points += 5; users.find(u => u.id === currentUser.id).points = currentUser.points;
    saveDataToStorage(); updateAll();
  };

  const toggleLike = (postId) => {
    const p = posts.find(x => x.id === postId); if (!p) return;
    const i = p.likes.indexOf(currentUser.id);
    if (i >= 0) p.likes.splice(i,1); else p.likes.push(currentUser.id);
    saveDataToStorage(); renderFeed(); renderUserProfile();
  };

  const toggleSave = (postId) => {
    const p = posts.find(x => x.id === postId); if (!p) return;
    const i = p.bookmarks.indexOf(currentUser.id);
    if (i >= 0) p.bookmarks.splice(i,1); else p.bookmarks.push(currentUser.id);
    saveDataToStorage(); renderFeed();
  };

  const doRepost = (postId) => {
    const p = posts.find(x => x.id === postId); if (!p) return;
    p.reposts += 1;
    // Pequeno incentivo
    currentUser.points += 1; users.find(u => u.id === currentUser.id).points = currentUser.points;
    saveDataToStorage(); renderFeed(); renderUserProfile();
  };

  const addComment = (postId, text) => {
    const p = posts.find(x => x.id === postId); if (!p) return;
    const comment = { id: (p.comments.length ? Math.max(...p.comments.map(c=>c.id)) + 1 : 1), userId: currentUser.id, content: text.trim(), createdAt: dayjs().toISOString() };
    if (!comment.content) return;
    p.comments.push(comment);
    // Pontos por comentar
    currentUser.points += 2; users.find(u => u.id === currentUser.id).points = currentUser.points;
    saveDataToStorage(); renderFeed(); renderUserProfile();
  };

  const escapeHtml = (s) => s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  // =========================
  // ADMIN (Tabelas)
  // =========================
  const renderDbTable = (tableId, headers, items, rowMap) => {
    const tbl = document.getElementById(tableId);
    tbl.innerHTML = `<thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${items.map(rowMap).join('')}</tbody>`;
  };

  // =========================
  // EVENTOS GERAIS
  // =========================
  const setupEventListeners = () => {
    // Alternar Tabs
    tabCatalog.addEventListener('click', () => { tabCatalog.classList.add('tab-active'); tabSocial.classList.remove('tab-active'); viewCatalog.classList.remove('hidden'); viewSocial.classList.add('hidden'); });
    tabSocial .addEventListener('click', () => { tabSocial.classList.add('tab-active'); tabCatalog.classList.remove('tab-active'); viewSocial.classList.remove('hidden'); viewCatalog.classList.add('hidden'); });

    // Busca/filtragem
    searchInput?.addEventListener('input', renderBooks);
    categoryFilter?.addEventListener('change', renderBooks);

    // Abre modal de livro ao clicar no card
    document.addEventListener('click', (e) => {
      const card = e.target.closest('[data-book-id]');
      if (card && (card.closest('#book-list') || card.closest('#my-books-content'))) {
        const id = parseInt(card.getAttribute('data-book-id'));
        openBookModal(id);
      }
    });

    // Ações dentro dos modais
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const act = btn.getAttribute('data-action');

      if (act === 'close-modal') { closeModal(btn.getAttribute('data-target')); }
      if (act === 'rent-book') { rentBook(parseInt(btn.getAttribute('data-book-id')), btn.getAttribute('data-tier'), parseInt(btn.getAttribute('data-days'))); }
      if (act === 'return-book') { returnBook(parseInt(btn.getAttribute('data-book-id'))); }
      if (act === 'rate-book') { rateBook(parseInt(btn.getAttribute('data-book-id')), parseInt(btn.getAttribute('data-rating'))); }
      if (act === 'redeem-reward') {
        const id = parseInt(btn.getAttribute('data-reward-id'));
        const rw = rewardsList.find(r => r.id === id);
        if (currentUser.points >= rw.cost) {
          currentUser.points -= rw.cost; currentUser.rewards = currentUser.rewards || []; currentUser.rewards.push(rw.id);
          saveDataToStorage(); updateAll();
        }
      }
      if (act === 'use-reward') {
        alert('Recompensa aplicada! (simulação)');
      }
      if (act === 'publish-book-post') {
        const bookId = parseInt(btn.getAttribute('data-book-id'));
        const txt = document.getElementById('book-post-text').value;
        createPost(txt, bookId);
        if (document.getElementById('book-discussions')) {
          document.getElementById('book-discussions').innerHTML = posts.filter(p => p.bookId === bookId).sort((a,b)=> dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()).map(renderPostHtml).join('');
          document.getElementById('book-post-text').value = '';
        }
      }
      if (act === 'open-book') {
        const id = parseInt(btn.getAttribute('data-book-id'));
        openBookModal(id);
      }
    });

    // Publicar post na aba "Rede Social"
    publishPost.addEventListener('click', () => {
      createPost(postText.value, postBookSel.value ? parseInt(postBookSel.value) : null);
      postText.value = ''; postBookSel.value = '';
    });

    // Reações/Comentários no Feed (delegação)
    feedList.addEventListener('click', (e) => {
      const postEl = e.target.closest('[data-post-id]'); if (!postEl) return;
      const postId = parseInt(postEl.getAttribute('data-post-id'));
      const btn = e.target.closest('.reaction-btn');
      if (!btn) return;
      const act = btn.getAttribute('data-action');

      if (act === 'like') { toggleLike(postId); }
      if (act === 'save') { toggleSave(postId); }
      if (act === 'repost') { doRepost(postId); }
      if (act === 'comment') {
        const box = postEl.querySelector('.comment-box');
        box.classList.toggle('hidden');
        const input = box.querySelector('.comment-input');
        input.focus();
        input.onkeydown = (ev) => {
          if (ev.key === 'Enter') { addComment(postId, input.value); input.value=''; box.classList.add('hidden'); }
        };
      }
    });

    // FAB Admin
    adminFab.addEventListener('click', () => { adminModal.style.display = 'flex'; });
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tab]');
      if (btn && btn.parentElement?.id === 'db-tabs-container') {
        const tab = btn.getAttribute('data-tab');
        document.querySelectorAll('.db-tab').forEach(t => t.classList.remove('text-teal-600','border-b-2','border-teal-600','font-semibold'));
        btn.classList.add('text-teal-600','border-b-2','border-teal-600','font-semibold');
        document.querySelectorAll('.db-tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(`${tab}-content`).classList.remove('hidden');
      }
    });

    // Fecha modais clicando fora do conteúdo
    [bookModal, adminModal].forEach(m => {
      m.addEventListener('click', (e) => { if (e.target === m) m.style.display = 'none'; });
    });
  };

  // =========================
  // CICLO DE RENDER
  // =========================
  const updateAll = () => {
    renderBooks();
    renderUserProfile();
    renderRankings();
    renderBlacklist();
    renderMyBooks();
    renderRewards();
    renderFeed();

    // DB admin
    renderDbTable('db-books-table', ['ID','Título','Autor','Categoria','Cópias','Alugados','Rating Sum','Rating Count'], books, b => `<tr><td>${b.id}</td><td>${b.title}</td><td>${b.author}</td><td>${b.category}</td><td>${b.copies}</td><td>${b.rented}</td><td>${b.ratingSum}</td><td>${b.ratingCount}</td></tr>`);
    renderDbTable('db-users-table', ['ID','Nome','Email','Pontos','Admin'], users, u => `<tr><td>${u.id}</td><td>${u.name}</td><td>${u.email}</td><td>${u.points}</td><td>${u.isAdmin}</td></tr>`);
    renderDbTable('db-rentals-table', ['ID','Book ID','User ID','Data Aluguel','Data Devolução','Data Retorno','Tier'], rentals, r => `<tr><td>${r.id}</td><td>${r.bookId}</td><td>${r.userId}</td><td>${r.rentalDate}</td><td>${r.dueDate}</td><td>${r.returnDate || 'N/A'}</td><td>${r.tier}</td></tr>`);
    renderDbTable('db-posts-table', ['ID','User','Livro','Likes','Comments','Reposts','Criado'], posts, p => `<tr><td>${p.id}</td><td>${postUserName(p.userId)}</td><td>${p.bookId ? (books.find(b=>b.id===p.bookId)?.title || '-') : '-'}</td><td>${p.likes.length}</td><td>${p.comments.length}</td><td>${p.reposts}</td><td>${dayjs(p.createdAt).format('DD/MM HH:mm')}</td></tr>`);

    saveDataToStorage();
  };

  const initializeApp = () => {
    if (currentUser && currentUser.isAdmin) adminFab.style.display = 'flex';
    populateCategories();
    updateAll();
  };

  // =========================
  // ENTRY POINT
  // =========================
  setupEventListeners();
  loadDataFromStorage();

  const sessionUser = sessionStorage.getItem('library_currentUser');
  if (sessionUser) {
    currentUser = JSON.parse(sessionUser);
    authContainer.style.display = 'none';
    appContainer.style.display  = 'block';
    appScene = initApp3D();
    initializeApp();
  } else {
    authContainer.style.display = 'flex';
    appContainer.style.display  = 'none';
    document.getElementById('login-bg-canvas').style.display = 'block';
    loginScene = initLogin3D();
  }
});
