<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class ProjectUserController extends Controller
{
    public function index(Project $project)
    {
        $users = $project->users()->withPivot('role')->get();
        return $this->success($users);
    }
}
