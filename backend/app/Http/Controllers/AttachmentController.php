<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Services\AttachmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    protected $attachmentService;

    public function __construct(AttachmentService $attachmentService)
    {
        $this->attachmentService = $attachmentService;
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'attachable_type' => 'required|in:task,project',
            'attachable_id' => 'required|integer'
        ]);

        $attachment = $this->attachmentService->uploadFile(
            $request->file('file'), 
            $request->attachable_type, 
            $request->attachable_id
        );

        return $this->success($attachment, 'File uploaded successfully', 201);
    }

    public function download(Attachment $attachment)
    {
        try {
            $path = Storage::disk('public')->path($attachment->file_path);
            
            if (!file_exists($path)) {
                return $this->error('File not found at path: ' . $path, 404);
            }

            return response()->download($path, $attachment->file_name);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Download failed: ' . $e->getMessage());
            return $this->error('Download error: ' . $e->getMessage(), 500);
        }
    }

    public function destroy(Attachment $attachment)
    {
        if ($attachment->user_id !== Auth::id()) {
             // Basic check
             return $this->error('Unauthorized', 403);
        }

        $this->attachmentService->deleteAttachment($attachment);
        return $this->success([], 'Attachment deleted successfully');
    }
}
