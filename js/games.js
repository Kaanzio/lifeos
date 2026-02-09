/**
 * Life OS - Games Module v2
 * Oyun takibi yönetimi - Mağaza kategorileri ve liste görünümü
 */

const Games = {
    games: [],
    container: null,
    viewMode: 'grid', // grid veya list
    filterStore: 'all',
    filterStatus: 'all',

    stores: [
        { id: 'steam', name: 'Steam', icon: '🔵', color: '#1b2838' },
        { id: 'epic', name: 'Epic Games', icon: '⚫', color: '#0078f2' },
        { id: 'amazon', name: 'Amazon', icon: '🟠', color: '#ff9900' },
        { id: 'xbox', name: 'Xbox', icon: '🟢', color: '#107c10' },
        { id: 'gog', name: 'GOG', icon: '🟣', color: '#86328a' },
        { id: 'ubisoft', name: 'Ubisoft', icon: '🔶', color: '#0070ff' },
        { id: 'playstation', name: 'PlayStation', icon: '🔷', color: '#003087' },
        { id: 'nintendo', name: 'Nintendo', icon: '🔴', color: '#e60012' },
        { id: 'other', name: 'Diğer', icon: '⚪', color: '#6b7280' }
    ],

    init() {
        this.container = document.getElementById('gamesGrid');
        this.loadGames();
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document.getElementById('addGameBtn')?.addEventListener('click', () => {
            this.showAddModal();
        });
    },

    loadGames() {
        this.games = Storage.load('lifeos_games', []);
    },

    saveGames() {
        Storage.save('lifeos_games', this.games);
    },

    add(gameData) {
        const game = {
            id: Storage.generateId(),
            title: gameData.title,
            store: gameData.store || 'steam',
            platform: gameData.platform || 'PC',
            genre: gameData.genre || 'Genel',
            icon: gameData.icon || '🎮',
            status: 'toPlay',
            rating: 0,
            hoursPlayed: 0,
            notes: gameData.notes || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.games.push(game);
        this.saveGames();
        this.render();
        Dashboard.render();

        Notifications.add('Yeni Oyun Eklendi', `"${game.title}" oyun listenize eklendi.`, 'success');
        return game;
    },

    update(id, updates) {
        const game = this.games.find(g => g.id === id);
        if (game) {
            const wasNotCompleted = game.status !== 'completed';
            Object.assign(game, updates, { updatedAt: new Date().toISOString() });

            if (game.status === 'completed' && wasNotCompleted) {
                Notifications.add('Tebrikler! 🎮', `"${game.title}" oyununu bitirdiniz!`, 'success');
            }

            this.saveGames();
            this.render();
            Dashboard.render();
        }
    },

    remove(id) {
        this.games = this.games.filter(g => g.id !== id);
        this.saveGames();
        this.render();
        Dashboard.render();
    },

    getStats() {
        return {
            total: this.games.length,
            playing: this.games.filter(g => g.status === 'playing').length,
            completed: this.games.filter(g => g.status === 'completed').length
        };
    },

    getFilteredGames() {
        return this.games.filter(g => {
            const storeMatch = this.filterStore === 'all' || g.store === this.filterStore;
            const statusMatch = this.filterStatus === 'all' || g.status === this.filterStatus;
            return storeMatch && statusMatch;
        });
    },

    render() {
        const stats = this.getStats();

        document.getElementById('gameStatTotal').textContent = stats.total;
        document.getElementById('gameStatPlaying').textContent = stats.playing;
        document.getElementById('gameStatCompleted').textContent = stats.completed;

        // Render toolbar and content
        const filteredGames = this.getFilteredGames();

        let html = this.renderToolbar();

        if (this.games.length === 0) {
            html += `
                <div class="empty-state-large">
                    <span class="empty-icon">🎮</span>
                    <h3>Henüz oyun eklenmedi</h3>
                    <p>Oynadığınız veya oynamak istediğiniz oyunları ekleyin</p>
                </div>
            `;
        } else if (filteredGames.length === 0) {
            html += `<p class="empty-state" style="grid-column: 1/-1;">Bu filtreyle eşleşen oyun yok</p>`;
        } else if (this.viewMode === 'list') {
            html += this.renderListView(filteredGames);
        } else {
            html += this.renderGridView(filteredGames);
        }

        this.container.innerHTML = html;
        this.bindCardEvents();
        this.bindToolbarEvents();
    },

    renderToolbar() {
        const storeOptions = this.stores.map(s =>
            `<option value="${s.id}" ${this.filterStore === s.id ? 'selected' : ''}>${s.icon} ${s.name}</option>`
        ).join('');

        return `
            <div class="module-toolbar" style="grid-column: 1/-1; display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center;">
                <select class="form-select" id="gameStoreFilter" style="flex: 0 0 auto; min-width: 150px;">
                    <option value="all" ${this.filterStore === 'all' ? 'selected' : ''}>🏪 Tüm Mağazalar</option>
                    ${storeOptions}
                </select>
                <select class="form-select" id="gameStatusFilter" style="flex: 0 0 auto; min-width: 140px;">
                    <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>📊 Tüm Durumlar</option>
                    <option value="toPlay" ${this.filterStatus === 'toPlay' ? 'selected' : ''}>📋 Oynanacak</option>
                    <option value="playing" ${this.filterStatus === 'playing' ? 'selected' : ''}>🎮 Oynanıyor</option>
                    <option value="completed" ${this.filterStatus === 'completed' ? 'selected' : ''}>✅ Tamamlandı</option>
                    <option value="dropped" ${this.filterStatus === 'dropped' ? 'selected' : ''}>⏸️ Bırakıldı</option>
                </select>
                <div style="flex: 1;"></div>
                <div style="display: flex; gap: 4px;">
                    <button class="btn btn-secondary btn-icon ${this.viewMode === 'grid' ? 'active' : ''}" id="gameGridView" title="Izgara Görünümü" style="${this.viewMode === 'grid' ? 'background: var(--accent-purple); color: white;' : ''}">▦</button>
                    <button class="btn btn-secondary btn-icon ${this.viewMode === 'list' ? 'active' : ''}" id="gameListView" title="Liste Görünümü" style="${this.viewMode === 'list' ? 'background: var(--accent-purple); color: white;' : ''}">☰</button>
                </div>
            </div>
        `;
    },

    renderGridView(games) {
        const statusLabels = {
            toPlay: '📋 Oynanacak',
            playing: '🎮 Oynanıyor',
            completed: '✅ Tamamlandı',
            dropped: '⏸️ Bırakıldı'
        };

        return games.map(game => {
            const store = this.stores.find(s => s.id === game.store) || this.stores[8];
            return `
                <div class="module-card" data-id="${game.id}">
                    <div class="module-card-header">
                        <div class="module-card-icon">${game.icon}</div>
                        <div class="module-card-actions">
                            <button class="module-card-btn edit-game" title="Düzenle">✏️</button>
                            <button class="module-card-btn delete-game" title="Sil">🗑️</button>
                        </div>
                    </div>
                    <h4 class="module-card-title">${game.title}</h4>
                    <p class="module-card-subtitle">${store.icon} ${store.name} • ${game.genre}</p>
                    <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
                        <span style="padding: 4px 12px; background: var(--bg-tertiary); border-radius: 20px; font-size: 12px;">${statusLabels[game.status]}</span>
                        ${game.hoursPlayed > 0 ? `<span style="padding: 4px 12px; background: var(--bg-tertiary); border-radius: 20px; font-size: 12px; color: var(--text-muted);">⏱️ ${game.hoursPlayed}s</span>` : ''}
                        ${game.rating > 0 ? `<span style="padding: 4px 12px; background: var(--bg-tertiary); border-radius: 20px; font-size: 12px; color: var(--warning);">⭐ ${game.rating}/10</span>` : ''}
                    </div>
                    <button class="btn btn-secondary" style="width: 100%; margin-top: 16px;" onclick="Games.showUpdateModal('${game.id}')">
                        📊 Durumu Güncelle
                    </button>
                </div>
            `;
        }).join('');
    },

    renderListView(games) {
        const statusLabels = {
            toPlay: '📋 Oynanacak',
            playing: '🎮 Oynanıyor',
            completed: '✅ Tamamlandı',
            dropped: '⏸️ Bırakıldı'
        };

        // Mağazaya göre grupla
        const grouped = {};
        games.forEach(game => {
            const storeId = game.store || 'other';
            if (!grouped[storeId]) grouped[storeId] = [];
            grouped[storeId].push(game);
        });

        let html = '<div style="grid-column: 1/-1; display: flex; flex-direction: column; gap: 24px;">';

        for (const storeId of Object.keys(grouped)) {
            const store = this.stores.find(s => s.id === storeId) || this.stores[8];
            const storeGames = grouped[storeId];

            html += `
                <div class="list-group">
                    <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                        <span>${store.icon}</span> ${store.name} <span style="font-weight: 400; color: var(--text-muted);">(${storeGames.length})</span>
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${storeGames.map(game => `
                            <div class="list-item" data-id="${game.id}" style="display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: var(--bg-card); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                                <span style="font-size: 24px;">${game.icon}</span>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="font-weight: 600; margin-bottom: 4px;">${game.title}</div>
                                    <div style="font-size: 13px; color: var(--text-muted);">${game.genre} • ${game.platform}</div>
                                </div>
                                <span style="padding: 4px 12px; background: var(--bg-tertiary); border-radius: 20px; font-size: 12px;">${statusLabels[game.status]}</span>
                                ${game.rating > 0 ? `<span style="font-size: 14px; color: var(--warning);">⭐ ${game.rating}</span>` : ''}
                                ${game.hoursPlayed > 0 ? `<span style="font-size: 13px; color: var(--text-muted);">⏱️ ${game.hoursPlayed}s</span>` : ''}
                                <div style="display: flex; gap: 4px;">
                                    <button class="btn btn-secondary btn-icon edit-game" style="width: 36px; height: 36px;">✏️</button>
                                    <button class="btn btn-secondary btn-icon delete-game" style="width: 36px; height: 36px;">🗑️</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    },

    bindToolbarEvents() {
        document.getElementById('gameStoreFilter')?.addEventListener('change', (e) => {
            this.filterStore = e.target.value;
            this.render();
        });

        document.getElementById('gameStatusFilter')?.addEventListener('change', (e) => {
            this.filterStatus = e.target.value;
            this.render();
        });

        document.getElementById('gameGridView')?.addEventListener('click', () => {
            this.viewMode = 'grid';
            this.render();
        });

        document.getElementById('gameListView')?.addEventListener('click', () => {
            this.viewMode = 'list';
            this.render();
        });
    },

    bindCardEvents() {
        // Grid view cards
        this.container.querySelectorAll('.module-card').forEach(card => {
            const id = card.dataset.id;
            card.querySelector('.edit-game')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showEditModal(id);
            });
            card.querySelector('.delete-game')?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Bu oyunu silmek istediğinizden emin misiniz?')) this.remove(id);
            });
        });

        // List view items
        this.container.querySelectorAll('.list-item').forEach(item => {
            const id = item.dataset.id;
            item.querySelector('.edit-game')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showEditModal(id);
            });
            item.querySelector('.delete-game')?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Bu oyunu silmek istediğinizden emin misiniz?')) this.remove(id);
            });
        });
    },

    showUpdateModal(id) {
        const game = this.games.find(g => g.id === id);
        if (!game) return;

        const modalBody = document.getElementById('modalBody');
        document.getElementById('modalTitle').textContent = 'Oyun Durumu';

        modalBody.innerHTML = `
            <form id="gameUpdateForm">
                <div class="form-group">
                    <label class="form-label">Durum</label>
                    <select class="form-select" name="status">
                        <option value="toPlay" ${game.status === 'toPlay' ? 'selected' : ''}>📋 Oynanacak</option>
                        <option value="playing" ${game.status === 'playing' ? 'selected' : ''}>🎮 Oynanıyor</option>
                        <option value="completed" ${game.status === 'completed' ? 'selected' : ''}>✅ Tamamlandı</option>
                        <option value="dropped" ${game.status === 'dropped' ? 'selected' : ''}>⏸️ Bırakıldı</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Oynanan Saat</label>
                    <input type="number" class="form-input" name="hoursPlayed" min="0" value="${game.hoursPlayed}">
                </div>
                <div class="form-group">
                    <label class="form-label">Puan (1-10)</label>
                    <input type="number" class="form-input" name="rating" min="0" max="10" value="${game.rating}">
                </div>
                <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">Kaydet</button>
                </div>
            </form>
        `;

        App.openModal();

        document.getElementById('gameUpdateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.update(id, {
                status: formData.get('status'),
                hoursPlayed: parseInt(formData.get('hoursPlayed')) || 0,
                rating: parseInt(formData.get('rating')) || 0
            });
            App.closeModal();
        });
    },

    showAddModal() {
        const modalBody = document.getElementById('modalBody');
        document.getElementById('modalTitle').textContent = 'Yeni Oyun Ekle';

        const storeOptions = this.stores.map(s =>
            `<option value="${s.id}">${s.icon} ${s.name}</option>`
        ).join('');

        modalBody.innerHTML = `
            <form id="gameForm">
                <div class="form-group">
                    <label class="form-label">Oyun Adı *</label>
                    <input type="text" class="form-input" name="title" required placeholder="Örn: The Witcher 3">
                </div>
                <div class="form-group">
                    <label class="form-label">Mağaza / Platform</label>
                    <select class="form-select" name="store">
                        ${storeOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Cihaz</label>
                    <select class="form-select" name="platform">
                        <option value="PC">PC</option>
                        <option value="PlayStation">PlayStation</option>
                        <option value="Xbox">Xbox</option>
                        <option value="Nintendo Switch">Nintendo Switch</option>
                        <option value="Mobile">Mobil</option>
                        <option value="Diğer">Diğer</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Tür</label>
                    <select class="form-select" name="genre">
                        <option value="RPG">RPG</option>
                        <option value="Aksiyon">Aksiyon</option>
                        <option value="Macera">Macera</option>
                        <option value="Strateji">Strateji</option>
                        <option value="Spor">Spor</option>
                        <option value="FPS">FPS</option>
                        <option value="Simülasyon">Simülasyon</option>
                        <option value="Indie">Indie</option>
                        <option value="Genel">Genel</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">İkon</label>
                    <select class="form-select" name="icon">
                        <option value="🎮">🎮 Gamepad</option>
                        <option value="🕹️">🕹️ Joystick</option>
                        <option value="👾">👾 Retro</option>
                        <option value="🎯">🎯 Hedef</option>
                        <option value="⚔️">⚔️ Savaş</option>
                        <option value="🏎️">🏎️ Yarış</option>
                        <option value="⚽">⚽ Spor</option>
                        <option value="🧩">🧩 Bulmaca</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Notlar</label>
                    <textarea class="form-textarea" name="notes" placeholder="Oyun hakkında notlar..."></textarea>
                </div>
                <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">Ekle</button>
                </div>
            </form>
        `;

        App.openModal();

        document.getElementById('gameForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.add({
                title: formData.get('title'),
                store: formData.get('store'),
                platform: formData.get('platform'),
                genre: formData.get('genre'),
                icon: formData.get('icon'),
                notes: formData.get('notes')
            });
            App.closeModal();
        });
    },

    showEditModal(id) {
        const game = this.games.find(g => g.id === id);
        if (!game) return;

        const modalBody = document.getElementById('modalBody');
        document.getElementById('modalTitle').textContent = 'Oyun Düzenle';

        const storeOptions = this.stores.map(s =>
            `<option value="${s.id}" ${game.store === s.id ? 'selected' : ''}>${s.icon} ${s.name}</option>`
        ).join('');

        modalBody.innerHTML = `
            <form id="gameEditForm">
                <div class="form-group">
                    <label class="form-label">Oyun Adı *</label>
                    <input type="text" class="form-input" name="title" required value="${game.title}">
                </div>
                <div class="form-group">
                    <label class="form-label">Mağaza / Platform</label>
                    <select class="form-select" name="store">
                        ${storeOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Cihaz</label>
                    <select class="form-select" name="platform">
                        <option value="PC" ${game.platform === 'PC' ? 'selected' : ''}>PC</option>
                        <option value="PlayStation" ${game.platform === 'PlayStation' ? 'selected' : ''}>PlayStation</option>
                        <option value="Xbox" ${game.platform === 'Xbox' ? 'selected' : ''}>Xbox</option>
                        <option value="Nintendo Switch" ${game.platform === 'Nintendo Switch' ? 'selected' : ''}>Nintendo Switch</option>
                        <option value="Mobile" ${game.platform === 'Mobile' ? 'selected' : ''}>Mobil</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Notlar</label>
                    <textarea class="form-textarea" name="notes">${game.notes || ''}</textarea>
                </div>
                <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">Kaydet</button>
                </div>
            </form>
        `;

        App.openModal();

        document.getElementById('gameEditForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.update(id, {
                title: formData.get('title'),
                store: formData.get('store'),
                platform: formData.get('platform'),
                notes: formData.get('notes')
            });
            App.closeModal();
        });
    }
};
