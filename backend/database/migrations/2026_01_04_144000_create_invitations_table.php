<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->string('token', 32)->unique();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            // Optional: if inviting to a specific project immediately
            $table->foreignId('project_id')->nullable()->constrained()->cascadeOnDelete(); 
            $table->string('role')->default('member');
            $table->timestamps();
            
            $table->unique(['organization_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};
