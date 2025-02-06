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
    constructor() {
        document.addEventListener('DOMContentLoaded', () => {
            this.onApplicationStart();
        });
    }

    onApplicationStart() {
        let tasks = this.fetchTasksFromLocalStorage();
        console.log(tasks);
        this.renderTasksToUI(tasks);
    }

    renderTasksToUI(tasks) {
        const list = document.querySelector('.task-list');
        if (!list) return;
        list.innerHTML = '';
        tasks.forEach(task => {
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
        return tasks.map(taskData => new Task(taskData));
    }

    createTask(taskData) {
        const tasks = this.fetchTasksFromLocalStorage();
        const newTask = new Task(taskData);
        tasks.push(newTask);
        localStorage.setItem(StorageKeys.TASKS, JSON.stringify(tasks));
        return newTask;
    }
}

let applicationManager = new TaskManager()