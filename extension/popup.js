// Todo List - Popup script

let tasks = [];
let currentFilter = 'all';

// Charger les tâches au démarrage
document.addEventListener('DOMContentLoaded', async () => {
    await loadTasks();
    setupEventListeners();
    renderTasks();
});

// Charger les tâches depuis le stockage local
async function loadTasks() {
    try {
        const result = await chrome.storage.local.get(['tasks']);
        tasks = result.tasks || [];
    } catch (error) {
        console.error('Erreur chargement tâches:', error);
        tasks = [];
    }
}

// Sauvegarder les tâches dans le stockage local
async function saveTasks() {
    try {
        await chrome.storage.local.set({ tasks });
    } catch (error) {
        console.error('Erreur sauvegarde tâches:', error);
    }
}

// Configuration des event listeners
function setupEventListeners() {
    // Ajouter une tâche
    document.getElementById('add-btn').addEventListener('click', addTask);
    document.getElementById('task-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Filtres
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTasks();
        });
    });

    // Effacer les tâches terminées
    document.getElementById('clear-completed').addEventListener('click', clearCompleted);
}

// Ajouter une nouvelle tâche
function addTask() {
    const input = document.getElementById('task-input');
    const text = input.value.trim();

    if (!text) return;

    const task = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(task); // Ajouter au début
    input.value = '';
    saveTasks();
    renderTasks();
}

// Basculer l'état d'une tâche
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

// Supprimer une tâche
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

// Effacer toutes les tâches terminées
function clearCompleted() {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
}

// Filtrer les tâches
function getFilteredTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(t => !t.completed);
        case 'completed':
            return tasks.filter(t => t.completed);
        default:
            return tasks;
    }
}

// Afficher les tâches
function renderTasks() {
    const container = document.getElementById('tasks-container');
    const filteredTasks = getFilteredTasks();

    // État vide
    if (filteredTasks.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-text">
          ${currentFilter === 'all'
                ? 'Aucune tâche. Ajoutez-en une !'
                : currentFilter === 'active'
                    ? 'Aucune tâche active'
                    : 'Aucune tâche terminée'}
        </div>
      </div>
    `;
        updateStats();
        return;
    }

    // Afficher les tâches
    container.innerHTML = filteredTasks.map(task => `
    <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <div class="task-checkbox" onclick="toggleTask(${task.id})"></div>
      <div class="task-text">${escapeHtml(task.text)}</div>
      <button class="task-delete" onclick="deleteTask(${task.id})">×</button>
    </div>
  `).join('');

    updateStats();
}

// Mettre à jour les statistiques
function updateStats() {
    const activeTasks = tasks.filter(t => !t.completed).length;
    const countText = activeTasks === 0
        ? 'Aucune tâche active'
        : activeTasks === 1
            ? '1 tâche active'
            : `${activeTasks} tâches actives`;

    document.getElementById('task-count').textContent = countText;
}

// Échapper le HTML pour éviter les XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Rendre les fonctions accessibles globalement
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
