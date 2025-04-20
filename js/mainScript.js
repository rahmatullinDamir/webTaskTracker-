import * as server from "./serverScript.js";
import * as local from "./localStorageScript.js";

let isServerAvailable = false;

function updateSyncStatus(isServerAvailable) {
    const syncIcon = document.getElementById("sync-icon");
    if (isServerAvailable) {
        syncIcon.textContent = "✅";
        syncIcon.style.color = "green";
    } else {
        syncIcon.textContent = "🔄";
        syncIcon.style.color = "red";
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    isServerAvailable = await server.checkServerAvailability();
    updateSyncStatus(isServerAvailable);

    if (isServerAvailable) {
        try {
            const tasks = await server.fetchAllTasksFromServer();
            tasks.forEach(task => addTaskToDOM(task));
            await server.processSyncQueue();
        } catch (error) {
            console.error("Ошибка при загрузке задач с сервера:", error);
            isServerAvailable = false;

            const localTasks = local.loadTasksFromLocalStorage();
            localTasks.forEach(task => addTaskToDOM(task));
        }
    } else {
        const localTasks = local.loadTasksFromLocalStorage();
        localTasks.forEach(task => addTaskToDOM(task));
    }

    setInterval(async () => {
        const serverAvailable = await server.checkServerAvailability();
        if (serverAvailable && !isServerAvailable) {
            isServerAvailable = true;
            console.log("Сервер доступен. Начинаем синхронизацию...");
            await server.processDeleteQueue();
            await server.processSyncQueue();
        } else if (!serverAvailable) {
            isServerAvailable = false;
            console.log("Сервер недоступен.");
        }
        updateSyncStatus(isServerAvailable);
    }, 5000);

    document.getElementById("task-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("task_name").value.trim();
        const description = document.getElementById("task_desc").value.trim();
        const priority = document.getElementById("task_priority").value;
        const dueDate = document.getElementById("due-date").value;
        const status = document.getElementById("task_status").value;

        const errorMessage = document.getElementById("error-message");
        const error = document.createElement("p");

        const task = {name, description, priority, dueDate, status};

        try {
            const result = await server.saveTaskToServer(task);
            addTaskToDOM(result);
            local.addTaskToLocalStorage(task);
        } catch (e) {
            local.addTaskToLocalStorage(task);
            server.addToSyncQueue(task);

            let priority = new Map([['HIGH', 'Высокий'],
                ['MEDIUM', 'Средний'], ["LOW", "Низкий"]]);
            let status = new Map([['PENDING', 'В ожидании'],
                ["IN_PROGRESS", "В ходе выполнения"], ["COMPLETED", "Выполнено"]]);

            task.status = status.get(task.status);
            task.priority = priority.get(task.priority);
            addTaskToDOM(task);
            const errorMessage = document.getElementById("error-message");
            const error = document.createElement("p");
            error.textContent = e.message || "Сервер недоступен. Задача сохранена локально.";
            errorMessage.appendChild(error);
        }
    })

    function addTaskToDOM(result) {
        const taskList = document.getElementById("task-list");
        const task = document.createElement("div");
        task.classList.add("task-item");
        task.innerHTML = `
            <h3 class="editable" data-field="name">${result.name}</h3>
            <p class="editable" data-field="description">${result.description}</p>
            <p>Приоритет: <span class="editable" data-field="priority">${result.priority}</span></p>
            <p>Статус: <span class="editable" data-field="status">${result.status}</span></p>
            <p>Срок: <span class="editable" data-field="dueDate">${result.dueDate}</span></p>
            <button class="delete-task-btn">Удалить</button>
        `;
        task.setAttribute("data-id", result.id || "");
        taskList.appendChild(task);

        const deleteButton = task.querySelector(".delete-task-btn");
        deleteButton.addEventListener("click", async () => {
            const taskId = task.getAttribute("data-id");

            try {
                if (taskId) {
                    console.log("Задача имеет ID:", taskId);
                    if (isServerAvailable) {
                        const response = await server.deleteTask(taskId);
                        if (!response.ok) {
                            throw new Error("Не удалось удалить задачу с сервера.");
                        }
                    } else {
                        server.addToDeleteQueue(taskId);
                        alert("Сервер недоступен. Задача будет удалена после восстановления соединения.");
                    }
                }

                server.removeFromSyncQueue(getTaskDataFromDOM(task));

                local.deleteTaskFromLocalStorage(getTaskDataFromDOM(task));

                task.remove();
            } catch (error) {
                console.error("Ошибка при удалении задачи:", error.message);
            }
        });

        task.querySelectorAll(".editable").forEach((element) => {
            element.addEventListener("dblclick", (event) => {
                makeEditable(event.target);
            });
        });
    }

    function getTaskDataFromDOM(taskElement) {
        return {
            name: taskElement.querySelector("[data-field='name']").textContent,
            description: taskElement.querySelector("[data-field='description']").textContent,
            priority: taskElement.querySelector("[data-field='priority']").textContent,
            status: taskElement.querySelector("[data-field='status']").textContent,
            dueDate: taskElement.querySelector("[data-field='dueDate']").textContent,
        };
    }

    function makeEditable(element) {
        const field = element.getAttribute("data-field");
        const originalValue = element.textContent;

        if (field === "status" || field === "priority") {
            const select = document.createElement("select");
            let priority = new Map([['HIGH', 'Высокий'],
                ['MEDIUM', 'Средний'], ["LOW", "Низкий"]]);
            let status = new Map([['PENDING', 'В ожидании'],
                ["IN_PROGRESS", "В ходе выполнения"], ["COMPLETED", "Выполнено"]]);

            const options = field === "priority" ? priority : status;
            options.forEach((value, key, map) => {
                const option = document.createElement("option");
                option.value = key;
                option.textContent = value;
                option.selected = value === originalValue;
                select.appendChild(option);
            })

            element.textContent = "";
            element.appendChild(select);

            select.focus();

            select.addEventListener("change", async () => {
                const newValue = select.value;
                if (newValue && newValue !== originalValue) {
                    await server.updateTaskField(element.closest(".task-item").getAttribute("data-id"), field, newValue);
                }
                element.textContent = options.get(newValue);
            });
        } else {
            const input = document.createElement("input");
            input.type = field === "dueDate" ? "date" : "text";
            input.value = originalValue;
            element.textContent = "";
            element.appendChild(input);


            input.focus();

            input.addEventListener("blur", async () => {
                const newValue = input.value.trim();
                if (newValue && newValue !== originalValue) {
                    await server.updateTaskField(element.closest(".task-item").getAttribute("data-id"), field, newValue);
                }
                element.textContent = newValue || originalValue;
            });

            input.addEventListener("keydown", async (e) => {
                if (e.key === "Enter") {
                    const newValue = input.value.trim();
                    if (newValue && newValue !== originalValue) {
                        await server.updateTaskField(element.closest(".task-item").getAttribute("data-id"), field, newValue);
                    }
                    element.textContent = newValue || originalValue;
                }
            });
        }
    }

});


