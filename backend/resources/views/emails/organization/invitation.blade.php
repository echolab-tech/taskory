@component('mail::message')
# You have been invited to join {{ $invitation->organization->name }}

You have been invited to join the organization **{{ $invitation->organization->name }}** on Taskory.

@component('mail::button', ['url' => $url])
Accept Invitation
@endcomponent

If you did not expect this invitation, you can ignore this email.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
