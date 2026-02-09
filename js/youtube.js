/**
 * Life OS - YouTube Module
 * YouTube kanalları yönetimi
 */

const YouTube = {
    channels: [],
    container: null,
    viewMode: 'grid',
    filterCategory: 'all',

    categories: ['Eğitim', 'Oyun', 'Teknoloji', 'Müzik', 'Film & Dizi', 'Eğlence', 'Genel'],

    init() {
        this.container = document.getElementById('youtubeGrid');
        this.loadChannels();
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document.getElementById('addYoutubeBtn')?.addEventListener('click', () => {
            this.showAddModal();
        });
    },

    loadChannels() {
        this.channels = Storage.load('lifeos_youtube', []);
    },

    saveChannels() {
        Storage.save('lifeos_youtube', this.channels);
    },

    add(channelData) {
        const channel = {
            id: Storage.generateId(),
            name: channelData.name,
            url: channelData.url,
            category: channelData.category || 'Genel',
            icon: channelData.icon || '▶️',
            description: channelData.description || '',
            isFavorite: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.channels.push(channel);
        this.saveChannels();
        this.render();

        Notifications.add('Yeni Kanal Eklendi', `"${channel.name}" YouTube listenize eklendi.`, 'success');
        return channel;
    },

    update(id, updates) {
        const channel = this.channels.find(c => c.id === id);
        if (channel) {
            Object.assign(channel, updates, { updatedAt: new Date().toISOString() });
            this.saveChannels();
            this.render();
        }
    },

    remove(id) {
        this.channels = this.channels.filter(c => c.id !== id);
        this.saveChannels();
        this.render();
    },

    toggleFavorite(id) {
        const channel = this.channels.find(c => c.id === id);
        if (channel) {
            channel.isFavorite = !channel.isFavorite;
            this.saveChannels();
            this.render();
        }
    },

    visit(id) {
        const channel = this.channels.find(c => c.id === id);
        if (channel) {
            window.open(channel.url, '_blank');
        }
    },

    getStats() {
        return {
            total: this.channels.length,
            favorites: this.channels.filter(c => c.isFavorite).length
        };
    },

    getFilteredChannels() {
        let filtered = this.channels;
        if (this.filterCategory !== 'all') {
            filtered = filtered.filter(c => c.category === this.filterCategory);
        }
        return filtered.sort((a, b) => b.isFavorite - a.isFavorite);
    },

    render() {
        const stats = this.getStats();

        document.getElementById('ytStatTotal').textContent = stats.total;
        document.getElementById('ytStatFavorite').textContent = stats.favorites;

        const filteredChannels = this.getFilteredChannels();
        let html = this.renderToolbar();

        if (this.channels.length === 0) {
            html += `
                <div class="empty-state-large">
                    <span class="empty-icon">▶️</span>
                    <h3>Henüz kanal eklenmedi</h3>
                    <p>Takip ettiğiniz YouTube kanallarını organize edin</p>
                </div>
            `;
        } else if (filteredChannels.length === 0) {
            html += `<p class="empty-state" style="grid-column: 1/-1;">Bu filtreyle eşleşen kanal yok</p>`;
        } else if (this.viewMode === 'list') {
            html += this.renderListView(filteredChannels);
        } else {
            html += this.renderGridView(filteredChannels);
        }

        this.container.innerHTML = html;
        this.bindCardEvents();
        this.bindToolbarEvents();
    },

    renderToolbar() {
        const catOptions = this.categories.map(c =>
            `<option value="${c}" ${this.filterCategory === c ? 'selected' : ''}>${c}</option>`
        ).join('');

        return `
            <div class="module-toolbar" style="grid-column: 1/-1; display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center;">
                <select class="form-select" id="ytCategoryFilter" style="flex: 0 0 auto; min-width: 150px;">
                    <option value="all" ${this.filterCategory === 'all' ? 'selected' : ''}>🏷️ Tüm Kategoriler</option>
                    ${catOptions}
                </select>
                <div style="flex: 1;"></div>
                <div style="display: flex; gap: 4px;">
                    <button class="btn btn-secondary btn-icon" id="ytGridView" style="${this.viewMode === 'grid' ? 'background: var(--accent-purple); color: white;' : ''}">▦</button>
                    <button class="btn btn-secondary btn-icon" id="ytListView" style="${this.viewMode === 'list' ? 'background: var(--accent-purple); color: white;' : ''}">☰</button>
                </div>
            </div>
        `;
    },

    renderGridView(channels) {
        return channels.map(channel => `
            <div class="module-card" data-id="${channel.id}">
                <div class="module-card-header">
                    <div class="module-card-icon" style="background: #ff0000;">${channel.icon}</div>
                    <div class="module-card-actions">
                        <button class="module-card-btn toggle-fav" title="${channel.isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}" style="opacity: 1; ${channel.isFavorite ? 'color: #f59e0b;' : ''}">${channel.isFavorite ? '⭐' : '☆'}</button>
                        <button class="module-card-btn edit-channel" title="Düzenle">✏️</button>
                        <button class="module-card-btn delete-channel" title="Sil">🗑️</button>
                    </div>
                </div>
                <h4 class="module-card-title">${channel.name}</h4>
                <p class="module-card-subtitle">${channel.description || channel.category}</p>
                <span style="display: inline-block; padding: 4px 12px; background: #ff000022; color: #ff0000; border-radius: 20px; font-size: 12px; margin-top: 8px;">${channel.category}</span>
                <button class="btn btn-primary" style="width: 100%; margin-top: 16px; background: #ff0000;" onclick="YouTube.visit('${channel.id}')">
                    ▶️ YouTube'da Aç
                </button>
            </div>
        `).join('');
    },

    renderListView(channels) {
        const grouped = {};
        channels.forEach(channel => {
            const cat = channel.category || 'Genel';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(channel);
        });

        let html = '<div style="grid-column: 1/-1; display: flex; flex-direction: column; gap: 24px;">';

        for (const category of Object.keys(grouped)) {
            const catChannels = grouped[category];
            html += `
                <div class="list-group">
                    <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 12px;">
                        🏷️ ${category} <span style="font-weight: 400; color: var(--text-muted);">(${catChannels.length})</span>
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${catChannels.map(channel => `
                            <div class="list-item" data-id="${channel.id}" style="display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: var(--bg-card); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                                <span style="font-size: 24px; background: #ff0000; padding: 8px; border-radius: 8px;">${channel.icon}</span>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                                        ${channel.name}
                                        ${channel.isFavorite ? '<span style="color: #f59e0b;">⭐</span>' : ''}
                                    </div>
                                    <div style="font-size: 13px; color: var(--text-muted);">${channel.description || ''}</div>
                                </div>
                                <button class="btn btn-primary" style="padding: 8px 16px; font-size: 13px; background: #ff0000;" onclick="YouTube.visit('${channel.id}')">Aç</button>
                                <div style="display: flex; gap: 4px;">
                                    <button class="btn btn-secondary btn-icon toggle-fav" style="width: 36px; height: 36px; ${channel.isFavorite ? 'color: #f59e0b;' : ''}">${channel.isFavorite ? '⭐' : '☆'}</button>
                                    <button class="btn btn-secondary btn-icon edit-channel" style="width: 36px; height: 36px;">✏️</button>
                                    <button class="btn btn-secondary btn-icon delete-channel" style="width: 36px; height: 36px;">🗑️</button>
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
        document.getElementById('ytCategoryFilter')?.addEventListener('change', (e) => {
            this.filterCategory = e.target.value;
            this.render();
        });

        document.getElementById('ytGridView')?.addEventListener('click', () => {
            this.viewMode = 'grid';
            this.render();
        });

        document.getElementById('ytListView')?.addEventListener('click', () => {
            this.viewMode = 'list';
            this.render();
        });
    },

    bindCardEvents() {
        this.container.querySelectorAll('.module-card, .list-item').forEach(item => {
            const id = item.dataset.id;
            item.querySelector('.toggle-fav')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(id);
            });
            item.querySelector('.edit-channel')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showEditModal(id);
            });
            item.querySelector('.delete-channel')?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Bu kanalı silmek istediğinizden emin misiniz?')) this.remove(id);
            });
        });
    },

    showAddModal() {
        const modalBody = document.getElementById('modalBody');
        document.getElementById('modalTitle').textContent = 'Yeni YouTube Kanalı';

        const catOptions = this.categories.map(c => `<option value="${c}">${c}</option>`).join('');

        modalBody.innerHTML = `
            <form id="ytForm">
                <div class="form-group">
                    <label class="form-label">Kanal Adı *</label>
                    <input type="text" class="form-input" name="name" required placeholder="Örn: Barış Özcan">
                </div>
                <div class="form-group">
                    <label class="form-label">Kanal URL *</label>
                    <input type="url" class="form-input" name="url" required placeholder="https://youtube.com/@kanal">
                </div>
                <div class="form-group">
                    <label class="form-label">Kategori</label>
                    <select class="form-select" name="category">
                        ${catOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Açıklama</label>
                    <textarea class="form-textarea" name="description" placeholder="Kanal hakkında kısa açıklama..."></textarea>
                </div>
                <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">İptal</button>
                    <button type="submit" class="btn btn-primary" style="background: #ff0000;">Ekle</button>
                </div>
            </form>
        `;

        App.openModal();

        document.getElementById('ytForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.add({
                name: formData.get('name'),
                url: formData.get('url'),
                category: formData.get('category'),
                description: formData.get('description')
            });
            App.closeModal();
        });
    },

    showEditModal(id) {
        const channel = this.channels.find(c => c.id === id);
        if (!channel) return;

        const modalBody = document.getElementById('modalBody');
        document.getElementById('modalTitle').textContent = 'Kanal Düzenle';

        modalBody.innerHTML = `
            <form id="ytEditForm">
                <div class="form-group">
                    <label class="form-label">Kanal Adı *</label>
                    <input type="text" class="form-input" name="name" required value="${channel.name}">
                </div>
                <div class="form-group">
                    <label class="form-label">Kanal URL *</label>
                    <input type="url" class="form-input" name="url" required value="${channel.url}">
                </div>
                <div class="form-group">
                    <label class="form-label">Açıklama</label>
                    <textarea class="form-textarea" name="description">${channel.description || ''}</textarea>
                </div>
                <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">Kaydet</button>
                </div>
            </form>
        `;

        App.openModal();

        document.getElementById('ytEditForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.update(id, {
                name: formData.get('name'),
                url: formData.get('url'),
                description: formData.get('description')
            });
            App.closeModal();
        });
    }
};
