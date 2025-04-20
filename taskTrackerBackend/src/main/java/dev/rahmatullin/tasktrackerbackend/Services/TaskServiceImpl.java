package dev.rahmatullin.tasktrackerbackend.Services;

import dev.rahmatullin.tasktrackerbackend.Dto.TaskDto;
import dev.rahmatullin.tasktrackerbackend.Dto.TaskForm;
import dev.rahmatullin.tasktrackerbackend.Models.Task;
import dev.rahmatullin.tasktrackerbackend.Repositories.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class TaskServiceImpl implements TaskService {
    @Autowired
    private TaskRepository taskRepository;
    @Override
    public TaskDto addTask(TaskForm taskForm) {
        Task task = Task.builder()
                .name(taskForm.getName())
                .description(taskForm.getDescription())
                .status(taskForm.getStatus())
                .priority(taskForm.getPriority())
                .dueDate(taskForm.getDueDate())
                .build();
        taskRepository.save(task);

        return TaskDto.in(task);
    }

    @Override
    public List<TaskDto> getAllTasks() {
        return TaskDto.from(taskRepository.findAll());
    }

    @Override
    public TaskDto getTask(Long taskId) {
        Optional<Task> task = taskRepository.findById(taskId);
        if (task.isPresent()) {
            return TaskDto.in(task.get());
        }
        return null;
    }

    @Override
    public boolean updateTask(Long taskId, TaskForm taskForm) {
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return false;
        }

        if (taskForm.getName() != null) task.setName(taskForm.getName());
        if (taskForm.getDescription() != null) task.setDescription(taskForm.getDescription());
        if (taskForm.getStatus() != null) task.setStatus(taskForm.getStatus());
        if (taskForm.getPriority() != null) task.setPriority(taskForm.getPriority());
        if (taskForm.getDueDate() != null) task.setDueDate(taskForm.getDueDate());

        taskRepository.save(task);
        return true;
    }

    @Override
    public boolean deleteTask(Long taskId) {
        if (taskRepository.existsById(taskId)) {
           taskRepository.deleteById(taskId);
           return true;
        }
        return false;
    }

}
