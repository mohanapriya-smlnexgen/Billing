// src/components/FoodList.jsx

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

import {
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

import API from "../../api";
import AddFoodForm from "./AddFoodForm";
import EditFoodForm from "./EditFoodForm";
import SubCategoryManager from "./SubCategoryManage";

const FoodList = () => {
  // ───────────────── STATE ─────────────────
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  // NEW
  const [fetching, setFetching] = useState(false);

  const [message, setMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] =
    useState(null);

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [editingFood, setEditingFood] =
    useState(null);

  const [selectedTab, setSelectedTab] =
    useState("food");

  const [search, setSearch] = useState("");

  const [
    showSubCategoryManager,
    setShowSubCategoryManager,
  ] = useState(false);

  const [imageModal, setImageModal] =
    useState(null);

  // VARIANT STATE
  const [selectedVariants, setSelectedVariants] =
    useState({});

  // ───────────────── FETCH ─────────────────
  const fetchFoods = useCallback(
    async (signal) => {
      try {
        // FULL LOADER ONLY FIRST TIME
        if (foods.length === 0) {
          setLoading(true);
        } else {
          setFetching(true);
        }

        const { data } = await API.get(
          "food-menu/",
          {
            signal,
          }
        );

        setFoods(data);
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error(
            "Failed to fetch foods:",
            err
          );

          setMessage("Failed to load items");
        }
      } finally {
        setLoading(false);
        setFetching(false);
      }
    },
    [foods.length]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchFoods(controller.signal);

    return () => controller.abort();
  }, [fetchFoods]);

  // ───────────────── IMAGE URL ─────────────────
  const getImageUrl = (url) => {
    if (!url) return null;

    if (url.startsWith("image/upload/")) {
      return url.replace(
        "image/upload/",
        ""
      );
    }

    if (url.startsWith("http")) return url;

    return url;
  };

  // ───────────────── FILTER ─────────────────
  const filteredFoods = useMemo(() => {
    const type = (f) =>
      (
        f.menu_type ||
        f.category ||
        ""
      ).toLowerCase();

    return foods.filter((f) => {
      const matchesTab =
        selectedTab === "food"
          ? type(f) === "food" ||
            !type(f).includes("cafe")
          : type(f) === "cafe" ||
            type(f).includes("cafe");

      const matchesSearch =
        !search ||
        f.food_name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        f.description
          ?.toLowerCase()
          .includes(search.toLowerCase());

      return (
        matchesTab &&
        matchesSearch
      );
    });
  }, [foods, selectedTab, search]);

  // ───────────────── GROUP ─────────────────
  const grouped = useMemo(() => {
    const map = new Map();

    filteredFoods.forEach((food) => {
      const cat =
        food.category_display ||
        food.category ||
        "Uncategorized";

      const sub =
        food.subcategory_display ||
        food.subcategory;

      const key = sub
        ? `${cat}__${sub}`
        : cat;

      if (!map.has(key)) {
        map.set(key, {
          category: cat,
          subcategory: sub || null,
          items: [],
        });
      }

      map.get(key).items.push(food);
    });

    return Array.from(
      map.values()
    ).sort((a, b) =>
      a.category.localeCompare(
        b.category
      )
    );
  }, [filteredFoods]);

  // ───────────────── CRUD ─────────────────
  const handleDelete = async (
    id,
    name
  ) => {
    try {
      await API.delete(
        `food-menu/${id}/`
      );

      setMessage(`"${name}" deleted`);

      setDeleteConfirm(null);

      fetchFoods(
        new AbortController().signal
      );
    } catch {
      setMessage("Failed to delete");
    }
  };

  const handleFoodAdded = () => {
    setShowAddModal(false);

    fetchFoods(
      new AbortController().signal
    );

    setMessage("Item added");
  };

  const handleFoodUpdated = () => {
    setShowEditModal(false);

    setEditingFood(null);

    fetchFoods(
      new AbortController().signal
    );

    setMessage("Item updated");
  };

  const handleEditClick = (food) => {
    setEditingFood(food);
    setShowEditModal(true);
  };

  // ───────────────── IMAGE MODAL ─────────────────
  const openImageModal = (food) => {
    const img = getImageUrl(
      food.image
    );

    if (img) {
      setImageModal({
        imageUrl: img,
        foodName: food.food_name,
      });
    }
  };

  // ───────────────── MESSAGE AUTO HIDE ─────────────────
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  // ───────────────── INITIAL LOADING ─────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-14 h-14 animate-spin text-[#4f4fe5] mx-auto" />

          <p className="mt-4 text-[#4f4fe5] font-semibold">
            Loading menu...
          </p>
        </div>
      </div>
    );
  }

  // ───────────────── UI ─────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-6">

      <div className="max-w-7xl mx-auto px-4">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-8">

          <div>
            <h1 className="text-3xl font-bold text-[#4f4fe5]">
              Menu Board
            </h1>

            <p className="text-gray-600 mt-1">
              Manage food & cafe items
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">

            <button
              onClick={() =>
                setShowSubCategoryManager(
                  true
                )
              }
              className="px-5 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition"
            >
              Manage Subcategories
            </button>

            <button
              onClick={() =>
                setShowAddModal(true)
              }
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#4f4fe5] text-white font-semibold hover:bg-[#3d3dd6] transition shadow-lg"
            >
              <Plus size={18} />
              Add Item
            </button>
          </div>
        </div>

        {/* SEARCH + TAB */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">

          <div className="relative flex-1">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />

            <input
              type="text"
              placeholder="Search menu..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="w-full border border-gray-300 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4f4fe5]"
            />
          </div>

          <div className="flex bg-white rounded-xl border border-gray-200 p-1">

            {["food", "cafe"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() =>
                    setSelectedTab(tab)
                  }
                  className={`px-6 py-2 rounded-lg capitalize font-semibold transition ${
                    selectedTab === tab
                      ? "bg-[#4f4fe5] text-white"
                      : "text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>
        </div>

        {/* SMALL FETCH LOADER */}
        {fetching && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-10 h-10 animate-spin text-[#4f4fe5]" />
          </div>
        )}

        {/* MESSAGE */}
        {message && (
          <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-300 text-green-700 font-medium">
            {message}
          </div>
        )}

        {/* EMPTY */}
        {!fetching &&
          filteredFoods.length === 0 && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-gray-700">
                No items found
              </h2>

              <p className="text-gray-500 mt-2">
                Try different search
              </p>
            </div>
          )}

        {/* LIST */}
        <div className="space-y-8">

          {grouped.map((group) => (
            <section
              key={`${group.category}-${group.subcategory}`}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
            >

              {/* GROUP HEADER */}
              <div className="bg-gradient-to-r from-[#4f4fe5] to-[#6d6df1] px-6 py-4">

                <h2 className="text-white text-xl font-bold">
                  {group.category}

                  {group.subcategory && (
                    <span className="text-white/90 ml-2 text-base">
                      —{" "}
                      {group.subcategory}
                    </span>
                  )}
                </h2>
              </div>

              {/* ITEMS */}
              <div className="p-5 space-y-4">

                {group.items.map((food) => {
                  const img =
                    getImageUrl(
                      food.image
                    );

                  const selectedVariantIndex =
                    selectedVariants[
                      food.food_id
                    ] ?? 0;

                  const selectedVariant =
                    food.variants?.[
                      selectedVariantIndex
                    ];

                  const displayPrice =
                    selectedVariant?.price ??
                    food.price;

                  return (
                    <div
                      key={food.food_id}
                      className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center border border-gray-200 rounded-2xl p-4 hover:shadow-md transition"
                    >

                      {/* IMAGE */}
                      <div className="lg:col-span-5 flex items-center gap-4">

                        {img ? (
                          <img
                            src={img}
                            alt={
                              food.food_name
                            }
                            onClick={() =>
                              openImageModal(
                                food
                              )
                            }
                            className="w-16 h-16 rounded-xl object-cover cursor-pointer border border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="text-gray-400" />
                          </div>
                        )}

                        <div>
                          <h3 className="font-bold text-gray-900">
                            {
                              food.food_name
                            }
                          </h3>

                          <p className="text-sm text-gray-500 mt-1">
                            {
                              food.description
                            }
                          </p>
                        </div>
                      </div>

                      {/* TYPE */}
                      <div className="lg:col-span-1">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            food.food_type ===
                            "veg"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {food.food_type}
                        </span>
                      </div>

                      {/* VARIANTS */}
                      <div className="lg:col-span-3 flex flex-col gap-2">

                        {food.variants &&
                        food.variants
                          .length >
                          0 ? (
                          <>
                            <select
                              value={
                                selectedVariantIndex
                              }
                              onChange={(
                                e
                              ) =>
                                setSelectedVariants(
                                  (
                                    prev
                                  ) => ({
                                    ...prev,
                                    [food.food_id]:
                                      Number(
                                        e
                                          .target
                                          .value
                                      ),
                                  })
                                )
                              }
                              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                              {food.variants.map(
                                (
                                  variant,
                                  idx
                                ) => (
                                  <option
                                    key={
                                      idx
                                    }
                                    value={
                                      idx
                                    }
                                  >
                                    {
                                      variant.value
                                    }{" "}
                                    {
                                      variant.unit
                                    }
                                  </option>
                                )
                              )}
                            </select>

                            <span className="font-bold text-[#4f4fe5] text-lg">
                              ₹
                              {
                                displayPrice
                              }
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-[#4f4fe5] text-lg">
                            ₹
                            {
                              food.price
                            }
                          </span>
                        )}
                      </div>

                      {/* ACTIONS */}
                      <div className="lg:col-span-2 flex justify-end gap-3">

                        <button
                          onClick={() =>
                            handleEditClick(
                              food
                            )
                          }
                          className="p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() =>
                            setDeleteConfirm(
                              {
                                id: food.food_id,
                                name: food.food_name,
                              }
                            )
                          }
                          className="p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* DELETE MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">

            <h2 className="text-xl font-bold text-gray-900">
              Delete Item
            </h2>

            <p className="mt-3 text-gray-600">
              Remove{" "}
              <strong>
                {
                  deleteConfirm.name
                }
              </strong>
              ?
            </p>

            <div className="mt-6 flex gap-3">

              <button
                onClick={() =>
                  setDeleteConfirm(null)
                }
                className="flex-1 py-3 rounded-xl border border-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={() =>
                  handleDelete(
                    deleteConfirm.id,
                    deleteConfirm.name
                  )
                }
                className="flex-1 py-3 rounded-xl bg-red-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center p-5 border-b">

              <h2 className="text-xl font-bold">
                Add Item
              </h2>

              <button
                onClick={() =>
                  setShowAddModal(false)
                }
              >
                <X />
              </button>
            </div>

            <div className="p-5">
              <AddFoodForm
                onSuccess={
                  handleFoodAdded
                }
                onCancel={() =>
                  setShowAddModal(false)
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal &&
        editingFood && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">

              <div className="flex justify-between items-center p-5 border-b">

                <h2 className="text-xl font-bold">
                  Edit Item
                </h2>

                <button
                  onClick={() => {
                    setShowEditModal(
                      false
                    );

                    setEditingFood(
                      null
                    );
                  }}
                >
                  <X />
                </button>
              </div>

              <div className="p-5">
                <EditFoodForm
                  food={editingFood}
                  onSuccess={
                    handleFoodUpdated
                  }
                  onCancel={() => {
                    setShowEditModal(
                      false
                    );

                    setEditingFood(
                      null
                    );
                  }}
                />
              </div>
            </div>
          </div>
        )}

      {/* SUB CATEGORY */}
      {showSubCategoryManager && (
        <SubCategoryManager
          onClose={() =>
            setShowSubCategoryManager(
              false
            )
          }
          onSuccess={(msg) =>
            setMessage(msg)
          }
        />
      )}

      {/* IMAGE MODAL */}
      {imageModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full relative">

            <button
              onClick={() =>
                setImageModal(null)
              }
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow"
            >
              <X />
            </button>

            <img
              src={imageModal.imageUrl}
              alt={
                imageModal.foodName
              }
              className="w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodList;