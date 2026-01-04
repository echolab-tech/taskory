<?php

namespace App\Mail;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrganizationInvitation extends Mailable
{
    use Queueable, SerializesModels;

    public $invitation;

    public function __construct(Invitation $invitation)
    {
        $this->invitation = $invitation;
    }

    public function build()
    {
        $url = config('app.frontend_url') . '/accept-invite?token=' . $this->invitation->token;

        return $this->subject('Invitation to join ' . $this->invitation->organization->name)
                    ->markdown('emails.organization.invitation', ['url' => $url, 'invitation' => $this->invitation]);
    }
}
