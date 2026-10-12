<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => ['ok' => true, 'app' => config('app.name')]);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
