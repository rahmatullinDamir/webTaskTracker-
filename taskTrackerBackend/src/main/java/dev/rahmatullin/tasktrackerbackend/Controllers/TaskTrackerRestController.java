package dev.rahmatullin.tasktrackerbackend.Controllers;

import dev.rahmatullin.tasktrackerbackend.Dto.TaskDto;
import dev.rahmatullin.tasktrackerbackend.Dto.TaskForm;
import dev.rahmatullin.tasktrackerbackend.Services.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks")
@CrossOrigin(origins = "http://localhost:63342")
public class TaskTrackerRestController {

    @Autowired
    private TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskDto> postTask(@RequestBody TaskForm taskForm) {
        System.out.println(taskForm);
        TaskDto createdTask = taskService.addTask(taskForm);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTask);
    }

    @GetMapping("/health")
    public ResponseEntity<String> checkHealth() {
        return ResponseEntity.ok("Server is up and running");
    }

    @GetMapping
    public ResponseEntity<List<TaskDto>> getTasks() {
        List<TaskDto> tasks = taskService.getAllTasks();

        if (tasks.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(tasks);
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<Void> updateTask(@PathVariable Long taskId,
                                           @RequestBody TaskForm taskForm) {
        boolean isUpdated = taskService.updateTask(taskId, taskForm);

        if (isUpdated) {
            return ResponseEntity.ok().build();
        }

        return ResponseEntity.notFound().build();

    }

    @GetMapping("/{taskId}")
    public ResponseEntity<TaskDto> getTask(@PathVariable Long taskId) {
        TaskDto task = taskService.getTask(taskId);

        if (task != null) {
           return ResponseEntity.ok(task);
        }

        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long taskId) {
        System.out.println("Deleting task with ID: " + taskId);
        boolean isDeleted = taskService.deleteTask(taskId);
        if (isDeleted) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

}
