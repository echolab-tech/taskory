<?php

namespace App\Services;

use App\Models\Project;

class ProjectService
{
    public function getProjects(array $filters)
    {
        if (isset($filters['organization_id'])) {
            return Project::where('organization_id', $filters['organization_id'])->get();
        }

        // Return all projects that belong to organizations the user is a member of
        $user = auth()->user();
        if (!$user) {
            return collect();
        }

        $organizationIds = $user->organizations()->pluck('organizations.id');
        return Project::whereIn('organization_id', $organizationIds)->get();
    }

    public function createProject(array $data)
    {
        $project = Project::create($data);
        
        // Seed default statuses
        (new \Database\Seeders\DefaultTaskStatusSeeder())->run($project->id);

        return $project;
    }

    public function updateProject(Project $project, array $data)
    {
        $project->update($data);
        return $project;
    }

    public function deleteProject(Project $project)
    {
        $project->delete();
    }
}
