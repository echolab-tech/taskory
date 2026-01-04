<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\TaskActivity;
use Illuminate\Http\Request;

class ProjectActivityController extends Controller
{
    public function index(Request $request, Project $project)
    {
        $activities = TaskActivity::whereHas('task', function ($query) use ($project) {
            $query->where('project_id', $project->id);
        })
        ->with(['user', 'task'])
        ->orderBy('created_at', 'desc')
        ->paginate(50);

        return $this->success($activities);
    }
}
