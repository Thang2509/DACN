<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class LearningPath extends Model
{
    protected $fillable = ['title', 'slug', 'description'];

    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class)->withPivot('position')->orderByPivot('position');
    }
}
