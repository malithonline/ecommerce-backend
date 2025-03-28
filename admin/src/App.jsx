import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PrivateRoute from "./components/PrivateRoute";
import ProductForm from "./components/ProductForm";
import ProductList from "./components/ProductList";
import UsersManagedForm from "./components/UsersManagedForm";
import CustomerManagedForm from "./components/CustomerManagedForm";
import ProfilePage from "./pages/ProfilePage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      >
        <Route path="products/add" element={<ProductForm />} />
        <Route path="products/edit" element={<ProductList />} />
        <Route path="users_managed-form" element={<UsersManagedForm />} /> 
        <Route path="customer-managed-form" element={<CustomerManagedForm />} /> 
      </Route>
      <Route path="/ProfilePage" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
