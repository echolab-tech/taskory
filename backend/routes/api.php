<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskStatusController;
use App\Http\Controllers\MilestoneController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\AttachmentController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Email Verification (Public signed route)
Route::get('/email/verify/{id}/{hash}', function (Illuminate\Http\Request $request) {
    if (! $request->hasValidSignature()) {
        return response()->json(['message' => 'Invalid or expired verification link.'], 403);
    }

    $user = \App\Models\User::findOrFail($request->route('id'));

    if ($user->hasVerifiedEmail()) {
        return redirect('http://localhost:3000/dashboard?verified=1');
    }

    if ($user->markEmailAsVerified()) {
        event(new \Illuminate\Auth\Events\Verified($user));
    }

    return redirect('http://localhost:3000/dashboard?verified=1');
})->name('verification.verify');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::post('/email/verification-notification', function (Illuminate\Http\Request $request) {
        $request->user()->sendEmailVerificationNotification();
        return response()->json(['message' => 'Verification link sent!']);
    })->middleware(['throttle:6,1'])->name('verification.send');

    // Setup route for first-time organization creation
    Route::post('/setup/organization', [\App\Http\Controllers\SetupController::class, 'createOrganization']);

    Route::post('/organizations/accept-invite', [OrganizationController::class, 'acceptInvite']);
    Route::apiResource('organizations', OrganizationController::class);
    Route::post('/organizations/{organization}/users', [OrganizationController::class, 'addUser']);

    Route::apiResource('projects', ProjectController::class);
    Route::get('/projects/{project}/users', [\App\Http\Controllers\ProjectUserController::class, 'index']);
    Route::post('/projects/{project}/users', [ProjectController::class, 'addUser']);

    Route::post('/tasks/reorder', [TaskController::class, 'reorder']);
    Route::apiResource('tasks', TaskController::class);
    
    // Statuses & Milestones (depend on project, so usually we pass project_id via query param, but for REST standard we use resource routes)
    Route::apiResource('task-statuses', TaskStatusController::class);
    Route::apiResource('milestones', MilestoneController::class);

    Route::get('/tasks/{task}/comments', [TaskController::class, 'comments']);
    Route::post('/tasks/{task}/comments', [TaskController::class, 'storeComment']);

    Route::post('/comments', [CommentController::class, 'store']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);

    Route::post('/attachments', [AttachmentController::class, 'store']);
    Route::get('/attachments/{attachment}/download', [AttachmentController::class, 'download']);
    Route::delete('/attachments/{attachment}', [AttachmentController::class, 'destroy']);
});
