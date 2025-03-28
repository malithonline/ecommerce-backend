import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { IoClose } from "react-icons/io5";
import { RiDeleteBin5Fill, RiDeleteBack2Fill } from "react-icons/ri";
import { FaRegCheckSquare, FaCheckSquare } from "react-icons/fa";
import {
  createProduct,
  createBrand,
  getBrands,
  getCategories,
} from "../api/product";
import toast from "react-hot-toast";

const ProductForm = () => {
  const { user } = useContext(AuthContext);
  // Product Fields
  const [description, setDescription] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [marketPrice, setMarketPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [subDescription, setSubDescription] = useState("");

  // Subcategories
  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);

  // Single main image
  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);

  // Multiple sub images
  const [subImages, setSubImages] = useState([]);
  const [subImagesPreview, setSubImagesPreview] = useState([]);

  // Brands
  const [brands, setBrands] = useState([]);
  const [brandPopupVisible, setBrandPopupVisible] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandDescription, setNewBrandDescription] = useState("");

  // Variations (Color/Size/Quantity)
  const [colorName, setColorName] = useState("");
  const [colorPickerValue, setColorPickerValue] = useState("#ffffff");
  const [isColorLocked, setIsColorLocked] = useState(false);
  const [size, setSize] = useState("");
  const [colorQuantity, setColorQuantity] = useState("");
  const [variations, setVariations] = useState([]);

  // FAQ states
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqs, setFaqs] = useState([]);

  // Handlers for main image
  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainImage(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  const removeMainImage = () => {
    setMainImage(null);
    setMainImagePreview(null);
  };

  // Handlers for sub images
  const handleSubImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSubImages((prev) => [...prev, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setSubImagesPreview((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeSubImage = (index) => {
    setSubImages((prev) => prev.filter((_, i) => i !== index));
    setSubImagesPreview((prev) => prev.filter((_, i) => i !== index));
  };

  // Brand popup handlers
  const openBrandPopup = () => {
    setBrandPopupVisible(true);
  };

  const closeBrandPopup = () => {
    setBrandPopupVisible(false);
    setNewBrandName("");
    setNewBrandDescription("");
  };

  // Hide scrollbar when popup is open, restore when closed
  useEffect(() => {
    if (brandPopupVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [brandPopupVisible]);

  const handleAddBrand = async () => {
    if (newBrandName.trim() === "") {
      toast.error("Brand name is required");
      return;
    }

    try {
      const brandData = {
        brandName: newBrandName,
        shortDescription: newBrandDescription,
        userId: user.userId,
      };
      await createBrand(brandData);
      toast.success("Brand added successfully");
      loadBrands();
      closeBrandPopup();
    } catch (error) {
      toast.error(error.message || "Failed to add brand");
    }
  };

  const loadBrands = async () => {
    try {
      const data = await getBrands();
      setBrands(data.brands);
    } catch (error) {
      toast.error(error.message || "Failed to load brands");
    }
  };

  const loadSubCategories = async () => {
    try {
      const data = await getCategories();
      setAvailableSubCategories(data.categories);
    } catch (error) {
      toast.error(error.message || "Failed to load subcategories");
    }
  };

  const toggleColorLock = () => {
    if (!isColorLocked) {
      // Validate the colorName: if it's a valid hex (e.g. "#abc" or "#aabbcc") or a recognized color name.
      const hexRegex = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
      if (colorName.trim() && hexRegex.test(colorName.trim())) {
        setColorPickerValue(colorName.trim().toLowerCase());
        setIsColorLocked(true);
      } else {
        // If no valid value was typed, show an error.
        toast.error("Please enter a valid hex color");
        return;
      }
    } else {
      setIsColorLocked(false);
      setColorName("");
      setColorPickerValue("#ffffff");
    }
  };

  const handleColorPickerChange = (e) => {
    const newHex = e.target.value.toLowerCase();
    setColorPickerValue(newHex);
    setColorName(newHex);
  };

  // Variation Handlers
  const getInputStyle = () => {
    let bg = isColorLocked ? colorPickerValue : "#ffffff";
    let txt = bg === "#ffffff" ? "#000000" : "#ffffff";
    return { backgroundColor: bg, color: txt };
  };

  // Add variation (color/size/quantity) to table
  const handleAddVariation = () => {
    if (isColorLocked && size.trim() && colorQuantity.trim()) {
      const newVar = {
        colorCode: colorPickerValue,
        size: size,
        quantity: colorQuantity,
      };
      setVariations((prev) => [...prev, newVar]);
      setSize("");
      setColorQuantity("");
      setColorPickerValue("#ffffff");
      setIsColorLocked(false);
      setColorName("");
    } else {
      toast.error("Color, size and quantity are required");
    }
  };

  // Remove variation row
  const removeVariation = (index) => {
    setVariations((prev) => prev.filter((_, i) => i !== index));
  };

  // Add FAQ to table
  const handleAddFaq = () => {
    if (faqQuestion.trim() && faqAnswer.trim()) {
      const newFaq = {
        question: faqQuestion,
        answer: faqAnswer,
      };
      setFaqs((prev) => [...prev, newFaq]);
      setFaqQuestion("");
      setFaqAnswer("");
    } else {
      toast.error("Question and answer are required");
    }
  };

  // Remove FAQ row
  const removeFaq = (index) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!description.trim() || !selectedBrand.trim()) {
      toast.error("Description and brand are required");
      return;
    }

    // Build FormData
    const formData = new FormData();
    formData.append("Description", description);
    formData.append("Product_Brand_idProduct_Brand", selectedBrand);
    formData.append("Market_Price", marketPrice);
    formData.append("Selling_Price", sellingPrice);
    formData.append("Long_Description", subDescription);
    if (mainImage) {
      formData.append("mainImage", mainImage);
    }
    // For multiple sub images
    subImages.forEach((file) => {
      formData.append("subImages", file);
    });
    // Append JSON stringified arrays
    formData.append("variations", JSON.stringify(variations));
    formData.append("faqs", JSON.stringify(faqs));
    formData.append("subCategoryIds", JSON.stringify(selectedSubCategories));

    try {
      await createProduct(formData);
      toast.success("Product added successfully");

      // Clear all fields
      setDescription("");
      setSelectedBrand("");
      setMarketPrice("");
      setSellingPrice("");
      setSubDescription("");
      setMainImage(null);
      setMainImagePreview(null);
      setSubImages([]);
      setSubImagesPreview([]);
      setVariations([]);
      setFaqs([]);
      setSelectedSubCategories([]);
      setColorName("");
      setColorPickerValue("#ffffff");
      setIsColorLocked(false);
      setSize("");
      setColorQuantity("");
    } catch (error) {
      toast.error(error.message || "Failed to add product");
    }
  };

  // Load brands and available subcategories on mount
  useEffect(() => {
    loadBrands();
    loadSubCategories();
  }, []);

  // Handler for subcategory select
  const handleSubcategorySelect = (e) => {
    const subId = e.target.value;
    if (subId) {
      // Find the subcategory object from availableSubCategories
      let selectedSubcat = null;
      availableSubCategories.forEach((category) => {
        if (category.subcategories) {
          const found = category.subcategories.find(
            (sub) => String(sub.idSub_Category) === subId
          );
          if (found) {
            selectedSubcat = found;
          }
        }
      });

      // Only add if not already added (using id)
      if (
        selectedSubcat &&
        !selectedSubCategories.some(
          (sc) => sc.idSub_Category === selectedSubcat.idSub_Category
        )
      ) {
        setSelectedSubCategories((prev) => [...prev, selectedSubcat]);
      }
    }
  };
  return (
    <div className="max-w-5xl mx-auto my-5 p-10 bg-white rounded-md shadow-md">
      {/* Heading */}
      <h2 className="text-2xl font-bold text-[#1D372E] mb-4">Add Product</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Description and Brand */}
        <div className="flex flex-wrap gap-5">
          <div className="flex-1 min-w-[250px] text-[#1D372E]">
            <label className="block text-lg font-medium mb-1">
              Main Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter product description"
              className="input input-bordered w-full bg-white border-2 border-[#1D372E]"
            />
          </div>

          <div className="flex-1 min-w-[250px] text-[#1D372E]">
            <label className="block text-lg font-medium mb-1">Brand</label>
            <div className="flex items-center gap-2">
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="select select-bordered w-full bg-white border-2 border-[#1D372E]"
              >
                <option value="" className="font-bold">
                  Select Brand
                </option>
                {brands.map((brand, index) => (
                  <option key={index} value={brand.idProduct_Brand}>
                    {brand.Brand_Name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={openBrandPopup}
                className="btn btn-primary bg-[#5CAF90] border-none"
              >
                Add Brand
              </button>
            </div>
          </div>
        </div>

        {/* Market Price and Sub Categories */}
        <div className="flex flex-wrap gap-5">
          <div className="flex-1 min-w-[250px] text-[#1D372E]">
            <label className="block text-lg font-medium mb-1">
              Market Price
            </label>
            <input
              type="number"
              value={marketPrice}
              onChange={(e) => setMarketPrice(e.target.value)}
              placeholder="Enter market price"
              className="input input-bordered w-full bg-white border-2 border-[#1D372E]"
            />
          </div>

          <div className="flex-1 min-w-[250px] text-[#1D372E]">
            <label className="block text-lg font-medium mb-1">
              Sub Categories
            </label>
            <select
              className="w-full select select-bordered bg-white border-2 border-[#1D372E]"
              onChange={handleSubcategorySelect}
            >
              <option value="" className="font-bold">
                Select Sub Category
              </option>
              {availableSubCategories.map((cat, cIndex) => (
                <optgroup key={cIndex} label={cat.Description}>
                  {" "}
                  {/* Category name */}
                  {cat.subcategories &&
                    cat.subcategories.map((subcat, sIndex) => (
                      <option key={sIndex} value={subcat.idSub_Category}>
                        {subcat.Description}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>

            {/* Display selected subcategories below the input */}
            <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
              {selectedSubCategories.map((subcat, index) => (
                <div
                  key={index}
                  className="inline-flex items-center bg-[#5CAF90] text-white px-3 py-2 rounded flex-shrink-0"
                >
                  <span className="mr-2">{subcat.Description}</span>
                  <RiDeleteBack2Fill
                    className="cursor-pointer"
                    onClick={() =>
                      setSelectedSubCategories((prev) =>
                        prev.filter(
                          (sc) => sc.idSub_Category !== subcat.idSub_Category
                        )
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selling Price and Main Image */}
        <div className="flex flex-wrap gap-5">
          <div className="flex-1 min-w-[250px] text-[#1D372E]">
            <label className="block text-lg font-medium mb-1">
              Selling Price
            </label>
            <input
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="Enter selling price"
              className="input input-bordered w-full bg-white border-2 border-[#1D372E]"
            />
          </div>

          <div className="flex-1 min-w-[250px] text-[#1D372E]">
            <label className="block text-lg font-medium mb-1">Main Image</label>
            <input
              type="file"
              onChange={handleMainImageChange}
              className="file-input file-input-bordered w-full bg-white border-2 border-[#1D372E]"
            />
            {mainImagePreview && (
              <div className="relative mt-4 w-32 h-32 border border-gray-300 rounded">
                <img
                  src={mainImagePreview}
                  alt="Main Preview"
                  className="object-cover w-full h-full"
                />
                <button
                  type="button"
                  onClick={removeMainImage}
                  className="absolute top-1 right-1 bg-[#5CAF90] p-1.5 cursor-pointer"
                >
                  <RiDeleteBin5Fill size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sub Images and Sub Description */}
        <div className="flex flex-wrap gap-5">
          <div className="flex-1 min-w-[250px] text-[#1D372E]">
            <label className="block text-lg font-medium mb-1">Sub Images</label>
            <input
              type="file"
              multiple
              onChange={handleSubImagesChange}
              className="file-input file-input-bordered w-full bg-white border-2 border-[#1D372E]"
            />
            {/* Show previews of sub images */}
            {subImagesPreview.length > 0 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar">
                {subImagesPreview.map((preview, index) => (
                  <div
                    key={index}
                    className="relative w-32 h-32 border border-gray-300 rounded flex-shrink-0"
                  >
                    <img
                      src={preview}
                      alt={`Sub Preview ${index}`}
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() => removeSubImage(index)}
                      className="absolute top-1 right-1 bg-[#5CAF90] p-1.5 cursor-pointer"
                    >
                      <RiDeleteBin5Fill size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-[250px] text-[#1D372E]">
            <label className="block text-lg font-medium mb-1">
              Sub Description
            </label>
            <textarea
              value={subDescription}
              onChange={(e) => setSubDescription(e.target.value)}
              placeholder="Enter additional product details"
              className="w-full textarea textarea-bordered bg-white border-2 border-[#1D372E]"
              rows={5}
            />
          </div>
        </div>

        {/* Variations (Color/Size/Quantity) Table */}
        <div className="flex flex-wrap gap-5 items-center">
          {/* Color */}
          <div className="flex-1 min-w-[200px] text-[#1D372E]">
            <label className="block text-lg font-medium mb-1">Color</label>
            <div className="flex items-center gap-2">
              {/* Color Name Input */}
              <input
                type="text"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="Enter color hex value"
                className="input input-bordered w-full bg-white border-2 border-[#1D372E] placeholder:text-gray-400"
                disabled={isColorLocked}
                style={getInputStyle()}
              />

              {/* Color Display Box */}
              <div className="relative">
                <div
                  className="w-10 h-10 border-2 border-[#1D372E] rounded cursor-pointer"
                  style={{ backgroundColor: colorPickerValue }}
                  onClick={() => document.getElementById("colorPicker").click()}
                />
                <input
                  id="colorPicker"
                  type="color"
                  value={colorPickerValue}
                  onChange={handleColorPickerChange}
                  className="absolute z-10 mt-2 left-0 opacity-0 pointer-events-none"
                  style={{ width: "0px", height: "0px" }}
                />
              </div>

              {/* Toggle Icon */}
              {isColorLocked ? (
                <FaCheckSquare
                  className="cursor-pointer text-2xl"
                  onClick={toggleColorLock}
                />
              ) : (
                <FaRegCheckSquare
                  className="cursor-pointer text-2xl"
                  onClick={toggleColorLock}
                />
              )}
            </div>
          </div>

          {/* Size */}
          <div className="flex-1 min-w-[200px] text-[#1D372E]">
            <label className="block text-lg font-medium mb-1">Size</label>
            <input
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="Enter size"
              className="input input-bordered w-full bg-white border-2 border-[#1D372E]"
            />
          </div>

          {/* Quantity */}
          <div className="flex-1 min-w-[200px] text-[#1D372E]">
            <label className="block text-lg font-medium mb-1">Quantity</label>
            <input
              type="number"
              value={colorQuantity}
              onChange={(e) => setColorQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="input input-bordered w-full bg-white border-2 border-[#1D372E]"
            />
          </div>

          {/* Add Variation Button */}
          <div className="mt-7">
            <button
              type="button"
              onClick={handleAddVariation}
              className="btn bg-[#5CAF90] border-none font-medium"
            >
              Add
            </button>
          </div>
        </div>

        {/* Variations Table */}
        {variations.length > 0 && (
          <div className="overflow-x-auto mt-4">
            <table className="table-auto w-full text-center border border-[#1D372E]">
              <thead className="bg-[#5CAF90] text-[#1D372E]">
                <tr>
                  <th className="border-2 p-2">Color Code</th>
                  <th className="border-2 p-2">Size</th>
                  <th className="border-2 p-2">Quantity</th>
                  <th className="border-2 p-2">Action</th>
                </tr>
              </thead>
              <tbody className="text-[#1D372E]">
                {variations.map((item, index) => (
                  <tr key={index}>
                    <td className="border-2 p-2">
                      <div className="inline-flex items-center gap-2">
                        {/* Small color box */}
                        <div
                          className="w-6 h-6 border border-gray-300"
                          style={{ backgroundColor: item.colorCode }}
                        />
                        {/* Hex value text */}
                        <span>{item.colorCode}</span>
                      </div>
                    </td>
                    <td className="border-2 p-2">{item.size}</td>
                    <td className="border-2 p-2">{item.quantity}</td>
                    <td className="border-2 p-2">
                      <button
                        type="button"
                        onClick={() => removeVariation(index)}
                        className="btn btn-sm bg-[#1D372E] text-white border-none"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Frequently Ask Question Section */}
        <div className="flex flex-wrap gap-5 mt-6">
          <div className="flex-1 min-w-[250px] text-[#1D372E]">
            <label className="block text-lg font-medium mb-1">
              Frequently Ask Question
            </label>
            <input
              type="text"
              value={faqQuestion}
              onChange={(e) => setFaqQuestion(e.target.value)}
              placeholder="Enter Frequently Ask Question"
              className="input input-bordered w-full bg-white border-2 border-[#1D372E]"
            />
          </div>

          <div className="flex-1 min-w-[250px] text-[#1D372E]">
            <label className="block text-lg font-medium mb-1">Answer</label>
            <input
              type="text"
              value={faqAnswer}
              onChange={(e) => setFaqAnswer(e.target.value)}
              placeholder="Enter Answer"
              className="input input-bordered w-full bg-white border-2 border-[#1D372E]"
            />
          </div>

          <div className="mt-7">
            <button
              type="button"
              onClick={handleAddFaq}
              className="btn bg-[#5CAF90] border-none font-medium"
            >
              Add
            </button>
          </div>
        </div>

        {/* FAQ Table */}
        {faqs.length > 0 && (
          <div className="overflow-x-auto mt-4">
            <table className="table-auto w-full text-center border border-[#1D372E]">
              <thead className="bg-[#5CAF90] text-[#1D372E]">
                <tr>
                  <th className="border-2 p-2">Frequently Ask Question</th>
                  <th className="border-2 p-2">Answer</th>
                  <th className="border-2 p-2">Action</th>
                </tr>
              </thead>
              <tbody className="text-[#1D372E]">
                {faqs.map((faq, index) => (
                  <tr key={index}>
                    <td className="border-2 p-2">{faq.question}</td>
                    <td className="border-2 p-2">{faq.answer}</td>
                    <td className="border-2 p-2">
                      <button
                        type="button"
                        onClick={() => removeFaq(index)}
                        className="btn btn-sm bg-[#1D372E] text-white border-none"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className="btn bg-[#5CAF90] border-none font-medium"
          >
            Save Product
          </button>
        </div>
      </form>

      {/* Brand Popup */}
      {brandPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-white rounded-md p-8 w-[90%] max-w-lg relative">
            {/* Popup Header */}
            <div className="flex justify-between items-center text-[#1D372E] mb-5">
              <h3 className="text-xl font-bold">Add Brand</h3>
              <button onClick={closeBrandPopup} className="cursor-pointer">
                <IoClose size={24} />
              </button>
            </div>

            {/* Add Brand Form */}
            <div className="text-[#1D372E] mb-4">
              <label className="block text-lg font-medium mb-2">
                Brand Name
              </label>
              <input
                type="text"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Enter brand name"
                className="input input-bordered w-full bg-white border-2 border-[#1D372E]"
              />
            </div>
            <div className="text-[#1D372E] mb-8">
              <label className="block text-lg font-medium mb-2">
                Brand Description
              </label>
              <textarea
                value={newBrandDescription}
                onChange={(e) => setNewBrandDescription(e.target.value)}
                placeholder="Enter brand description"
                className="textarea w-full bg-white border-2 border-[#1D372E]"
                rows={3}
              ></textarea>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleAddBrand}
                className="btn bg-[#5CAF90] border-none font-medium"
              >
                Add Brand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductForm;
