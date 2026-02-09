/**
 * Life OS - Profile Module v2
 * Kullanıcı profili ve ayarları yönetimi - Emoji avatar desteği ile
 */

const Profile = {
    profile: null,
    showEmojiPicker: false,

    // Avatar için kullanılabilecek emojiler
    avatarEmojis: [
        '😀', '😎', '🤓', '🧑‍💻', '👨‍🎓', '👩‍🎓', '🧑‍🔬', '👨‍🔬', '👩‍🔬',
        '🦸', '🧙', '🧑‍🚀', '👑', '🐱', '🐶', '🦊', '🦁', '🐼',
        '🐸', '🦉', '🦋', '🌟', '⚡', '🔥', '💎', '🎯', '🎨',
        '🎵', '🎮', '⚗️', '🔬', '🔩', '⚙️', '💻', '📚', '✨'
    ],

    init() {
        this.loadProfile();
        this.bindEvents();
        this.render();
    },

    loadProfile() {
        this.profile = Storage.load('lifeos_profile', {
            name: '',
            university: '',
            department: 'Metalurji ve Malzeme Mühendisliği',
            year: '1',
            avatarColor: '#8b5cf6',
            avatarEmoji: '',
            profileBgColor: '' // Profil kartı arkaplan rengi
        });
    },

    saveProfile() {
        Storage.save('lifeos_profile', this.profile);
    },

    bindEvents() {
        // Save profile button
        document.getElementById('saveProfileBtn')?.addEventListener('click', () => {
            this.saveProfileForm();
        });

        // Theme options
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                App.setTheme(theme);
                this.updateThemeButtons();
            });
        });
    },

    saveProfileForm() {
        const name = document.getElementById('profileNameInput')?.value || '';
        const university = document.getElementById('profileUniversity')?.value || '';
        const department = document.getElementById('profileDepartment')?.value || '';
        const year = document.getElementById('profileYear')?.value || '1';

        this.profile.name = name;
        this.profile.university = university;
        this.profile.department = department;
        this.profile.year = year;

        // Update settings
        const settings = Storage.load(Storage.KEYS.SETTINGS, {});
        settings.userName = name;
        Storage.save(Storage.KEYS.SETTINGS, settings);

        this.saveProfile();
        this.render();
        App.updateUserDisplay();

        Notifications.add('Profil Güncellendi', 'Bilgileriniz başarıyla kaydedildi.', 'success');
    },

    setAvatarColor(color) {
        this.profile.avatarColor = color;
        this.saveProfile();
        this.render();
        this.applyAvatarStyle();
    },

    setAvatarEmoji(emoji) {
        this.profile.avatarEmoji = emoji;
        this.saveProfile();
        this.render();
        this.applyAvatarStyle();
        this.toggleEmojiPicker();
    },

    clearAvatarEmoji() {
        this.profile.avatarEmoji = '';
        this.saveProfile();
        this.render();
        this.applyAvatarStyle();
    },

    toggleEmojiPicker() {
        this.showEmojiPicker = !this.showEmojiPicker;
        const picker = document.getElementById('emojiPickerGrid');
        if (picker) {
            picker.style.display = this.showEmojiPicker ? 'grid' : 'none';
        }
    },

    applyAvatarStyle() {
        const color = this.profile.avatarColor || '#8b5cf6';
        const emoji = this.profile.avatarEmoji || '';
        const settings = Storage.load(Storage.KEYS.SETTINGS, {});
        const name = this.profile.name || settings.userName || 'Kullanıcı';
        const initial = name.charAt(0).toUpperCase();

        // Apply to all avatars
        document.querySelectorAll('.user-avatar, .profile-avatar-large').forEach(el => {
            el.style.background = emoji ? 'var(--bg-tertiary)' : color;
            const innerEl = el.querySelector('span');
            if (innerEl) {
                innerEl.textContent = emoji || initial;
                innerEl.style.fontSize = emoji ? (el.classList.contains('profile-avatar-large') ? '50px' : '24px') : '';
            }
        });

        // Update active color button
        document.querySelectorAll('.avatar-color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === color);
        });
    },

    updateThemeButtons() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === currentTheme);
        });
    },

    exportData() {
        const data = Storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lifeos-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        Notifications.add('Veri Dışa Aktarıldı', 'Yedekleme dosyası indirildi.', 'success');
    },

    showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        if (Storage.importData(ev.target.result)) {
                            Notifications.add('Veri İçe Aktarıldı', 'Verileriniz başarıyla yüklendi. Sayfa yenileniyor...', 'success');
                            setTimeout(() => location.reload(), 1500);
                        } else {
                            Notifications.add('Hata', 'Veri içe aktarılamadı.', 'error');
                        }
                    } catch (err) {
                        Notifications.add('Hata', 'Geçersiz dosya formatı.', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    },

    confirmClearData() {
        if (confirm('⚠️ Tüm verileriniz silinecek!\n\nBu işlem geri alınamaz. Devam etmek istiyor musunuz?')) {
            if (confirm('Emin misiniz? Tüm dersler, kitaplar, oyunlar ve görevler silinecek.')) {
                Storage.clearAll();
                Notifications.add('Veriler Silindi', 'Tüm verileriniz temizlendi. Sayfa yenileniyor...', 'info');
                setTimeout(() => location.reload(), 1500);
            }
        }
    },

    getStats() {
        const lessonStats = Lessons?.getStats?.() || { total: 0 };
        const bookStats = Books?.books?.length || 0;
        const taskStats = Planning?.tasks?.length || 0;
        const gameStats = Games?.games?.length || 0;

        return {
            lessons: lessonStats.total || 0,
            books: bookStats,
            tasks: taskStats,
            games: gameStats
        };
    },

    render() {
        const stats = this.getStats();
        const settings = Storage.load(Storage.KEYS.SETTINGS, {});
        const name = this.profile.name || settings.userName || 'Kullanıcı';
        const emoji = this.profile.avatarEmoji || '';

        // Profile card
        document.getElementById('profileName').textContent = name;

        const initialEl = document.getElementById('profileInitialLarge');
        if (initialEl) {
            initialEl.textContent = emoji || name.charAt(0).toUpperCase();
            initialEl.style.fontSize = emoji ? '50px' : '';
        }

        // Form inputs
        const nameInput = document.getElementById('profileNameInput');
        if (nameInput) nameInput.value = this.profile.name || settings.userName || '';

        const uniInput = document.getElementById('profileUniversity');
        if (uniInput) uniInput.value = this.profile.university || '';

        const deptInput = document.getElementById('profileDepartment');
        if (deptInput) deptInput.value = this.profile.department || 'Metalurji ve Malzeme Mühendisliği';

        const yearInput = document.getElementById('profileYear');
        if (yearInput) yearInput.value = this.profile.year || '1';

        // Stats
        const lessonsEl = document.getElementById('profileStatLessons');
        if (lessonsEl) lessonsEl.textContent = stats.lessons;

        const booksEl = document.getElementById('profileStatBooks');
        if (booksEl) booksEl.textContent = stats.books;

        const tasksEl = document.getElementById('profileStatTasks');
        if (tasksEl) tasksEl.textContent = stats.tasks;

        const gamesEl = document.getElementById('profileStatGames');
        if (gamesEl) gamesEl.textContent = stats.games;

        // Render emoji picker section
        this.renderEmojiPicker();

        // Render Security Section
        const securityContainer = document.getElementById('securitySettingsContainer');
        if (securityContainer) {
            securityContainer.innerHTML = this.renderSecuritySection();
        }

        // Apply avatar style and profile bg
        this.applyAvatarStyle();
        this.applyProfileBgColor();
        this.updateThemeButtons();
    },

    renderEmojiPicker() {
        const container = document.getElementById('emojiPickerContainer');
        if (!container) return;

        const emoji = this.profile.avatarEmoji || '';
        const color = this.profile.avatarColor || '#8b5cf6';

        container.innerHTML = `
            <label class="form-label">Profil Resmi (Emoji)</label>
            <div style="display: flex; gap: 16px; align-items: flex-start; margin-bottom: 16px;">
                <div class="emoji-selected" onclick="Profile.toggleEmojiPicker()" title="Emoji Seç">
                    ${emoji || '👤'}
                </div>
                <div style="flex: 1;">
                    <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 8px;">
                        Profiliniz için bir emoji seçin
                    </p>
                    ${emoji ? `<button class="btn btn-secondary" onclick="Profile.clearAvatarEmoji()" style="font-size: 12px;">Emojiyi Kaldır</button>` : ''}
                </div>
            </div>
            <div class="emoji-grid" id="emojiPickerGrid" style="display: ${this.showEmojiPicker ? 'grid' : 'none'};">
                ${this.avatarEmojis.map(e => `
                    <span class="emoji-option" onclick="Profile.setAvatarEmoji('${e}')">${e}</span>
                `).join('')}
            </div>
            
            <label class="form-label" style="margin-top: 16px;">Avatar Rengi</label>
            <div id="avatarColors" style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#6366f1'].map(c => `
                    <button class="avatar-color-btn ${color === c ? 'active' : ''}" data-color="${c}" 
                            style="width: 36px; height: 36px; border-radius: 50%; border: 2px solid ${color === c ? 'white' : 'transparent'}; 
                            background: ${c}; cursor: pointer;" 
                            onclick="Profile.setAvatarColor('${c}')">
                    </button>
                `).join('')}
            </div>

            <label class="form-label" style="margin-top: 16px;">Profil Kartı Arkaplan Rengi</label>
            <div class="profile-bg-colors" style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${this.getBackgroundColors().map(bg => `
                    <button class="profile-bg-color-btn ${this.profile.profileBgColor === bg.value ? 'active' : ''}" 
                            style="width: 40px; height: 40px; border-radius: 8px; border: 2px solid ${this.profile.profileBgColor === bg.value ? 'white' : 'transparent'}; 
                            background: ${bg.value}; cursor: pointer;" 
                            onclick="Profile.setProfileBgColor('${bg.value}')" title="${bg.name}">
                    </button>
                `).join('')}
                <button class="profile-bg-color-btn ${!this.profile.profileBgColor ? 'active' : ''}" 
                        style="width: 40px; height: 40px; border-radius: 8px; border: 2px solid ${!this.profile.profileBgColor ? 'white' : 'var(--border-color)'}; 
                        background: var(--bg-card); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px;" 
                        onclick="Profile.setProfileBgColor('')" title="Varsayılan">
                    ✕
                </button>
            </div>
        `;
    },

    renderSecuritySection() {
        return `
            <div class="profile-form">
                <div class="form-group">
                    <label class="form-label">Mevcut Şifre</label>
                    <input type="password" id="currentPassword" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">Yeni Şifre</label>
                    <input type="password" id="newPassword" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">Yeni Şifre (Tekrar)</label>
                    <input type="password" id="newPasswordConfirm" class="form-input">
                </div>
                <button type="button" class="btn btn-secondary" onclick="Profile.handleChangePassword()" style="margin-top: 8px;">
                    🔑 Şifreyi Değiştir
                </button>
            </div>
        `;
    },

    handleChangePassword() {
        const currentPass = document.getElementById('currentPassword').value;
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('newPasswordConfirm').value;

        if (!currentPass || !newPass || !confirmPass) {
            Notifications.add('Hata', 'Lütfen tüm alanları doldurun.', 'error');
            return;
        }

        if (newPass !== confirmPass) {
            Notifications.add('Hata', 'Yeni şifreler eşleşmiyor.', 'error');
            return;
        }

        if (newPass.length < 4) {
            Notifications.add('Hata', 'Şifre en az 4 karakter olmalıdır.', 'warning');
            return;
        }

        // Get current username from settings or App
        const settings = Storage.load(Storage.KEYS.SETTINGS, {});
        const username = settings.userName;

        if (!username) {
            Notifications.add('Hata', 'Kullanıcı oturumu bulunamadı.', 'error');
            return;
        }

        const result = Auth.changePassword(username, currentPass, newPass);

        if (result.success) {
            Notifications.add('Başarılı', result.message, 'success');
            // Clear inputs
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('newPasswordConfirm').value = '';
        } else {
            Notifications.add('Hata', result.message, 'error');
        }
    },

    getBackgroundColors() {
        return [
            { name: 'Mor Gradyan', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            { name: 'Mavi Gradyan', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
            { name: 'Yeşil Gradyan', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
            { name: 'Turuncu Gradyan', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
            { name: 'Gece', value: 'linear-gradient(135deg, #0c0c1e 0%, #1a1a3e 100%)' },
            { name: 'Koyu Mor', value: 'linear-gradient(135deg, #1a0533 0%, #3a1c71 100%)' },
            { name: 'Deniz', value: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' },
            { name: 'Orman', value: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' }
        ];
    },

    setProfileBgColor(color) {
        this.profile.profileBgColor = color;
        this.saveProfile();
        this.applyProfileBgColor();
        this.renderEmojiPicker();
    },

    applyProfileBgColor() {
        const card = document.querySelector('.profile-card');
        if (card && this.profile.profileBgColor) {
            card.style.background = this.profile.profileBgColor;
        } else if (card) {
            card.style.background = '';
        }
    }
};
