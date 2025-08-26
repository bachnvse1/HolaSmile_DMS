import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

const AuthCallback = () => {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const query = new URLSearchParams(window.location.search);

    const token = query.get("token");
    const refreshToken = query.get("refreshToken");
    const username = query.get("username");
    const fullName = query.get("fullName");
    const role = query.get("role");
    const imageUrl = query.get("imageUrl");

    if (token && username && role) {
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken ?? "");
      localStorage.setItem("username", username);
      localStorage.setItem("role", role);
      localStorage.setItem("avatar", imageUrl ?? "");

      toast.success(`Đăng nhập thành công! Xin chào ${fullName}`, {
        position: "top-left",
        autoClose: 3000,
      });

      handled.current = true;

      if (role === "Patient") {
            navigate("/patient/appointments");
          } else if (role === "Administrator") {
            navigate("/administrator/user-list");
          } else if (role && ["Receptionist", "Assistant", "Dentist"].includes(role)) {
            navigate("/appointments");
          } else if (role === "Owner") {
            navigate("/dashboard");
          } else {
            navigate("/");
          }
    } else {
      toast.error("Đăng nhập thất bại!", {
        position: "top-left",
      });
      navigate("/");
    }
  }, [navigate]);

  return <div className="p-6 text-center">Đang xử lý đăng nhập...</div>;
};

export default AuthCallback;
