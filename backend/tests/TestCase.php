<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Giả lập request từ React SPA để Sanctum dùng session cookie như thật
        $this->withHeader('Referer', 'http://localhost:5173');
    }
}
