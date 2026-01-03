<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\ProjectService;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    protected $projectService;

    public function __construct(ProjectService $projectService)
    {
        $this->projectService = $projectService;
    }

    public function index(Request $request)
    {
        $projects = $this->projectService->getProjects($request->all());
        return $this->success($projects);
    }

    public function store(Request $request)
    {
        $request->validate([
            'organization_id' => 'required|exists:organizations,id',
            'name' => 'required|string|max:255',
        ]);

        $project = $this->projectService->createProject($request->all());
        return $this->success($project, 'Project created successfully', 201);
    }

    public function show(Project $project)
    {
        return $this->success($project->load('statuses', 'milestones', 'organization'));
    }

    public function update(Request $request, Project $project)
    {
        $updatedProject = $this->projectService->updateProject($project, $request->all());
        return $this->success($updatedProject, 'Project updated successfully');
    }

    public function destroy(Project $project)
    {
        $this->projectService->deleteProject($project);
        return $this->success([], 'Project deleted successfully');
    }
}
