<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

// Quản trị viên quản lý người dùng và cấp vai trò
class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');
        $role = $request->query('role');

        return User::query()
            ->when($search, fn ($query) => $query->where(
                fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")
            ))
            ->when(in_array($role, User::ROLES), fn ($query) => $query->where('role', $role))
            ->latest()
            ->paginate(20);
    }

    public function updateRole(Request $request, User $user)
    {
        $data = $request->validate(['role' => ['required', Rule::in(User::ROLES)]]);
        if ($user->is($request->user())) {
            throw ValidationException::withMessages(['role' => 'Không thể tự đổi vai trò của chính mình.']);
        }

        $user->role = $data['role'];
        $user->save();

        return $user;
    }
}
