import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBrands, getProductsByBrand } from "../../api/product";
import ProductCard from "../../components/ProductCard";
import { calculateDiscountPercentage } from "../../components/CalculateDiscount"; 

const BrandDetails = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    const loadBrandData = async () => {
      try {
        const data = await getBrands();
        const brand = data.brands.find(
          (brand) => brand.Brand_Name.toUpperCase() === name.toUpperCase()
        );

        if (brand) {
          setSelectedBrand(brand);
          setLoadingProducts(true);
          try {
            // Fetch products for the brand
            const productData = await getProductsByBrand(brand.idProduct_Brand);
            const productsArray = Array.isArray(productData.products)
              ? productData.products.filter(
                  (products) => products.Status === "active"
                )
              : [];
            setProducts(productsArray);
          } catch (productError) {
            console.error("Error fetching products:", productError);
            setError(`Error loading products: ${productError.message}`);
          } finally {
            setLoadingProducts(false);
          }
        } else {
          setError("Brand not found");
        }
      } catch (error) {
        console.error("Error fetching brand:", error);
        setError(error.message || "Failed to load brand details");
      } finally {
        setLoading(false);
      }
    };

    loadBrandData();
  }, [name]);

  // Use useMemo to calculate top selling products based on the fetched products
  const topSellingProducts = useMemo(() => {
    // Filter out products with no sold quantity or invalid quantity
    const validProducts = products.filter(
      (product) => typeof product.Sold_Qty === "number" && product.Sold_Qty > 0
    );

    // Sort products by Sold_Qty in descending order
    const sortedProducts = [...validProducts].sort(
      (a, b) => b.Sold_Qty - a.Sold_Qty
    );

    // Take the top 5 products (or fewer if there are less than 5)
    return sortedProducts.slice(0, 5).map((product, index) => ({
      itemNo: index + 1,
      orderName: product.Description, // Use product description as order name
      price: Number(product.Selling_Price), // Use selling price
      idProduct: product.idProduct, // Keep product ID for navigation if needed
    }));
  }, [products]); // Recalculate when the 'products' state changes

  // Function to navigate to ProductPage
  const handleProductClick = (productId) => {
    window.scrollTo(0, 0);
    navigate(`/product-page/${productId}`); // Navigate to the ProductPage with the product ID
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center animate-pulse">
          <div className="w-12 h-12 border-4 border-[#5CAF90] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[#1D372E]">Loading brand details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-lg text-red-500">
        <div className="p-8 text-center bg-white rounded-lg shadow-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-16 h-16 mx-auto mb-4 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!selectedBrand) {
    return (
      <div className="flex items-center justify-center h-screen text-lg text-red-500">
        Brand not found!
      </div>
    );
  }

  // Format price to 2 decimal places
  const formatPrice = (price) => {
    return Number(price).toFixed(2);
  };

  // Calculate discount percentage
  const calculateDiscount = (marketPrice, sellingPrice) => {
    if (!marketPrice || !sellingPrice) return null;
    const discount = ((marketPrice - sellingPrice) / marketPrice) * 100;
    return discount > 0 ? Math.round(discount) : null;
  };

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50 md:px-16 font-poppins">
      <h2 className="text-[33.18px] text-[#1D372E] font-semibold mb-6 text-left">
        {selectedBrand.Brand_Name.toUpperCase()}
      </h2>

      <div className="relative flex flex-col items-center max-w-3xl p-6 mx-auto bg-gray-200 rounded-md md:flex-row md:max-w-full ">
        <div className="flex-shrink-0 w-40">
          <img
            src={selectedBrand.Brand_Image_Url || "/placeholder.svg"}
            alt={selectedBrand.Brand_Name}
            className="object-contain w-full h-auto rounded-lg"
          />
        </div>

        <div className="px-6 text-left md:flex-1">
          <p className="text-[16px] md:text-[19.2px] text-[#5E5E5E]">
            {selectedBrand.ShortDescription}
          </p>
        </div>
      </div>

      {/* Products Section */}
      <div className="mt-6">
        <h2 className="mb-6 text-2xl font-semibold text-center sm:text-3xl md:text-4xl">
          <span className="text-[#1D372E]">{selectedBrand.Brand_Name} </span>
          <span className="text-[#5CAF90]">Products</span>
        </h2>
        {loadingProducts ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-[#5CAF90] border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-4 text-[#1D372E]">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <div
                  key={product.id}
                  className="hover:scale-[1.02] hover:shadow-md transform transition-all duration-300"
                  onClick={() => handleProductClick(product.idProduct)}
                >
                  <ProductCard
                    key={product.idProduct}
                    image={product.Main_Image_Url || "/placeholder.svg"}
                    category={selectedBrand.Brand_Name}
                    title={product.Description}
                    price={product.Selling_Price}
                    oldPrice={product.Market_Price}
                    historyStatus={ product.History_Status}
                    activeDiscount={product.discounts?.find(d => d.Status === "active") || null}
                    eventDiscounts={product.eventDiscounts || []}
                    id={product.idProduct}
                    product={{
                      idProduct: product.idProduct,
                      Selling_Price: product.Selling_Price,
                      Market_Price: product.Market_Price,
                      discounts: product.discounts || [],
                      eventDiscounts: product.eventDiscounts || []
                    }}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full py-10 flex items-center justify-center">
                  <p className="text-xl md:text-2xl font-bold text-gray-500">
                    No products available for this brand.
                  </p>
                </div>
            )}
          </div>
        )}
      </div>

      {/* Top Selling Products Section */}
      {topSellingProducts.length > 0 && ( // Only show the table if there are top selling products
        <div className="mt-12 border border-[#E8E8E8] rounded-[15px] p-6">
          <h3 className="text-[33.18px] text-[#1D372E] font-semibold mb-6 text-center">
            Top Selling Products
          </h3>
          <table className="min-w-full rounded-[15px] overflow-hidden">
            <thead>
              <tr>
                <th className="bg-[#EAFFF7] py-2 px-4 text-center font-semibold h-[60px] border-b-2 border-gray-300">
                  Item No
                </th>
                <th className="bg-[#EAFFF7] py-2 px-4 text-center font-semibold h-[60px] border-b-2 border-gray-300">
                  Product Name
                </th>
                <th className="bg-[#EAFFF7] py-2 px-4 text-center font-semibold h-[60px] border-b-2 border-gray-300">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {topSellingProducts.map((product, index) => (
                <tr
                  key={product.idProduct} // Use product ID as key for better performance
                  className="text-center transition-colors cursor-pointer hover:bg-gray-100" // Add cursor and hover effect
                  onClick={() => handleProductClick(product.idProduct)} // Make rows clickable
                >
                  <td
                    className={`py-2 px-4 h-[45px] ${
                      index !== topSellingProducts.length - 1
                        ? "border-b border-gray-300"
                        : ""
                    } bg-[#F7FDFF] border-r border-gray-300`}
                  >
                    {product.itemNo}
                  </td>
                  <td
                    className={`py-2 px-4 ${
                      index !== topSellingProducts.length - 1
                        ? "border-b border-gray-300"
                        : ""
                    } bg-[#F7FDFF] border-r border-gray-300`}
                  >
                    {product.orderName}
                  </td>
                  <td
                    className={`py-2 px-4 ${
                      index !== topSellingProducts.length - 1
                        ? "border-b border-gray-300"
                        : ""
                    } bg-[#F7FDFF]`}
                  >
                    ${formatPrice(product.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <br />
    </div>
  );
};

export default BrandDetails;
