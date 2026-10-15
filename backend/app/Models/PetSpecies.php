<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PetSpecies extends Model
{
    protected $table = 'pet_species';

    protected $fillable = ['code', 'name', 'description', 'egg_color', 'egg_price', 'is_starter'];

    protected function casts(): array
    {
        return ['is_starter' => 'boolean'];
    }
}
