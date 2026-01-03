<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\Events\Registered;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
            'message' => 'Registration successful. Please check your email to verify your account.'
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Check if user has organization
        $hasOrganization = $user->organizations()->exists() || 
                          \App\Models\Organization::where('owner_id', $user->id)->exists();

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
            'email_verified' => !is_null($user->email_verified_at),
            'has_organization' => $hasOrganization,
            'needs_setup' => is_null($user->email_verified_at) || !$hasOrganization,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $hasOrganization = $user->organizations()->exists() || 
                          \App\Models\Organization::where('owner_id', $user->id)->exists();

        return response()->json([
            'user' => $user,
            'email_verified' => !is_null($user->email_verified_at),
            'has_organization' => $hasOrganization,
            'needs_setup' => is_null($user->email_verified_at) || !$hasOrganization,
        ]);
    }
}
