<?php

namespace App\Services;

use App\Models\Organization;
use Illuminate\Support\Facades\Auth;

class OrganizationService
{
    public function getUserOrganizations($user)
    {
        $ownOrgs = Organization::where('owner_id', $user->id)->get();
        $memberOrgs = $user->organizations;
        
        return $ownOrgs->merge($memberOrgs)->unique('id');
    }

    public function createOrganization(array $data)
    {
        return Organization::create([
            'name' => $data['name'],
            'owner_id' => Auth::id(),
        ]);
    }

    public function updateOrganization(Organization $organization, array $data)
    {
        $organization->update($data);
        return $organization;
    }

    public function deleteOrganization(Organization $organization)
    {
        $organization->delete();
    }

    public function inviteUser(Organization $organization, string $email, ?int $projectId = null)
    {
        // Check if user is already a member
        $existingUser = \App\Models\User::where('email', $email)->first();
        if ($existingUser && $organization->users()->where('user_id', $existingUser->id)->exists()) {
             if ($projectId) {
                  $project = \App\Models\Project::find($projectId);
                  if ($project && $project->organization_id === $organization->id) {
                      if ($project->users()->where('user_id', $existingUser->id)->exists()) {
                          throw new \Exception("User is already a member of this project.");
                      }
                      // Direct Add
                      $project->users()->attach($existingUser->id, ['role' => 'member']);
                      return $existingUser;
                  }
             }
             throw new \Exception("User is already a member of this organization.");
        }

        if ($projectId) {
            $project = \App\Models\Project::where('id', $projectId)->where('organization_id', $organization->id)->first();
            if (!$project) {
                throw new \Exception("Project invalid or does not belong to organization.");
            }
        }

        // Create Invitation
        $invitation = \App\Models\Invitation::updateOrCreate(
            ['email' => $email, 'organization_id' => $organization->id],
            [
                'token' => \Illuminate\Support\Str::random(32),
                'role' => 'member',
                'project_id' => $projectId
            ]
        );

        // Send Email
        \Illuminate\Support\Facades\Mail::to($email)->send(new \App\Mail\OrganizationInvitation($invitation));

        return $invitation;
    }

    public function acceptInvitation(string $token, \App\Models\User $user)
    {
        $invitation = \App\Models\Invitation::where('token', $token)->first();

        if (!$invitation) {
            throw new \Exception("Invalid invitation token.");
        }

        if ($user->email !== $invitation->email) {
            throw new \Exception("This invitation is for {$invitation->email}, not {$user->email}.");
        }

        // Add to Organization
        if (!$invitation->organization->users()->where('user_id', $user->id)->exists()) {
            $invitation->organization->users()->attach($user->id, ['role' => $invitation->role]);
        }
        
        // Add to Project if specified
        if ($invitation->project_id) {
             // Ensure project exists and belongs to organization (sanity check, though schema constraints handle most)
             $project = \App\Models\Project::find($invitation->project_id);
             if ($project && $project->organization_id === $invitation->organization_id) {
                 if (!$project->users()->where('user_id', $user->id)->exists()) {
                     $project->users()->attach($user->id, ['role' => 'member']);
                 }
             }
        }

        // Delete invitation
        $invitation->delete();

        return $invitation->organization;
    }

    // Deprecated direct add (or used internal)
    public function addUserToOrganization(Organization $organization, string $email)
    {
        // ... (Keep existing if needed for manual admin adds without email flow, but invite is preferred)
        // For now, I'll remove it or alias it? Use logic above.
        // Let's repurpose this original function to be the 'Internal Immediate Add' if ever needed, but user wants Invite flow.
        return $this->inviteUser($organization, $email);
    }
}
