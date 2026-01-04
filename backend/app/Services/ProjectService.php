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

        // Add creator as admin
        $user = auth()->user();
        if ($user) {
            $project->users()->attach($user->id, ['role' => 'admin']);
        }

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

    public function addUserToProject(Project $project, string $email)
    {
        $user = \App\Models\User::where('email', $email)->first();

        if (!$user) {
            throw new \Exception("User with email {$email} not found.");
        }

        // Optional: Check if user is in the organization of the project?
        // For now, allow adding any user, potentially auto-adding to Org or just strictly Project context.
        // Let's assume strict project membership for now.

        if ($project->users()->where('user_id', $user->id)->exists()) {
             throw new \Exception("User is already a member of this project.");
        }

        // Ensure user is in the organization
        if (!$project->organization) {
            $project->load('organization');
        }
        
        if (!$project->organization->users()->where('user_id', $user->id)->exists()) {
             throw new \Exception("User must be a member of the organization ({$project->organization->name}) before being added to the project.");
        }

        $project->users()->attach($user->id, ['role' => 'member']);

        return $user;
    }
}
