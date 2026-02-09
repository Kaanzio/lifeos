/**
 * Life OS - Dashboard Module v2.3
 * Ana panel istatistikleri ve özet görünümü - Canlı geri sayım güncellemesi
 */

const Dashboard = {
    timerInterval: null,

    init() {
        this.render();
    },

    render() {
        this.updateStats();
        this.updateTodayTasks();
        this.updateHabitChain();
        this.updateUpcoming();
        this.updateQuote();
        this.markToday();
    },

    // Motivational quotes from famous people
    quotes: [
        { text: "Başarı, her gün tekrarlanan küçük çabaların toplamıdır.", author: "Robert Collier" },
        { text: "Dün yapamadığını bugün yap, yarını bekleyenlerden olma.", author: "Atatürk" },
        { text: "Başarının sırrı, başlamaktır.", author: "Mark Twain" },
        { text: "Bugün yapmak istemediğin şey, yarın yapamayacağın şey olacak.", author: "Paulo Coelho" },
        { text: "Hayatı seven insan, zamanı boşa harcamaz; çünkü hayat bundan ibarettir.", author: "Benjamin Franklin" },
        { text: "Dünün en büyük zaferlerinden bile öğrenecek çok şey var.", author: "Confucius" },
        { text: "Her gün bir adım at. Sonunda varacaksın.", author: "Lao Tzu" },
        { text: "Hayal etmeyi bırakma, çünkü hayaller gerçek olabilir.", author: "Walt Disney" },
        { text: "Başarısızlık, başarıya giden yolda sadece bir duraklamadır.", author: "Thomas Edison" },
        { text: "İyi bir plan bugün, mükemmel bir plandan yarın daha iyidir.", author: "George S. Patton" },
        { text: "Kendine inan, yarıyolundasın.", author: "Theodore Roosevelt" },
        { text: "Çalışmak, dua etmektir.", author: "Latin Atasözü" }
    ],

    updateQuote() {
        const quoteEl = document.getElementById('dailyQuote');
        const authorEl = document.getElementById('quoteAuthor');
        if (!quoteEl || !authorEl) return;

        // Pick a random quote on each page load
        const index = Math.floor(Math.random() * this.quotes.length);
        const quote = this.quotes[index];

        quoteEl.textContent = `"${quote.text}"`;
        authorEl.textContent = quote.author;
    },

    updateHabitChain() {
        const container = document.getElementById('dashboardHabitChain');
        if (!container) return;

        // Use HabitTracker if it exists
        if (typeof HabitTracker !== 'undefined' && HabitTracker.chains?.length > 0) {
            const chain = HabitTracker.chains[0]; // First chain
            const streak = HabitTracker.calculateStreak(chain);
            const days = HabitTracker.getLast28Days().slice(-14); // Last 14 days for dashboard

            container.innerHTML = `
                <div class="dashboard-habit-grid">
                    ${days.map(d => {
                const isCompleted = chain.completedDays.includes(d.dateStr);
                return `
                            <div class="dashboard-habit-day ${isCompleted ? 'completed' : ''} ${d.isToday ? 'today' : ''}" 
                                 onclick="HabitTracker.toggleDay('${chain.id}', '${d.dateStr}'); Dashboard.updateHabitChain();" 
                                 title="${d.dateStr}">
                                ${d.day}
                            </div>
                        `;
            }).join('')}
                </div>
                <div class="dashboard-habit-streak">
                    <div>
                        <span class="dashboard-habit-streak-value">${streak}</span>
                        <span class="dashboard-habit-streak-label"> gün serisi</span>
                    </div>
                    <div style="margin-left: auto;">
                        <span style="font-size: 20px;">${chain.emoji}</span>
                        <span style="color: var(--text-secondary); font-weight: 500;">${chain.name}</span>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Henüz alışkanlık zinciri yok</p>
                    <button class="btn btn-primary" style="margin-top: 12px;" onclick="App.navigateTo('habits')">Zincir Oluştur</button>
                </div>
            `;
        }
    },

    updateStats() {
        // Lessons
        const lessonStats = Lessons?.getStats?.() || { total: 0 };
        const totalLessonsEl = document.getElementById('totalLessons');
        if (totalLessonsEl) totalLessonsEl.textContent = lessonStats.total || 0;

        // Books
        const bookCount = Books?.books?.length || 0;
        const totalBooksEl = document.getElementById('totalBooks');
        if (totalBooksEl) totalBooksEl.textContent = bookCount;

        // Tasks
        const taskStats = Planning?.getStats?.() || { completed: 0, total: 0 };
        const completedEl = document.getElementById('completedTasks');
        if (completedEl) completedEl.textContent = taskStats.completed || 0;

        // Games
        const gameCount = Games?.games?.length || 0;
        const totalGamesEl = document.getElementById('totalGames');
        if (totalGamesEl) totalGamesEl.textContent = gameCount;

        // Streak
        const settings = Storage.load(Storage.KEYS.SETTINGS, {});
        const streak = this.calculateStreak();
        const streakEl = document.getElementById('dashboardStreak');
        if (streakEl) streakEl.textContent = streak;

        // Also update legacy streak element if exists
        const legacyStreakEl = document.getElementById('streak');
        if (legacyStreakEl) legacyStreakEl.textContent = streak;

        // Update settings
        settings.streak = streak;
        Storage.save(Storage.KEYS.SETTINGS, settings);
    },

    calculateStreak() {
        const settings = Storage.load(Storage.KEYS.SETTINGS, {});
        const today = new Date().toDateString();
        const lastVisit = settings.lastVisit;

        if (!lastVisit) return 1;

        const lastDate = new Date(lastVisit);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return settings.streak || 1;
        } else if (diffDays === 1) {
            return (settings.streak || 0) + 1;
        }
        return 1;
    },

    updateTodayTasks() {
        const container = document.getElementById('todayTasks');
        if (!container) return;

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const tasks = (Planning?.tasks || []).filter(t => {
            if (!t.dueDate) return false;
            return t.dueDate === todayStr && t.status !== 'done';
        });

        if (tasks.length === 0) {
            container.innerHTML = '<p class="empty-state">Bugün için görev yok 🎉</p>';
            return;
        }

        container.innerHTML = tasks.slice(0, 4).map(task => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: var(--bg-tertiary); border-radius: var(--border-radius-sm); margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="width: 10px; height: 10px; border-radius: 50%; background: ${task.priority === 'high' ? 'var(--danger)' : task.priority === 'medium' ? 'var(--warning)' : 'var(--success)'}"></span>
                    <span style="font-weight: 500;">${task.title}</span>
                </div>
                <span style="font-size: 12px; color: var(--text-muted);">${this.getStatusLabel(task.status)}</span>
            </div>
        `).join('');
    },

    getStatusLabel(status) {
        const labels = { todo: 'Yapılacak', inProgress: 'Devam', done: 'Tamamlandı' };
        return labels[status] || status;
    },



    updateUpcoming() {
        const container = document.getElementById('upcomingItems');
        if (!container) return;

        // Clear existing interval
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Get upcoming tasks (next 7 days)
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const upcomingTasks = (Planning?.tasks || [])
            .filter(t => {
                if (!t.dueDate) return false;
                // Only include tasks that have a specific time set
                if (!t.dueTime) return false;
                // Include today's tasks
                return t.dueDate >= todayStr && t.dueDate <= nextWeek.toISOString().split('T')[0] && t.status !== 'done';
            })
            .map(t => {
                let date;
                if (t.dueTime) {
                    date = new Date(`${t.dueDate}T${t.dueTime}`);
                } else {
                    // Task due date is end of that day if no time specified
                    date = new Date(t.dueDate);
                    date.setHours(23, 59, 59, 999);
                }

                return {
                    type: 'task',
                    icon: '📋',
                    title: t.title,
                    date: date,
                    priority: t.priority
                };
            });

        // Get upcoming exams (next 14 days)
        const twoWeeks = new Date(now);
        twoWeeks.setDate(twoWeeks.getDate() + 14);

        const upcomingExams = (Exams?.exams || [])
            .map(e => {
                // Exam has specific date and time
                const date = new Date(`${e.date}T${e.time}`);
                // Build title from exam name and lesson name
                const examTitle = e.lessonName
                    ? `${e.lessonName} - ${e.name}`
                    : e.name;
                return {
                    type: 'exam',
                    icon: '📝',
                    title: examTitle,
                    date: date,
                    lessonId: e.lessonId,
                    rawDate: e.date // Keep raw date for filtering
                };
            })
            .filter(e => {
                const examDate = new Date(e.rawDate);
                const endDate = new Date(twoWeeks);
                // Basic date range check works better with raw date for day comparison or just timestamp
                return e.date >= now && e.date <= endDate;
            });

        // Combine and sort
        const allUpcoming = [...upcomingTasks, ...upcomingExams]
            .sort((a, b) => a.date - b.date)
            .slice(0, 5);

        if (allUpcoming.length === 0) {
            container.innerHTML = '<p class="empty-state">Yaklaşan etkinlik yok</p>';
            return;
        }

        // Render initial HTML
        container.innerHTML = allUpcoming.map((item, index) => {
            // Initial render placeholder, will be updated by interval immediately

            return `
                <div id="upcoming-item-${index}" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-tertiary); border-radius: var(--border-radius-sm); margin-bottom: 8px;">
                    <span style="font-size: 20px;">${item.icon}</span>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 500; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">${this.formatDate(item.date)}</div>
                    </div>
                    <div style="text-align: right; min-width: 90px;">
                        <div id="dashboard-countdown-${index}" style="font-weight: 600; font-size: 14px; color: var(--primary); font-variant-numeric: tabular-nums;">--:--:--</div>
                        <div id="dashboard-countdown-label-${index}" style="font-size: 10px; color: var(--text-muted);">kaldı</div>
                    </div>
                </div>
            `;
        }).join('');

        // Update function
        const updateCountdowns = () => {
            allUpcoming.forEach((item, index) => {
                const time = this.getCountdown(item.date, item.type);
                const countEl = document.getElementById(`dashboard-countdown-${index}`);
                const labelEl = document.getElementById(`dashboard-countdown-label-${index}`);
                const itemEl = document.getElementById(`upcoming-item-${index}`);

                if (countEl) {
                    countEl.textContent = time.display;
                    // Update urgency styles
                    if (time.urgent) {
                        countEl.style.color = 'var(--danger)';
                        if (itemEl) {
                            itemEl.style.background = 'rgba(239, 68, 68, 0.1)';
                            itemEl.style.border = '1px solid rgba(239, 68, 68, 0.3)';
                        }
                    } else {
                        countEl.style.color = 'var(--primary)';
                    }
                }
                if (labelEl) labelEl.textContent = time.label;
            });
        };

        // Run immediately and then interval
        updateCountdowns();
        this.timerInterval = setInterval(updateCountdowns, 1000);
    },

    getCountdown(targetDate, type) {
        const now = new Date();
        const diff = targetDate - now;

        // If passed
        if (diff < 0) {
            return { display: 'Geçti', label: '', urgent: false };
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days === 0) {
            // Less than 24h: Always show HH:MM:SS
            // This applies to both Tasks (to 23:59) and Exams (to specific time)
            return {
                display: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
                label: 'kaldı',
                urgent: true
            };
        } else {
            // More than 24h (including tomorrow): Show days + hours + minutes
            return {
                display: `${days}g ${hours}s ${minutes}dk`,
                label: 'kaldı',
                urgent: days <= 3 && type === 'exam'
            };
        }
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const options = { weekday: 'short', day: 'numeric', month: 'short' };
        return date.toLocaleDateString('tr-TR', options);
    },

    formatTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Şimdi';
        if (minutes < 60) return `${minutes} dk önce`;
        if (hours < 24) return `${hours} saat önce`;
        if (days < 7) return `${days} gün önce`;
        return date.toLocaleDateString('tr-TR');
    },

    updateWeeklyChart() {
        const weeklyProgress = Storage.load('lifeos_weekly_progress', {});
        const today = new Date();
        const currentWeekStart = this.getWeekStart(today);

        document.querySelectorAll('.weekly-day').forEach((dayEl, index) => {
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + index);
            const dateStr = date.toISOString().split('T')[0];

            const dayData = weeklyProgress[dateStr] || { completed: 0 };
            const percentage = Math.min(dayData.completed * 20, 100); // Max 5 completions = 100%

            const fill = dayEl.querySelector('.weekly-day-fill');
            if (fill) {
                fill.style.height = `${percentage}%`;
            }
        });
    },

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    },

    markToday() {
        const today = new Date().getDay();
        const adjustedDay = today === 0 ? 6 : today - 1; // Monday = 0

        document.querySelectorAll('.weekly-day').forEach((dayEl, index) => {
            dayEl.classList.toggle('today', index === adjustedDay);
        });
    },

    // Record a completion for today
    recordCompletion() {
        const weeklyProgress = Storage.load('lifeos_weekly_progress', {});
        const dateStr = new Date().toISOString().split('T')[0];

        if (!weeklyProgress[dateStr]) {
            weeklyProgress[dateStr] = { completed: 0 };
        }
        weeklyProgress[dateStr].completed++;

        Storage.save('lifeos_weekly_progress', weeklyProgress);
        this.updateWeeklyChart();
    }
};
