<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'bio' => ['nullable', 'string', 'max:1000'],
        ]);
        $request->user()->update($data);

        return $request->user();
    }

    public function updateAvatar(Request $request)
    {
        $request->validate(['avatar' => ['required', 'image', 'max:2048']]);

        $user = $request->user();
        $oldPath = $user->avatar_path;
        $user->avatar_path = $request->file('avatar')->store('avatars', 'public');
        $user->save();

        if ($oldPath) {
            Storage::disk('public')->delete($oldPath);
        }

        return $user;
    }

    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);
        $request->user()->update(['password' => $data['password']]);

        return response()->json(['message' => 'Đã đổi mật khẩu.']);
    }
}
