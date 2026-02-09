/**
 * Life OS - Sites Module v2
 * Faydalı site yönetimi - Liste görünümü ve kategori filtreleme
 */

const Sites = {
    sites: [],
    container: null,
    viewMode: 'grid',
    filterCategory: 'all',

    categories: ['Eğitim', 'Araç', 'Haber', 'Sosyal', 'Eğlence', 'İş', 'Genel'],

    init() {
        this.container = document.getElementById('sitesGrid');
        this.loadSites();
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document.getElementById('addSiteBtn')?.addEventListener('click', () => {
            this.showAddModal();
        });
    },

    loadSites() {
        this.sites = Storage.load('lifeos_sites', []);
    },

    saveSites() {
        Storage.save('lifeos_sites', this.sites);
    },

    add(siteData) {
        const site = {
            id: Storage.generateId(),
            title: siteData.title,
            url: siteData.url,
            category: siteData.category || 'Genel',
            icon: siteData.icon || '🌐',
            description: siteData.description || '',
            isFavorite: false,
            visitCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.sites.push(site);
        this.saveSites();
        this.render();

        Notifications.add('Yeni Site Eklendi', `"${site.title}" siteler listenize eklendi.`, 'success');
        return site;
    },

    update(id, updates) {
        const site = this.sites.find(s => s.id === id);
        if (site) {
            Object.assign(site, updates, { updatedAt: new Date().toISOString() });
            this.saveSites();
            this.render();
        }
    },

    remove(id) {
        this.sites = this.sites.filter(s => s.id !== id);
        this.saveSites();
        this.render();
    },

    toggleFavorite(id) {
        const site = this.sites.find(s => s.id === id);
        if (site) {
            site.isFavorite = !site.isFavorite;
            this.saveSites();
            this.render();
        }
    },

    visit(id) {
        const site = this.sites.find(s => s.id === id);
        if (site) {
            site.visitCount++;
            this.saveSites();
            window.open(site.url, '_blank');
        }
    },

    getStats() {
        return {
            total: this.sites.length,
            favorites: this.sites.filter(s => s.isFavorite).length
        };
    },

    getFilteredSites() {
        let filtered = this.sites;
        if (this.filterCategory !== 'all') {
            filtered = filtered.filter(s => s.category === this.filterCategory);
        }
        // Favorileri öne al
        return filtered.sort((a, b) => b.isFavorite - a.isFavorite);
    },

    render() {
        const stats = this.getStats();

        document.getElementById('siteStatTotal').textContent = stats.total;
        document.getElementById('siteStatFavorite').textContent = stats.favorites;

        const filteredSites = this.getFilteredSites();
        let html = this.renderToolbar();

        if (this.sites.length === 0) {
            html += `
                <div class="empty-state-large">
                    <span class="empty-icon">🌐</span>
                    <h3>Henüz site eklenmedi</h3>
                    <p>Faydalı siteleri kaydedin ve organize edin</p>
                </div>
            `;
        } else if (filteredSites.length === 0) {
            html += `<p class="empty-state" style="grid-column: 1/-1;">Bu filtreyle eşleşen site yok</p>`;
        } else if (this.viewMode === 'list') {
            html += this.renderListView(filteredSites);
        } else {
            html += this.renderGridView(filteredSites);
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
                <select class="form-select" id="siteCategoryFilter" style="flex: 0 0 auto; min-width: 150px;">
                    <option value="all" ${this.filterCategory === 'all' ? 'selected' : ''}>🏷️ Tüm Kategoriler</option>
                    ${catOptions}
                </select>
                <div style="flex: 1;"></div>
                <div style="display: flex; gap: 4px;">
                    <button class="btn btn-secondary btn-icon" id="siteGridView" style="${this.viewMode === 'grid' ? 'background: var(--accent-purple); color: white;' : ''}">▦</button>
                    <button class="btn btn-secondary btn-icon" id="siteListView" style="${this.viewMode === 'list' ? 'background: var(--accent-purple); color: white;' : ''}">☰</button>
                </div>
            </div>
        `;
    },

    renderGridView(sites) {
        return sites.map(site => `
            <div class="module-card" data-id="${site.id}">
                <div class="module-card-header">
                    <div class="module-card-icon">${site.icon}</div>
                    <div class="module-card-actions">
                        <button class="module-card-btn toggle-fav" title="${site.isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}" style="opacity: 1; ${site.isFavorite ? 'color: #f59e0b;' : ''}">${site.isFavorite ? '⭐' : '☆'}</button>
                        <button class="module-card-btn edit-site" title="Düzenle">✏️</button>
                        <button class="module-card-btn delete-site" title="Sil">🗑️</button>
                    </div>
                </div>
                <h4 class="module-card-title">${site.title}</h4>
                <p class="module-card-subtitle">${site.description || site.url}</p>
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                    <span style="padding: 4px 12px; background: var(--bg-tertiary); border-radius: 20px; font-size: 12px; color: var(--text-secondary);">${site.category}</span>
                    <span style="padding: 4px 12px; background: var(--bg-tertiary); border-radius: 20px; font-size: 12px; color: var(--text-muted);">👁 ${site.visitCount}</span>
                </div>
                <button class="btn btn-primary" style="width: 100%; margin-top: 16px;" onclick="Sites.visit('${site.id}')">
                    🔗 Siteyi Aç
                </button>
            </div>
        `).join('');
    },

    renderListView(sites) {
        // Kategoriye göre grupla
        const grouped = {};
        sites.forEach(site => {
            const cat = site.category || 'Genel';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(site);
        });

        let html = '<div style="grid-column: 1/-1; display: flex; flex-direction: column; gap: 24px;">';

        for (const category of Object.keys(grouped)) {
            const catSites = grouped[category];
            html += `
                <div class="list-group">
                    <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 12px;">
                        🏷️ ${category} <span style="font-weight: 400; color: var(--text-muted);">(${catSites.length})</span>
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${catSites.map(site => `
                            <div class="list-item" data-id="${site.id}" style="display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: var(--bg-card); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                                <span style="font-size: 24px;">${site.icon}</span>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                                        ${site.title}
                                        ${site.isFavorite ? '<span style="color: #f59e0b;">⭐</span>' : ''}
                                    </div>
                                    <div style="font-size: 13px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${site.url}</div>
                                </div>
                                <span style="font-size: 13px; color: var(--text-muted);">👁 ${site.visitCount}</span>
                                <button class="btn btn-primary" style="padding: 8px 16px; font-size: 13px;" onclick="Sites.visit('${site.id}')">Aç</button>
                                <div style="display: flex; gap: 4px;">
                                    <button class="btn btn-secondary btn-icon toggle-fav" style="width: 36px; height: 36px; ${site.isFavorite ? 'color: #f59e0b;' : ''}">${site.isFavorite ? '⭐' : '☆'}</button>
                                    <button class="btn btn-secondary btn-icon edit-site" style="width: 36px; height: 36px;">✏️</button>
                                    <button class="btn btn-secondary btn-icon delete-site" style="width: 36px; height: 36px;">🗑️</button>
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
        document.getElementById('siteCategoryFilter')?.addEventListener('change', (e) => {
            this.filterCategory = e.target.value;
            this.render();
        });

        document.getElementById('siteGridView')?.addEventListener('click', () => {
            this.viewMode = 'grid';
            this.render();
        });

        document.getElementById('siteListView')?.addEventListener('click', () => {
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
            item.querySelector('.edit-site')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showEditModal(id);
            });
            item.querySelector('.delete-site')?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Bu siteyi silmek istediğinizden emin misiniz?')) this.remove(id);
            });
        });
    },

    showAddModal() {
        const modalBody = document.getElementById('modalBody');
        document.getElementById('modalTitle').textContent = 'Yeni Site Ekle';

        const catOptions = this.categories.map(c => `<option value="${c}">${c}</option>`).join('');

        modalBody.innerHTML = `
            <form id="siteForm">
                <div class="form-group">
                    <label class="form-label">Site Adı *</label>
                    <input type="text" class="form-input" name="title" required placeholder="Örn: Udemy">
                </div>
                <div class="form-group">
                    <label class="form-label">URL *</label>
                    <input type="url" class="form-input" name="url" required placeholder="https://example.com">
                </div>
                <div class="form-group">
                    <label class="form-label">Kategori</label>
                    <select class="form-select" name="category">
                        ${catOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">İkon</label>
                    <select class="form-select" name="icon">
                        <option value="🌐">🌐 Web</option>
                        <option value="📚">📚 Eğitim</option>
                        <option value="🛠️">🛠️ Araç</option>
                        <option value="📰">📰 Haber</option>
                        <option value="💼">💼 İş</option>
                        <option value="🎬">🎬 Video</option>
                        <option value="🎵">🎵 Müzik</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Açıklama</label>
                    <textarea class="form-textarea" name="description" placeholder="Site hakkında kısa açıklama..."></textarea>
                </div>
                <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">Ekle</button>
                </div>
            </form>
        `;

        App.openModal();

        document.getElementById('siteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.add({
                title: formData.get('title'),
                url: formData.get('url'),
                category: formData.get('category'),
                icon: formData.get('icon'),
                description: formData.get('description')
            });
            App.closeModal();
        });
    },

    showEditModal(id) {
        const site = this.sites.find(s => s.id === id);
        if (!site) return;

        const modalBody = document.getElementById('modalBody');
        document.getElementById('modalTitle').textContent = 'Site Düzenle';

        modalBody.innerHTML = `
            <form id="siteEditForm">
                <div class="form-group">
                    <label class="form-label">Site Adı *</label>
                    <input type="text" class="form-input" name="title" required value="${site.title}">
                </div>
                <div class="form-group">
                    <label class="form-label">URL *</label>
                    <input type="url" class="form-input" name="url" required value="${site.url}">
                </div>
                <div class="form-group">
                    <label class="form-label">Açıklama</label>
                    <textarea class="form-textarea" name="description">${site.description || ''}</textarea>
                </div>
                <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">Kaydet</button>
                </div>
            </form>
        `;

        App.openModal();

        document.getElementById('siteEditForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.update(id, {
                title: formData.get('title'),
                url: formData.get('url'),
                description: formData.get('description')
            });
            App.closeModal();
        });
    }
};
