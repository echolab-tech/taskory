<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\TaskActivity;
use Illuminate\Http\Request;

class ProjectDashboardController extends Controller
{
    public function index(Project $project)
    {
        // Get recent activities (limit 10 for dashboard)
        $activities = TaskActivity::whereHas('task', function ($query) use ($project) {
            $query->where('project_id', $project->id);
        })
        ->with(['user', 'task'])
        ->orderBy('created_at', 'desc')
        ->limit(10)
        ->get()
        ->map(function ($activity) {
            return [
                'id' => $activity->id,
                'user' => $activity->user,
                'task' => $activity->task ? [
                    'id' => $activity->task->id,
                    'title' => $activity->task->title
                ] : null,
                'action' => $this->formatAction($activity),
                'created_at' => $activity->created_at,
            ];
        });

        return $this->success($activities);
    }

    private function formatAction($activity)
    {
        $taskTitle = $activity->task ? $activity->task->title : 'a task';
        
        switch ($activity->action) {
            case 'created':
                return "created task \"{$taskTitle}\"";
            case 'Status_updated':
                return "updated status of \"{$taskTitle}\"";
            case 'Assignee_updated':
                return "changed assignee for \"{$taskTitle}\"";
            case 'Priority_updated':
                return "updated priority of \"{$taskTitle}\"";
            case 'Due Date_updated':
                return "changed due date for \"{$taskTitle}\"";
            case 'Title_updated':
                return "renamed \"{$taskTitle}\"";
            case 'Estimated Hours_updated':
                return "updated estimated hours for \"{$taskTitle}\"";
            case 'Actual Hours_updated':
                return "logged hours for \"{$taskTitle}\"";
            case 'comment':
                return "commented on \"{$taskTitle}\"";
            default:
                return "updated \"{$taskTitle}\"";
        }
    }
}
