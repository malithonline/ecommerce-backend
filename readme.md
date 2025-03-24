# API cURL Commands


## Base URLs
```
BASE_URL = http://localhost:9000
ADMIN_ENDPOINT = http://localhost:9000/admin
API_ENDPOINT = http://localhost:9000/api
```

## Test Connection
```bash
curl -X GET "http://localhost:9000/test"
```

## Admin Endpoints

### Authentication
```bash
# Admin Login
curl -X POST "http://localhost:9000/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### Dashboard
```bash
# Get Dashboard Statistics
curl -X GET "http://localhost:9000/admin/dashboard/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Product Management
```bash
# Create Product
curl -X POST "http://localhost:9000/admin/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "description": "Test Product",
    "product_brand_id": 1,
    "market_price": 100,
    "selling_price": 80,
    "main_image_url": "http://example.com/image.jpg",
    "long_description": "This is a test product created by the API test script",
    "sku": "TEST-123456"
  }'

# Get All Products
curl -X GET "http://localhost:9000/admin/products" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Update Product
curl -X PUT "http://localhost:9000/admin/products/PRODUCT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "description": "Updated Test Product",
    "product_brand_id": 1,
    "market_price": 100,
    "selling_price": 80,
    "main_image_url": "http://example.com/image.jpg",
    "long_description": "This is a test product created by the API test script",
    "sku": "TEST-123456"
  }'

# Delete Product
curl -X DELETE "http://localhost:9000/admin/products/PRODUCT_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Get Product Categories
curl -X GET "http://localhost:9000/admin/products/categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Create Category
curl -X POST "http://localhost:9000/admin/products/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "image_icon_url": "http://example.com/category.jpg"
  }'
```

### Order Management
```bash
# Get All Orders
curl -X GET "http://localhost:9000/admin/orders" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Get Order by ID
curl -X GET "http://localhost:9000/admin/orders/ORDER_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Update Order Status
curl -X PUT "http://localhost:9000/admin/orders/ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "processing"
  }'
```

### User Management
```bash
# Get All Users
curl -X GET "http://localhost:9000/admin/users" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Get User Roles
curl -X GET "http://localhost:9000/admin/users/roles" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Update User Status
curl -X PUT "http://localhost:9000/admin/users/USER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "active"
  }'
```

## Customer Endpoints

### Authentication
```bash
# Register New Customer
curl -X POST "http://localhost:9000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "full_name": "Test Customer",
    "email": "test@example.com",
    "password": "test123",
    "mobile_no": "1234567890"
  }'

# Customer Login
curl -X POST "http://localhost:9000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Product Endpoints
```bash
# Get All Products
curl -X GET "http://localhost:9000/api/products"

# Get Product by ID
curl -X GET "http://localhost:9000/api/products/PRODUCT_ID"

# Get Product FAQs
curl -X GET "http://localhost:9000/api/products/PRODUCT_ID/faqs"

# Add Product FAQ
curl -X POST "http://localhost:9000/api/products/PRODUCT_ID/faqs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -d '{
    "question": "Is this a test question?",
    "answer": "Yes, this is a test answer."
  }'

# Update Product FAQ
curl -X PUT "http://localhost:9000/api/products/PRODUCT_ID/faqs/FAQ_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -d '{
    "question": "Is this a test question?",
    "answer": "This is an updated test answer."
  }'

# Delete Product FAQ
curl -X DELETE "http://localhost:9000/api/products/PRODUCT_ID/faqs/FAQ_ID" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN"
```

### Cart Endpoints
```bash
# Add to Cart
curl -X POST "http://localhost:9000/api/cart/CUSTOMER_ID/add" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -d '{
    "product_variation_id": 1,
    "qty": 2,
    "rate": 80
  }'

# Get Cart
curl -X GET "http://localhost:9000/api/cart/CUSTOMER_ID" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN"
```

### Order Endpoints
```bash
# Create Order
curl -X POST "http://localhost:9000/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -d '{
    "customer_id": "CUSTOMER_ID",
    "delivery_address_id": 1,
    "cart_id": "CART_ID",
    "delivery_type": "standard",
    "payment_type": "cash"
  }'

# Get Customer Orders
curl -X GET "http://localhost:9000/api/orders/CUSTOMER_ID" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN"
```

