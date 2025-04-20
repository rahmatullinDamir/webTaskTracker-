package dev.rahmatullin.tasktrackerbackend.Services;

import dev.rahmatullin.tasktrackerbackend.Dto.TaskDto;
import dev.rahmatullin.tasktrackerbackend.Dto.TaskForm;

import java.util.List;

public interface TaskService {
    TaskDto addTask(TaskForm taskForm);

    List<TaskDto> getAllTasks();

    TaskDto getTask(Long taskId);

    boolean updateTask(Long taskId, TaskForm taskForm);

    boolean deleteTask(Long taskId);
}
