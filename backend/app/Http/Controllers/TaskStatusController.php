<?php

namespace App\Http\Controllers;

use App\Models\TaskStatus;
use App\Services\TaskStatusService;
use Illuminate\Http\Request;

class TaskStatusController extends Controller
{
    protected $taskStatusService;

    public function __construct(TaskStatusService $taskStatusService)
    {
        $this->taskStatusService = $taskStatusService;
    }

    public function index(Request $request)
    {
        $request->validate(['project_id' => 'required|exists:projects,id']);
        $statuses = $this->taskStatusService->getStatusesByProject($request->project_id);
        return $this->success($statuses);
    }

    public function store(Request $request)
    {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'name' => 'required|string',
        ]);

        $status = $this->taskStatusService->createStatus($request->all());
        return $this->success($status, 'Status created successfully', 201);
    }

    public function update(Request $request, TaskStatus $taskStatus)
    {
        $updatedStatus = $this->taskStatusService->updateStatus($taskStatus, $request->all());
        return $this->success($updatedStatus, 'Status updated successfully');
    }

    public function destroy(TaskStatus $taskStatus)
    {
        $this->taskStatusService->deleteStatus($taskStatus);
        return $this->success([], 'Status deleted successfully');
    }
}
