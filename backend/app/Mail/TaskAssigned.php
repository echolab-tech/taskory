<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TaskAssigned extends Mailable
{
    use Queueable, SerializesModels;

    public $task;
    public $assigner;

    public function __construct($task, $assigner)
    {
        $this->task = $task;
        $this->assigner = $assigner;
    }

    public function build()
    {
        return $this->markdown('emails.task.assigned')
                    ->subject('You have been assigned to a task: ' . $this->task->title);
    }
}
