<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    public function test_api_ping_tra_ve_ok(): void
    {
        $this->getJson('/api/ping')->assertOk()->assertJson(['ok' => true, 'app' => 'EduQuest']);
    }
}
