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
            await server.processUpdateQueue();
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

            addTaskToDOM(task);
            error.textContent = e.message || "Сервер недоступен. Задача сохранена локально.";
            errorMessage.appendChild(error);
        }
    })

    function addTaskToDOM(result) {
        const taskList = document.getElementById("task-list");
        const task = document.createElement("div");

        let priority = new Map([['HIGH', 'Высокий'],
            ['MEDIUM', 'Средний'], ["LOW", "Низкий"]]);
        let status = new Map([['PENDING', 'В ожидании'],
            ["IN_PROGRESS", "В ходе выполнения"], ["COMPLETED", "Выполнено"]]);
        let priorityReversed = new Map([["Высокий", "HIGH"],
            ['Средний', 'MEDIUM'], ["Низкий", "LOW"]]);
        let statusReversed = new Map([["В ожидании", "PENDING"],
            ["В ходе выполнения", "IN_PROGRESS"], ["Выполнено", "COMPLETED"]]);

        if (status.has(result.status)) result.status = status.get(result.status);
        if (priority.has(result.priority)) result.priority = priority.get(result.priority);

        const priorityValue = priorityReversed.get(result.priority);
        const statusValue = statusReversed.get(result.status);

        task.classList.add("task-item");
        task.innerHTML = `
            <h3 class="editable" data-field="name">${result.name}</h3>
            <p class="editable" data-field="description">${result.description}</p>
            <p>Приоритет: <span class="editable" data-field="priority" data-value="${priorityValue}">${result.priority}</span></p>
            <p>Статус: <span class="editable" data-field="status" data-value="${statusValue}">${result.status}</span></p>
            <p>Срок: <span class="editable" data-field="dueDate">${result.dueDate}</span></p>
            <div class="progress-bar">
                <div class="progress" style="width: ${getProgressPercentage(result.status)}%;"></div>
            </div>
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

                task.classList.add("removing");
                setTimeout(() => {
                    server.removeFromSyncQueue(getTaskDataFromDOM(task));
                    local.deleteTaskFromLocalStorage(getTaskDataFromDOM(task));
                    task.remove();
                }, 300);

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
    function getTaskDataFromDOMWithValue(taskElement) {
        return {
            name: taskElement.querySelector("[data-field='name']").textContent,
            description: taskElement.querySelector("[data-field='description']").textContent,
            priority: taskElement.querySelector("[data-field='priority']").getAttribute("data-value"),
            status: taskElement.querySelector("[data-field='status']").getAttribute("data-value"),
            dueDate: taskElement.querySelector("[data-field='dueDate']").textContent,
        };
    }

    function makeEditable(element) {
        const field = element.getAttribute("data-field");
        const originalValue = element.textContent;

        element.classList.add("changed");
        setTimeout(() => element.classList.remove("changed"), 500);

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
                    await handleTaskUpdate(element, field, newValue);
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
                    await handleTaskUpdate(element, field, newValue);
                }
                element.textContent = newValue || originalValue;
            });

            input.addEventListener("keydown", async (e) => {
                if (e.key === "Enter") {
                    const newValue = input.value.trim();
                    if (newValue && newValue !== originalValue) {
                        await handleTaskUpdate(element, field, newValue);
                    }
                    element.textContent = newValue || originalValue;
                }
            });
        }
    }


    async function handleTaskUpdate(element, field, newValue) {
        const taskElement = element.closest(".task-item");
        const id = taskElement.getAttribute("data-id");
        const updatedTask = getTaskDataFromDOMWithValue(taskElement);
        updatedTask[field] = newValue;

        try {
            if (id) {
                if (isServerAvailable) {
                    try {
                        await server.updateTaskField(id, field, newValue);
                    }
                    catch (error) {
                        console.error(error);
                    }

                } else {
                    const updatedTaskWithId = {...updatedTask, id}

                    updatedTask[field] = null;
                    const localStorageTasks = local.loadTasksFromLocalStorage();
                    const taskIndexInLocalStorage = localStorageTasks.findIndex(t =>
                        (updatedTask.name == null || t.name === updatedTask.name) &&
                        (updatedTask.description == null || t.description === updatedTask.description) &&
                        (updatedTask.priority == null || t.priority === updatedTask.priority) &&
                        (updatedTask.status == null || t.status === updatedTask.status) &&
                        (updatedTask.dueDate == null || t.dueDate === updatedTask.dueDate)
                    )

                    console.log(updatedTaskWithId);
                    if ( taskIndexInLocalStorage !== -1 ) {
                        localStorageTasks[taskIndexInLocalStorage] = updatedTaskWithId;
                        local.saveTasksToLocalStorage(localStorageTasks);
                    }

                    server.addToUpdateQueue(updatedTaskWithId);
                    alert("Сервер недоступен. Изменения будут синхронизированы после восстановления соединения.");
                }
            } else {
                const tasksInSyncQueue = server.syncQueue;
                const localStorageTasks = local.loadTasksFromLocalStorage();
                updatedTask[field] = null;

                const taskIndex = tasksInSyncQueue.findIndex(t =>
                    (updatedTask.name == null || t.name === updatedTask.name) &&
                    (updatedTask.description == null || t.description === updatedTask.description) &&
                    (updatedTask.priority == null || t.priority === updatedTask.priority) &&
                    (updatedTask.status == null || t.status === updatedTask.status) &&
                    (updatedTask.dueDate == null || t.dueDate === updatedTask.dueDate)
                );

                const taskIndexInLocalStorage = localStorageTasks.findIndex(t =>
                    (updatedTask.name == null || t.name === updatedTask.name) &&
                    (updatedTask.description == null || t.description === updatedTask.description) &&
                    (updatedTask.priority == null || t.priority === updatedTask.priority) &&
                    (updatedTask.status == null || t.status === updatedTask.status) &&
                    (updatedTask.dueDate == null || t.dueDate === updatedTask.dueDate)
                )

                if (taskIndex !== -1 && taskIndexInLocalStorage !== -1) {
                    updatedTask[field] = newValue;
                    tasksInSyncQueue[taskIndex] = updatedTask;
                    localStorageTasks[taskIndexInLocalStorage] = updatedTask;
                    server.saveSyncQueue(tasksInSyncQueue);
                    local.saveTasksToLocalStorage(localStorageTasks);
                    alert("Задача обновлена в очереди синхронизации.");
                } else {
                    console.error("Ошибка: Задача не найдена в очереди синхронизации.");
                }
            }
        } catch (error) {
            console.error("Ошибка при обновлении задачи:", error.message);
        }
    }

    function filterTasks() {
        const statusFilter = document.getElementById("filter-status").value;
        const priorityFilter = document.getElementById("filter-priority").value;
        const dueDateFilter = document.getElementById("filter-dueDate").value;

        const tasks = Array.from(document.querySelectorAll(".task-item"));

        tasks.forEach(task => {
            const taskStatus = task.querySelector("[data-field='status']").getAttribute("data-value");
            const taskPriority = task.querySelector("[data-field='priority']").getAttribute("data-value");
            console.log(taskStatus + " " + taskPriority);
            const taskDueDate = task.querySelector("[data-field='dueDate']").textContent;

            let matchesStatus = statusFilter === "all" || taskStatus === statusFilter;
            let matchesPriority = priorityFilter === "all" || taskPriority === priorityFilter;
            let matchesDueDate = !dueDateFilter || taskDueDate === dueDateFilter;

            if (matchesStatus && matchesPriority && matchesDueDate) {
                task.style.display = "block";
            } else {
                task.style.display = "none";
            }
        });
    }

    document.getElementById("apply-filters").addEventListener("click", () => {
        filterTasks();
    });

    document.getElementById("reset-filters").addEventListener("click", () => {
        document.getElementById("filter-status").value = "all";
        document.getElementById("filter-priority").value = "all";
        document.getElementById("filter-dueDate").value = "";

        const tasks = Array.from(document.querySelectorAll(".task-item"));
        tasks.forEach(task => {
            task.style.display = "block";
        });
    });

});


