<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Services\OrganizationService;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    protected $organizationService;

    public function __construct(OrganizationService $organizationService)
    {
        $this->organizationService = $organizationService;
    }

    public function index()
    {
        $data = $this->organizationService->getUserOrganizations(auth()->user());
        return $this->success($data);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);
        $organization = $this->organizationService->createOrganization($request->all());
        return $this->success($organization, 'Organization created successfully', 201);
    }

    public function show(Organization $organization)
    {
        return $this->success($organization->load('projects', 'users'));
    }

    public function update(Request $request, Organization $organization)
    {
        $request->validate(['name' => 'required|string|max:255']);
        $updatedOrg = $this->organizationService->updateOrganization($organization, $request->all());
        return $this->success($updatedOrg, 'Organization updated successfully');
    }

    public function destroy(Organization $organization)
    {
        // $this->authorize('delete', $organization);
        $this->organizationService->deleteOrganization($organization);
        return $this->success([], 'Organization deleted successfully');
    }

    public function addUser(Request $request, Organization $organization)
    {
        $request->validate([
            'email' => 'required|email',
            'project_id' => 'nullable|integer' // Optional: if inviting directly to a project context
        ]);

        try {
            $result = $this->organizationService->inviteUser($organization, $request->email, $request->input('project_id'));
            
            if ($result instanceof \App\Models\User) {
                return $this->success($result, 'User added to project successfully');
            }
            
            return $this->success($result, 'Invitation sent successfully');
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function acceptInvite(Request $request)
    {
        $request->validate(['token' => 'required|string']);

        try {
            $organization = $this->organizationService->acceptInvitation($request->token, auth()->user());
            return $this->success($organization, 'Joined organization successfully');
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
