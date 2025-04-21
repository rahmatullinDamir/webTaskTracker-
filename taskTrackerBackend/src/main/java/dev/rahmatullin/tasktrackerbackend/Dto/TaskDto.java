package dev.rahmatullin.tasktrackerbackend.Dto;

import dev.rahmatullin.tasktrackerbackend.Models.Task;
import dev.rahmatullin.tasktrackerbackend.Models.TaskPriority;
import dev.rahmatullin.tasktrackerbackend.Models.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskDto {
    private Long id;
    private String name;
    private String description;
    private String priority;
    private String status;
    private String dueDate;

//    private static DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    public static TaskDto in(Task task) {
        return TaskDto.builder()
                .id(task.getId())
                .name(task.getName())
                .description(task.getDescription())
                .priority(task.getPriority().toString())
                .status(task.getStatus().toString())
                .dueDate(String.valueOf(task.getDueDate()))
                .build();
    }

    public static List<TaskDto> from(List<Task> tasks) {
        return tasks.stream().map(TaskDto::in).toList();
    }
}
