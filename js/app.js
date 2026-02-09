/**
 * Life OS - Main App Module v2.2
 * Login sistemi ve ana uygulama kontrolü
 */

const App = {
    currentPage: 'dashboard',
    userName: '',

    init() {
        // Auth modülünü başlat (lockout kontrolü)
        Auth.init();

        // Kullanıcı var mı kontrol et
        const users = Auth.getUsers();

        if (users.length === 0) {
            // Hiç kullanıcı yoksa -> Kayıt Ekranı (İlk Kurulum)
            this.renderRegisterUI('setup');
        } else {
            // Kullanıcı varsa -> Giriş Ekranı
            this.renderLoginUI();
        }
    },

    /**
     * Giriş Ekranını Render Et
     */
    renderLoginUI() {
        const overlay = document.getElementById('login-overlay');
        overlay.style.display = 'flex';

        overlay.innerHTML = `
            <div class="auth-card">
                <div class="auth-logo-container" style="margin-bottom: 24px;">
                    <div class="logo-icon-modern" style="width: 48px; height: 48px; font-size: 24px; margin: 0 auto 12px;">
                        <span>L</span>
                    </div>
                    <span class="logo-text-modern" style="font-size: 28px;">Life<span class="logo-accent">OS</span></span>
                </div>
                <h2 class="auth-title">Tekrar Hoşgeldiniz</h2>
                <p class="auth-subtitle">Devam etmek için giriş yapın</p>
                
                <div id="authError" class="auth-error"></div>

                <form id="loginForm" class="auth-form">
                    <div class="form-group">
                        <input type="text" id="username" class="form-input" placeholder="Kullanıcı Adı" required>
                    </div>
                    <div class="form-group">
                        <input type="password" id="password" class="form-input" placeholder="Şifre" required>
                    </div>
                    <button type="submit" class="btn btn-primary auth-btn" id="loginBtn">Giriş Yap</button>
                    
                    <div class="auth-switch">
                        Yeni kullanıcı mısın? <a onclick="App.renderRegisterUI()">Hesap Oluştur</a>
                    </div>
                </form>
            </div>
        `;

        // Lockout kontrolü
        if (Auth.isLockedOut()) {
            this.showLockoutMessage();
            return;
        }

        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    },

    /**
     * Kayıt Ekranını Render Et
     */
    renderRegisterUI(mode = 'normal') {
        const overlay = document.getElementById('login-overlay');
        overlay.style.display = 'flex';

        const isSetup = mode === 'setup';

        overlay.innerHTML = `
            <div class="auth-card">
                <div class="auth-logo-container" style="margin-bottom: 24px;">
                    <div class="logo-icon-modern" style="width: 48px; height: 48px; font-size: 24px; margin: 0 auto 12px;">
                        <span>L</span>
                    </div>
                    <span class="logo-text-modern" style="font-size: 28px;">Life<span class="logo-accent">OS</span></span>
                </div>
                <h2 class="auth-title">${isSetup ? 'LifeOS Kurulumu' : 'Yeni Hesap Oluştur'}</h2>
                <p class="auth-subtitle">
                    ${isSetup
                ? 'Verilerinizi korumak için ilk yönetici hesabını oluşturun.<br><small>Mevcut verileriniz bu hesaba aktarılacaktır.</small>'
                : 'Kendinize ait yeni bir alan oluşturun.'}
                </p>
                
                <div id="authError" class="auth-error"></div>

                <form id="registerForm" class="auth-form">
                    <div class="form-group">
                        <input type="text" id="regUsername" class="form-input" placeholder="Kullanıcı Adı" required>
                    </div>
                    <div class="form-group">
                        <input type="password" id="regPassword" class="form-input" placeholder="Şifre" required>
                    </div>
                    <div class="form-group">
                        <input type="password" id="regPasswordConfirm" class="form-input" placeholder="Şifre (Tekrar)" required>
                    </div>
                    <button type="submit" class="btn btn-primary auth-btn">Kayıt Ol</button>
                    
                    ${!isSetup ? `
                    <div class="auth-switch">
                        Zaten hesabın var mı? <a onclick="App.renderLoginUI()">Giriş Yap</a>
                    </div>
                    ` : ''}
                </form>
            </div>
        `;

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
    },

    /**
     * Giriş İşlemi
     */
    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('authError');
        const btn = document.getElementById('loginBtn');

        const result = Auth.login(username, password);

        if (result.success) {
            this.userName = result.user.username;
            this.showApp();
        } else {
            errorEl.style.display = 'block';
            errorEl.textContent = result.message;

            // Animasyon (salla)
            const card = document.querySelector('.auth-card');
            card.classList.add('shake'); // CSS'de shake eklemek lazım, şimdilik basit kalsın

            if (Auth.isLockedOut()) {
                this.showLockoutMessage();
            }
        }
    },

    /**
     * Lockout Mesajı
     */
    showLockoutMessage() {
        const btn = document.getElementById('loginBtn');
        const errorEl = document.getElementById('authError');
        if (btn) btn.disabled = true;

        const updateTimer = () => {
            const remaining = Math.ceil((Auth.getLockoutTime() - Date.now()) / 1000);
            if (remaining <= 0) {
                if (btn) btn.disabled = false;
                if (btn) btn.textContent = 'Giriş Yap';
                if (errorEl) errorEl.style.display = 'none';
                return;
            }
            if (btn) btn.textContent = `Bekleyin (${Math.ceil(remaining / 60)} dk)`;
            if (errorEl) {
                errorEl.style.display = 'block';
                errorEl.textContent = `Çok fazla hatalı deneme. ${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')} sonra tekrar deneyin.`;
            }
            setTimeout(updateTimer, 1000);
        };
        updateTimer();
    },

    /**
     * Kayıt İşlemi
     */
    handleRegister() {
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regPasswordConfirm').value;
        const errorEl = document.getElementById('authError');

        if (password !== confirm) {
            errorEl.style.display = 'block';
            errorEl.textContent = 'Şifreler eşleşmiyor.';
            return;
        }

        const result = Auth.register(username, password);

        if (result.success) {
            // Kayıt başarılı, otomatik giriş veya login ekranına yönlendir
            // UX kararı: Otomatik giriş yaptıralım
            Auth.login(username, password);
            this.userName = username;

            errorEl.style.display = 'none';
            Notifications.add('Hoşgeldiniz', result.message, 'success');

            this.showApp();
        } else {
            errorEl.style.display = 'block';
            errorEl.textContent = result.message;
        }
    },

    /**
     * Uygulamayı Göster (Giriş Başarılı)
     */
    showApp() {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('app').classList.add('visible');

        // Storage Defaults (artık user prefix ile çalışacak)
        Storage.initializeDefaults();

        // Save last user to settings (optional, for auto-fill maybe?)
        // Storage.save(Storage.KEYS.SETTINGS, { ...Storage.load(Storage.KEYS.SETTINGS), userName: this.userName });

        this.loadTheme();

        // Initialize all modules
        Notifications.init();
        Lessons.init();
        Books.init();
        Sites.init();
        Games.init();
        YouTube.init();
        Planning.init();
        Profile.init();
        HabitTracker.init();
        Exams.init();
        Schedule.init();
        Shows.init();
        Pomodoro.init();
        Notes.init();
        Notes.init();
        Dashboard.init();

        // Optional Drive Sync
        if (window.DriveSync) DriveSync.init();

        this.bindEvents();
        this.updateUserInfo();
        this.showWelcomeNotification();
        this.updateWelcomeDate();

        console.log('🎯 Life OS v2.5 başlatıldı!');
    },

    updateWelcomeDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = now.toLocaleDateString('tr-TR', options);
        const dateEl = document.getElementById('welcomeDate');
        if (dateEl) dateEl.textContent = dateStr;
    },

    updateUserInfo() {
        const initial = this.userName.charAt(0).toUpperCase();
        document.getElementById('userInitial').textContent = initial;
        document.getElementById('welcomeText').textContent = `Merhaba, ${this.userName}!`;

        // Time-based greeting
        const hour = new Date().getHours();
        let subtext;
        if (hour >= 5 && hour < 12) {
            subtext = 'Bugün harika şeyler başarabilirsin. ☀️';
        } else if (hour >= 12 && hour < 18) {
            subtext = 'Öğleden sonra enerjini yüksek tut! 💪';
        } else if (hour >= 18 && hour < 22) {
            subtext = 'Günü değerlendir ve planla. 🌅';
        } else {
            subtext = 'İyi dinlen, yarın yeni bir gün. 🌙';
        }
        document.getElementById('welcomeSubtext').textContent = subtext;
    },

    updateUserDisplay() {
        const settings = Storage.load(Storage.KEYS.SETTINGS, {});
        const name = settings.userName || 'Kullanıcı';
        this.userName = name;

        const initial = name.charAt(0).toUpperCase();
        document.getElementById('userInitial').textContent = initial;
        document.getElementById('welcomeText').textContent = `Merhaba, ${name}!`;
    },

    setTheme(theme) {
        const settings = Storage.load(Storage.KEYS.SETTINGS, {});
        settings.theme = theme;
        Storage.save(Storage.KEYS.SETTINGS, settings);
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon(theme);
    },

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(item.dataset.page);
            });
        });

        // Quick actions on dashboard - new style
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Panel links
        document.querySelectorAll('.panel-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(link.dataset.page);
            });
        });

        // Old style quick actions (keep for compatibility)
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.navigateTo(page);
                setTimeout(() => {
                    const addBtns = {
                        lessons: 'addLessonBtn',
                        books: 'addBookBtn',
                        games: 'addGameBtn',
                        planning: 'addTaskBtn'
                    };
                    document.getElementById(addBtns[page])?.click();
                }, 100);
            });
        });

        // Card links
        document.querySelectorAll('.card-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(link.dataset.page);
            });
        });

        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });

        // Export button
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportData();
        });

        // Mobile menu
        document.getElementById('menuToggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // Modal
        document.getElementById('closeModal')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') {
                this.closeModal();
            }
        });

        // Notifications button - FIXED: better event binding
        const notifBtn = document.getElementById('notificationBtn');
        if (notifBtn) {
            notifBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                Notifications.togglePanel();
            });
        }

        document.getElementById('closeNotifications')?.addEventListener('click', () => {
            Notifications.closePanel();
        });

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                Notifications.closePanel();
            }
        });

        // Sidebar close on outside click (mobile)
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const menuToggle = document.getElementById('menuToggle');

            if (window.innerWidth <= 1024 &&
                sidebar.classList.contains('open') &&
                !sidebar.contains(e.target) &&
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });

        // User avatar click - go to profile
        document.getElementById('userAvatar')?.addEventListener('click', () => {
            this.navigateTo('profile');
        });
    },

    handleQuickAction(action) {
        const actionMap = {
            addLesson: { page: 'lessons', btn: 'addLessonBtn' },
            addBook: { page: 'books', btn: 'addBookBtn' },
            addTask: { page: 'planning', btn: 'addTaskBtn' },
            addGame: { page: 'games', btn: 'addGameBtn' }
        };

        const config = actionMap[action];
        if (config) {
            this.navigateTo(config.page);
            setTimeout(() => {
                document.getElementById(config.btn)?.click();
            }, 100);
        }
    },

    navigateTo(page) {
        this.currentPage = page;

        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Show page
        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === `page-${page}`);
        });

        // Update title
        const titles = {
            dashboard: 'Dashboard',
            lessons: 'Dersler',
            books: 'Kitaplar',
            sites: 'Siteler',
            games: 'Oyunlar',
            youtube: 'YouTube',
            planning: 'Yapılacaklar',
            profile: 'Profil',
            habits: 'Zinciri Kırma',
            exams: 'Sınavlar',
            shows: 'Dizi / Film',
            schedule: 'Ders Programı',
            pomodoro: 'Pomodoro',
            notes: 'Not Defteri'
        };
        document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';

        // Close sidebar on mobile
        document.getElementById('sidebar').classList.remove('open');

        // Refresh page
        this.refreshPage(page);
    },

    refreshPage(page) {
        switch (page) {
            case 'dashboard': Dashboard.render(); break;
            case 'lessons': Lessons.render(); break;
            case 'books': Books.render(); break;
            case 'sites': Sites.render(); break;
            case 'games': Games.render(); break;
            case 'youtube': YouTube.render(); break;
            case 'planning': Planning.render(); break;
            case 'habits': HabitTracker.render(); break;
            case 'exams': Exams.render(); break;
            case 'shows': Shows.render(); break;
            case 'schedule': Schedule.render(); break;
            case 'pomodoro': Pomodoro.render(); break;
            case 'notes': Notes.render(); break;
            case 'profile': Profile.render(); break;
        }
    },

    loadTheme() {
        const settings = Storage.load(Storage.KEYS.SETTINGS, {});
        const theme = settings.theme || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon(theme);
    },

    toggleTheme() {
        const settings = Storage.load(Storage.KEYS.SETTINGS, {});
        const currentTheme = settings.theme || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        settings.theme = newTheme;
        Storage.save(Storage.KEYS.SETTINGS, settings);

        document.documentElement.setAttribute('data-theme', newTheme);
        this.updateThemeIcon(newTheme);

        Notifications.showToast(
            'Tema Değiştirildi',
            newTheme === 'dark' ? 'Karanlık mod aktif' : 'Aydınlık mod aktif',
            'info'
        );
    },

    updateThemeIcon(theme) {
        const icon = document.querySelector('.theme-icon');
        if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';
    },

    openModal() {
        document.getElementById('modalOverlay').classList.add('open');
    },

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('open');
    },

    showWelcomeNotification() {
        const settings = Storage.load(Storage.KEYS.SETTINGS, {});
        const today = new Date().toDateString();

        if (settings.lastVisit !== today) {
            const hour = new Date().getHours();
            let greeting;

            if (hour >= 5 && hour < 12) {
                greeting = 'Günaydın! Harika bir gün olsun.';
            } else if (hour >= 12 && hour < 18) {
                greeting = 'İyi günler! Verimli bir öğleden sonra dileriz.';
            } else if (hour >= 18 && hour < 22) {
                greeting = 'İyi akşamlar! Günü değerlendirme zamanı.';
            } else {
                greeting = 'İyi geceler! Yarın için planlarınızı gözden geçirin.';
            }

            const streak = settings.streak || 0;
            if (streak > 0) {
                greeting += ` 🔥 ${streak} günlük seriniz var!`;
            }

            Notifications.add(`Hoşgeldin, ${this.userName}! 🎯`, greeting, 'info');

            settings.lastVisit = today;
            Storage.save(Storage.KEYS.SETTINGS, settings);
        }
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

        Notifications.add(
            'Veri Dışa Aktarıldı 💾',
            'Yedek dosyası indirildi. Google Drive\'a yükleyebilirsiniz.',
            'success'
        );
    },

    /**
     * Çıkış yap - oturumu kapat
     */
    logout() {
        if (!confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
            return;
        }

        // Kullanıcı adını temizle (veriler korunur)
        const settings = Storage.load(Storage.KEYS.SETTINGS, {});
        delete settings.userName;
        Storage.save(Storage.KEYS.SETTINGS, settings);

        // UI'ı gizle ve login'e dön
        document.getElementById('app').classList.remove('visible');
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('userName').value = '';

        Notifications.showToast('Çıkış Yapıldı', 'Oturum kapatıldı.', 'info');
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => {
    App.init();

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker Registered 📡', reg.scope))
            .catch(err => console.log('Service Worker Fail ❌', err));
    }
});
