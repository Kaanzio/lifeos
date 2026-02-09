/**
 * Life OS - Authentication Module
 * Kullanıcı yönetimi, giriş, kayıt ve güvenlik
 */

const Auth = {
    currentUser: null,
    lockoutDuration: 10 * 60 * 1000, // 10 minutes

    init() {
        this.checkLockout();
    },

    /**
     * Kullanıcı listesini getir
     */
    getUsers() {
        try {
            return JSON.parse(localStorage.getItem('lifeos_users') || '[]');
        } catch {
            return [];
        }
    },

    /**
     * Kullanıcı kaydet
     */
    saveUser(user) {
        const users = this.getUsers();
        users.push(user);
        localStorage.setItem('lifeos_users', JSON.stringify(users));
    },

    /**
     * Kullanıcı var mı kontrol et
     */
    userExists(username) {
        const users = this.getUsers();
        return users.some(u => u.username.toLowerCase() === username.toLowerCase());
    },

    /**
     * Yeni Kullanıcı Kaydı
     */
    register(username, password) {
        if (!username || !password) return { success: false, message: 'Kullanıcı adı ve şifre gereklidir.' };
        if (this.userExists(username)) return { success: false, message: 'Bu kullanıcı adı zaten alınmış.' };

        const isFirstUser = this.getUsers().length === 0;

        const newUser = {
            id: Date.now().toString(36),
            username: username,
            password: this.hashPassword(password),
            createdAt: new Date().toISOString()
        };

        this.saveUser(newUser);

        // Eğer ilk kullanıcıysa, mevcut verileri bu kullanıcıya migrate et
        if (isFirstUser) {
            this.migrateLegacyData(username);
        }

        return { success: true, message: 'Kayıt başarılı!' };
    },

    /**
     * Şifre Değiştir
     */
    changePassword(username, oldPassword, newPassword) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());

        if (userIndex === -1) {
            return { success: false, message: 'Kullanıcı bulunamadı.' };
        }

        const user = users[userIndex];
        if (user.password !== this.hashPassword(oldPassword)) {
            return { success: false, message: 'Eski şifre hatalı.' };
        }

        user.password = this.hashPassword(newPassword);
        users[userIndex] = user;
        localStorage.setItem('lifeos_users', JSON.stringify(users));

        return { success: true, message: 'Şifreniz başarıyla değiştirildi.' };
    },

    /**
     * Giriş Yap
     */
    login(username, password) {
        if (this.isLockedOut()) {
            const remaining = Math.ceil((this.getLockoutTime() - Date.now()) / 60000);
            return { success: false, message: `Çok fazla hatalı deneme. Lütfen ${remaining} dakika bekleyin.` };
        }

        const users = this.getUsers();
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

        if (user && user.password === this.hashPassword(password)) {
            this.currentUser = user;
            this.resetAttempts();
            Storage.setUser(user.username); // Storage modülüne kullanıcıyı bildir
            return { success: true, user: user };
        } else {
            this.recordFailedAttempt();
            const attempts = this.getAttempts();
            return { success: false, message: 'Kullanıcı adı veya şifre hatalı.', attempts: attempts };
        }
    },

    /**
     * Basit Password Hash (Client-side obfuscation)
     */
    hashPassword(string) {
        let hash = 0;
        if (string.length === 0) return hash;
        for (let i = 0; i < string.length; i++) {
            const char = string.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    },

    /**
     * Hatalı Deneme Yönetimi
     */
    getAttempts() {
        const data = JSON.parse(localStorage.getItem('lifeos_auth_lockout') || '{}');
        return data.attempts || 0;
    },

    getLockoutTime() {
        const data = JSON.parse(localStorage.getItem('lifeos_auth_lockout') || '{}');
        return data.lockUntil || 0;
    },

    recordFailedAttempt() {
        const data = JSON.parse(localStorage.getItem('lifeos_auth_lockout') || '{}');
        data.attempts = (data.attempts || 0) + 1;

        if (data.attempts >= 5) {
            data.lockUntil = Date.now() + this.lockoutDuration;
        }

        localStorage.setItem('lifeos_auth_lockout', JSON.stringify(data));
    },

    resetAttempts() {
        localStorage.removeItem('lifeos_auth_lockout');
    },

    isLockedOut() {
        const lockUntil = this.getLockoutTime();
        return lockUntil > Date.now();
    },

    checkLockout() {
        if (this.isLockedOut()) {
            return true;
        }
        // Süre dolduysa sıfırla ama attempts kalsın mı? Hayır, sıfırla.
        if (this.getLockoutTime() > 0 && Date.now() > this.getLockoutTime()) {
            this.resetAttempts();
        }
        return false;
    },

    /**
     * Eski Verileri Migrate Et
     */
    migrateLegacyData(username) {
        console.log(`Migrating legacy data to user: ${username}`);
        const prefix = `user_${username}_`;

        // Storage.KEYS içindeki tüm keyleri bul ve taşı
        Object.values(Storage.KEYS).forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                localStorage.setItem(prefix + key, data);
                // İsteğe bağlı: Eski veriyi silmeyelim, güvenlik yedeği kalsın
                // localStorage.removeItem(key); 
            }
        });

        // Modül bazlı hardcoded keyler varsa onları da taşı (örn: lifeos_pomodoro, lifeos_schedule)
        const specificKeys = ['lifeos_pomodoro', 'lifeos_schedule', 'lifeos_shows', 'lifeos_notes'];
        specificKeys.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                localStorage.setItem(prefix + key, data);
            }
        });
    }
};
