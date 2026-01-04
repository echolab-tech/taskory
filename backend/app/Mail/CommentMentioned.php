<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CommentMentioned extends Mailable
{
    use Queueable, SerializesModels;

    public $task;
    public $comment;
    public $commenter;

    public function __construct($task, $comment, $commenter)
    {
        $this->task = $task;
        $this->comment = $comment;
        $this->commenter = $commenter;
    }

    public function build()
    {
        return $this->markdown('emails.comment.mentioned')
                    ->subject('You were mentioned in a comment on task: ' . $this->task->title);
    }
}
