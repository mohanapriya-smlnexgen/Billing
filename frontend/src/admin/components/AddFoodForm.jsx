// src/components/AddFoodForm.jsx
import React, { useState, useEffect } from "react";
import API from "../../api";

const AddFoodForm = ({ onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    category: "food",
    subcategory: "",
    food_type: "veg",
    food_name: "",
    description: "",
    image: null,
  });

  const [variants, setVariants] = useState([
    { unit: "qty", value: 1, price: "" }
  ]);

  const [subcategories, setSubcategories] = useState([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  // CLOUDINARY
  const CLOUDINARY_CLOUD_NAME = "dkq48nzr3";
  const CLOUDINARY_UPLOAD_PRESET = "kot-menu-preset";
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  // Fetch subcategories
  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        setLoadingSubcategories(true);
        const response = await API.get("subcategories/");
        setSubcategories(response.data);
      } catch (error) {
        console.error(error);
        setSubcategories([]);
      } finally {
        setLoadingSubcategories(false);
      }
    };
    fetchSubcategories();
  }, []);

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

  // Upload image
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
      let imageUrl = "";
      if (form.image) {
        imageUrl = await uploadToCloudinary(form.image);
      }

      const payload = {
        ...form,
        image: imageUrl || null,
        price: 0, // optional now
        variants: variants.map((v) => ({
          unit: v.unit,
          value: parseFloat(v.value),
          price: parseFloat(v.price),
        })),
      };

      await API.post("food-menu/", payload);

      setMessage("Food item added successfully!");

      // Reset
      setForm({
        category: "food",
        subcategory: "",
        food_type: "veg",
        food_name: "",
        description: "",
        image: null,
      });

      setVariants([{ unit: "qty", value: 1, price: "" }]);
      document.getElementById("image").value = "";

      setTimeout(() => {
        onSuccess && onSuccess();
      }, 1200);

    } catch (err) {
      console.error(err);
      setMessage("Failed to add food item");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* BASIC DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Category */}
        <div>
          <label className="text-sm font-medium">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border rounded-xl p-2"
          >
            <option value="food">Food</option>
            <option value="cafe">Cafe</option>
          </select>
        </div>

        {/* Subcategory */}
        <div>
          <label className="text-sm font-medium">Subcategory</label>
          <select
            name="subcategory"
            value={form.subcategory}
            onChange={handleChange}
            disabled={loadingSubcategories}
            className="w-full border rounded-xl p-2"
          >
            <option value="">Select</option>
            {subcategories.map((s) => (
              <option key={s.subcategory_id} value={s.subcategory_name}>
                {s.subcategory_name}
              </option>
            ))}
          </select>
        </div>

        {/* Food Type */}
        <div>
          <label className="text-sm font-medium">Food Type</label>
          <select
            name="food_type"
            value={form.food_type}
            onChange={handleChange}
            className="w-full border rounded-xl p-2"
          >
            <option value="veg">Veg</option>
            <option value="nonveg">Non-Veg</option>
            <option value="egg">Egg</option>
          </select>
        </div>

        {/* Food Name */}
        <div>
          <label className="text-sm font-medium">Food Name</label>
          <input
            name="food_name"
            value={form.food_name}
            onChange={handleChange}
            required
            className="w-full border rounded-xl p-2"
          />
        </div>
      </div>

      {/* VARIANTS SECTION */}
      <div>
        <h3 className="font-semibold mb-2">Pricing Variants</h3>

        {variants.map((v, index) => (
          <div key={index} className="flex gap-3 mb-2 items-center">

            <select
              value={v.unit}
              onChange={(e) =>
                handleVariantChange(index, "unit", e.target.value)
              }
              className="border rounded-xl p-2"
            >
              <option value="kg">Kg</option>
              <option value="g">Gram</option>
              <option value="qty">Qty</option>
            </select>

            <input
              type="number"
              placeholder="Value"
              value={v.value}
              onChange={(e) =>
                handleVariantChange(index, "value", e.target.value)
              }
              className="border rounded-xl p-2"
            />

            <input
              type="number"
              placeholder="Price"
              value={v.price}
              onChange={(e) =>
                handleVariantChange(index, "price", e.target.value)
              }
              className="border rounded-xl p-2"
            />

            {variants.length > 1 && (
              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="text-red-500"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addVariant}
          className="mt-2 text-indigo-600 font-medium"
        >
          + Add Variant
        </button>
      </div>

      {/* IMAGE */}
      <div>
        <label className="text-sm font-medium">Image</label>
        <input
          id="image"
          type="file"
          name="image"
          onChange={handleChange}
          className="w-full border rounded-xl p-2"
        />
      </div>

      {/* DESCRIPTION */}
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full border rounded-xl p-2"
        />
      </div>

      {/* ACTIONS */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="w-full border p-3 rounded-xl"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-indigo-600 text-white p-3 rounded-xl"
        >
          {uploading ? "Saving..." : "Add Food"}
        </button>
      </div>

      {/* MESSAGE */}
      {message && (
        <div className="text-center text-sm mt-3">{message}</div>
      )}
    </form>
  );
};

export default AddFoodForm;