<?php

namespace App\Http\Controllers;

use App\Models\PetItem;
use App\Models\PetSpecies;
use App\Models\UserPet;
use App\Services\PetService;
use Illuminate\Http\Request;

// Thú cưng của học viên: chọn trứng đầu tiên, xem chỉ số, đặt tên, cho ngủ, cho ăn, trang bị, chọn thú đồng hành
class PetController extends Controller
{
    public function __construct(private PetService $pets) {}

    public function index(Request $request)
    {
        // Nạp sẵn loài và trang bị cho mọi thú trong 2 truy vấn (tránh mỗi thú một lượt truy vấn)
        $pets = UserPet::with('species', 'equipment.item')->where('user_id', $request->user()->id)->orderByDesc('is_active')->get();

        return [
            'species' => PetSpecies::orderBy('id')->get(['id', 'code', 'name', 'description', 'egg_color', 'egg_price', 'is_starter']),
            'pets' => $pets->map(fn (UserPet $pet) => $this->pets->view($this->pets->refresh($pet))),
        ];
    }

    public function store(Request $request)
    {
        $data = $request->validate(['species' => ['required', 'exists:pet_species,code']]);
        $pet = $this->pets->adopt($request->user(), PetSpecies::firstWhere('code', $data['species']));

        return response()->json($this->pets->view($pet), 201);
    }

    public function update(Request $request, UserPet $pet)
    {
        $this->authorizeOwner($request, $pet);
        $pet->update($request->validate(['nickname' => ['required', 'string', 'max:50']]));

        return $this->pets->view($pet);
    }

    public function sleep(Request $request, UserPet $pet)
    {
        $this->authorizeOwner($request, $pet);

        return $this->pets->view($this->pets->toggleSleep($pet));
    }

    public function feed(Request $request, UserPet $pet)
    {
        $this->authorizeOwner($request, $pet);
        $data = $request->validate(['item_id' => ['required', 'exists:pet_items,id']]);

        return $this->pets->view($this->pets->feed($request->user(), $pet, PetItem::find($data['item_id'])));
    }

    public function equip(Request $request, UserPet $pet)
    {
        $this->authorizeOwner($request, $pet);
        $data = $request->validate(['item_id' => ['required', 'exists:pet_items,id']]);

        return $this->pets->view($this->pets->equip($request->user(), $pet, PetItem::find($data['item_id'])));
    }

    public function unequip(Request $request, UserPet $pet, string $slot)
    {
        $this->authorizeOwner($request, $pet);

        return $this->pets->view($this->pets->unequip($pet, $slot));
    }

    public function activate(Request $request, UserPet $pet)
    {
        $this->authorizeOwner($request, $pet);

        return $this->pets->view($this->pets->activate($request->user(), $pet));
    }

    private function authorizeOwner(Request $request, UserPet $pet): void
    {
        abort_unless($pet->user_id === $request->user()->id, 403);
    }
}
