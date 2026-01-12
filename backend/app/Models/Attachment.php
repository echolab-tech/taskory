<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attachment extends Model
{
    protected $fillable = [
        'user_id',
        'file_name',
        'file_path',
        'file_size',
        'mime_type'
    ];

    /**
     * Get the parent attachable model (Task or Project).
     */
    public function attachable(): MorphTo
    {
        return $this->morphTo();
    }

    protected $appends = ['file_url'];

    public function getFileUrlAttribute()
    {
        return asset('storage/' . $this->file_path);
    }

    /**
     * Get the user who uploaded the attachment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
