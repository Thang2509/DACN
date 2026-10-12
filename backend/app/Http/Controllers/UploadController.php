<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

// Tải ảnh/video MP4 dùng trong khối nội dung
class UploadController extends Controller
{
    public function store(Request $request)
    {
        $request->validate(['file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,gif,mp4', 'max:40960']]);
        $path = $request->file('file')->store('uploads', 'public');

        return response()->json(['url' => Storage::disk('public')->url($path)], 201);
    }
}
