// src/components/EditFoodForm.jsx
import React, { useState, useEffect } from "react";
import API from "../../api";

const EditFoodForm = ({ food, onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    category: "food",
    subcategory: "",
    food_type: "veg",
    food_name: "",
    description: "",
    image: null,
  });

  const [variants, setVariants] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/dkq48nzr3/image/upload`;
  const CLOUDINARY_UPLOAD_PRESET = "kot-menu-preset";

  // Fetch subcategories
  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const res = await API.get("subcategories/");
        setSubcategories(res.data);
      } catch {
        setSubcategories([]);
      } finally {
        setLoadingSubcategories(false);
      }
    };
    fetchSubcategories();
  }, []);

  // Load food data + variants
  useEffect(() => {
    if (food) {
      setForm({
        category: food.category || "food",
        subcategory: food.subcategory || "",
        food_type: food.food_type || "veg",
        food_name: food.food_name || "",
        description: food.description || "",
        image: null,
      });

      setVariants(
        food.variants?.length
          ? food.variants
          : [{ unit: "qty", value: 1, price: "" }]
      );
    }
  }, [food]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm({ ...form, [name]: files ? files[0] : value });
  };

  // Variant handlers
  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const addVariant = () => {
    setVariants([...variants, { unit: "qty", value: 1, price: "" }]);
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: data,
    });

    const json = await res.json();
    return json.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage("");

    try {
      let imageUrl = food?.image || "";

      if (form.image) {
        imageUrl = await uploadToCloudinary(form.image);
      }

      const payload = {
        ...form,
        image: imageUrl,
        price: 0,
        variants: variants.map((v) => ({
          unit: v.unit,
          value: parseFloat(v.value),
          price: parseFloat(v.price),
        })),
      };

      await API.put(`food-menu/${food.food_id}/`, payload);

      setMessage("Food updated successfully!");

      setTimeout(() => {
        onSuccess && onSuccess();
      }, 1200);

    } catch (err) {
      console.error(err);
      setMessage("Failed to update food item");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* BASIC DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div>
          <label className="text-sm font-medium">Category</label>
          <select name="category" value={form.category} onChange={handleChange} className="w-full border p-2 rounded-xl">
            <option value="food">Food</option>
            <option value="cafe">Cafe</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Subcategory</label>
          <select name="subcategory" value={form.subcategory} onChange={handleChange} className="w-full border p-2 rounded-xl">
            <option value="">Select</option>
            {subcategories.map((s) => (
              <option key={s.subcategory_id} value={s.subcategory_name}>
                {s.subcategory_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Food Type</label>
          <select name="food_type" value={form.food_type} onChange={handleChange} className="w-full border p-2 rounded-xl">
            <option value="veg">Veg</option>
            <option value="nonveg">Non-Veg</option>
            <option value="egg">Egg</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Food Name</label>
          <input
            name="food_name"
            value={form.food_name}
            onChange={handleChange}
            className="w-full border p-2 rounded-xl"
          />
        </div>
      </div>

      {/* VARIANTS */}
      <div>
        <h3 className="font-semibold mb-2">Pricing Variants</h3>

        {variants.map((v, index) => (
          <div key={index} className="flex gap-3 mb-2">

            <select
              value={v.unit}
              onChange={(e) => handleVariantChange(index, "unit", e.target.value)}
              className="border p-2 rounded-xl"
            >
              <option value="kg">Kg</option>
              <option value="g">Gram</option>
              <option value="qty">Qty</option>
            </select>

            <input
              type="number"
              placeholder="Value"
              value={v.value}
              onChange={(e) => handleVariantChange(index, "value", e.target.value)}
              className="border p-2 rounded-xl"
            />

            <input
              type="number"
              placeholder="Price"
              value={v.price}
              onChange={(e) => handleVariantChange(index, "price", e.target.value)}
              className="border p-2 rounded-xl"
            />

            {variants.length > 1 && (
              <button type="button" onClick={() => removeVariant(index)} className="text-red-500">
                ✕
              </button>
            )}
          </div>
        ))}

        <button type="button" onClick={addVariant} className="text-indigo-600 mt-2">
          + Add Variant
        </button>
      </div>

      {/* IMAGE */}
      <div>
        <label className="text-sm font-medium">Image</label>
        <input type="file" name="image" onChange={handleChange} className="w-full border p-2 rounded-xl" />
        {food?.image && (
          <img src={food.image} alt="" className="h-20 mt-2 rounded" />
        )}
      </div>

      {/* DESCRIPTION */}
      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        className="w-full border p-2 rounded-xl"
      />

      {/* ACTIONS */}
      <div className="flex gap-4">
        <button type="button" onClick={onCancel} className="w-full border p-3 rounded-xl">
          Cancel
        </button>

        <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-xl">
          {uploading ? "Updating..." : "Update Food"}
        </button>
      </div>

      {message && <p className="text-center text-sm">{message}</p>}
    </form>
  );
};

export default EditFoodForm;