// Ranking App - Código unificado (Index + Admin)
(function() {
    'use strict';

    // Detectar si estamos en la página de admin
    const isAdminPage = window.location.pathname.includes('admin.html');

    // ========== CONFIGURACIÓN - CAMBIAR AQUÍ ==========
    // 
    // Para usar servidor LOCAL (desarrollo):
    //   - Cambia USE_LOCAL_SERVER a true
    //   - Asegúrate de tener el servidor corriendo: python3 server.py
    //
    // Para usar servidor EXTERNO (Render - producción):
    //   - Cambia USE_LOCAL_SERVER a false
    //   - El código usará automáticamente el servidor de Render
    //
    const USE_LOCAL_SERVER = false; // 👈 CAMBIA ESTO: true = local, false = Render
    
    // URLs de los servidores
    const LOCAL_SERVER_URL = 'http://localhost:8000';
    const RENDER_API_URL = 'https://ranking-81qv.onrender.com';
    
    // Detectar si estamos en producción (no localhost)
    const isProduction = window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1' &&
                        !window.location.hostname.startsWith('192.168.');
    
    // Configuración compartida
    const CONFIG = {
        ROOT_EMAIL: 'luisangellr13@gmail.com',
        ROOT_PASSWORD: 'Luis1309*',
        DATA_URL: 'assets/data/ranking.json',
        // Si USE_LOCAL_SERVER es true, usa local. Si es false, usa Render en producción o local en desarrollo
        API_BASE: USE_LOCAL_SERVER ? LOCAL_SERVER_URL : (isProduction ? RENDER_API_URL : LOCAL_SERVER_URL),
        USE_API: true // Siempre usar API
    };
    
    console.log('🔧 Configuración del servidor:', {
        USE_LOCAL_SERVER: USE_LOCAL_SERVER,
        isProduction: isProduction,
        API_BASE: CONFIG.API_BASE
    });

    // ========== FUNCIONES COMPARTIDAS ==========
    
    function validateRankingData(data) {
        if (!Array.isArray(data)) return [];
        
        return data
            .filter(item => item && typeof item === 'object')
            .map(item => ({
                nombre: String(item.nombre || 'Sin nombre').trim(),
                area: String(item.area || 'Sin área').trim(),
                cargo: String(item.cargo || '').trim(),
                puntos: Number(item.puntos) || 0
            }));
    }

    // ========== CÓDIGO PARA INDEX.HTML ==========
    if (!isAdminPage) {
        // Datos del ranking
        let rankingData = [];
        let currentPage = 1;
        const ITEMS_PER_PAGE = 10;

        // Emojis de trofeos según posición
        const TROPHIES = {
            1: '🥇',
            2: '🥈',
            3: '🥉',
            4: '🏆',
            5: '🏆'
        };

        // ========== Utilidades ==========
        
        function getTrophyEmoji(position) {
            return TROPHIES[position] || '';
        }

        function normalizeForSearch(text) {
            if (!text) return '';
            try {
                return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            } catch (e) {
                return String(text).toLowerCase();
            }
        }

        function findMatchesPositions(original, filterNorm) {
            const orig = original || '';
            if (!filterNorm) return [];
            
            const norm = normalizeForSearch(orig);
            const positions = [];
            let start = 0;
            
            while (true) {
                const idx = norm.indexOf(filterNorm, start);
                if (idx === -1) break;
                
                let normPos = 0;
                let origStart = null;
                let origEnd = null;
                
                for (let i = 0; i < orig.length; i++) {
                    const ch = orig[i];
                    const chNorm = ch.normalize ? ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : ch;
                    if (normPos === idx) origStart = i;
                    normPos += chNorm.length;
                    if (normPos === idx + filterNorm.length) {
                        origEnd = i + 1;
                        break;
                    }
                }
                
                if (origStart == null) break;
                positions.push([origStart, origEnd]);
                start = idx + filterNorm.length;
            }
            
            return positions;
        }

        function highlightMatch(text, filterNorm) {
            if (!filterNorm) return text || '';
            
            const orig = text || '';
            const positions = findMatchesPositions(orig, filterNorm);
            if (!positions.length) return orig;
            
            let result = orig;
            for (let i = positions.length - 1; i >= 0; i--) {
                const [s, e] = positions[i];
                result = result.slice(0, s) + 
                        '<span class="highlight">' + result.slice(s, e) + '</span>' + 
                        result.slice(e);
            }
            return result;
        }

        function getPositionClass(position) {
            if (position === 1) return 'top-1';
            if (position === 2) return 'top-2';
            if (position === 3) return 'top-3';
            return '';
        }

        // ========== Renderizado ==========

        function renderRanking() {
            renderPeople();
            renderAreas();
        }

        function renderPeople() {
            const container = document.getElementById('ranking-container');
            if (!container) return;

            const searchInput = document.getElementById('search-input');
            const filter = searchInput ? normalizeForSearch(searchInput.value.trim()) : '';
            
            // Si hay búsqueda activa, resetear a página 1
            if (filter) {
                currentPage = 1;
            }
            
            container.innerHTML = '';

            // Validar y ordenar datos
            const validData = rankingData.filter(p => p && (p.nombre || p.area));
            const sortedData = [...validData].sort((a, b) => {
                const puntosA = Number(a.puntos) || 0;
                const puntosB = Number(b.puntos) || 0;
                return puntosB - puntosA;
            });

            // Filtrar por búsqueda
            const visiblePeople = sortedData.filter(person => {
                if (!filter) return true;
                const searchText = [
                    person.nombre || '',
                    person.area || '',
                    person.cargo || ''
                ].join(' ');
                return normalizeForSearch(searchText).includes(filter);
            });

            // Calcular paginación
            const totalPages = Math.ceil(visiblePeople.length / ITEMS_PER_PAGE);
            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const paginatedPeople = visiblePeople.slice(startIndex, endIndex);

            // Actualizar contador
            updateSearchCount('search-count', visiblePeople.length);

            // Renderizar filas (solo las de la página actual)
            paginatedPeople.forEach((person, localIndex) => {
                // Calcular posición global (no local)
                const globalIndex = startIndex + localIndex;
                const position = globalIndex + 1;
                const positionClass = getPositionClass(position);

                const row = document.createElement('div');
                row.className = 'ranking-row';
                row.setAttribute('role', 'listitem');
                if (filter) row.classList.add('matched');

                const trophy = position <= 5 ? getTrophyEmoji(position) : '';
                const positionHTML = position <= 5 
                    ? `<span class="trophy">${trophy}</span><span class="trophy-number">${position}</span>`
                    : `<span class="trophy-number">${position}</span>`;

                const nameHTML = highlightMatch(person.nombre || 'Sin nombre', filter);
                const areaHTML = highlightMatch(person.area || 'Sin área', filter);
                const cargoHTML = highlightMatch(person.cargo || '', filter);
                const puntos = Number(person.puntos) || 0;

                row.innerHTML = `
                    <div class="position ${positionClass}">${positionHTML}</div>
                    <div class="card-left">
                        <div class="name">${nameHTML}</div>
                        <div><span class="area">${areaHTML}</span> <span class="cargo">• ${cargoHTML}</span></div>
                    </div>
                    <div class="card-right">
                    <div class="puntos">
                        <div class="value">${puntos}</div>
                        <div class="label">Puntos</div>
                    </div>
                    </div>
                `;

                container.appendChild(row);
            });

            // Mostrar mensaje si no hay resultados
            if (visiblePeople.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = filter ? 'No se encontraron resultados' : 'No hay datos disponibles';
                container.appendChild(noResults);
            }

            // Actualizar controles de paginación
            updatePaginationControls(visiblePeople.length, totalPages);
        }

        function renderAreas() {
            const container = document.getElementById('ranking-compact');
            if (!container) return;

            const searchInput = document.getElementById('search-input-area');
            const filter = searchInput ? normalizeForSearch(searchInput.value.trim()) : '';
            
            container.innerHTML = '';

            // Agrupar por área
            const areaMap = {};
            rankingData.forEach(person => {
                if (!person || !person.area) return;
                const area = person.area.trim() || 'Sin área';
                const puntos = Number(person.puntos) || 0;
                areaMap[area] = (areaMap[area] || 0) + puntos;
            });

            // Convertir a array y ordenar
            const areaList = Object.entries(areaMap)
                .map(([area, puntos]) => ({ area, puntos }))
                .sort((a, b) => b.puntos - a.puntos);

            // Filtrar por búsqueda
            const visibleAreas = areaList.filter(item => {
                if (!filter) return true;
                return normalizeForSearch(item.area).includes(filter);
            });

            // Actualizar contador
            updateSearchCount('search-count-area', visibleAreas.length);

            // Renderizar filas
            visibleAreas.forEach((item, index) => {
                const position = index + 1;
                const positionClass = getPositionClass(position);
                
                const row = document.createElement('div');
                row.className = 'compact-row';
                row.setAttribute('role', 'listitem');
                if (filter) row.classList.add('matched');

                const areaHTML = highlightMatch(item.area, filter);

                row.innerHTML = `
                    <div class="compact-pos ${positionClass}">${position}</div>
                    <div class="compact-info">
                        <div class="name">${areaHTML}</div>
                    </div>
                    <div class="compact-puntos">${item.puntos}</div>
                `;

                container.appendChild(row);
            });

            // Mostrar mensaje si no hay resultados
            if (visibleAreas.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = filter ? 'No se encontraron áreas' : 'No hay datos disponibles';
                container.appendChild(noResults);
            }
        }

        function updateSearchCount(elementId, count) {
            const element = document.getElementById(elementId);
            if (element) {
                const text = count + (count === 1 ? ' resultado' : ' resultados');
                element.textContent = text;
            }
        }

        function updatePaginationControls(totalItems, totalPages) {
            const paginationControls = document.getElementById('pagination-controls');
            const prevBtn = document.getElementById('prev-page');
            const nextBtn = document.getElementById('next-page');
            const pageInfo = document.getElementById('page-info');

            if (!paginationControls || !prevBtn || !nextBtn || !pageInfo) return;

            // Mostrar controles solo si hay más de 10 elementos
            if (totalItems > ITEMS_PER_PAGE) {
                paginationControls.style.display = 'flex';
                
                // Actualizar información de página
                pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
                
                // Habilitar/deshabilitar botones
                prevBtn.disabled = currentPage === 1;
                nextBtn.disabled = currentPage === totalPages;
                
                // Agregar clases para estilos
                if (currentPage === 1) {
                    prevBtn.classList.add('disabled');
                } else {
                    prevBtn.classList.remove('disabled');
                }
                
                if (currentPage === totalPages) {
                    nextBtn.classList.add('disabled');
                } else {
                    nextBtn.classList.remove('disabled');
                }
            } else {
                paginationControls.style.display = 'none';
            }
        }

        function goToPage(page) {
            const searchInput = document.getElementById('search-input');
            const filter = searchInput ? normalizeForSearch(searchInput.value.trim()) : '';
            
            // Validar que la página sea válida
            const validData = rankingData.filter(p => p && (p.nombre || p.area));
            const sortedData = [...validData].sort((a, b) => {
                const puntosA = Number(a.puntos) || 0;
                const puntosB = Number(b.puntos) || 0;
                return puntosB - puntosA;
            });
            
            const visiblePeople = sortedData.filter(person => {
                if (!filter) return true;
                const searchText = [
                    person.nombre || '',
                    person.area || '',
                    person.cargo || ''
                ].join(' ');
                return normalizeForSearch(searchText).includes(filter);
            });
            
            const totalPages = Math.ceil(visiblePeople.length / ITEMS_PER_PAGE);
            
            if (page >= 1 && page <= totalPages) {
                currentPage = page;
                renderPeople();
                
                // Scroll suave al inicio del contenedor
                const container = document.getElementById('ranking-container');
                if (container) {
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }

        // ========== Búsqueda ==========

        function setupSearchListeners() {
            const searchInput = document.getElementById('search-input');
            const searchClear = document.getElementById('search-clear');
            const areaInput = document.getElementById('search-input-area');
            const areaClear = document.getElementById('search-clear-area');

            if (searchInput) {
                searchInput.addEventListener('input', debounce(() => {
                    currentPage = 1; // Resetear a página 1 al buscar
                    renderPeople();
                }, 300));
                searchInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        setTimeout(() => {
                            const first = document.querySelector('.ranking-row.matched');
                            if (first) {
                                first.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                first.focus();
                            }
                        }, 50);
                    }
                });
            }

            if (searchClear) {
                searchClear.addEventListener('click', () => {
                    if (searchInput) {
                        searchInput.value = '';
                        currentPage = 1; // Resetear a página 1
                        renderPeople();
                        searchInput.focus();
                    }
                });
            }

            if (areaInput) {
                areaInput.addEventListener('input', debounce(renderAreas, 300));
                areaInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        setTimeout(() => {
                            const first = document.querySelector('.compact-row.matched');
                            if (first) {
                                first.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                first.focus();
                            }
                        }, 50);
                    }
                });
            }

            if (areaClear) {
                areaClear.addEventListener('click', () => {
                    if (areaInput) {
                        areaInput.value = '';
                        renderAreas();
                        areaInput.focus();
                    }
                });
            }

            // Event listeners para paginación
            const prevBtn = document.getElementById('prev-page');
            const nextBtn = document.getElementById('next-page');

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (currentPage > 1) {
                        goToPage(currentPage - 1);
                    }
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    const searchInput = document.getElementById('search-input');
                    const filter = searchInput ? normalizeForSearch(searchInput.value.trim()) : '';
                    
                    const validData = rankingData.filter(p => p && (p.nombre || p.area));
                    const sortedData = [...validData].sort((a, b) => {
                        const puntosA = Number(a.puntos) || 0;
                        const puntosB = Number(b.puntos) || 0;
                        return puntosB - puntosA;
                    });
                    
                    const visiblePeople = sortedData.filter(person => {
                        if (!filter) return true;
                        const searchText = [
                            person.nombre || '',
                            person.area || '',
                            person.cargo || ''
                        ].join(' ');
                        return normalizeForSearch(searchText).includes(filter);
                    });
                    
                    const totalPages = Math.ceil(visiblePeople.length / ITEMS_PER_PAGE);
                    
                    if (currentPage < totalPages) {
                        goToPage(currentPage + 1);
                    }
                });
            }
        }

        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // ========== Admin Modal ==========

        function setupAdminModal() {
            console.log('🔧 Configurando modal admin...');
            
            const adminBtn = document.getElementById('admin-btn');
            const adminModal = document.getElementById('admin-modal');
            const adminClose = document.getElementById('admin-close');
            const loginForm = document.getElementById('login-form');

            console.log('Elementos encontrados:', { 
                adminBtn: !!adminBtn, 
                adminModal: !!adminModal, 
                adminClose: !!adminClose, 
                loginForm: !!loginForm 
            });

            if (adminBtn) {
                // Remover listeners anteriores si existen
                adminBtn.replaceWith(adminBtn.cloneNode(true));
                const newAdminBtn = document.getElementById('admin-btn');
                
                newAdminBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('✅ Botón admin clickeado');
                    openAdminModal();
                });
                console.log('✅ Listener agregado al botón admin');
                    } else {
                console.error('❌ No se encontró el botón admin-btn');
            }

            if (adminClose) {
                // Remover listeners anteriores si existen
                adminClose.replaceWith(adminClose.cloneNode(true));
                const newAdminClose = document.getElementById('admin-close');
                
                newAdminClose.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('✅ Botón cerrar clickeado');
                    closeAdminModal();
                });
                console.log('✅ Listener agregado al botón cerrar');
            } else {
                console.error('❌ No se encontró el botón admin-close');
            }

            // También cerrar al hacer clic en el fondo del modal
            if (adminModal) {
                adminModal.addEventListener('click', function(e) {
                    if (e.target === adminModal) {
                        console.log('✅ Click en fondo del modal, cerrando...');
                        closeAdminModal();
                    }
                });
            }

            if (loginForm) {
                loginForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    handleLogin(e);
                });
                console.log('✅ Listener agregado al formulario de login');
            } else {
                console.error('❌ No se encontró el formulario login-form');
            }

            // Cerrar con ESC
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && adminModal && adminModal.classList.contains('active')) {
                    console.log('✅ Tecla ESC presionada, cerrando modal...');
                    closeAdminModal();
                }
            });
            
            console.log('✅ Modal admin configurado');
        }

        function openAdminModal() {
            const modal = document.getElementById('admin-modal');
            console.log('Abriendo modal:', modal);
            if (modal) {
                modal.classList.add('active');
                modal.setAttribute('aria-hidden', 'false');
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                
                // Limpiar formulario y errores
                const form = document.getElementById('login-form');
                const errorDiv = document.getElementById('login-error');
                if (form) form.reset();
                if (errorDiv) {
                    errorDiv.style.display = 'none';
                    errorDiv.textContent = '';
                }
                
                // Focus en el input de email
                const emailInput = document.getElementById('admin-email');
                if (emailInput) {
                    setTimeout(() => emailInput.focus(), 100);
                }
            } else {
                console.error('Modal no encontrado');
            }
        }

        function closeAdminModal() {
            const modal = document.getElementById('admin-modal');
            const errorDiv = document.getElementById('login-error');
            const form = document.getElementById('login-form');
            
            console.log('Cerrando modal admin');
            
            if (modal) {
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
            
            if (form) {
                form.reset();
            }
            
            if (errorDiv) {
                errorDiv.style.display = 'none';
                errorDiv.textContent = '';
            }
        }

        function handleLogin(event) {
            event.preventDefault();
            
            const emailInput = document.getElementById('admin-email');
            const passwordInput = document.getElementById('admin-password');
            const errorDiv = document.getElementById('login-error');

            if (!emailInput || !passwordInput || !errorDiv) return;

            const userEmail = emailInput.value.trim().toLowerCase();
            const userPassword = passwordInput.value;

            // Validación básica
            if (!userEmail || !userPassword) {
                showLoginError('Por favor, completa todos los campos');
                return;
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userEmail)) {
                showLoginError('Por favor, ingresa un email válido');
                return;
            }

            // Cargar usuarios desde localStorage
            const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
            
            // Verificar credenciales root
            if (userEmail === CONFIG.ROOT_EMAIL && userPassword === CONFIG.ROOT_PASSWORD) {
                // Login como root
                sessionStorage.setItem('adminLoggedIn', 'true');
                sessionStorage.setItem('adminEmail', userEmail);
                sessionStorage.setItem('adminRole', 'root');
                sessionStorage.setItem('adminName', 'Administrador Root');
                
                closeAdminModal();
                window.location.href = 'admin.html';
                return;
            }

            // Verificar usuarios registrados
            const user = users.find(u => u.email.toLowerCase() === userEmail && u.password === userPassword);
            
            if (user) {
                // Login exitoso
                sessionStorage.setItem('adminLoggedIn', 'true');
                sessionStorage.setItem('adminEmail', user.email);
                sessionStorage.setItem('adminRole', user.role || 'user');
                sessionStorage.setItem('adminName', user.name || user.email);
                
                closeAdminModal();
                window.location.href = 'admin.html';
            } else {
                showLoginError('Correo o contraseña incorrectos');
            }
        }

        function showLoginError(message) {
            const errorDiv = document.getElementById('login-error');
            if (errorDiv) {
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';
                errorDiv.setAttribute('aria-live', 'assertive');
            }
        }

        // ========== Carga de datos ==========

        async function loadRankingData() {
            try {
                // PRIMERO: En producción, siempre cargar desde el servidor primero
                // En desarrollo local, puede usar localStorage primero para desarrollo rápido
                if (CONFIG.USE_API && CONFIG.API_BASE && isProduction) {
                    // En producción: priorizar servidor
                    try {
                        const response = await fetch(CONFIG.API_BASE + '/api/ranking');
                        if (response.ok) {
                            const data = await response.json();
                            if (data && Array.isArray(data.ranking) && data.ranking.length > 0) {
                                rankingData = validateRankingData(data.ranking);
                                console.log('✅ Datos cargados desde servidor (producción):', rankingData.length, 'colaboradores');
                                // Guardar en localStorage como caché
                                localStorage.setItem('rankingData', JSON.stringify(rankingData));
                                renderRanking();
                                return;
                            }
                        }
                    } catch (apiError) {
                        console.log('⚠️ Servidor no disponible, usando caché local');
                    }
                }
                
                // SEGUNDO: Si estamos en desarrollo o el servidor falló, intentar localStorage
                const stored = localStorage.getItem('rankingData');
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            rankingData = validateRankingData(parsed);
                            console.log('💾 Datos cargados desde localStorage (caché):', rankingData.length, 'colaboradores');
                            renderRanking();
                            
                            // En producción, intentar actualizar desde servidor en segundo plano
                            if (isProduction && CONFIG.USE_API && CONFIG.API_BASE) {
                                updateFromServerInBackground();
                            }
                            return;
                        }
                    } catch (e) {
                        console.error('Error parseando localStorage:', e);
                    }
                }
                
                // TERCERO: Si no hay datos en localStorage, intentar servidor (desarrollo)
                if (CONFIG.USE_API && CONFIG.API_BASE && !isProduction) {
                    try {
                        const response = await fetch(CONFIG.API_BASE + '/api/ranking');
                        if (response.ok) {
                            const data = await response.json();
                            if (data && Array.isArray(data.ranking)) {
                                rankingData = validateRankingData(data.ranking);
                                console.log('✅ Datos cargados desde servidor (desarrollo):', rankingData.length, 'colaboradores');
                                localStorage.setItem('rankingData', JSON.stringify(rankingData));
                                renderRanking();
                                return;
                            }
                        }
                    } catch (apiError) {
                        console.log('⚠️ Servidor no disponible, cargando archivo local');
                    }
                }
                
                // TERCERO: Si el servidor no responde, cargar archivo local
                const response = await fetch(CONFIG.DATA_URL + '?nocache=' + Date.now());
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Validar estructura
                if (data && Array.isArray(data.ranking)) {
                    rankingData = validateRankingData(data.ranking);
                } else if (Array.isArray(data)) {
                    rankingData = validateRankingData(data);
                } else {
                    throw new Error('Formato de datos inválido');
                }
                
                console.log('📁 Datos cargados desde archivo local:', rankingData.length, 'colaboradores');
                
                // Guardar en localStorage como respaldo
                if (rankingData.length > 0) {
                    localStorage.setItem('rankingData', JSON.stringify(rankingData));
                }
                
                renderRanking();
                
            } catch (error) {
                console.error('Error cargando datos:', error);
                
                // Último recurso: datos por defecto
                rankingData = getDefaultData();
                renderRanking();
            }
        }
        
        // Función para actualizar desde servidor en segundo plano
        async function updateFromServerInBackground() {
            if (CONFIG.USE_API && CONFIG.API_BASE) {
                try {
                    const response = await fetch(CONFIG.API_BASE + '/api/ranking');
                    if (response.ok) {
                        const data = await response.json();
                        if (data && Array.isArray(data.ranking)) {
                            const serverData = validateRankingData(data.ranking);
                            // Actualizar si los datos del servidor son diferentes (no solo si hay más)
                            const serverDataStr = JSON.stringify(serverData);
                            const currentDataStr = JSON.stringify(rankingData);
                            if (serverDataStr !== currentDataStr) {
                                console.log('🔄 Actualizando desde servidor (datos diferentes detectados)');
                                rankingData = serverData;
                                localStorage.setItem('rankingData', JSON.stringify(rankingData));
                                renderRanking();
                            }
                        }
                    }
                } catch (e) {
                    // Silencioso, solo en segundo plano
                    console.log('⚠️ No se pudo actualizar desde servidor en segundo plano:', e.message);
                }
            }
        }


        function getDefaultData() {
            return [
                { nombre: "María González", area: "Recursos Humanos", cargo: "Directora de Talento", puntos: 1250 },
                { nombre: "Carlos Rodríguez", area: "Tecnología", cargo: "CTO", puntos: 1180 },
                { nombre: "Ana Martínez", area: "Marketing", cargo: "Directora de Marketing Digital", puntos: 1120 }
            ];
        }

        // ========== Inicialización ==========

        function init() {
            console.log('Inicializando aplicación (index.html)...');
            
            // Configurar listeners primero
            setupSearchListeners();
            setupAdminModal();
            
            // Cargar datos
        loadRankingData();
            
            // Inicializar usuarios si no existen (solo root)
            if (!localStorage.getItem('adminUsers')) {
                localStorage.setItem('adminUsers', JSON.stringify([]));
            }
            
            console.log('Aplicación inicializada correctamente');
        }

        // Inicializar cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOM cargado, ejecutando init...');
                init();
            });
        } else {
            console.log('DOM ya está listo, ejecutando init inmediatamente...');
            // Pequeño delay para asegurar que todos los elementos estén disponibles
            setTimeout(init, 100);
        }
    }

    // ========== CÓDIGO PARA ADMIN.HTML ==========
    if (isAdminPage) {
        // Verificar autenticación - Redirigir inmediatamente si no hay sesión
        const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
        const adminEmail = sessionStorage.getItem('adminEmail');

        if (!isLoggedIn || !adminEmail) {
            // Redirigir inmediatamente sin mostrar contenido
            window.location.replace('index.html');
            return;
        }

        const adminRole = sessionStorage.getItem('adminRole') || 'user';

        // Mostrar email del usuario
        const userEmailEl = document.getElementById('admin-user-email');
        if (userEmailEl) {
            userEmailEl.textContent = adminEmail + (adminRole === 'root' ? ' (Root)' : '');
        }

        // Mostrar sección de usuarios solo si es root
        if (adminRole === 'root') {
            const usersSection = document.getElementById('users-section');
            if (usersSection) {
                usersSection.style.display = 'block';
            }
        }

        // Datos
        let rankingData = [];
        let editingPersonId = null;
        let editingUserId = null;

        // ========== Carga de datos ==========

        async function loadRankingData() {
            try {
                // PRIMERO: Intentar cargar desde API del servidor (siempre que esté disponible)
                if (CONFIG.USE_API && CONFIG.API_BASE) {
                    try {
                        const response = await fetch(CONFIG.API_BASE + '/api/ranking');
                        if (response.ok) {
                            const data = await response.json();
                            if (data && Array.isArray(data.ranking) && data.ranking.length > 0) {
                                rankingData = validateRankingData(data.ranking);
                                
                                console.log('✅ Datos cargados desde servidor:', rankingData.length, 'colaboradores');
                                
                                // Guardar en localStorage como respaldo
                                localStorage.setItem('rankingData', JSON.stringify(rankingData));
                                
                                renderPeopleTable();
                                renderAreasTable();
                                return;
                            }
                        }
                    } catch (apiError) {
                        console.log('⚠️ Servidor no disponible, intentando localStorage o archivo local');
                    }
                }
                
                // SEGUNDO: Si el servidor falló, intentar localStorage
                const stored = localStorage.getItem('rankingData');
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            rankingData = validateRankingData(parsed);
                            console.log('💾 Datos cargados desde localStorage (caché):', rankingData.length, 'colaboradores');
                            renderPeopleTable();
                            renderAreasTable();
                            return;
                        }
                    } catch (e) {
                        console.error('Error parseando localStorage:', e);
                    }
                }
                
                // TERCERO: Si no hay datos en localStorage, cargar desde archivo local
                console.log('📁 Cargando desde archivo local');
                
                // Intentar desde archivo JSON directamente
                try {
                    const localResponse = await fetch('assets/data/ranking.json?nocache=' + Date.now());
                    if (localResponse.ok) {
                        const localData = await localResponse.json();
                        rankingData = localData.ranking || [];
                        console.log('📁 Datos cargados desde archivo local:', rankingData.length);
                        localStorage.setItem('rankingData', JSON.stringify(rankingData));
                        renderPeopleTable();
                        renderAreasTable();
                        return;
                    }
                } catch (e) {
                    console.error('Error cargando archivo local:', e);
                }
                
                // Intentar desde localStorage como último recurso
                const stored = localStorage.getItem('rankingData');
                if (stored) {
                    try {
                        rankingData = JSON.parse(stored);
                        console.log('Datos cargados desde localStorage:', rankingData.length, 'colaboradores');
                        renderPeopleTable();
                        renderAreasTable();
                    } catch (e) {
                        console.error('Error parseando localStorage:', e);
                        rankingData = [];
                        renderPeopleTable();
                        renderAreasTable();
                    }
                } else {
                    console.warn('No hay datos disponibles');
                    rankingData = [];
                    renderPeopleTable();
                    renderAreasTable();
                }
            } catch (error) {
                console.error('❌ Error general cargando datos:', error);
                rankingData = [];
                renderPeopleTable();
                renderAreasTable();
            }
        }

        // ========== Renderizado de tablas ==========

        function renderPeopleTable() {
            const tbody = document.getElementById('people-tbody');
            if (!tbody) return;

            tbody.innerHTML = '';

            if (rankingData.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="6" style="text-align: center; padding: 30px; color: #a8c5dd;">No hay colaboradores registrados</td>';
                tbody.appendChild(row);
                return;
            }

            // Ordenar por puntos y guardar índice original
            const sorted = rankingData.map((person, originalIndex) => ({
                ...person,
                originalIndex
            })).sort((a, b) => {
                return (Number(b.puntos) || 0) - (Number(a.puntos) || 0);
            });

            sorted.forEach((person, index) => {
                const row = document.createElement('tr');
                const position = index + 1;
                
                row.innerHTML = `
                    <td>${position}</td>
                    <td>${escapeHtml(person.nombre || '')}</td>
                    <td>${escapeHtml(person.area || '')}</td>
                    <td>${escapeHtml(person.cargo || '')}</td>
                    <td>${Number(person.puntos) || 0}</td>
                    <td>
                        <button class="btn-edit" onclick="editPerson(${person.originalIndex})">✏️ Editar</button>
                        <button class="btn-delete" onclick="deletePerson(${person.originalIndex})">🗑️ Eliminar</button>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
        }

        function renderAreasTable() {
            const tbody = document.getElementById('areas-tbody');
            if (!tbody) return;

            tbody.innerHTML = '';

            if (rankingData.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="5" style="text-align: center; padding: 30px; color: #a8c5dd;">No hay áreas registradas</td>';
                tbody.appendChild(row);
                return;
            }

            // Agrupar por área
            const areaMap = {};
            rankingData.forEach(person => {
                const area = (person.area || 'Sin área').trim();
                const puntos = Number(person.puntos) || 0;
                if (!areaMap[area]) {
                    areaMap[area] = { puntos: 0, count: 0 };
                }
                areaMap[area].puntos += puntos;
                areaMap[area].count += 1;
            });

            // Convertir a array y ordenar
            const areaList = Object.entries(areaMap)
                .map(([area, data]) => ({ area, puntos: data.puntos, count: data.count }))
                .sort((a, b) => b.puntos - a.puntos);

            if (areaList.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="5" style="text-align: center; padding: 30px; color: #a8c5dd;">No hay áreas registradas</td>';
                tbody.appendChild(row);
                return;
            }

            areaList.forEach((item, index) => {
                const row = document.createElement('tr');
                const position = index + 1;
                const escapedArea = escapeHtml(item.area);
                
                row.innerHTML = `
                    <td>${position}</td>
                    <td>${escapedArea}</td>
                    <td>${item.puntos}</td>
                    <td>${item.count}</td>
                    <td>
                        <button class="btn-secondary" onclick="viewAreaDetails('${escapedArea.replace(/'/g, "\\'")}')">👁️ Ver</button>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
        }

        // ========== CRUD de Colaboradores ==========

        window.editPerson = function(originalIndex) {
            if (originalIndex < 0 || originalIndex >= rankingData.length) {
                console.error('Índice inválido:', originalIndex);
                return;
            }
            
            const person = rankingData[originalIndex];
            editingPersonId = originalIndex;

            document.getElementById('person-name').value = person.nombre || '';
            document.getElementById('person-area').value = person.area || '';
            document.getElementById('person-cargo').value = person.cargo || '';
            document.getElementById('person-puntos').value = person.puntos || 0;
            document.getElementById('person-modal-title').textContent = 'Editar Colaborador';
            
            const modal = document.getElementById('person-modal');
            if (modal) modal.classList.add('active');
        };

        window.deletePerson = async function(originalIndex) {
            if (!confirm('¿Estás seguro de eliminar este colaborador?')) return;

            if (originalIndex < 0 || originalIndex >= rankingData.length) {
                console.error('Índice inválido:', originalIndex);
                return;
            }

            rankingData.splice(originalIndex, 1);
            await saveRankingData();
        };

        window.viewAreaDetails = function(area) {
            const peopleInArea = rankingData.filter(p => (p.area || 'Sin área').trim() === area);
            alert(`Colaboradores en ${area}:\n\n${peopleInArea.map((p, i) => `${i+1}. ${p.nombre} - ${p.puntos} puntos`).join('\n')}`);
        };

        // ========== Modal de Colaborador ==========

        function setupPersonModal() {
            const addBtn = document.getElementById('add-person-btn');
            const modal = document.getElementById('person-modal');
            const closeBtn = document.getElementById('close-person-modal');
            const cancelBtn = document.getElementById('cancel-person');
            const form = document.getElementById('person-form');

            if (addBtn) {
                addBtn.addEventListener('click', () => {
                    editingPersonId = null;
                    form.reset();
                    document.getElementById('person-modal-title').textContent = 'Agregar Colaborador';
                    if (modal) modal.classList.add('active');
                });
            }

            if (closeBtn) {
                closeBtn.addEventListener('click', closePersonModal);
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', closePersonModal);
            }

            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) closePersonModal();
                });
            }

            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    savePerson();
                });
            }
        }

        function closePersonModal() {
            const modal = document.getElementById('person-modal');
            if (modal) modal.classList.remove('active');
            editingPersonId = null;
            document.getElementById('person-form').reset();
        }

        async function savePerson() {
            const nombre = document.getElementById('person-name').value.trim();
            const area = document.getElementById('person-area').value.trim();
            const cargo = document.getElementById('person-cargo').value.trim();
            const puntos = Number(document.getElementById('person-puntos').value) || 0;

            if (!nombre || !area) {
                alert('Nombre y Área son obligatorios');
                return;
            }

            if (editingPersonId !== null && editingPersonId !== -1) {
                // Editar
                rankingData[editingPersonId] = { nombre, area, cargo, puntos };
            } else {
                // Agregar nuevo
                rankingData.push({ nombre, area, cargo, puntos });
            }

            await saveRankingData();
            closePersonModal();
        }

        // ========== Guardar datos ==========

        async function saveRankingData() {
            console.log('💾 Guardando datos...', rankingData.length, 'colaboradores');
            
            // PRIMERO: Guardar en el servidor (siempre que esté disponible)
            if (CONFIG.USE_API && CONFIG.API_BASE) {
                try {
                    console.log('📤 Enviando datos al servidor...', CONFIG.API_BASE);
                    const response = await fetch(CONFIG.API_BASE + '/api/ranking/save', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ data: rankingData })
                    });
                    
                    console.log('📥 Respuesta del servidor:', response.status, response.statusText);
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Error del servidor (${response.status}): ${errorText}`);
                    }
                    
                    const result = await response.json();
                    console.log('✅ Datos guardados en servidor:', result.message);
                    
                    // Guardar en localStorage como caché (después de guardar en servidor)
                    localStorage.setItem('rankingData', JSON.stringify(rankingData));
                    
                    // Actualizar tablas inmediatamente
                    renderPeopleTable();
                    renderAreasTable();
                    
                    return { success: true, message: result.message };
                } catch (error) {
                    console.error('❌ Error guardando en servidor:', error);
                    // Si falla el servidor, guardar en localStorage como respaldo
                    localStorage.setItem('rankingData', JSON.stringify(rankingData));
                    renderPeopleTable();
                    renderAreasTable();
                    
                    // Mostrar alerta solo si estamos en producción
                    if (isProduction) {
                        alert('⚠️ No se pudo guardar en el servidor. Los datos se guardaron localmente.\n\nError: ' + error.message);
                    }
                    return { success: false, error: error.message };
                }
            } else {
                // Si no hay servidor configurado, solo guardar en localStorage
                localStorage.setItem('rankingData', JSON.stringify(rankingData));
                renderPeopleTable();
                renderAreasTable();
                console.log('💾 Datos guardados en localStorage (sin servidor configurado)');
                return { success: true, message: 'Datos guardados en localStorage' };
            }
        }

        // ========== CSV Import/Export ==========

        function setupCSVHandlers() {
            // Exportar CSV de Colaboradores
            const exportPeopleBtn = document.getElementById('export-csv-people');
            if (exportPeopleBtn) {
                exportPeopleBtn.addEventListener('click', exportPeopleCSV);
            }

            // Importar CSV de Colaboradores
            const importPeopleBtn = document.getElementById('import-csv-people');
            const fileInputPeople = document.getElementById('csv-file-input-people');
            if (importPeopleBtn && fileInputPeople) {
                importPeopleBtn.addEventListener('click', () => fileInputPeople.click());
                fileInputPeople.addEventListener('change', (e) => {
                    if (e.target.files.length > 0) {
                        importPeopleCSV(e.target.files[0]);
                        e.target.value = ''; // Resetear para permitir cargar el mismo archivo
                    }
                });
            }

            // Exportar CSV de Áreas
            const exportAreasBtn = document.getElementById('export-csv-areas');
            if (exportAreasBtn) {
                exportAreasBtn.addEventListener('click', exportAreasCSV);
            }
        }

        function exportPeopleCSV() {
            const headers = ['Nombre', 'Área', 'Cargo', 'Puntos'];
            const rows = rankingData.map(p => [
                p.nombre || '',
                p.area || '',
                p.cargo || '',
                p.puntos || 0
            ]);

            const csvContent = [
                headers.join(';'),
                ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
            ].join('\n');

            downloadCSV(csvContent, 'colaboradores.csv');
        }

        function exportAreasCSV() {
            const areaMap = {};
            rankingData.forEach(person => {
                const area = (person.area || 'Sin área').trim();
                const puntos = Number(person.puntos) || 0;
                if (!areaMap[area]) {
                    areaMap[area] = { puntos: 0, count: 0 };
                }
                areaMap[area].puntos += puntos;
                areaMap[area].count += 1;
            });

            const areaList = Object.entries(areaMap)
                .map(([area, data]) => ({ area, puntos: data.puntos, count: data.count }))
                .sort((a, b) => b.puntos - a.puntos);

            const headers = ['Área', 'Puntos Totales', 'Cantidad de Colaboradores'];
            const rows = areaList.map(item => [
                item.area,
                item.puntos,
                item.count
            ]);

            const csvContent = [
                headers.join(';'),
                ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
            ].join('\n');

            downloadCSV(csvContent, 'areas.csv');
        }

        function importPeopleCSV(file) {
            console.log('Iniciando importación de CSV:', file.name);
            
            const reader = new FileReader();
            
            reader.onerror = () => {
                console.error('Error al leer el archivo');
                alert('Error al leer el archivo. Verifica que el archivo sea válido.');
            };
            
            reader.onload = async (e) => {
                try {
                    console.log('Archivo leído correctamente, procesando...');
                    const text = e.target.result;
                    const lines = text.split('\n').filter(line => line.trim());
                    
                    console.log('Líneas encontradas:', lines.length);
                    
                    if (lines.length < 2) {
                        alert('El archivo CSV debe tener al menos una fila de encabezados y una fila de datos');
                        return;
                    }

                    const headers = lines[0].split(';').map(h => h.trim().replace(/^"|"$/g, ''));
                    console.log('Encabezados:', headers);
                    
                    const data = [];

                    for (let i = 1; i < lines.length; i++) {
                        const values = parseCSVLine(lines[i]);
                        if (values.length >= 2) {
                            data.push({
                                nombre: values[0] || '',
                                area: values[1] || '',
                                cargo: values[2] || '',
                                puntos: Number(values[3]) || 0
                            });
                        }
                    }

                    console.log('Registros procesados:', data.length);

                    if (data.length === 0) {
                        alert('No se encontraron registros válidos en el archivo CSV.');
                        return;
                    }

                    if (confirm(`¿Deseas REEMPLAZAR todos los colaboradores actuales con ${data.length} registros del CSV?`)) {
                        // Reemplazar datos completamente
                        rankingData = data;
                        
                        // Guardar y esperar a que termine
                        await saveRankingData();
                        
                        console.log('✅ Datos importados y guardados correctamente');
                        alert(`✅ ${data.length} colaboradores importados y guardados correctamente`);
                    }
                } catch (error) {
                    console.error('Error al procesar el archivo:', error);
                    alert('Error al procesar el archivo: ' + error.message);
                }
            };
            
            reader.readAsText(file);
        }

        function parseCSVLine(line) {
            const values = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ';' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());
            return values;
        }

        function downloadCSV(content, filename) {
            const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // ========== Logout ==========

        function setupLogout() {
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    if (confirm('¿Deseas cerrar sesión?')) {
                        sessionStorage.removeItem('adminLoggedIn');
                        sessionStorage.removeItem('adminEmail');
                        sessionStorage.removeItem('adminRole');
                        sessionStorage.removeItem('adminName');
                        window.location.href = 'index.html';
                    }
                });
            }
        }

        // ========== Utilidades ==========

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // ========== Gestión de Usuarios ==========

        function loadUsers() {
            const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
            return users;
        }

        function saveUsers(users) {
            localStorage.setItem('adminUsers', JSON.stringify(users));
        }

        function renderUsersTable() {
            const tbody = document.getElementById('users-tbody');
            if (!tbody) return;

            tbody.innerHTML = '';

            const users = loadUsers();

            if (users.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="5" style="text-align: center; padding: 30px; color: #a8c5dd;">No hay usuarios registrados</td>';
                tbody.appendChild(row);
                return;
            }

            users.forEach((user, index) => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${escapeHtml(user.name || '')}</td>
                    <td>${escapeHtml(user.email || '')}</td>
                    <td><span style="padding: 4px 8px; border-radius: 4px; background: ${user.role === 'admin' ? 'rgba(255, 107, 53, 0.2)' : 'rgba(59, 130, 246, 0.2)'}; color: ${user.role === 'admin' ? '#ff8c42' : '#60a5fa'}; font-weight: 600; font-size: 0.85rem;">${user.role === 'admin' ? 'Administrador' : 'Usuario'}</span></td>
                    <td>${new Date(user.createdAt || Date.now()).toLocaleDateString('es-ES')}</td>
                    <td>
                        <button class="btn-edit" onclick="editUser(${index})">✏️ Editar</button>
                        <button class="btn-delete" onclick="deleteUser(${index})">🗑️ Eliminar</button>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
        }

        window.editUser = function(index) {
            const users = loadUsers();
            if (index < 0 || index >= users.length) return;
            
            const user = users[index];
            editingUserId = index;

            document.getElementById('user-name').value = user.name || '';
            document.getElementById('user-email').value = user.email || '';
            document.getElementById('user-password').value = '';
            document.getElementById('user-password').required = false;
            document.getElementById('user-role').value = user.role || 'user';
            document.getElementById('user-modal-title').textContent = 'Editar Usuario';
            
            const modal = document.getElementById('user-modal');
            if (modal) modal.classList.add('active');
        };

        window.deleteUser = function(index) {
            if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

            const users = loadUsers();
            if (index < 0 || index >= users.length) return;

            users.splice(index, 1);
            saveUsers(users);
            renderUsersTable();
        };

        function setupUserModal() {
            const addBtn = document.getElementById('add-user-btn');
            const modal = document.getElementById('user-modal');
            const closeBtn = document.getElementById('close-user-modal');
            const cancelBtn = document.getElementById('cancel-user');
            const form = document.getElementById('user-form');

            if (addBtn) {
                addBtn.addEventListener('click', () => {
                    editingUserId = null;
                    form.reset();
                    document.getElementById('user-password').required = true;
                    document.getElementById('user-modal-title').textContent = 'Agregar Usuario';
                    if (modal) modal.classList.add('active');
                });
            }

            if (closeBtn) {
                closeBtn.addEventListener('click', closeUserModal);
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', closeUserModal);
            }

            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) closeUserModal();
                });
            }

            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    saveUser();
                });
            }
        }

        function closeUserModal() {
            const modal = document.getElementById('user-modal');
            if (modal) modal.classList.remove('active');
            editingUserId = null;
            document.getElementById('user-form').reset();
            document.getElementById('user-password').required = true;
        }

        function saveUser() {
            const name = document.getElementById('user-name').value.trim();
            const email = document.getElementById('user-email').value.trim().toLowerCase();
            const password = document.getElementById('user-password').value;
            const role = document.getElementById('user-role').value;

            if (!name || !email) {
                alert('Nombre y Email son obligatorios');
                return;
            }

            // Validar email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Por favor, ingresa un email válido');
                return;
            }

            const users = loadUsers();

            if (editingUserId !== null && editingUserId !== -1) {
                // Editar usuario existente
                if (users[editingUserId].email !== email) {
                    // Verificar que el nuevo email no esté en uso
                    if (users.some((u, i) => i !== editingUserId && u.email === email)) {
                        alert('Este email ya está en uso');
                        return;
                    }
                }
                
                users[editingUserId].name = name;
                users[editingUserId].email = email;
                if (password) {
                    users[editingUserId].password = password;
                }
                users[editingUserId].role = role;
            } else {
                // Agregar nuevo usuario
                // Verificar que el email no esté en uso
                if (users.some(u => u.email === email)) {
                    alert('Este email ya está registrado');
                    return;
                }

                if (!password || password.length < 6) {
                    alert('La contraseña debe tener al menos 6 caracteres');
                    return;
                }

                users.push({
                    name,
                    email,
                    password,
                    role,
                    createdAt: Date.now()
                });
            }

            saveUsers(users);
            renderUsersTable();
            closeUserModal();
        }

        // ========== Inicialización ==========

        function init() {
            setupPersonModal();
            setupCSVHandlers();
            setupLogout();
            loadRankingData();
            
            // Solo inicializar gestión de usuarios si es root
            if (adminRole === 'root') {
                setupUserModal();
                renderUsersTable();
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

})();
