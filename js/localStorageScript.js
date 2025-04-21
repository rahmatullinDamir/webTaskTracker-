const keyForLocalStorage = "tasks";

export function saveTasksToLocalStorage(tasks){
    localStorage.setItem(keyForLocalStorage, JSON.stringify(tasks));
}

export function loadTasksFromLocalStorage() {
    try {
        const tasks = JSON.parse(localStorage.getItem(keyForLocalStorage)) || [];
        if (!Array.isArray(tasks)) {
            throw new Error("Данные в localStorage повреждены. Ожидался массив задач.");
        }
        return tasks;
    } catch (error) {
        console.error("Ошибка при загрузке задач из localStorage:", error);
        return [];
    }
}
export function deleteTaskFromLocalStorage(task) {
    try {
        const tasks = JSON.parse(localStorage.getItem(keyForLocalStorage)) || [];
        const updatedTasks = tasks.filter(t => t.name !== task.name || t.description !== task.description);
        localStorage.setItem(keyForLocalStorage, JSON.stringify(updatedTasks));
    } catch (error) {
        console.error("Ошибка при удалении задачи из localStorage:", error);
    }
}
export function addTaskToLocalStorage(task) {
    try {
        const tasks = JSON.parse(localStorage.getItem(keyForLocalStorage)) || [];

        if (!Array.isArray(tasks)) {
            throw new Error("Данные в localStorage повреждены. Ожидался массив задач.");
        }

        tasks.push(task);

        localStorage.setItem(keyForLocalStorage, JSON.stringify(tasks));
    } catch (error) {
        console.error("Ошибка при добавлении задачи в localStorage:", error);
    }
}

export function updateTaskInLocalStorage(updatedTask) {
    try {
        const tasks = JSON.parse(localStorage.getItem(keyForLocalStorage)) || [];

        const taskIndex = tasks.findIndex(task => task.id === updatedTask.id);

        if (taskIndex !== -1) {
            tasks[taskIndex] = updatedTask;
        } else {
            tasks.push(updatedTask);
        }

        localStorage.setItem(keyForLocalStorage, JSON.stringify(tasks));
    } catch (error) {
        console.error("Ошибка при обновлении задачи в localStorage:", error);
    }
}