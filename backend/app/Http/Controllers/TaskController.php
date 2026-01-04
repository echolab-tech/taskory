<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    protected $taskService;

    public function __construct(TaskService $taskService)
    {
        $this->taskService = $taskService;
    }

    public function index(Request $request)
    {
        $tasks = $this->taskService->getTasks($request->all());
        return $this->success($tasks);
    }

    public function store(Request $request)
    {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'title' => 'required|string|max:255',
            'status_id' => 'nullable|exists:task_statuses,id',
            'assignee_id' => 'nullable|exists:users,id',
            'milestone_id' => 'nullable|exists:milestones,id',
            'priority' => 'nullable|in:low,medium,high',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
        ]);

        $task = $this->taskService->createTask($request->all());
        return $this->success($task, 'Task created successfully', 201);
    }

    public function show(Task $task)
    {
        return $this->success($task->load('activities', 'comments', 'attachments', 'assignee', 'status'));
    }

    public function update(Request $request, Task $task)
    {
        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'status_id' => 'nullable|exists:task_statuses,id',
            'assignee_id' => 'nullable|exists:users,id',
            'milestone_id' => 'nullable|exists:milestones,id',
            'priority' => 'nullable|in:low,medium,high',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
        ]);
        $updatedTask = $this->taskService->updateTask($task, $request->all());
        return $this->success($updatedTask, 'Task updated successfully');
    }

    public function destroy(Task $task)
    {
        $this->taskService->deleteTask($task);
        return $this->success([], 'Task deleted successfully');
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'tasks' => 'required|array',
            'tasks.*.id' => 'required|exists:tasks,id',
            'tasks.*.position' => 'required|integer',
        ]);

        $this->taskService->reorderTasks($request->tasks);
        return $this->success([], 'Tasks reordered successfully');
    }
    public function comments(Task $task)
    {
        $activities = $this->taskService->getTaskActivities($task);
        return $this->success($activities);
    }

    public function storeComment(Request $request, Task $task)
    {
        $request->validate([
            'content' => 'nullable|string',
            'files' => 'nullable|array',
            'files.*' => 'file|max:10240' // 10MB max per file
        ]);

        if (!$request->content && !$request->hasFile('files')) {
            return response()->json(['message' => 'Content or files required'], 422);
        }

        $this->taskService->createComment($task, $request->all(), $request->file('files', []));
        
        return $this->success([], 'Comment posted successfully');
    }
}
