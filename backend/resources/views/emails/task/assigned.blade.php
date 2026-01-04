@component('mail::message')
# You have been assigned to a task

**Task:** {{ $task->title }}  
**Project:** {{ $task->project->name ?? 'Unknown Project' }}  
**Assigned By:** {{ $assigner->name ?? 'System' }}

@component('mail::button', ['url' => config('app.frontend_url') . '/' . $task->project->organization_id . '/project/' . $task->project_id . '/tasks?taskId=' . $task->id])
View Task
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
