import { useNavigate, Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

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

  const res = await axios.post(
    "http://localhost:5135/api/Receptionist/patients",
    payload,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
};

export default function AddPatient() {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: addPatient,
    onSuccess: () => {
      alert("Đã thêm bệnh nhân thành công");
      navigate("/");
    },
    onError: (error) => {
      console.error("Lỗi thêm bệnh nhân:", error);
      formik.setStatus("Có lỗi xảy ra. Vui lòng thử lại.");
    },
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/patients"
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Thêm Bệnh Nhân</h1>
        </div>

        <form onSubmit={formik.handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium">Tên khách hàng</label>
            <input
              type="text"
              name="customerName"
              value={formik.values.customerName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="mt-1 block w-full border rounded-lg px-3 py-2"
            />
            {formik.touched.customerName && formik.errors.customerName && (
              <p className="text-sm text-red-600">{formik.errors.customerName}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium">Số điện thoại</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formik.values.phoneNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="mt-1 block w-full border rounded-lg px-3 py-2"
            />
            {formik.touched.phoneNumber && formik.errors.phoneNumber && (
              <p className="text-sm text-red-600">{formik.errors.phoneNumber}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="mt-1 block w-full border rounded-lg px-3 py-2"
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-sm text-red-600">{formik.errors.email}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium">Ngày sinh</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formik.values.dateOfBirth}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="mt-1 block w-full border rounded-lg px-3 py-2"
            />
            {formik.touched.dateOfBirth && formik.errors.dateOfBirth && (
              <p className="text-sm text-red-600">{formik.errors.dateOfBirth}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium">Giới tính</label>
            <select
              name="gender"
              value={formik.values.gender}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="mt-1 block w-full border rounded-lg px-3 py-2"
            >
              <option value="">Chọn giới tính</option>
              {genderOptions.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
            {formik.touched.gender && formik.errors.gender && (
              <p className="text-sm text-red-600">{formik.errors.gender}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium">Địa chỉ</label>
            <textarea
              name="address"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="mt-1 block w-full border rounded-lg px-3 py-2"
            />
            {formik.touched.address && formik.errors.address && (
              <p className="text-sm text-red-600">{formik.errors.address}</p>
            )}
          </div>

          {/* Optional Fields */}
          <div>
            <label className="block text-sm font-medium">Điều kiện cơ bản</label>
            <textarea
              name="underlyingConditions"
              value={formik.values.underlyingConditions}
              onChange={formik.handleChange}
              className="mt-1 block w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Nhóm bệnh nhân</label>
            <textarea
              name="patientGroup"
              value={formik.values.patientGroup}
              onChange={formik.handleChange}
              className="mt-1 block w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Ghi chú</label>
            <textarea
              name="notes"
              value={formik.values.notes}
              onChange={formik.handleChange}
              className="mt-1 block w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-4">
            <Link
              to="#"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={mutation.status === "pending"}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60"
            >
              {mutation.status === "pending" ? "Đang thêm..." : "Thêm bệnh nhân"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
