<?php

namespace App\Http\Controllers;

use App\Models\Milestone;
use App\Services\MilestoneService;
use Illuminate\Http\Request;

class MilestoneController extends Controller
{
    protected $milestoneService;

    public function __construct(MilestoneService $milestoneService)
    {
        $this->milestoneService = $milestoneService;
    }

    public function index(Request $request)
    {
        $request->validate(['project_id' => 'required|exists:projects,id']);
        $milestones = $this->milestoneService->getMilestonesByProject($request->project_id);
        return $this->success($milestones);
    }

    public function store(Request $request)
    {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'name' => 'required|string',
        ]);
        
        $milestone = $this->milestoneService->createMilestone($request->all());
        return $this->success($milestone, 'Milestone created successfully', 201);
    }

    public function update(Request $request, Milestone $milestone)
    {
        $updatedMilestone = $this->milestoneService->updateMilestone($milestone, $request->all());
        return $this->success($updatedMilestone, 'Milestone updated successfully');
    }

    public function destroy(Milestone $milestone)
    {
        $this->milestoneService->deleteMilestone($milestone);
        return $this->success([], 'Milestone deleted successfully');
    }
}
