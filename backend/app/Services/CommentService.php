<?php

namespace App\Services;

use App\Models\Comment;
use Illuminate\Support\Facades\Auth;

class CommentService
{
    public function createComment(array $data)
    {
        return Comment::create([
            'task_id' => $data['task_id'],
            'user_id' => Auth::id(),
            'content' => $data['content']
        ]);
    }

    public function deleteComment(Comment $comment)
    {
        $comment->delete();
    }
}
