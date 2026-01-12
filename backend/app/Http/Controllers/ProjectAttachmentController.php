<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Attachment;
use Illuminate\Http\Request;

class ProjectAttachmentController extends Controller
{
    public function index(Project $project)
    {
        // Get attachments for the project itself
        // AND attachments for any tasks within this project.
        
        $taskIds = $project->tasks()->pluck('id');
        
        $attachments = Attachment::where(function($q) use ($project) {
                // Direct project attachments
                $q->where('attachable_type', Project::class)
                  ->where('attachable_id', $project->id);
            })
            ->orWhere(function($q) use ($taskIds) {
                // Task attachments
                $q->where('attachable_type', \App\Models\Task::class)
                  ->whereIn('attachable_id', $taskIds);
            })
            ->with('user')
            ->latest()
            ->get();

        return $this->success($attachments);
    }
}
