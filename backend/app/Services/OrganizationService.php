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
}
