<?php

namespace App\Services;

use App\Models\Task;
use Illuminate\Support\Facades\Auth;

class TaskService
{
    public function getTasks(array $filters)
    {
        $query = Task::query();

        if (isset($filters['project_id'])) {
            $query->where('project_id', $filters['project_id']);
        }

        if (isset($filters['assignee_id'])) {
            $query->where('assignee_id', $filters['assignee_id']);
        }

        if (isset($filters['assignee_ids']) && is_array($filters['assignee_ids'])) {
             $query->whereIn('assignee_id', $filters['assignee_ids']);
        }

        if (isset($filters['status_ids']) && is_array($filters['status_ids'])) {
            $query->whereIn('status_id', $filters['status_ids']);
        }

        if (isset($filters['date_created_start'])) {
            $query->whereDate('created_at', '>=', $filters['date_created_start']);
        }
        if (isset($filters['date_created_end'])) {
            $query->whereDate('created_at', '<=', $filters['date_created_end']);
        }

        if (isset($filters['date_updated_start'])) {
            $query->whereDate('updated_at', '>=', $filters['date_updated_start']);
        }
        if (isset($filters['date_updated_end'])) {
            $query->whereDate('updated_at', '<=', $filters['date_updated_end']);
        }

        if (isset($filters['due_date_start'])) {
            $query->whereDate('due_date', '>=', $filters['due_date_start']);
        }
        if (isset($filters['due_date_end'])) {
            $query->whereDate('due_date', '<=', $filters['due_date_end']);
        }

        // Only show top-level tasks in the main list
        $query->whereNull('parent_id');

        return $query->with('assignee', 'status', 'milestone', 'creator', 'subtasks.assignee', 'subtasks.status', 'subtasks.creator')
                     ->withCount(['comments', 'subtasks'])
                     ->orderBy('position', 'asc')
                     ->get();
    }

    public function reorderTasks(array $tasks)
    {
        foreach ($tasks as $taskData) {
            Task::where('id', $taskData['id'])->update(['position' => $taskData['position']]);
        }
    }

    public function createTask(array $data)
    {
        if (!isset($data['position'])) {
            $maxPosition = Task::where('project_id', $data['project_id'])->max('position');
            $data['position'] = ($maxPosition !== null) ? $maxPosition + 1 : 0;
        }
        if (!isset($data['creator_id'])) {
            $data['creator_id'] = Auth::id();
        }
        
        $task = Task::create($data);
        
        $this->logActivity($task, 'created', null, ['title' => $task->title]);
        
        return $task;
    }

    public function updateTask(Task $task, array $data)
    {
        $original = $task->replicate(); // Keep clean copy of original state
        $task->fill($data);
        
        $changes = [];
        // Track specific field changes with human-readable values
        if ($task->isDirty('status_id')) {
            $oldStatus = \App\Models\TaskStatus::find($original->status_id);
            $newStatus = \App\Models\TaskStatus::find($task->status_id);
            $changes[] = [
                'field' => 'Status',
                'old' => $oldStatus ? $oldStatus->name : 'None',
                'new' => $newStatus ? $newStatus->name : 'None'
            ];
        }

        if ($task->isDirty('priority')) {
            $changes[] = [
                'field' => 'Priority',
                'old' => ucfirst($original->priority ?? 'None'),
                'new' => ucfirst($task->priority)
            ];
        }

        $assigneeChanged = false;
        if ($task->isDirty('assignee_id')) {
            $oldUser = \App\Models\User::find($original->assignee_id);
            $newUser = \App\Models\User::find($task->assignee_id);
            $changes[] = [
                'field' => 'Assignee',
                'old' => $oldUser ? $oldUser->name : 'Unassigned',
                'new' => $newUser ? $newUser->name : 'Unassigned'
            ];
            $assigneeChanged = true;
        }
        
        if ($task->isDirty('due_date')) {
            $changes[] = [
                'field' => 'Due Date',
                'old' => $original->due_date,
                'new' => $task->due_date
            ];
        }
        
        if ($task->isDirty('title')) {
             $changes[] = [
                'field' => 'Title',
                'old' => $original->title,
                'new' => $task->title
            ];
        }

        if ($task->isDirty('parent_id')) {
             $changes[] = [
                'field' => 'Parent Task',
                'old' => $original->parent_id,
                'new' => $task->parent_id
            ];
        }

        if ($task->isDirty('estimated_hours')) {
             $changes[] = [
                'field' => 'Estimated Hours',
                'old' => $original->estimated_hours,
                'new' => $task->estimated_hours
            ];
        }

        if ($task->isDirty('actual_hours')) {
             $changes[] = [
                'field' => 'Actual Hours',
                'old' => $original->actual_hours,
                'new' => $task->actual_hours
            ];
        }

        $task->save();

        // Log formatted changes
        foreach ($changes as $change) {
            $this->logActivity(
                $task, 
                $change['field'] . "_updated", 
                $change['old'], 
                $change['new']
            );
        }

        // Send Email if Assignee Changed
        if ($assigneeChanged && $task->assignee_id) {
            $assignee = \App\Models\User::find($task->assignee_id);
            if ($assignee && $assignee->email) {
                \Illuminate\Support\Facades\Mail::to($assignee->email)->send(
                    new \App\Mail\TaskAssigned($task, Auth::user())
                );
            }
        }
        
        return $task;
    }

    protected function logActivity(Task $task, string $action, $oldValue, $newValue)
    {
        $task->activities()->create([
            'user_id' => Auth::id(),
            'action' => $action,
            'old_value' => $oldValue, // Now storing readable string/name
            'new_value' => $newValue, // Now storing readable string/name
        ]);
    }

    public function deleteTask(Task $task)
    {
        $task->delete();
    }

    public function getTaskActivities(Task $task)
    {
        // 1. Comments
        $comments = $task->comments()->with('user')->get()->map(function ($comment) {
            return [
                'id' => 'c_' . $comment->id,
                'type' => 'comment',
                'user' => $comment->user,
                'content' => $comment->content,
                'created_at' => $comment->created_at,
            ];
        });

        // 2. System Activities
        $activities = $task->activities()
            ->where('action', '!=', 'comment')
            ->with('user')
            ->get()
            ->map(function ($activity) {
            // Build readable content string
            $field = str_replace('_updated', '', $activity->action);
            
            // Format: "Changed Status from 'Open' to 'Done'"
            // Since we stored readable names in old_value/new_value, we can use them directly
            // Handle array/json if it was casted, but we passed strings in updateTask
            $old = is_array($activity->old_value) ? json_encode($activity->old_value) : $activity->old_value;
            $new = is_array($activity->new_value) ? json_encode($activity->new_value) : $activity->new_value; // Handle potential old log format if needed
            
            // Temporary fix for legacy logs that might be array
            if (is_array($activity->old_value) && isset($activity->old_value['status_id'])) $old = "ID: " . $activity->old_value['status_id'];

            $content = "Changed {$field} from '{$old}' to '{$new}'";
            
            if ($activity->action === 'status_changed') {
                 // Legacy handling for 'status_changed' action if exists
                 $content = "Changed Status"; 
            }

            return [
                'id' => 'a_' . $activity->id,
                'type' => 'activity',
                'user' => $activity->user,
                'content' => $content,
                'created_at' => $activity->created_at ?? now(), // Ensure DB has created_at or use migration to add it
                'meta' => [
                    'old' => $activity->old_value,
                    'new' => $activity->new_value
                ]
            ];
        });

        // 3. Attachments
        $attachments = $task->attachments()->with('user')->get()->map(function ($att) {
            return [
                'id' => 'f_' . $att->id,
                'type' => 'file',
                'user' => $att->user,
                'content' => "Uploaded file: " . $att->file_name,
                'created_at' => $att->created_at,
                'file_url' => asset('storage/' . $att->file_path),
                'file_name' => $att->file_name
            ];
        });

        $feed = $comments->concat($activities)->concat($attachments);
        
        // Sort Ascending (Oldest -> Newest) so newest is at the bottom of the chat list
        return $feed->sortBy('created_at')->values();
    }

    public function createComment(Task $task, array $data, array $files = [])
    {
        $comment = $task->comments()->create([
            'user_id' => Auth::id(),
            'content' => $data['content'] ?? '',
        ]);
        
        // Log comment as activity so it appears in project feed
        $this->logActivity($task, 'comment', null, ['content' => $comment->content]);

        // Sending Mention Emails
        // Regex to find @Name
        preg_match_all('/@(\w+)/', $comment->content, $matches);
        if (!empty($matches[1])) {
            $mentionedNames = array_unique($matches[1]);
            // Search users in project (or specific scope if needed)
            $users = \App\Models\User::whereIn('name', $mentionedNames)->get(); // Simple matching by name
            
            foreach ($users as $user) {
                if ($user->email && $user->id !== Auth::id()) {
                     \Illuminate\Support\Facades\Mail::to($user->email)->send(
                        new \App\Mail\CommentMentioned($task, $comment, Auth::user())
                    );
                }
            }
        }

        if (!empty($files)) {
            foreach ($files as $file) {
                $path = $file->store('attachments', 'public');
                $task->attachments()->create([
                    'user_id' => Auth::id(),
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                ]);
            }
        }

        return $comment;
    }
}
