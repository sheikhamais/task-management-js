const StorageKeys = Object.freeze({
    TASKS: 'tasks'
});

class Task {
    constructor({ id = crypto.randomUUID(), title, category, expiryDate }) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.expiryDate = expiryDate;
    }
}

class TaskManager {

    #allTasks = [];
    tasks = [];

    appliedTasksFilter = {
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
            const query = event.target.value.trim();
            this.performSearch(query);
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

            this.appliedTasksFilter = {
                category: categoryFilter.value,
                startDate: startDateFilter.value,
                endDate: endDateFilter.value
            };

            this.tasks = this.allTasks;

            if (this.appliedTasksFilter.category) {
                this.tasks = this.tasks.filter(task => task.category === this.appliedTasksFilter.category);
            }

            if (this.appliedTasksFilter.startDate && this.appliedTasksFilter.endDate) {
                this.tasks = this.tasks.filter(task => {
                    const taskDate = new Date(task.expiryDate);
                    const startDate = new Date(this.appliedTasksFilter.startDate);
                    const endDate = new Date(this.appliedTasksFilter.endDate);

                    return taskDate >= startDate && taskDate <= endDate;
                });
            }

            this.renderTasksToUI();
            this.updateFilterBarUI();
        });

        const clearFilterButton = document.querySelector('.clear-filter-btn');
    }

    performSearch(query) {
        if (query.length === 0) {
            this.tasks = [...this.allTasks];
            this.renderTasksToUI();
        }

        if (query.length < 2) { return; }

        this.tasks = this.allTasks.filter(task =>
            task.title.toLowerCase().includes(query.toLowerCase())
        );

        this.renderTasksToUI();
    }

    addNewTask() {

        let taskTitleInput = document.querySelector('.task-input');
        let taskCategorySelect = document.querySelector('.category-select');
        let taskDeadlineInput = document.querySelector('.deadline-input');

        // Validate title is alphanumeric
        if (!taskTitleInput.value || !/^[a-zA-Z0-9\s]+$/.test(taskTitleInput.value)) {
            alert('Title must contain only letters and numbers!');
            return;
        }

        // Validate category is not empty
        if (!taskCategorySelect.value) {
            alert('Category is required!');
            return;
        }

        // Validate deadline is a valid date
        const parsedDate = new Date(taskDeadlineInput.value);
        if (isNaN(parsedDate.getTime())) {
            alert('Invalid date!');
            return;
        }

        let taskData = {
            title: taskTitleInput.value,
            category: taskCategorySelect.value,
            expiryDate: taskDeadlineInput.value
        };

        this.storeNewTaskInLocalStorage(taskData);
        this.fetchTasksFromLocalStorage();
        this.renderTasksToUI();

        this.clearSearchField();
        this.clearFilters();
        this.clearAddNewTaskInputFields();
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
        appliedTasksFilter = {
            category: null,
            startDate: null,
            endDate: null
        };
        this.updateFilterBarUI();
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
        list.innerHTML = '';
        this.tasks.forEach(task => {
            const item = document.createElement('li');
            item.className = 'task-item';
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
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '×';
            item.append(title, deadline, category, editBtn, deleteBtn);
            list.appendChild(item);
        });
    }

    fetchTasksFromLocalStorage() {
        const storedTasks = localStorage.getItem(StorageKeys.TASKS)
        const tasks = JSON.parse(storedTasks) || [];
        const mappedTasks = tasks.map(taskData => new Task(taskData));
        this.tasks = mappedTasks;
        this.allTasks = mappedTasks; // Keep a copy of all tasks for filtering
    }

    updateFilterBarUI() {
        const appliedFiltersContainer = document.querySelector('.applied-filters-container');
        const categoryFilter = document.querySelector('.category-filter-text');
        const datesFilter = document.querySelector('.dates-filter-text');

        [appliedFiltersContainer, categoryFilter, datesFilter].forEach(element => {
            element.style.display = 'none';
        });

        if (this.appliedTasksFilter.category) {
            categoryFilter.textContent = `Category: ${this.appliedTasksFilter.category}`;
            categoryFilter.style.display = 'inline-block';
            appliedFiltersContainer.style.display = 'flex';
        }

        if (this.appliedTasksFilter.startDate && this.appliedTasksFilter.endDate) {
            datesFilter.textContent = `Dates: ${this.appliedTasksFilter.startDate} - ${this.appliedTasksFilter.endDate}`;
            datesFilter.style.display = 'inline-block';
            appliedFiltersContainer.style.display = 'flex';
        }
    }
}

let applicationManager = new TaskManager();