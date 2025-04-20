import * as localStorageScript from './localStorageScript.js';

const API_URL = "http://localhost:8080/tasks";
const keyToLocalStorage = "syncQueue";
let syncQueue = JSON.parse(localStorage.getItem(keyToLocalStorage)) || [];
const deleteQueueKey = "deleteQueue";

export async function processDeleteQueue() {
    try {
        const deleteQueue = JSON.parse(localStorage.getItem(deleteQueueKey)) || [];

        for (const taskId of deleteQueue) {
            try {
                const response = await deleteTask(taskId);
                if (response.ok) {
                    removeFromDeleteQueue(taskId);
                }
            } catch (error) {
                console.error("Ошибка при удалении задачи из очереди:", error);
            }
        }
    } catch (error) {
        console.error("Ошибка при обработке очереди удалений:", error);
    }
}
export function removeFromSyncQueue(task) {
    try {
        const syncQueue = JSON.parse(localStorage.getItem(keyToLocalStorage)) || [];
        const updatedQueue = syncQueue.filter(t => t.name !== task.name || t.description !== task.description);
        localStorage.setItem(keyToLocalStorage, JSON.stringify(updatedQueue));
    } catch (error) {
        console.error("Ошибка при удалении задачи из очереди синхронизации:", error);
    }
}
export function addToDeleteQueue(taskId) {
    try {
        const deleteQueue = JSON.parse(localStorage.getItem(deleteQueueKey)) || [];
        if (!deleteQueue.includes(taskId)) {
            deleteQueue.push(taskId);
            localStorage.setItem(deleteQueueKey, JSON.stringify(deleteQueue));
        }
    } catch (error) {
        console.error("Ошибка при добавлении задачи в очередь удалений:", error);
    }
}

export function removeFromDeleteQueue(taskId) {
    try {
        const deleteQueue = JSON.parse(localStorage.getItem(deleteQueueKey)) || [];
        const updatedQueue = deleteQueue.filter(id => id !== taskId);
        localStorage.setItem(deleteQueueKey, JSON.stringify(updatedQueue));
    } catch (error) {
        console.error("Ошибка при удалении задачи из очереди удалений:", error);
    }
}
export async function checkServerAvailability() {
    try {
        const response = await fetch("http://localhost:8080/tasks/health", { method: "GET" });
        if (response.ok) {
            return true;
        }
    } catch (error) {
        console.error("Сервер недоступен:", error);
    }
    return false;
}

export function addToSyncQueue(task) {
    try {
        syncQueue = JSON.parse(localStorage.getItem(keyToLocalStorage)) || [];
        syncQueue.push(task)
        localStorage.setItem(keyToLocalStorage, JSON.stringify(syncQueue));
    } catch (error) {
        console.error("Ошибка при добавлении задачи в очередь синхронизации:", error);
    }
}
function updateTaskInDOM(updatedTask) {
    const taskElement = Array.from(document.querySelectorAll(".task-item")).find(task => {
        const name = task.querySelector("[data-field='name']").textContent;
        const description = task.querySelector("[data-field='description']").textContent;
        console.log("NAME" + name);
        console.log("DESCRIPTIoN" + description);
        return name === updatedTask.name && description === updatedTask.description;
    });

    if (taskElement) {
        taskElement.setAttribute("data-id", updatedTask.id);

        taskElement.querySelector("[data-field='name']").textContent = updatedTask.name;
        taskElement.querySelector("[data-field='description']").textContent = updatedTask.description;
        taskElement.querySelector("[data-field='priority']").textContent = updatedTask.priority;
        taskElement.querySelector("[data-field='status']").textContent = updatedTask.status;
        taskElement.querySelector("[data-field='dueDate']").textContent = updatedTask.dueDate;
    }
}

export async function processSyncQueue() {
    try {
        const syncQueue = JSON.parse(localStorage.getItem(keyToLocalStorage)) || [];

        for (const task of syncQueue) {
            try {
                const result = await saveTaskToServer(task);
                localStorageScript.updateTaskInLocalStorage(result);
                updateTaskInDOM(result);
            } catch (error) {
                console.error("Ошибка при отправке задачи из очереди:", error);
                return;
            }
        }

        // Очищаем очередь после успешной отправки
        localStorage.removeItem(keyToLocalStorage);
    } catch (error) {
        console.error("Ошибка при обработке очереди синхронизации:", error);
    }
}
export async function fetchAllTasksFromServer() {
    const response = await fetch(API_URL, {
        method: 'GET',
    });
    if(!response.ok) {
        throw Error(response.statusText);
    }
    return await response.json();
}


export async function updateTaskField(id, field, value) {
    try {
        const response = await fetch(API_URL + "/" + id, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({[field]: value}),
        });

        if (!response.ok) {
            console.error(`Failed to update task field ${field} with value ${value}`);
        }
    } catch (error) {
        console.error(error);
    }
}

export async function saveTaskToServer(task) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(task),
    })
    if (!response.ok) {
        console.error(`Failed to update task field ${task}`);
        throw new Error(`Failed to update task field ${task}`);
    }
    return await response.json();
}

export async function deleteTask(id) {
    const response = await fetch(API_URL + "/" + id, {
        method: "DELETE",
    });

    if (!response.ok) {
        console.error(`Failed to delete task ${id}`);
        throw new Error(`Failed to delete task ${id}`);
    }

    return Promise.resolve(response.ok);
}