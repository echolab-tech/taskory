@component('mail::message')
# You were mentioned in a comment

**Task:** {{ $task->title }}  
**User:** {{ $commenter->name }}

"{{ $comment->content }}"

@component('mail::button', ['url' => config('app.frontend_url') . '/' . $task->project->organization_id . '/project/' . $task->project_id . '/tasks?taskId=' . $task->id])
View Comment
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
