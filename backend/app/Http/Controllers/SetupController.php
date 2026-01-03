<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\Project;
use App\Models\TaskStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SetupController extends Controller
{
    public function createOrganization(Request $request)
    {
        $request->validate([
            'organization_name' => 'required|string|max:255',
            'project_name' => 'nullable|string|max:255',
        ]);

        $user = Auth::user();

        // Check if user already has organization
        if ($user->organizations()->exists() || Organization::where('owner_id', $user->id)->exists()) {
            return response()->json(['message' => 'User already has an organization'], 400);
        }

        // Create organization
        $organization = Organization::create([
            'name' => $request->organization_name,
            'owner_id' => $user->id,
        ]);

        // Add user to organization as owner
        $organization->users()->attach($user->id, ['role' => 'owner']);

        $project = null;
        
        // Create project if name provided
        if ($request->project_name) {
            $project = Project::create([
                'organization_id' => $organization->id,
                'name' => $request->project_name,
                'status' => 'active',
            ]);

            // Seed default statuses
            (new \Database\Seeders\DefaultTaskStatusSeeder())->run($project->id);
        }

        return response()->json([
            'message' => 'Organization created successfully',
            'organization' => $organization,
            'project' => $project,
        ]);
    }
}
