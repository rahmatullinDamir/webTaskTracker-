package dev.rahmatullin.tasktrackerbackend.Repositories;

import dev.rahmatullin.tasktrackerbackend.Models.Task;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {
}
