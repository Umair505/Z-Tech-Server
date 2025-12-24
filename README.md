# Z-Tech-Server

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Umair505/Z-Tech-Server/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Umair505/Z-Tech-Server.svg?style=social)](https://github.com/Umair505/Z-Tech-Server/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Umair505/Z-Tech-Server.svg?style=social)](https://github.com/Umair505/Z-Tech-Server/network/members)

## Description

Z-Tech-Server is the backend API for the Z-TECH e-commerce platform. Built with Node.js, Express.js, and MongoDB, it provides secure authentication using JWT cookies, role-based authorization for admins, product and order management, cart and wishlist functionality, and cloud-based image uploads via Cloudinary.

The server acts as the core business logic layer, handling users, products, orders, payments data, and admin operations while securely communicating with the frontend.

## Features

* **JWT-based Authentication**: Secure login using JSON Web Tokens stored in HTTP-only cookies.
* **Role-Based Authorization**: Admin-only access for managing users, products, and orders.
* **User Management**: User registration, role checking, admin promotion, and deletion.
* **Product Management (CRUD)**: Admins can create, update, delete, and manage products.
* **Cart System**: Users can add, update quantity, view, and remove cart items.
* **Wishlist System**: Save and manage favorite products.
* **Order Management**:
  * Users can place orders and view their order history.
  * Admins can view all orders and update order status.
* **Cloudinary Image Uploads**: Secure image uploads using Multer memory storage and Cloudinary streams.
* **Admin Statistics**: Dashboard stats for total users, products, orders, and revenue.
* **CORS Security**: Whitelisted frontend domains with credential support.
* **Production Ready**: Configured for Vercel deployment.


## Installation

To get Z-Tech-Server up and running on your local machine, follow these steps:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Umair505/Z-Tech-Server.git
    cd Z-Tech-Server
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Create a `.env` file**:
    Create a file named `.env` in the root directory of the project and add the following environment variables. Replace the placeholder values with your actual credentials:

    ```
    PORT=5000
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=a_very_secret_jwt_key
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
    SSL_STORE_ID=your_sslcommerz_store_id
    SSL_STORE_PASS=your_sslcommerz_store_password
    CLIENT_URL=http://localhost:3000,http://localhost:5173,https://z-tech-gadget.vercel.app
    ```
    *   `PORT`: The port on which the server will run.
    *   `MONGODB_URI`: Your MongoDB connection string (e.g., from MongoDB Atlas).
    *   `JWT_SECRET`: A strong, random string used to sign and verify JWTs.
    *   `CLOUDINARY_*`: Your Cloudinary account credentials for image/file uploads.
    *   `CLIENT_URL`: A comma-separated list of allowed frontend origins for CORS.

## Usage

Once the server is installed and configured, you can start it using the provided scripts:

1.  **Start the server in development mode (with `nodemon` for auto-restarts):**
    ```bash
    npm run dev
    ```

2.  **Start the server in production mode:**
    ```bash
    npm start
    ```

The server will typically run on `http://localhost:5000` (or your specified `PORT`).
### API Endpoints

This server provides RESTful API endpoints that the client application consumes. Here are the available endpoints:

* **Authentication**:
    * `POST /jwt` - Generate JWT and set authentication cookie.
    * `GET /logout` - Clear authentication cookie and log out.
* **Users**:
    * `POST /users` - Register a new user.
    * `GET /user/role/:email` - Retrieve the role of a specific user.
    * `GET /admin/users` - Get a list of all users (Admin only).
    * `PATCH /users/admin/:id` - Promote a user to Admin role.
    * `DELETE /users/:id` - Delete a specific user (Admin only).
* **Products**:
    * `GET /products` - Retrieve a list of all products.
    * `GET /products/:id` - Get details of a specific product.
    * `POST /products` - Create a new product (Admin only).
    * `PUT /products/:id` - Update an existing product (Admin only).
    * `DELETE /products/:id` - Delete a product (Admin only).
* **Cart**:
    * `POST /cart` - Add an item to the user's cart.
    * `GET /cart` - Retrieve the current user's cart.
    * `PATCH /cart/:id` - Update the quantity of a cart item.
    * `DELETE /cart/:id` - Remove an item from the cart.
* **Wishlist**:
    * `POST /wishlist` - Add an item to the wishlist.
    * `GET /wishlist` - Retrieve the user's wishlist.
    * `DELETE /wishlist/:id` - Remove an item from the wishlist.
* **Orders**:
    * `POST /order` - Place a new order.
    * `GET /orders` - Retrieve the current user's order history.
    * `GET /admin/orders` - Retrieve all orders (Admin only).
    * `GET /admin/orders/:id` - Get details of a specific order (Admin only).
    * `PATCH /admin/orders/:id` - Update order status (Admin only).
* **Admin Stats**:
    * `GET /admin/stats` - Retrieve dashboard statistics and analytics.

*(Note: Specific routes and their exact paths are defined within the route files of the application.)*

## Tech Stack

* **Languages**: JavaScript
* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: MongoDB (via Mongoose ODM)
* **Cloud Storage**: Cloudinary
* **Payment Gateway**: SSLCommerz LTS
* **Authentication**: JSON Web Token (JWT), bcryptjs
* **File Uploads**: Multer, Multer-Storage-Cloudinary
* **Environment Management**: Dotenv
* **CORS**: `cors` package
* **Utilities**: Axios, Cookie-Parser, Slugify, Streamifier

### Dependencies

* `bcryptjs`: ^3.0.3
* `cloudinary`: ^1.41.3
* `cookie-parser`: ^1.4.7
* `cors`: ^2.8.5
* `dotenv`: ^17.2.3
* `express`: ^5.2.1
* `jsonwebtoken`: ^9.0.3
* `mongoose`: ^9.0.1
* `multer`: ^2.0.2
* `multer-storage-cloudinary`: ^4.0.0
* `slugify`: ^1.6.6


### Development Dependencies

*   `nodemon`: ^3.1.11

## Project Structure

The project has a concise structure, with the main logic residing in the primary server file:

```
.
├── index.js
├── package.json
├── package-lock.json
└── vercel.json
```

*   `index.js`: The main entry point of the application, where the Express server is initialized, middleware is configured, database connection is established, and API routes are defined.
*   `package.json`: Defines project metadata, scripts (`start`, `dev`), and lists all project dependencies.
*   `package-lock.json`: Records the exact versions of all installed dependencies.
*   `vercel.json`: Configuration file for deploying the server to Vercel.

## Contributing

Contributions are welcome! If you have suggestions for improvements, new features, or bug fixes, please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/Umair505/Z-Tech-Server/blob/main/LICENSE) file for details.
