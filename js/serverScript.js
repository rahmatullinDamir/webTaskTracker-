import * as localStorageScript from './localStorageScript.js';

const API_URL = "http://localhost:8080/tasks";
const keyToLocalStorage = "syncQueue";
export let syncQueue = JSON.parse(localStorage.getItem(keyToLocalStorage)) || [];
const deleteQueueKey = "deleteQueue";
const updateQueueKey = "updateQueue";

function getProgressPercentage(status) {
    switch (status) {
        case "В ожидании":
            return 0;
        case "В ходе выполнения":
            return 50;
        case "Выполнено":
            return 100;
        default:
            return 0;
    }
}

export function saveSyncQueue(tasks) {
    try {
        localStorage.setItem(keyToLocalStorage, JSON.stringify(tasks));
    } catch (error) {
        console.error("Ошибка при сохранении очереди синхронизации:", error);
    }
}

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
        const response = await fetch(API_URL + "/health", {method: "GET"});
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

function updateTaskInDom(updatedTask) {
    const taskElement = document.querySelector(`.task-item[data-id="${updatedTask.id}"]`);
    if (!taskElement) {
        console.error("Ошибка: Задача с ID", updatedTask.id, "не найдена в DOM.");
        return;
    }

    let priorityReversed = new Map([["Высокий", "HIGH"],
        ['Средний', 'MEDIUM'], ["Низкий", "LOW"]]);
    let statusReversed = new Map([["В ожидании", "PENDING"],
        ["В ходе выполнения", "IN_PROGRESS"], ["Выполнено", "COMPLETED"]]);

    taskElement.querySelector("[data-field='name']").textContent = updatedTask.name;
    taskElement.querySelector("[data-field='description']").textContent = updatedTask.description;
    taskElement.querySelector("[data-field='priority']").textContent = updatedTask.priority;
    taskElement.querySelector("[data-field='status']").textContent = updatedTask.status;
    taskElement.querySelector("[data-field='dueDate']").textContent = updatedTask.dueDate;


    taskElement.querySelector("[data-field='priority']").setAttribute("data-value", priorityReversed.get(updatedTask.priority));
    taskElement.querySelector("[data-field='status']").setAttribute("data-value", statusReversed.get(updatedTask.status));


    const progressBar = taskElement.querySelector(".progress");
    if (progressBar) {
        progressBar.style.width = `${getProgressPercentage(updatedTask.status)}%`;
    }
}

export async function processSyncQueue() {
    try {
        const syncQueue = JSON.parse(localStorage.getItem(keyToLocalStorage)) || [];

        for (const task of syncQueue) {
            try {
                const result = await saveTaskToServer(task);
                localStorageScript.updateTaskInLocalStorage(result);
                updateTaskInDom(result); // here problem
            } catch (error) {
                console.error("Ошибка при отправке задачи из очереди:", error);
                return;
            }
        }

        localStorage.removeItem(keyToLocalStorage);
    } catch (error) {
        console.error("Ошибка при обработке очереди синхронизации:", error);
    }
}

export async function fetchAllTasksFromServer() {
    const response = await fetch(API_URL, {
        method: 'GET',
    });
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return await response.json();
}


export async function updateTaskField(id, field, value) {
    const response = await fetch(API_URL + "/" + id, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({[field]: value}),
    });

    if (!response.ok) {
        console.error(`Ошибка обновления ${field} значение ${value}`);
        throw new Error(`Ошибка обновления ${field} значение ${value}`);
    }
    return response.status;
}

export async function saveTaskToServer(task) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(task),
    })
    if (!response.ok) {
        console.error(`Ошибка обновления ${task}`);
        throw new Error(`Ошибка обновления ${task}`);
    }
    return await response.json();
}

export async function deleteTask(id) {
    const response = await fetch(API_URL + "/" + id, {
        method: "DELETE",
    });

    if (!response.ok) {
        console.error(`Ошибка удаления задачи с ID: ${id}`);
        throw new Error(`Ошибка удаления задачи с ID:  ${id}`);
    }

    return Promise.resolve(response.ok);
}

export function addToUpdateQueue(updatedTask) {
    try {
        const updateQueue = JSON.parse(localStorage.getItem(updateQueueKey)) || [];

        const existingTaskIndex = updateQueue.findIndex(task => task.id === updatedTask.id);

        if (existingTaskIndex !== -1) {
            updateQueue[existingTaskIndex] = updatedTask;
        } else {
            updateQueue.push(updatedTask);
        }

        localStorage.setItem(updateQueueKey, JSON.stringify(updateQueue));
    } catch (error) {
        console.error("Ошибка при добавлении задачи в очередь изменений:", error);
    }
}

export async function updateTaskOnServer(task) {
    try {
        const response = await fetch(API_URL + `/${task.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(task),
        });

        if (!response.ok) {
            throw new Error(`Ошибка при обновлении задачи с ID: ${task.id}`);
        }

        return response;
    } catch (error) {
        console.error("Ошибка при отправке задачи на сервер:", error.message);
        throw error;
    }
}

export async function processUpdateQueue() {
    try {
        const updateQueue = JSON.parse(localStorage.getItem(updateQueueKey)) || [];

        if (updateQueue.length === 0) {
            console.log("Очередь изменений пуста.");
            return;
        }

        console.log("Начинаем обработку очереди изменений...");

        for (const task of updateQueue) {
            try {
                console.log("TASK:")
                console.log(task);
                const response = await updateTaskOnServer(task);

                if (!response.ok) {
                    throw new Error(`Не удалось обновить задачу с ID: ${task.id}`);
                }

                console.log(`Задача с ID: ${task.id} успешно обновлена на сервере.`);
            } catch (error) {
                console.error(`Ошибка при обновлении задачи с ID: ${task.id}:`, error.message);
                continue;
            }
        }

        localStorage.setItem(updateQueueKey, JSON.stringify([]));
        console.log("Очередь изменений успешно очищена.");
    } catch (error) {
        console.error("Ошибка при обработке очереди изменений:", error.message);
    }
}