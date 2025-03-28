const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/admin/user.routes");
const customerRoutes = require("./routes/admin/customer.routes"); // Import customer routes
const productRoutes = require("./routes/admin/product.routes");

require("dotenv").config(); // Load environment variables from .env file

const app = express();

app.use(cors());
app.use(express.json());
app.use("/src/uploads", express.static("src/uploads"));

app.use("/api/customers", customerRoutes); // Use the customer routes
app.use("/api/admin/users", require("./routes/admin/user.routes"));
app.use("/api/users", userRoutes); // Use the user routes
app.use("/api/customers", customerRoutes); // Use the customer routes
app.use("/api/products", productRoutes); // Use the product routes

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
