package dev.rahmatullin.tasktrackerbackend.Models;

public enum TaskStatus {
    PENDING("В ожидании"),
    IN_PROGRESS("В ходе выполнения"),
    COMPLETED("Выполнено");

    String displayName;

    TaskStatus(String name) {
        displayName = name;
    }

    @Override
    public String toString() {
        return displayName;
    }

}
