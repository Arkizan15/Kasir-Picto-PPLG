<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::query()->updateOrCreate(
            ['username' => 'Kiki'],
            [
                'name' => 'Kiki',
                'email' => 'kiki@example.com',
                'password' => \Illuminate\Support\Facades\Hash::make('qwerty'),
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
            ]
        );

        // Ensure password is present if user newly created
        if (!User::query()->where('email', 'test@example.com')->exists()) {
            User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);
        }

        // Always update password if needed
        $user = User::query()->where('email', 'test@example.com')->first();
        if ($user && empty($user->password)) {
            $user->update(['password' => \Illuminate\Support\Facades\Hash::make('password')]);
        }

        // (Factory create is intentionally avoided to prevent duplicate email seeding issues.)
    }
}

