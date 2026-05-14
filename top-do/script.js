//Active JS file
//Built independently, with peer feedback and technical review.

document.addEventListener('DOMContentLoaded', () => {
    let tasks = JSON.parse(localStorage.getItem('taskGod_tasks')) || [];
    let editingTaskId = null;

    // Selectors
    const taskList = document.querySelector('.task-list');
    const taskModal = document.getElementById('task-modal');
    const taskForm = document.getElementById('task-form');
    const themeToggle = document.getElementById('theme-toggle');
    const badgePanel = document.getElementById('badge-panel');
    const searchInput = document.getElementById('task-search');
    const filterSelect = document.querySelector('.filter-dd');
    const sortSelect = document.querySelector('.sort-dd');
    
    // --- Theme Logic ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    });

    // --- Modal Logic ---
    function trapFocus(modal) {
        const focusable = modal.querySelectorAll('button, input, textarea, select');
        let first = focusable[0];
        let last = focusable[focusable.length - 1];

        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });
    }

    window.openModal = (id = null) => {
        editingTaskId = id;
        if (id) {
            const task = tasks.find(t => t.id === id);
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-desc').value = task.description;
            document.getElementById('task-due-date').value = task.dueDate;
            document.querySelector(`input[name="task-priority"][value="${task.priority}"]`).checked = true;
            document.querySelector('#task-modal h2').textContent = "Edit Task";
        } else {
            taskForm.reset();
            document.querySelector('#task-modal h2').textContent = "Create New Task";
        }
        taskModal.setAttribute('aria-hidden', 'false');
        taskModal.focus();          // move focus into the modal
        trapFocus(taskModal);       // activate the focus trap
    };

    window.closeModal = () => {
        taskModal.setAttribute('aria-hidden', 'true');
        taskForm.reset();
        editingTaskId = null;
    };

    // Close logic
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.querySelector('.cancel-button').addEventListener('click', closeModal);
    taskModal.addEventListener('click', (e) => { if (e.target === taskModal) closeModal(); });
    document.getElementById('add-task-button').addEventListener('click', () => openModal());

    // --- Badge Logic ---
    document.getElementById('badge-button').addEventListener('click', () => badgePanel.classList.add('is-open'));
    document.querySelector('.badge-close').addEventListener('click', () => badgePanel.classList.remove('is-open'));
    
    // Close badge panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!badgePanel.contains(e.target) && e.target.id !== 'badge-button' && badgePanel.classList.contains('is-open')) {
            badgePanel.classList.remove('is-open');
        }
    });

    // --- CRUD Operations ---
    document.querySelector('.create-button').addEventListener('click', () => {
        const title = document.getElementById('task-title').value.trim();
        if (!title) return alert("Title is required");

        const taskData = {
            id: editingTaskId || Date.now(),
            title: title,
            description: document.getElementById('task-desc').value.trim(),
            dueDate: document.getElementById('task-due-date').value,
            priority: document.querySelector('input[name="task-priority"]:checked').value,
            status: editingTaskId ? tasks.find(t => t.id === editingTaskId).status : 'pending',
            createdAt: editingTaskId ? tasks.find(t => t.id === editingTaskId).createdAt : new Date().toISOString()
        };

        if (editingTaskId) {
            const index = tasks.findIndex(t => t.id === editingTaskId);
            tasks[index] = taskData;
        } else {
            tasks.push(taskData);
        }

        saveAndRender();
        closeModal();
    });

    window.deleteTask = (id) => {
        tasks = tasks.filter(t => t.id !== id);
        saveAndRender();
    };

    window.toggleTaskStatus = (id) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.status = (task.status === 'completed') ? 'pending' : 'completed';
            if (task.status === 'completed') checkBadges();
        }
        saveAndRender();
    };

    function saveAndRender() {
        localStorage.setItem('taskGod_tasks', JSON.stringify(tasks));
        renderTasks();
    }

    // --- Search & Filter Logic ---
    function renderTasks() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;
        const sortValue = sortSelect.value;

        let filtered = tasks.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchTerm) || t.description.toLowerCase().includes(searchTerm);
            const isOverdue = new Date(t.dueDate) < new Date().setHours(0,0,0,0) && t.status !== 'completed';
            
            if (filterValue === 'pending') return matchesSearch && t.status === 'pending';
            if (filterValue === 'completed') return matchesSearch && t.status === 'completed';
            if (filterValue === 'overdue') return matchesSearch && isOverdue;
            return matchesSearch;
        });

        // Sorting
        filtered.sort((a, b) => {
            if (sortValue === 'title') return a.title.localeCompare(b.title);
            if (sortValue === 'due') return new Date(a.dueDate) - new Date(b.dueDate);
            if (sortValue === 'priority') {
                const map = { high: 1, medium: 2, low: 3 };
                return map[a.priority] - map[b.priority];
            }
            return b.id - a.id; // Created
        });

        taskList.innerHTML = '';
        filtered.forEach(task => {
            const isOverdue = new Date(task.dueDate) < new Date().setHours(0,0,0,0) && task.status !== 'completed';
            const li = document.createElement('li');
            li.className = 'task-item';
            li.style.borderLeft = task.status === 'completed' ? '5px solid #22c55e' : (isOverdue ? '5px solid #ef4444' : '5px solid #3b82f6');
            // Task item HTML
            li.innerHTML = `
                <article class="individual-task-cards">
                    <div class="task-header">
                        <h3>${task.title}</h3>
                        <span class="task-priority">${task.priority.toUpperCase()}</span>
                    </div>
                    <p>${task.description || ''}</p>
                    <div class="task-due-date">
                        <small>📅 ${task.dueDate || 'No date'}</small>
                    </div>
                    <div class="task-actions">
                        <button onclick="toggleTaskStatus(${task.id})" class="btn-${task.status === 'completed' ? 'undo' : 'done'}">
                            ${task.status === 'completed' ? 'Undo' : 'Done'}
                        </button>
                        <button onclick="openModal(${task.id})" class="btn-edit">Edit</button>
                        <button onclick="deleteTask(${task.id})" class="btn-delete">Delete</button>
                    </div>
                </article>`;
            taskList.appendChild(li);
        });

        updateUI();
    }

    function updateUI() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const pending = tasks.filter(t => t.status === 'pending').length;
        const overdue = tasks.filter(t => {
            return new Date(t.dueDate) < new Date().setHours(0,0,0,0) && t.status !== 'completed' && t.dueDate;
        }).length;

        const percent = total === 0 ? 0 : (completed / total) * 100;
        
        // Update all progress fills and texts
        document.querySelectorAll('.progress-bar-fill, .mini-progress-bar-fill').forEach(el => el.style.width = percent + '%');
        document.querySelectorAll('.progress-text').forEach(el => {
            el.textContent = `Completed: ${completed} | Pending: ${pending} | Overdue: ${overdue} | Total: ${total}`;
        });

        checkBadges(false); // Silent check on UI update
    }

    function checkBadges(showToast = true) {
        const completedCount = tasks.filter(t => t.status === 'completed').length;
        const badges = [
            { id: 'task-master', req: 2 },
            { id: 'task-enthusiast', req: 10 },
            { id: 'legendary', req: 50 }
        ];

        badges.forEach(b => {
            const badgeEl = document.querySelector(`[data-badge="${b.id}"]`);
            if (completedCount >= b.req && !badgeEl.classList.contains('unlocked')) {
                badgeEl.classList.add('unlocked');
                if (showToast) alert(`🏆 New Badge Unlocked: ${badgeEl.querySelector('.badge-title').textContent}!`);
            }
        });
    }

    // Listeners for Search/Filter
    searchInput.addEventListener('input', renderTasks);
    filterSelect.addEventListener('change', renderTasks);
    sortSelect.addEventListener('change', renderTasks);

    // Initial render
    renderTasks();
});
