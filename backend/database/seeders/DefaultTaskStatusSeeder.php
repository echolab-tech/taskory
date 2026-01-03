<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DefaultTaskStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run($projectId = null): void
    {
        if (!$projectId) return;

        $defaults = [
            [
                'name' => 'To Do',
                'color' => '#64748b', // slate-500
                'position' => 0,
                'is_default' => true,
                'is_completed' => false,
            ],
            [
                'name' => 'In Progress',
                'color' => '#3b82f6', // blue-500
                'position' => 1,
                'is_default' => false,
                'is_completed' => false,
            ],
            [
                'name' => 'In Review',
                'color' => '#8b5cf6', // violet-500
                'position' => 2,
                'is_default' => false,
                'is_completed' => false,
            ],
            [
                'name' => 'Completed',
                'color' => '#10b981', // emerald-500
                'position' => 3,
                'is_default' => false,
                'is_completed' => true,
            ],
        ];

        foreach ($defaults as $status) {
            \App\Models\TaskStatus::create(array_merge($status, ['project_id' => $projectId]));
        }
    }
}
