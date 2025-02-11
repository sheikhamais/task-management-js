export class Task {
    constructor({ id = crypto.randomUUID(), title, category, expiryDate, notified, completed }) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.expiryDate = expiryDate;
        this.notified = notified;
        this.completed = completed;
    }
}