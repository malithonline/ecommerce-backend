const pool = require("../config/database");
const { getOrgMail } = require('../utils/organization');

// -------------------------------------------
// Category and Subcategory Related Functions
// -------------------------------------------

// Fetch all categories with subcategories
async function getAllCategories() {
  const orgMail = getOrgMail();
  const [categories] = await pool.query("SELECT * FROM Product_Category WHERE orgmail = ?", [orgMail]);

  // Prepare an array with subcategories nested
  const categoryList = await Promise.all(
    categories.map(async (cat) => {
      const [subcategories] = await pool.query(
        "SELECT * FROM Sub_Category WHERE Product_Category_idProduct_Category = ? AND orgmail = ?",
        [cat.idProduct_Category, orgMail]
      );

      return {
        ...cat,
        subcategories, // Attach subcategories to the category
      };
    })
  );

  return categoryList;
}

// Get top 6 selling categories
async function getTopSellingCategories() {
  const orgMail = getOrgMail();
  const query = `
    SELECT 
        pc.idProduct_Category,
        pc.Description AS Category_Name,
        pc.Image_Icon_Url,
        pc.Description AS Category_Description,
        COALESCE(SUM(p.Sold_Qty), 0) AS Total_Sold_Qty
    FROM 
        Product_Category pc
    LEFT JOIN 
        Sub_Category sc ON pc.idProduct_Category = sc.Product_Category_idProduct_Category AND sc.orgmail = ?
    LEFT JOIN 
        Product_has_Sub_Category phsc ON sc.idSub_Category = phsc.Sub_Category_idSub_Category AND phsc.orgmail = ?
    LEFT JOIN 
        Product p ON phsc.Product_idProduct = p.idProduct AND p.orgmail = ?
    WHERE pc.orgmail = ?
    GROUP BY 
        pc.idProduct_Category, pc.Description, pc.Image_Icon_Url
    ORDER BY 
        Total_Sold_Qty DESC
    LIMIT 6
  `;
  const [categories] = await pool.query(query, [orgMail, orgMail, orgMail, orgMail]);
  return categories;
}

// Create a new category
async function createCategory(description, imageUrl) {
  if (!description) {
    throw new Error("Category description is required");
  }
  const orgMail = getOrgMail();
  const query = `
    INSERT INTO Product_Category (Description, Image_Icon_Url, orgmail)
    VALUES (?, ?, ?)
  `;
  const [result] = await pool.query(query, [description, imageUrl, orgMail]);
  return result; // result.insertId will be the new category id
}

// Update an existing category
async function updateCategory(categoryId, description, imageUrl) {
  if (!description) {
    throw new Error("Category description is required");
  }
  const orgMail = getOrgMail();
  if (imageUrl) {
    const query = `
      UPDATE Product_Category
      SET Description = ?, Image_Icon_Url = ?
      WHERE idProduct_Category = ? AND orgmail = ?
    `;
    await pool.query(query, [description, imageUrl, categoryId, orgMail]);
  } else {
    const query = `
      UPDATE Product_Category
      SET Description = ?
      WHERE idProduct_Category = ? AND orgmail = ?
    `;
    await pool.query(query, [description, categoryId, orgMail]);
  }
}

// Toggle or update the status column for a category
async function toggleCategoryStatus(categoryId, status) {
  if (!status) {
    throw new Error("Status is required");
  }
  const orgMail = getOrgMail();
  const query = `
    UPDATE Product_Category
    SET Status = ?
    WHERE idProduct_Category = ? AND orgmail = ?
  `;
  await pool.query(query, [status, categoryId, orgMail]);
}

// Delete a category and its subcategories
async function deleteCategory(categoryId) {
  const orgMail = getOrgMail();
  // First check if any subcategories are used in products
  const [subcategories] = await pool.query(
    "SELECT idSub_Category FROM Sub_Category WHERE Product_Category_idProduct_Category = ? AND orgmail = ?",
    [categoryId, orgMail]
  );

  for (const sub of subcategories) {
    const [products] = await pool.query(
      "SELECT COUNT(*) as count FROM Product_has_Sub_Category WHERE Sub_Category_idSub_Category = ? AND orgmail = ?",
      [sub.idSub_Category, orgMail]
    );

    if (products[0].count > 0) {
      throw new Error(
        "Cannot delete category as a subcategory has already been added to a product"
      );
    }
  }

  // Delete all subcategories first
  await pool.query(
    "DELETE FROM Sub_Category WHERE Product_Category_idProduct_Category = ? AND orgmail = ?",
    [categoryId, orgMail]
  );

  // Then delete the category
  await pool.query(
    "DELETE FROM Product_Category WHERE idProduct_Category = ? AND orgmail = ?",
    [categoryId, orgMail]
  );
}

// Create a new subcategory
async function createSubCategory(categoryId, description) {
  if (!description) {
    throw new Error("Subcategory description is required");
  }
  const orgMail = getOrgMail();
  // Ensure the category exists
  const [categories] = await pool.query(
    "SELECT * FROM Product_Category WHERE idProduct_Category = ? AND orgmail = ?",
    [categoryId, orgMail]
  );
  if (categories.length === 0) {
    throw new Error("Category does not exist");
  }

  const query = `
    INSERT INTO Sub_Category (Description, Product_Category_idProduct_Category, orgmail)
    VALUES (?, ?, ?)
  `;
  const [result] = await pool.query(query, [description, categoryId, orgMail]);
  return result;
}

// Update a subcategory
async function updateSubCategory(categoryId, subCategoryId, description) {
  if (!description) {
    throw new Error("Subcategory description is required");
  }

  const orgMail = getOrgMail();

  // Ensure the category exists
  const [categories] = await pool.query(
    "SELECT * FROM Product_Category WHERE idProduct_Category = ? AND orgmail = ?",
    [categoryId, orgMail]
  );

  if (categories.length === 0) {
    throw new Error("Category does not exist");
  }

  // Ensure the subcategory exists
  const [subcategories] = await pool.query(
    "SELECT * FROM Sub_Category WHERE idSub_Category = ? AND Product_Category_idProduct_Category = ? AND orgmail = ?",
    [subCategoryId, categoryId, orgMail]
  );

  if (subcategories.length === 0) {
    throw new Error("Subcategory does not exist");
  }

  const query = `
    UPDATE Sub_Category
    SET Description = ?
    WHERE idSub_Category = ? AND orgmail = ?
  `;

  await pool.query(query, [description, subCategoryId, orgMail]);
}

// Check if a subcategory is used in any products
async function checkSubCategoryInUse(subCategoryId) {
  const orgMail = getOrgMail();
  const [products] = await pool.query(
    "SELECT COUNT(*) as count FROM Product_has_Sub_Category WHERE Sub_Category_idSub_Category = ? AND orgmail = ?",
    [subCategoryId, orgMail]
  );

  return products[0].count > 0;
}

// Delete a sub category
async function deleteSubCategory(subCategoryId) {
  const orgMail = getOrgMail();
  // Check if the subcategory is used in any products
  const inUse = await checkSubCategoryInUse(subCategoryId);

  if (inUse) {
    throw new Error("Cannot delete subcategory as it is used in products");
  }

  // If there's a linking table to Product (Product_has_Sub_Category),
  // remove references first:
  await pool.query(
    "DELETE FROM Product_has_Sub_Category WHERE Sub_Category_idSub_Category = ? AND orgmail = ?",
    [subCategoryId, orgMail]
  );

  // Then delete the subcategory
  await pool.query("DELETE FROM Sub_Category WHERE idSub_Category = ? AND orgmail = ?", [
    subCategoryId,
    orgMail,
  ]);
}

// ------------------------
// Brand Related Functions
// ------------------------

// Insert a new brand into product brand table
async function createBrand(brandName, brandImageUrl, shortDescription, userId) {
  if (!brandName) throw new Error("Brand name is required");
  const orgMail = getOrgMail();
  const query = `
    INSERT INTO Product_Brand (Brand_Name, Brand_Image_Url, ShortDescription, User_idUser, orgmail)
    VALUES (?, ?, ?, ?, ?)
  `;

  const [result] = await pool.query(query, [
    brandName,
    brandImageUrl,
    shortDescription,
    userId,
    orgMail,
  ]);
  return result;
}

// Update an existing brand
async function updateBrand(
  brandId,
  brandName,
  brandImageUrl,
  shortDescription,
  userId
) {
  if (!brandName) throw new Error("Brand name is required");

  const orgMail = getOrgMail();

  // Check if brand exists
  const [existingBrand] = await pool.query(
    "SELECT * FROM Product_Brand WHERE idProduct_Brand = ? AND orgmail = ?",
    [brandId, orgMail]
  );
  if (existingBrand.length === 0) {
    throw new Error("Brand not found");
  }

  // If image URL is provided, update it; otherwise, keep the existing one
  if (brandImageUrl) {
    const query = `
      UPDATE Product_Brand 
      SET Brand_Name = ?, Brand_Image_Url = ?, ShortDescription = ?
      WHERE idProduct_Brand = ? AND orgmail = ?
    `;
    await pool.query(query, [
      brandName,
      brandImageUrl,
      shortDescription,
      brandId,
      orgMail,
    ]);
  } else {
    const query = `
      UPDATE Product_Brand 
      SET Brand_Name = ?, ShortDescription = ?
      WHERE idProduct_Brand = ? AND orgmail = ?
    `;
    await pool.query(query, [brandName, shortDescription, brandId, orgMail]);
  }
}

// Delete a brand
async function deleteBrand(brandId) {
  const orgMail = getOrgMail();
  // Check if brand exists
  const [existingBrand] = await pool.query(
    "SELECT * FROM Product_Brand WHERE idProduct_Brand = ? AND orgmail = ?",
    [brandId, orgMail]
  );
  if (existingBrand.length === 0) {
    throw new Error("Brand not found");
  }

  // Check if brand is used in any products
  const [products] = await pool.query(
    "SELECT COUNT(*) as count FROM Product WHERE Product_Brand_idProduct_Brand = ? AND orgmail = ?",
    [brandId, orgMail]
  );
  if (products[0].count > 0) {
    throw new Error("Cannot delete brand as it is used in products");
  }

  // Delete the brand
  await pool.query("DELETE FROM Product_Brand WHERE idProduct_Brand = ? AND orgmail = ?", [
    brandId,
    orgMail,
  ]);
}

// Get all brands
async function getBrands() {
  const orgMail = getOrgMail();
  const [brands] = await pool.query("SELECT * FROM Product_Brand WHERE orgmail = ?", [orgMail]);
  return brands;
}

// --------------------------
// Product Related Functions
// --------------------------

// Insert main product record into product table
async function createProduct(productData) {
  const orgMail = getOrgMail();
  const query = `
    INSERT INTO Product 
      (Description, Product_Brand_idProduct_Brand, Market_Price, Selling_Price, Main_Image_Url, Long_Description, SIH, Seasonal_Offer, Rush_Delivery, For_You, orgmail)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `;

  const [result] = await pool.query(query, [
    productData.Description,
    productData.Product_Brand_idProduct_Brand,
    productData.Market_Price,
    productData.Selling_Price,
    productData.Main_Image_Url,
    productData.Long_Description,
    productData.SIH,
    productData.Seasonal_Offer || 0,
    productData.Rush_Delivery || 0,
    productData.For_You || 0,
    orgMail,
  ]);
  return result;
}

// Insert each sub image into product images table
async function createProductImages(productId, imageUrl) {
  const orgMail = getOrgMail();
  const query = `
    INSERT INTO Product_Images (Product_idProduct, Image_Url, orgmail)
    VALUES (?, ?, ?)
  `;

  const [result] = await pool.query(query, [productId, imageUrl, orgMail]);
  return result;
}

// Insert a variant into product variant table
async function createProductVariant(productId, variation) {
  const orgMail = getOrgMail();
  const query = `
    INSERT INTO Product_Variations (Product_idProduct, Colour, Size, Qty, SIH, orgmail)
    VALUES (?,?,?,?,?,?)
  `;

  const [result] = await pool.query(query, [
    productId,
    variation.colorCode,
    variation.size,
    variation.quantity,
    variation.quantity,
    orgMail,
  ]);
  return result;
}

// Insert an faq record into faq table
async function createProductFaq(productId, faq) {
  const orgMail = getOrgMail();
  const query = `
    INSERT INTO FAQ (Question, Answer, Product_idProduct, orgmail)
    VALUES (?, ?, ?, ?)
  `;

  const [result] = await pool.query(query, [
    faq.question,
    faq.answer,
    productId,
    orgMail,
  ]);
  return result;
}

// Insert product to subcategory join records in product has sub category table
async function createProductSubCategory(productId, subCategoryId) {
  const orgMail = getOrgMail();
  const query = `
    INSERT INTO Product_has_Sub_Category (Product_idProduct, Sub_Category_idSub_Category, orgmail)
    VALUES (?, ?, ?)
  `;
  await pool.query(query, [productId, subCategoryId, orgMail]);
}

// Update a product
async function updateProduct(productId, productData, associatedData) {
  const orgMail = getOrgMail();
  // Update main product details
  const query = `
    UPDATE Product
    SET Description = ?, Product_Brand_idProduct_Brand = ?, Market_Price = ?, Selling_Price = ?, Main_Image_Url = ?, Long_Description = ?, SIH = ?, Seasonal_Offer = ?, Rush_Delivery = ?, For_You = ?
    WHERE idProduct = ? AND orgmail = ?
  `;

  await pool.query(query, [
    productData.Description,
    productData.Product_Brand_idProduct_Brand,
    productData.Market_Price,
    productData.Selling_Price,
    productData.Main_Image_Url,
    productData.Long_Description,
    productData.SIH,
    productData.Seasonal_Offer || 0,
    productData.Rush_Delivery || 0,
    productData.For_You || 0,
    productId,
    orgMail,
  ]);

  // Update product images: Delete existing images and insert new ones
  if (associatedData.images || associatedData.deletedImages) {
    // Delete specified images first
    if (associatedData.deletedImages) {
      await pool.query(
        "DELETE FROM Product_Images WHERE Product_idProduct = ? AND Image_Url IN (?) AND orgmail = ?",
        [productId, associatedData.deletedImages, orgMail]
      );
    }

    // Delete all images if new ones are provided
    if (associatedData.images) {
      await pool.query(
        "DELETE FROM Product_Images WHERE Product_idProduct = ? AND orgmail = ?",
        [productId, orgMail]
      );
      for (const imageUrl of associatedData.images) {
        await createProductImages(productId, imageUrl);
      }
    }
  }

  // Update variations
  if (associatedData.variations) {
    const newVariations = associatedData.variations;
    const [existingVariations] = await pool.query(
      "SELECT idProduct_Variations FROM Product_Variations WHERE Product_idProduct = ? AND orgmail = ?",
      [productId, orgMail]
    );
    const existingIds = existingVariations.map((v) => v.idProduct_Variations);
    const newIds = newVariations.filter((v) => v.id).map((v) => v.id);

    const toDelete = existingIds.filter((id) => !newIds.includes(id));
    for (const id of toDelete) {
      const [orders] = await pool.query(
        "SELECT COUNT(*) as count FROM order_has_product_variations WHERE Product_Variations_idProduct_Variations = ? AND orgmail = ?",
        [id, orgMail]
      );
      if (orders[0].count > 0) {
        throw new Error("Cannot delete variation as it has been ordered");
      }
    }
    if (toDelete.length > 0) {
      await pool.query(
        "DELETE FROM Product_Variations WHERE idProduct_Variations IN (?) AND orgmail = ?",
        [toDelete, orgMail]
      );
    }

    for (const variation of newVariations) {
      if (variation.id) {
        await pool.query(
          "UPDATE Product_Variations SET Colour = ?, Size = ?, Qty = ?, SIH = ? WHERE idProduct_Variations = ? AND orgmail = ?",
          [
            variation.colorCode,
            variation.size,
            variation.quantity,
            variation.quantity,
            variation.id,
            orgMail,
          ]
        );
      } else {
        await createProductVariant(productId, variation);
      }
    }
  }

  // Update faqs
  if (associatedData.faqs) {
    const newFaqs = associatedData.faqs;
    const [existingFaqs] = await pool.query(
      "SELECT idFAQ FROM FAQ WHERE Product_idProduct = ? AND orgmail = ?",
      [productId, orgMail]
    );
    const existingIds = existingFaqs.map((f) => f.idFAQ);
    const newIds = newFaqs.filter((f) => f.id).map((f) => f.id);

    const toDelete = existingIds.filter((id) => !newIds.includes(id));
    if (toDelete.length > 0) {
      await pool.query("DELETE FROM FAQ WHERE idFAQ IN (?) AND orgmail = ?", [toDelete, orgMail]);
    }

    for (const faq of newFaqs) {
      if (faq.id) {
        await pool.query(
          "UPDATE FAQ SET Question = ?, Answer = ? WHERE idFAQ = ? AND orgmail = ?",
          [faq.question, faq.answer, faq.id, orgMail]
        );
      } else {
        await createProductFaq(productId, faq);
      }
    }
  }

  // Update subcategories: Delete existing join records and insert new ones
  if (associatedData.subCategoryIds) {
    await pool.query(
      "DELETE FROM Product_has_Sub_Category WHERE Product_idProduct = ? AND orgmail = ?",
      [productId, orgMail]
    );
    for (const subCat of associatedData.subCategoryIds) {
      // If subCat is an object, extract its id; otherwise, use it directly.
      const subCatId = subCat.idSub_Category ? subCat.idSub_Category : subCat;
      await createProductSubCategory(productId, subCatId);
    }
  }
}

// Toggle or update the history status of a product
async function toggleProductHistoryStatus(productId, historyStatus) {
  if (!historyStatus) {
    throw new Error("History status is required");
  }

  const orgMail = getOrgMail();
  const query = `
    UPDATE Product
    SET History_Status = ?
    WHERE idProduct = ? AND orgmail = ?
  `;

  await pool.query(query, [historyStatus, productId, orgMail]);
}

// Toggle or update the status of a product
async function toggleProductStatus(productId, status) {
  if (!status) {
    throw new Error("Status is required");
  }

  const orgMail = getOrgMail();
  const query = `
    UPDATE Product
    SET Status = ?
    WHERE idProduct = ? AND orgmail = ?
  `;

  await pool.query(query, [status, productId, orgMail]);
}

// Get all products
async function getAllProducts() {
  const orgMail = getOrgMail();
  const query = `
    SELECT P.*, 
      B.Brand_Name,
      B.Brand_Image_Url,
      B.ShortDescription,
      (SELECT COUNT(*) FROM order_has_product_variations ohpv
        JOIN Product_Variations pv 
          ON ohpv.Product_Variations_idProduct_Variations = pv.idProduct_Variations
        WHERE pv.Product_idProduct = P.idProduct AND pv.orgmail = ?
      ) > 0 as hasOrders,
      (SELECT COUNT(*) FROM Cart_has_Product chp
        JOIN Product_Variations pv 
        ON chp.Product_Variations_idProduct_Variations = pv.idProduct_Variations 
      WHERE pv.Product_idProduct = P.idProduct AND pv.orgmail = ?
      ) > 0 as hasCart
    FROM Product P
    LEFT JOIN Product_Brand B 
      ON P.Product_Brand_idProduct_Brand = B.idProduct_Brand AND B.orgmail = ?
    WHERE P.orgmail = ?
  `;
  const [products] = await pool.query(query, [orgMail, orgMail, orgMail, orgMail]);

  // For each product, fetch all images, variations, faqs, and subcategories
  for (const product of products) {
    // Get all sub images
    const [images] = await pool.query(
      "SELECT * FROM Product_Images WHERE Product_idProduct = ? AND orgmail = ?",
      [product.idProduct, orgMail]
    );
    product.images = images;

    // Get all variations
    const [variations] = await pool.query(
      "SELECT * FROM Product_Variations WHERE Product_idProduct = ? AND orgmail = ?",
      [product.idProduct, orgMail]
    );
    product.variations = variations;

    // Get all faqs
    const [faqs] = await pool.query(
      "SELECT * FROM FAQ WHERE Product_idProduct = ? AND orgmail = ?",
      [product.idProduct, orgMail]
    );
    product.faqs = faqs;

    // Get all subcategories
    const [subCats] = await pool.query(
      `SELECT SC.*
       FROM Sub_Category SC
       JOIN Product_has_Sub_Category PS 
        ON SC.idSub_Category = PS.Sub_Category_idSub_Category AND PS.orgmail = ?
       WHERE PS.Product_idProduct = ? AND SC.orgmail = ?`,
      [orgMail, product.idProduct, orgMail]
    );
    product.subcategories = subCats;

    // Get active discounts for each product
    product.discounts = await getActiveDiscountsByProductId(product.idProduct);

    // Get active event‐level discounts for each product
    product.eventDiscounts = await getActiveEventDiscountsByProductId(
      product.idProduct
    );
  }

  return products;
}

// Get the total number of products
async function getProductCount() {
  const orgMail = getOrgMail();
  const query = `SELECT COUNT(*) AS totalProducts FROM Product WHERE orgmail = ?`;
  const [result] = await pool.query(query, [orgMail]);
  return result[0].totalProducts; // Return the count value
}

// Get top sold products
async function getProductsSoldQty() {
  const orgMail = getOrgMail();
  const query = `
    SELECT idProduct, Description, Sold_Qty, Main_Image_Url,Selling_Price,Market_Price
    FROM Product
    WHERE Sold_Qty > 0 AND orgmail = ?
    ORDER BY Sold_Qty DESC
    LIMIT 5
  `;
  console.log("Executing getProductsSoldQty query");
  const [products] = await pool.query(query, [orgMail]);
  console.log("Query result:", products);
  return products;
}

// Get sold quantity of a product
async function getProductSoldQty(productId) {
  const orgMail = getOrgMail();
  const query = `
    SELECT idProduct, Description, Sold_Qty
    FROM Product
    WHERE idProduct = ? AND orgmail = ?
  `;
  const [rows] = await pool.query(query, [productId, orgMail]);
  return rows.length > 0 ? rows[0] : null;
}

// Get all products by subcategory id
async function getProductsBySubCategory(subCategoryId) {
  const orgMail = getOrgMail();
  const query = `
    SELECT P.*, B.Brand_Name
    FROM Product P
    JOIN Product_has_Sub_Category PS ON P.idProduct = PS.Product_idProduct AND PS.orgmail = ?
    LEFT JOIN Product_Brand B ON P.Product_Brand_idProduct_Brand = B.idProduct_Brand AND B.orgmail = ?
    WHERE PS.Sub_Category_idSub_Category = ? AND P.orgmail = ?
  `;
  const [products] = await pool.query(query, [orgMail, orgMail, subCategoryId, orgMail]);

  // Fetch additional data like images for each product
  for (const product of products) {
    const [images] = await pool.query(
      "SELECT * FROM Product_Images WHERE Product_idProduct = ? AND orgmail = ?",
      [product.idProduct, orgMail]
    );
    product.images = images;
    product.discounts = await getActiveDiscountsByProductId(product.idProduct);
  }

  return products;
}

// Get all products by brand id
async function getProductsByBrand(brandId) {
  const orgMail = getOrgMail();
  const query = `
    SELECT P.*, B.Brand_Name
    FROM Product P
    JOIN Product_Brand B ON P.Product_Brand_idProduct_Brand = B.idProduct_Brand AND B.orgmail = ?
    WHERE P.Product_Brand_idProduct_Brand = ? AND P.orgmail = ?
  `;
  const [products] = await pool.query(query, [orgMail, brandId, orgMail]);

  // Fetch additional data like images for each product
  for (const product of products) {
    const [images] = await pool.query(
      "SELECT * FROM Product_Images WHERE Product_idProduct = ? AND orgmail = ?",
      [product.idProduct, orgMail]
    );
    product.images = images;
    product.discounts = await getActiveDiscountsByProductId(product.idProduct);
  }

  return products;
}

// Get a single product by id
async function getProductById(productId) {
  const orgMail = getOrgMail();
  // Fetch main product record with brand info
  const query = `
    SELECT P.*, 
      B.Brand_Name,
      B.Brand_Image_Url,
      B.ShortDescription
    FROM Product P
    LEFT JOIN Product_Brand B 
      ON P.Product_Brand_idProduct_Brand = B.idProduct_Brand AND B.orgmail = ?
    WHERE P.idProduct = ? AND P.orgmail = ?
  `;
  const [rows] = await pool.query(query, [orgMail, productId, orgMail]);
  if (rows.length === 0) return null;
  const product = rows[0];

  // Get all sub images
  const [images] = await pool.query(
    "SELECT * FROM Product_Images WHERE Product_idProduct = ? AND orgmail = ?",
    [product.idProduct, orgMail]
  );
  product.images = images;

  // Get all variations
  const [variations] = await pool.query(
    `SELECT PV.*, 
      (SELECT COUNT(*) FROM order_has_product_variations ohpv 
       WHERE ohpv.Product_Variations_idProduct_Variations = PV.idProduct_Variations) > 0 as hasOrders
     FROM Product_Variations PV
     WHERE PV.Product_idProduct = ? AND PV.orgmail = ?`,
    [product.idProduct, orgMail]
  );
  product.variations = variations;

  // Get all faqs
  const [faqs] = await pool.query(
    "SELECT * FROM FAQ WHERE Product_idProduct = ? AND orgmail = ?",
    [product.idProduct, orgMail]
  );
  product.faqs = faqs;

  // Get all subcategories
  const [subCats] = await pool.query(
    `SELECT SC.*
     FROM Sub_Category SC
     JOIN Product_has_Sub_Category PS ON SC.idSub_Category = PS.Sub_Category_idSub_Category AND PS.orgmail = ?
     WHERE PS.Product_idProduct = ? AND SC.orgmail = ?`,
    [orgMail, product.idProduct, orgMail]
  );
  product.subcategories = subCats;

  // Get active discounts for this product
  product.discounts = await getActiveDiscountsByProductId(product.idProduct);

  // Get active event‐level discounts for this product
  product.eventDiscounts = await getActiveEventDiscountsByProductId(
    product.idProduct
  );

  return product;
}

// Get sales information for a product
async function getProductSalesInfo(productId) {
  const orgMail = getOrgMail();
  // Get total units sold and revenue in last 30 days
  const [totals] = await pool.query(
    `SELECT SUM(ohpv.Qty) AS totalUnitsSoldLast30Days, SUM(ohpv.Total_Amount) AS totalRevenueLast30Days
    FROM Order_has_Product_Variations ohpv
    JOIN \`Order\` o ON ohpv.Order_idOrder = o.idOrder AND o.orgmail = ?
    JOIN Product_Variations pv ON ohpv.Product_Variations_idProduct_Variations = pv.idProduct_Variations AND pv.orgmail = ?
    WHERE pv.Product_idProduct = ?
    AND o.Date_Time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    AND o.Payment_Stats = 'paid'`,
    [orgMail, orgMail, productId]
  );

  // Get weekly sales data for the last 30 days
  const [weeklySales] = await pool.query(
    `SELECT DATE_FORMAT(o.Date_Time, '%Y-%u') AS week, SUM(ohpv.Qty) AS unitsSold, SUM(ohpv.Total_Amount) AS revenue
    FROM Order_has_Product_Variations ohpv
    JOIN \`Order\` o ON ohpv.Order_idOrder = o.idOrder AND o.orgmail = ?
    JOIN Product_Variations pv ON ohpv.Product_Variations_idProduct_Variations = pv.idProduct_Variations AND pv.orgmail = ?
    WHERE pv.Product_idProduct = ?
    AND o.Date_Time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    AND o.Payment_Stats = 'paid'
    GROUP BY week
    ORDER BY week`,
    [orgMail, orgMail, productId]
  );

  return {
    totalUnitsSoldLast30Days: totals[0].totalUnitsSoldLast30Days || 0,
    totalRevenueLast30Days: totals[0].totalRevenueLast30Days || 0,
    weeklySales: weeklySales,
  };
}

// Get all products with active discounts
async function getDiscountedProducts() {
  const orgMail = getOrgMail();
  const query = `
    SELECT DISTINCT P.*
    FROM Product P
    JOIN Discounts D ON P.idProduct = D.Product_idProduct AND D.orgmail = ?
    WHERE D.Status = 'active'
    AND CURDATE() BETWEEN STR_TO_DATE(D.Start_Date, '%Y-%m-%d') AND STR_TO_DATE(D.End_Date, '%Y-%m-%d')
    AND P.orgmail = ?
  `;
  const [products] = await pool.query(query, [orgMail, orgMail]);

  // Fetch complete details and discounts for each product
  const detailedProducts = [];
  for (const product of products) {
    const fullProduct = await getProductById(product.idProduct);
    const discounts = await getDiscountsByProductId(product.idProduct);

    // Filter active discounts
    fullProduct.discounts = discounts.filter((d) => {
      const today = new Date();
      const startDate = new Date(d.Start_Date);
      const endDate = new Date(d.End_Date);
      return d.Status === "active" && today >= startDate && today <= endDate;
    });

    detailedProducts.push(fullProduct);
  }

  return detailedProducts;
}

// Delete a product and its related records
async function deleteProduct(productId) {
  const orgMail = getOrgMail();
  // Delete from Cart_has_Product for this product's variations
  await pool.query(
    `DELETE FROM Cart_has_Product
    WHERE Product_Variations_idProduct_Variations IN (
      SELECT idProduct_Variations FROM Product_Variations WHERE Product_idProduct = ?
    )`,
    [productId]
  );

  // Get all orders that have this product
  const [orders] = await pool.query(
    `SELECT DISTINCT ohpv.Order_idOrder
    FROM Order_has_Product_Variations ohpv
    JOIN Product_Variations pv ON ohpv.Product_Variations_idProduct_Variations = pv.idProduct_Variations
    WHERE pv.Product_idProduct = ?`,
    [productId]
  );

  const orderIds = orders.map((order) => order.Order_idOrder);

  if (orderIds.length > 0) {
    // Delete from Order_History for these orders
    await pool.query(`DELETE FROM Order_History WHERE order_id IN (?)`, [
      [orderIds],
    ]);

    // Delete from Order_has_Product_Variations for these orders
    await pool.query(
      `DELETE FROM Order_has_Product_Variations WHERE Order_idOrder IN (?)`,
      [orderIds]
    );

    // Delete from Order
    await pool.query("DELETE FROM `Order` WHERE idOrder IN (?)", [orderIds]);
  }

  // Delete from join table
  await pool.query(
    "DELETE FROM Product_has_Sub_Category WHERE Product_idProduct = ? AND orgmail = ?",
    [productId, orgMail]
  );

  // Delete product images
  await pool.query("DELETE FROM Product_Images WHERE Product_idProduct = ? AND orgmail = ?", [
    productId,
    orgMail,
  ]);

  // Delete product variations
  await pool.query(
    "DELETE FROM Product_Variations WHERE Product_idProduct = ? AND orgmail = ?",
    [productId, orgMail]
  );

  // Delete faqs
  await pool.query("DELETE FROM FAQ WHERE Product_idProduct = ? AND orgmail = ?", [productId, orgMail]);

  // Delete discounts
  await pool.query("DELETE FROM Discounts WHERE Product_idProduct = ? AND orgmail = ?", [
    productId,
    orgMail,
  ]);

  // Delete event's product
  await pool.query(
    "DELETE FROM Event_has_Product WHERE Product_idProduct = ? AND orgmail = ?",
    [productId, orgMail]
  );

  // Delete product
  await pool.query("DELETE FROM Product WHERE idProduct = ? AND orgmail = ?", [productId, orgMail]);
}

// ---------------------------
// Discount Related Functions
// ---------------------------

// Get active event‐discounts for a specific product
async function getActiveEventDiscountsByProductId(productId) {
  const orgMail = getOrgMail();
  const query = `
    SELECT
      ed.idEvent_Discounts    AS id,
      ed.Event_idEvent        AS eventId,
      ed.Product_Ids          AS productIdsJson,
      ed.Description          AS description,
      ed.Discount_Type        AS discountType,
      ed.Discount_Value       AS discountValue,
      ed.Start_Date           AS startDate,
      ed.End_Date             AS endDate,
      ed.Status               AS status
    FROM Event_Discounts ed
    JOIN Event_has_Product ehp
      ON ed.Event_idEvent = ehp.Event_idEvent AND ehp.orgmail = ?
    WHERE ehp.Product_idProduct = ?
      AND ed.Status = 'active'
      AND ed.orgmail = ?
      AND CURDATE() BETWEEN STR_TO_DATE(ed.Start_Date, '%Y-%m-%d') AND STR_TO_DATE(ed.End_Date, '%Y-%m-%d') 
  `;
  const [rows] = await pool.query(query, [orgMail, productId, orgMail]);
  return rows.map((r) => ({
    id: r.id,
    eventId: r.eventId,
    productIds: JSON.parse(r.productIdsJson || "[]"),
    description: r.description,
    discountType: r.discountType,
    discountValue: r.discountValue,
    startDate: r.startDate,
    endDate: r.endDate,
    status: r.status,
  }));
}

// Get active discounts for a specific product
async function getActiveDiscountsByProductId(productId) {
  const orgMail = getOrgMail();
  const query = `
    SELECT * FROM Discounts 
    WHERE Product_idProduct = ?
    AND Status = 'active'
    AND orgmail = ?
    AND CURDATE() BETWEEN STR_TO_DATE(Start_Date, '%Y-%m-%d') AND STR_TO_DATE(End_Date, '%Y-%m-%d')
  `;
  const [discounts] = await pool.query(query, [productId, orgMail]);
  return discounts;
}

// Get all discounts
async function getAllDiscounts() {
  const orgMail = getOrgMail();
  const query = `
    SELECT d.*,
      p.Description as ProductName,
      (SELECT COUNT(*) FROM Order_has_Product_Variations ohpv
      WHERE ohpv.Discounts_idDiscounts = d.idDiscounts) > 0 as hasOrders
    FROM Discounts d
    JOIN Product p ON d.Product_idProduct = p.idProduct AND p.orgmail = ?
    WHERE d.orgmail = ?
    ORDER BY created_at DESC
  `;
  const [discounts] = await pool.query(query, [orgMail, orgMail]);
  return discounts;
}

// Get discounts for a specific product
async function getDiscountsByProductId(productId) {
  const orgMail = getOrgMail();
  const query = `
    SELECT * FROM Discounts
    WHERE Product_idProduct = ? AND orgmail = ?
    ORDER BY created_at DESC
  `;
  const [discounts] = await pool.query(query, [productId, orgMail]);
  return discounts;
}

// Create a new discount
async function createDiscount(discountData) {
  const orgMail = getOrgMail();
  const query = `
    INSERT INTO Discounts (
      Product_idProduct,
      Description,
      Discount_Type,
      Discount_Value,
      Start_Date,
      End_Date,
      Status,
      orgmail
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.query(query, [
    discountData.productId,
    discountData.description,
    discountData.discountType,
    discountData.discountValue,
    discountData.startDate,
    discountData.endDate,
    discountData.status || "active",
    orgMail,
  ]);

  return result;
}

// Update an existing discount
async function updateDiscount(discountId, discountData) {
  const orgMail = getOrgMail();
  const query = `
    UPDATE Discounts
    SET
      Product_idProduct = ?,
      Description = ?,
      Discount_Type = ?,
      Discount_Value = ?,
      Start_Date = ?,
      End_Date = ?,
      Status = ?
    WHERE idDiscounts = ? AND orgmail = ?
  `;

  const [result] = await pool.query(query, [
    discountData.productId,
    discountData.description,
    discountData.discountType,
    discountData.discountValue,
    discountData.startDate,
    discountData.endDate,
    discountData.status,
    discountId,
    orgMail,
  ]);
}

// Delete a discount
async function deleteDiscount(discountId) {
  const orgMail = getOrgMail();
  const query = `
    DELETE FROM Discounts
    WHERE idDiscounts = ? AND orgmail = ?
  `;
  const [result] = await pool.query(query, [discountId, orgMail]);
  return result;
}

// Get a single discount by id
async function getDiscountById(discountId) {
  const orgMail = getOrgMail();
  const query = `
    SELECT d.*, p.Description as ProductName
    FROM Discounts d
    JOIN Product p ON d.Product_idProduct = p.idProduct AND p.orgmail = ?
    WHERE d.idDiscounts = ? AND d.orgmail = ?
  `;
  const [rows] = await pool.query(query, [orgMail, discountId, orgMail]);
  return rows.length > 0 ? rows[0] : null;
}

module.exports = {
  // Category and Sub-Category related functions
  getAllCategories,
  getTopSellingCategories,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
  createSubCategory,
  updateSubCategory,
  checkSubCategoryInUse,
  deleteSubCategory,
  // Brand related functions
  createBrand,
  updateBrand,
  deleteBrand,
  getBrands,
  // Product related functions
  createProduct,
  createProductImages,
  createProductVariant,
  createProductFaq,
  createProductSubCategory,
  updateProduct,
  toggleProductHistoryStatus,
  toggleProductStatus,
  getAllProducts,
  getProductCount,
  getProductsSoldQty,
  getProductSoldQty,
  getProductsBySubCategory,
  getProductsByBrand,
  getProductById,
  getProductSalesInfo,
  getDiscountedProducts,
  deleteProduct,
  // Discount related functions
  getAllDiscounts,
  getDiscountsByProductId,
  getActiveDiscountsByProductId,
  getActiveEventDiscountsByProductId,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getDiscountById,
};
