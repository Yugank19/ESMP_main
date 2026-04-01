"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTaskDto = exports.CreateTaskDto = exports.TaskPriority = exports.TaskStatus = exports.UpdateProjectDto = exports.CreateProjectDto = exports.ProjectStatus = void 0;
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus["PLANNING"] = "PLANNING";
    ProjectStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ProjectStatus["COMPLETED"] = "COMPLETED";
    ProjectStatus["ON_HOLD"] = "ON_HOLD";
})(ProjectStatus || (exports.ProjectStatus = ProjectStatus = {}));
class CreateProjectDto {
}
exports.CreateProjectDto = CreateProjectDto;
class UpdateProjectDto {
}
exports.UpdateProjectDto = UpdateProjectDto;
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["TODO"] = "TODO";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["REVIEW"] = "REVIEW";
    TaskStatus["DONE"] = "DONE";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "LOW";
    TaskPriority["MEDIUM"] = "MEDIUM";
    TaskPriority["HIGH"] = "HIGH";
    TaskPriority["URGENT"] = "URGENT";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
class CreateTaskDto {
}
exports.CreateTaskDto = CreateTaskDto;
class UpdateTaskDto {
}
exports.UpdateTaskDto = UpdateTaskDto;
//# sourceMappingURL=projects-tasks.dto.js.map