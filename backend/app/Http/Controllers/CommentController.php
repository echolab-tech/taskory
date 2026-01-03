<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Services\CommentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    protected $commentService;

    public function __construct(CommentService $commentService)
    {
        $this->commentService = $commentService;
    }

    public function store(Request $request)
    {
        $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'content' => 'required|string',
        ]);

        $comment = $this->commentService->createComment($request->all());
        return $this->success($comment->load('user'), 'Comment added successfully', 201);
    }

    public function destroy(Comment $comment)
    {
        // Permission check ideally should be in Policy or Service validation
        if ($comment->user_id !== Auth::id()) {
            return $this->error('Unauthorized', 403);
        }
        $this->commentService->deleteComment($comment);
        return $this->success([], 'Comment deleted successfully');
    }
}
