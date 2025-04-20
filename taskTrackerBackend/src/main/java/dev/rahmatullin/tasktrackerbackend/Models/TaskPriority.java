package dev.rahmatullin.tasktrackerbackend.Models;

public enum TaskPriority {
    HIGH("Высокий"),
    MEDIUM("Средний"),
    LOW("Низкий");

    private final String displayName;

    TaskPriority(String displayName) {
        this.displayName = displayName;
    }

    @Override
    public String toString() {
        return displayName;
    }
}
