const StorageKeys = Object.freeze({
    TASKS: 'tasks'
});

class Task {
    constructor({ id = crypto.randomUUID(), title, category, expiryDate, notified, completed }) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.expiryDate = expiryDate;
        this.notified = notified;
        this.completed = completed;
    }
}

class TaskManager {

    #allTasks = [];
    tasks = [];
    #taskToEdit = Task;

    tasksSearchFilterData = {
        searchTerm: null,
        category: null,
        startDate: null,
        endDate: null
    };

    constructor() {
        this.onApplicationStart();
    }

    onApplicationStart() {
        this.addEventListeners();
    }

    addEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.fetchTasksFromLocalStorage();
            this.renderTasksToUI();
            this.updateFilterBarUI();
        });

        let addNewTaskButton = document.querySelector('.add-btn');
        addNewTaskButton.addEventListener('click', () => {
            this.addNewTask();
        });

        const searchInput = document.querySelector('.search-input');
        searchInput.addEventListener('input', (event) => {
            this.tasksSearchFilterData.searchTerm = event.target.value.trim();
            this.filterTasksByData();
            this.renderTasksToUI();
        });

        const applyFilterButton = document.querySelector('.filter-btn');
        applyFilterButton.addEventListener('click', () => {
            const categoryFilter = document.querySelector('#filter-category');
            const startDateFilter = document.querySelector('#filter-start-date');
            const endDateFilter = document.querySelector('#filter-end-date');

            if (!categoryFilter.value && !startDateFilter.value && !endDateFilter.value) {
                alert('Please select at least one filter!');
                return;
            }

            if (startDateFilter.value && !endDateFilter.value) {
                alert('Please select an end date!');
                return;
            }

            this.tasksSearchFilterData = {
                category: categoryFilter.value,
                startDate: startDateFilter.value,
                endDate: endDateFilter.value
            };

            this.filterTasksByData();

            this.renderTasksToUI();
            this.updateFilterBarUI();
        });

        const clearFilterButton = document.querySelector('.clear-filter-btn');
        clearFilterButton.addEventListener('click', () => {
            this.clearFilters();
            this.filterTasksByData();
            this.updateFilterBarUI();
            this.renderTasksToUI();
        });

        // Edit Task
        const dimLayer = document.querySelector('.dim-layer');
        const taskPopupContent = document.querySelector('.edit-task-popup');
        const editTaskPopupContainer = document.querySelector('#edit-task-popup-container');

        dimLayer.addEventListener('click', (event) => {
            if (!taskPopupContent.contains(event.target)) {
                editTaskPopupContainer.style.transform = 'translateY(-100%)';
            }
        });

        document.querySelector('.save-edit-btn').addEventListener('click', () => {
            this.saveEditedTask();
            editTaskPopupContainer.style.transform = 'translateY(-100%)';
        });

        document.querySelector('.cancel-edit-btn').addEventListener('click', () => {
            editTaskPopupContainer.style.transform = 'translateY(-100%)';
        });

        // Tasks alert, checks after each minute
        setInterval(() => {
            this.checkDueTasks();
        }, 60000);
    }

    checkDueTasks() {
        const now = new Date();
        this.#allTasks.forEach(task => {
            const taskDate = new Date(task.expiryDate);
            if (taskDate <= now && !task.notified) {
                alert(`Task "${task.title}" is due!`);
                task.notified = true;
                localStorage.setItem(StorageKeys.TASKS, JSON.stringify(this.#allTasks));
            }
        });
    }

    filterTasksByData() {
        this.tasks = this.#allTasks;

        const searchTerm = this.tasksSearchFilterData.searchTerm || '';
        if (searchTerm.length > 0) {
            this.tasks = this.tasks.filter(task =>
                task.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (this.tasksSearchFilterData.category) {
            this.tasks = this.tasks.filter(task => task.category === this.tasksSearchFilterData.category);
        }

        if (this.tasksSearchFilterData.startDate && this.tasksSearchFilterData.endDate) {
            this.tasks = this.tasks.filter(task => {
                const taskDate = new Date(task.expiryDate);
                const startDate = new Date(this.tasksSearchFilterData.startDate);
                const endDate = new Date(this.tasksSearchFilterData.endDate);

                return taskDate >= startDate && taskDate <= endDate;
            });
        }
    }

    addNewTask() {

        let taskTitleInput = document.querySelector('.task-input');
        let taskCategorySelect = document.querySelector('.category-select');
        let taskDeadlineInput = document.querySelector('.deadline-input');

        let validated = this.taskValuesValidation(taskTitleInput.value, taskCategorySelect.value, taskDeadlineInput.value);
        if (!validated) {
            return;
        }

        let taskData = {
            title: taskTitleInput.value,
            category: taskCategorySelect.value,
            expiryDate: taskDeadlineInput.value,
            notified: false,
            completed: false
        };

        this.storeNewTaskInLocalStorage(taskData);
        this.fetchTasksFromLocalStorage();
        this.renderTasksToUI();

        this.clearSearchField();
        this.clearFilters();

        this.updateFilterBarUI();
        this.clearAddNewTaskInputFields();
    }

    taskValuesValidation(title, category, deadline) {
        if (!title || !/^[a-zA-Z0-9\s]+$/.test(title)) {
            alert('Title must contain only letters and numbers!');
            return false;
        }

        if (!category) {
            alert('Category is required!');
            return false;
        }

        const parsedDate = new Date(deadline);
        if (isNaN(parsedDate.getTime())) {
            alert('Invalid date!');
            return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (parsedDate < today) {
            alert('Date must be today or later!');
            return false;
        }

        return true;
    }

    clearAddNewTaskInputFields() {
        let taskTitleInput = document.querySelector('.task-input');
        let taskCategorySelect = document.querySelector('.category-select');
        let taskDeadlineInput = document.querySelector('.deadline-input');

        taskTitleInput.value = '';
        taskCategorySelect.value = '';
        taskDeadlineInput.value = '';
    }

    clearSearchField() {
        let searchInput = document.querySelector('.search-input');
        searchInput.value = '';
    }

    clearFilters() {
        const categoryFilter = document.querySelector('#filter-category');
        const startDateFilter = document.querySelector('#filter-start-date');
        const endDateFilter = document.querySelector('#filter-end-date');

        categoryFilter.value = '';
        startDateFilter.value = '';
        endDateFilter.value = '';

        this.tasksSearchFilterData.category = null
        this.tasksSearchFilterData.startDate = null
        this.tasksSearchFilterData.endDate = null
    }

    storeNewTaskInLocalStorage(taskData) {
        this.fetchTasksFromLocalStorage();
        const newTask = new Task(taskData);
        this.tasks.unshift(newTask);
        localStorage.setItem(StorageKeys.TASKS, JSON.stringify(this.tasks));
        return newTask;
    }

    renderTasksToUI() {
        const list = document.querySelector('.task-list');
        if (!list) return;

        list.classList.add('fade-out');
        setTimeout(() => {
            list.innerHTML = '';
            this.#generateTasksListInnerHtml();
            list.classList.remove('fade-out');
            list.classList.add('fade-in');
        }, 500);
    }

    #generateTasksListInnerHtml() {
        const list = document.querySelector('.task-list');
        this.tasks.forEach(task => {
            const item = document.createElement('li');
            item.className = 'task-item';
            if (task.completed) {
                item.classList.add('completed');
            }

            const checkbox = document.createElement('input');
            checkbox.className = 'task-completion-checkbox';
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => {
                this.toggleTaskCompletion(task);
            });

            const title = document.createElement('span');
            title.className = 'task-title';
            title.textContent = task.title;

            const deadline = document.createElement('span');
            deadline.className = 'deadline';
            deadline.textContent = task.expiryDate;

            const category = document.createElement('span');
            category.className = 'category-tag';
            category.style.background = '#FFEEBA';
            category.textContent = task.category;

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => {
                this.#taskToEdit = task;
                this.showEditTaskPopup();
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete: ${task.title}?`)) {
                    this.deleteTask(task.id);
                }
            });

            item.append(checkbox, title, deadline, category, editBtn, deleteBtn);
            list.appendChild(item);
        });
    }

    toggleTaskCompletion(task) {
        task.completed = !task.completed;
        localStorage.setItem(StorageKeys.TASKS, JSON.stringify(this.#allTasks));
        this.renderTasksToUI();
    }

    showEditTaskPopup() {
        const editTaskPopupContainer = document.querySelector('#edit-task-popup-container');
        editTaskPopupContainer.style.transform = 'translateY(0)';

        const titleInput = document.querySelector('.edit-task-title');
        titleInput.value = this.#taskToEdit.title;

        const categorySelect = document.querySelector('.edit-task-category');
        categorySelect.value = this.#taskToEdit.category;

        const deadlineInput = document.querySelector('.edit-task-deadline');
        deadlineInput.value = this.#taskToEdit.expiryDate;
    }

    saveEditedTask() {
        const popup = document.querySelector('.edit-task-popup');
        const title = popup.querySelector('.edit-task-title').value;
        const category = popup.querySelector('.edit-task-category').value;
        const deadline = popup.querySelector('.edit-task-deadline').value;

        let isValidated = this.taskValuesValidation(title, category, deadline);
        if (!isValidated) {
            return;
        }

        const taskIndex = this.#allTasks.findIndex(taskInstance => taskInstance.id === this.#taskToEdit.id);
        this.#allTasks[taskIndex].title = title;
        this.#allTasks[taskIndex].category = category;
        this.#allTasks[taskIndex].expiryDate = deadline;

        localStorage.setItem(StorageKeys.TASKS, JSON.stringify(this.#allTasks));
        this.filterTasksByData();
        this.renderTasksToUI();
    }

    deleteTask(taskId) {
        this.#allTasks = this.#allTasks.filter(task => task.id !== taskId);
        localStorage.setItem(StorageKeys.TASKS, JSON.stringify(this.#allTasks));
        this.filterTasksByData();
        this.renderTasksToUI();
    }

    fetchTasksFromLocalStorage() {
        const storedTasks = localStorage.getItem(StorageKeys.TASKS)
        const tasks = JSON.parse(storedTasks) || [];
        const mappedTasks = tasks.map(taskData => new Task(taskData));
        this.tasks = mappedTasks;
        this.#allTasks = mappedTasks; // Keep a copy of all tasks for filtering
    }

    updateFilterBarUI() {
        const appliedFiltersContainer = document.querySelector('.applied-filters-container');
        const categoryFilter = document.querySelector('.category-filter-text');
        const datesFilter = document.querySelector('.dates-filter-text');

        [appliedFiltersContainer, categoryFilter, datesFilter].forEach(element => {
            element.style.display = 'none';
        });

        if (this.tasksSearchFilterData.category) {
            categoryFilter.textContent = `Category: ${this.tasksSearchFilterData.category}`;
            categoryFilter.style.display = 'inline-block';
            appliedFiltersContainer.style.display = 'flex';
        }

        if (this.tasksSearchFilterData.startDate && this.tasksSearchFilterData.endDate) {
            datesFilter.textContent = `Dates: ${this.tasksSearchFilterData.startDate} - ${this.tasksSearchFilterData.endDate}`;
            datesFilter.style.display = 'inline-block';
            appliedFiltersContainer.style.display = 'flex';
        }
    }
}

let applicationManager = new TaskManager();