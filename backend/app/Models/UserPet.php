<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserPet extends Model
{
    public const STAGES = ['hatchling', 'baby', 'adult', 'evolved'];

    protected $fillable = ['user_id', 'pet_species_id', 'nickname', 'stage', 'growth_xp', 'fullness', 'happiness', 'energy', 'is_sleeping', 'is_active', 'stats_updated_at'];

    protected function casts(): array
    {
        return [
            'growth_xp' => 'integer',
            'fullness' => 'integer',
            'happiness' => 'integer',
            'energy' => 'integer',
            'is_sleeping' => 'boolean',
            'is_active' => 'boolean',
            'stats_updated_at' => 'datetime',
        ];
    }

    public function species(): BelongsTo
    {
        return $this->belongsTo(PetSpecies::class, 'pet_species_id');
    }

    public function equipment(): HasMany
    {
        return $this->hasMany(PetEquipment::class);
    }
}
