package dev.rahmatullin.tasktrackerbackend.Dto;

import dev.rahmatullin.tasktrackerbackend.Models.TaskPriority;
import dev.rahmatullin.tasktrackerbackend.Models.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskForm {

    private String name;
    private String description;
    private TaskPriority priority;
    private TaskStatus status;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dueDate;
}
