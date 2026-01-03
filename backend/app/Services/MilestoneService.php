<?php

namespace App\Services;

use App\Models\Milestone;

class MilestoneService
{
    public function getMilestonesByProject($projectId)
    {
        return Milestone::where('project_id', $projectId)->get();
    }

    public function createMilestone(array $data)
    {
        return Milestone::create($data);
    }

    public function updateMilestone(Milestone $milestone, array $data)
    {
        $milestone->update($data);
        return $milestone;
    }

    public function deleteMilestone(Milestone $milestone)
    {
        $milestone->delete();
    }
}
