<?php

namespace App\Services;

use App\Models\Task;
use Illuminate\Support\Facades\Auth;

class TaskService
{
    public function getTasks(array $filters)
    {
        $query = Task::query();

        if (isset($filters['project_id'])) {
            $query->where('project_id', $filters['project_id']);
        }

        if (isset($filters['assignee_id'])) {
            $query->where('assignee_id', $filters['assignee_id']);
        }

        return $query->with('assignee', 'status', 'milestone', 'creator')
                     ->orderBy('position', 'asc')
                     ->get();
    }

    public function reorderTasks(array $tasks)
    {
        foreach ($tasks as $taskData) {
            Task::where('id', $taskData['id'])->update(['position' => $taskData['position']]);
        }
    }

    public function createTask(array $data)
    {
        if (!isset($data['position'])) {
            $maxPosition = Task::where('project_id', $data['project_id'])->max('position');
            $data['position'] = ($maxPosition !== null) ? $maxPosition + 1 : 0;
        }
        if (!isset($data['creator_id'])) {
            $data['creator_id'] = Auth::id();
        }
        return Task::create($data);
    }

    public function updateTask(Task $task, array $data)
    {
        $oldData = $task->toArray();
        $task->update($data);

        // Activity Logging Logic
        if ($task->wasChanged('status_id')) {
            $this->logActivity($task, 'status_changed', ['status_id' => $oldData['status_id']], ['status_id' => $task->status_id]);
        }
        
        return $task;
    }

    protected function logActivity(Task $task, string $action, $oldValue, $newValue)
    {
        $task->activities()->create([
            'user_id' => Auth::id(),
            'action' => $action,
            'old_value' => $oldValue,
            'new_value' => $newValue,
        ]);
    }

    public function deleteTask(Task $task)
    {
        $task->delete();
    }
}
