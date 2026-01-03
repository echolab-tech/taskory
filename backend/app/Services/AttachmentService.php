<?php

namespace App\Services;

use App\Models\Attachment;
use App\Models\Task;
use App\Models\Project;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AttachmentService
{
    public function uploadFile($file, $attachableType, $attachableId)
    {
        $path = $file->store('attachments', 'public');
        
        $modelClass = $attachableType === 'task' ? Task::class : Project::class;
        $model = $modelClass::findOrFail($attachableId);

        return $model->attachments()->create([
            'user_id' => Auth::id(),
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
        ]);
    }

    public function deleteAttachment(Attachment $attachment)
    {
        Storage::disk('public')->delete($attachment->file_path);
        $attachment->delete();
    }
}
