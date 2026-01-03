<?php

namespace App\Services;

use App\Models\TaskStatus;

class TaskStatusService
{
    public function getStatusesByProject($projectId)
    {
        return TaskStatus::where('project_id', $projectId)
                         ->orderBy('position')
                         ->get();
    }

    public function createStatus(array $data)
    {
        return TaskStatus::create($data);
    }

    public function updateStatus(TaskStatus $status, array $data)
    {
        $status->update($data);
        return $status;
    }

    public function deleteStatus(TaskStatus $status)
    {
        $status->delete();
    }
}
