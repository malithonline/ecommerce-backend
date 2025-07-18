import { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { FiMail, FiLock } from "react-icons/fi";
import * as api from "../api/auth";
import toast from "react-hot-toast";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      const data = await api.loginUser(email, password);

      if (data.message === "Login successful") {
        // Pass additional details if available
        login(
          data.userId,
          data.fullName,
          data.email,
          data.phoneNo,
          data.status
        );
        localStorage.setItem("token", data.token);
        toast.success("Login successful");

        // --- REDIRECT LOGIC ---
        const params = new URLSearchParams(location.search);
        if (params.get("redirect") === "timeline") {
          navigate("/Timeline?login=success");
        } else {
          navigate("/dashboard/dashboard-private");
        }
        // --- END REDIRECT LOGIC ---
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error) {
      toast.error(error.message || "Invalid credentials");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-5">
      <div className="form-control">
        <label className="label">
          <span className="label-text text-[#1D372E] text-xs md:text-sm font-medium">
            Email
          </span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
            <FiMail className="text-[#5CAF90] w-3 h-3 md:w-4 md:h-4" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input input-bordered input-sm md:input-md w-full pl-8 md:pl-10 bg-white border-[#1D372E] text-[#1D372E]"
            placeholder="Enter your email"
          />
        </div>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text text-[#1D372E] text-xs md:text-sm font-medium">
            Password
          </span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
            <FiLock className="text-[#5CAF90] w-3 h-3 md:w-4 md:h-4" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input input-bordered input-sm md:input-md w-full pl-8 md:pl-10 pr-10 bg-white border-[#1D372E] text-[#1D372E]"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 z-10 flex items-center pr-3"
          >
            {showPassword ? (
              <IoMdEyeOff className="text-[#5CAF90] w-3.5 h-3.5 md:w-4 md:h-4" />
            ) : (
              <IoMdEye className="text-[#5CAF90] w-3.5 h-3.5 md:w-4 md:h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-xs md:text-sm text-[#5CAF90] hover:underline cursor-pointer"
        >
          Forgot Password?
        </button>
      </div>

      <button
        type="submit"
        className={`btn btn-primary bg-[#5CAF90] border-none text-white btn-sm md:btn-md w-full ${
          isLoading ? "cursor-not-allowed" : "hover:bg-[#4a9a7d]"
        }`}
      >
        {isLoading ? (
          <>
            <span className="loading loading-spinner loading-xs"></span>
            Logging In...
          </>
        ) : (
          "Login"
        )}
      </button>
    </form>
  );
};

export default LoginForm;
