import { useNavigate, Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { toast } from "react-toastify"

interface FormData {
  customerName: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  address: string;
  underlyingConditions?: string;
  patientGroup?: string;
  notes?: string;
}

const addPatient = async (data: FormData) => {
  const payload = {
    fullName: data.customerName,
    phoneNumber: data.phoneNumber,
    dob: data.dateOfBirth,
    gender: data.gender === "male",
    email: data.email,
    adress: data.address,
    underlyingConditions: data.underlyingConditions || "",
    patientGroup: data.patientGroup || "",
    note: data.notes || "",
    createdby: 1,
  };

  const res = await axiosInstance.post("/Receptionist/patients", payload);
  return res.data;
};

export default function AddPatient() {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: addPatient,
    onSuccess: () => {
      toast.success("Đã thêm bệnh nhân thành công");
      navigate("/patients");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Có lỗi xảy ra. Vui lòng thử lại.";

      toast.error(message);

      formik.setStatus(message);
    }
  });

  const genderOptions = [
    { value: "male", label: "Nam" },
    { value: "female", label: "Nữ" },
  ];

  const formik = useFormik({
    initialValues: {
      customerName: "",
      phoneNumber: "",
      email: "",
      dateOfBirth: "",
      gender: "",
      address: "",
      underlyingConditions: "",
      patientGroup: "",
      notes: "",
    },
    validationSchema: Yup.object({
      customerName: Yup.string()
        .required("Bắt buộc nhập tên khách hàng")
        .min(2, "Tên phải có ít nhất 2 ký tự")
        .matches(/^[a-zA-ZÀ-ỹ\s]+$/, "Tên chỉ được chứa chữ cái và khoảng trắng"),
      phoneNumber: Yup.string()
        .required("Bắt buộc nhập số điện thoại")
        .matches(/^(?:\+84|0)\d{9,10}$/, "Số điện thoại không hợp lệ"),
      email: Yup.string()
        .email("Email không hợp lệ")
        .required("Bắt buộc nhập email"),
      dateOfBirth: Yup.string().required("Bắt buộc chọn ngày sinh"),
      gender: Yup.string().required("Bắt buộc chọn giới tính"),
      address: Yup.string().required("Bắt buộc nhập địa chỉ"),
    }),
    onSubmit: (values) => {
      mutation.mutate(values);
    },
  });

  return (
    <div className="min-h-screen bg-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/patients"
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Thêm Bệnh Nhân</h1>
        </div>

        <form
          onSubmit={formik.handleSubmit}
          className="bg-gray-50 rounded-xl border p-8 shadow space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tên khách hàng */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng</label>
              <input
                type="text"
                name="customerName"
                value={formik.values.customerName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
              />
              {formik.touched.customerName && formik.errors.customerName && (
                <p className="text-sm text-red-500 mt-1">{formik.errors.customerName}</p>
              )}
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formik.values.phoneNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
              />
              {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                <p className="text-sm text-red-500 mt-1">{formik.errors.phoneNumber}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-sm text-red-500 mt-1">{formik.errors.email}</p>
              )}
            </div>

            {/* Ngày sinh */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formik.values.dateOfBirth}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
              />
              {formik.touched.dateOfBirth && formik.errors.dateOfBirth && (
                <p className="text-sm text-red-500 mt-1">{formik.errors.dateOfBirth}</p>
              )}
            </div>

            {/* Giới tính */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
              <select
                name="gender"
                value={formik.values.gender}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
              >
                <option value="">Chọn giới tính</option>
                {genderOptions.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              {formik.touched.gender && formik.errors.gender && (
                <p className="text-sm text-red-500 mt-1">{formik.errors.gender}</p>
              )}
            </div>

            {/* Địa chỉ */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
              <textarea
                name="address"
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
              />
              {formik.touched.address && formik.errors.address && (
                <p className="text-sm text-red-500 mt-1">{formik.errors.address}</p>
              )}
            </div>

            {/* Các trường tuỳ chọn */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Điều kiện cơ bản</label>
              <textarea
                name="underlyingConditions"
                value={formik.values.underlyingConditions}
                onChange={formik.handleChange}
                className="w-full border px-3 py-2 rounded-md shadow-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhóm bệnh nhân</label>
              <textarea
                name="patientGroup"
                value={formik.values.patientGroup}
                onChange={formik.handleChange}
                className="w-full border px-3 py-2 rounded-md shadow-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <textarea
                name="notes"
                value={formik.values.notes}
                onChange={formik.handleChange}
                className="w-full border px-3 py-2 rounded-md shadow-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              to="/patients"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={mutation.status === "pending"}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.status === "pending" ? "Đang thêm..." : "Thêm bệnh nhân"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
