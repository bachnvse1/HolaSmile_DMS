import { Layout } from '@/layouts/homepage/Layout';
import { useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { ProcedureService } from '@/services/procedureService';
import { useGuestProcedures } from '@/hooks/useGuestProcedures';
import type { Procedure } from '@/types/procedure';

type Benefit = { title: string; desc: string };
type Review = { name: string; date: string; rating: number; comment: string };

const clamp = (v: number, a = 0, b = 5) => Math.max(a, Math.min(b, v));

const renderStars = (rating: number) => {
  const full = Math.round(clamp(rating, 0, 5));
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="text-yellow-500">{i < full ? '★' : '☆'}</span>
      ))}
    </>
  );
};

const getAvgRating = (p: Partial<Procedure> | null): number => {
  if (!p) return 4.5;
  const id = p.procedureId ?? 7;
  return +(3.8 + ((id % 20) / 20) * 1.4).toFixed(1); // 3.8 - 5.2 clamp by caller
};

const getReviewCount = (p: Partial<Procedure> | null): number => {
  if (!p) return 12;
  return 8 + ((p.procedureId ?? 0) % 12);
};

const getFakeReviews = (p: Partial<Procedure> | null): Review[] => {
  const names = ['Nguyễn A', 'Trần B', 'Lê C', 'Phạm D', 'Hoàng E'];
  const base = getAvgRating(p);
  const count = Math.min(3, getReviewCount(p));
  return Array.from({ length: count }).map((_, i) => ({
    name: names[i % names.length],
    date: `${2025 - (i % 3)}-0${(i % 9) + 1}-1${i + 1}`,
    rating: Math.max(3, Math.round((base + (i % 2 ? -0.3 : 0.2)) * 10) / 10),
    comment: [`Rất hài lòng với kết quả.`, `Đội ngũ chuyên nghiệp, phục vụ tốt.`, `Kết quả vượt mong đợi.`][i % 3],
  }));
};

const getBenefits = (p: Partial<Procedure> | null): Benefit[] => {
  const name = p?.procedureName ?? 'Thủ thuật';
  return [
    { title: `An toàn & Chuẩn y khoa`, desc: `${name} được thực hiện theo quy trình đạt chuẩn.` },
    { title: `Tái tạo thẩm mỹ`, desc: `Cải thiện nụ cười và chức năng răng miệng.` },
    { title: `Phục hồi nhanh`, desc: `Thời gian phục hồi ngắn, tối ưu cho lịch làm việc.` },
    { title: `Tư vấn cá nhân`, desc: `Kế hoạch điều trị phù hợp với bạn.` },
  ];
};

const getSteps = (): string[] => {
  return [
    'Tư vấn & khám tổng quát',
    'Lên kế hoạch điều trị',
    'Thực hiện thủ thuật bởi bác sĩ',
    'Hướng dẫn chăm sóc sau thủ thuật',
  ];
};

const getGallery = (p: Partial<Procedure> | null): string[] => {
  const defaultImage = 'https://st.quantrimang.com/photos/image/2020/02/28/cach-ve-sinh-rang-mieng-khi-nieng-rang-3.jpg';
  const safeImage = (x: Partial<Procedure> | null) => {
    if (!x) return defaultImage;
  const maybe = x as unknown as { imageUrl?: string };
  if (maybe.imageUrl && typeof maybe.imageUrl === 'string') return maybe.imageUrl;
    return defaultImage;
  };

  const imgs = [
    safeImage(p),
    'https://www.viethandental.com/uploads/banner/nho-rang-khon-moc-lech-tim-hieu-chi-tiet-tu-a-den-z.jpg',
    'https://www.viethandental.com/uploads/banner/nho-rang-khon-moc-lech-tim-hieu-chi-tiet-tu-a-den-z.jpg',
  ];
  return imgs;
};

export default function ProcedureDetailPage() {
  const { procedureId } = useParams();
  const navigate = useNavigate();
  const [procedure, setProcedure] = useState<Partial<Procedure> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: guestProcedures = [], isLoading: guestLoading } = useGuestProcedures();
  const defaultImage = 'https://st.quantrimang.com/photos/image/2020/02/28/cach-ve-sinh-rang-mieng-khi-nieng-rang-3.jpg';
  const hasImage = (obj: unknown): obj is { imageUrl?: string } => {
    return !!obj && typeof obj === 'object' && 'imageUrl' in obj;
  };

  useEffect(() => {
    if (!procedureId) return;
    const id = Number(procedureId);
    if (Number.isNaN(id)) {
      setError('ID thủ thuật không hợp lệ');
      setLoading(false);
      return;
    }

    setLoading(true);

    // Prefer cached guest procedures to avoid extra fetch
    if (guestLoading) {
      // wait for guest list to load; effect will re-run when guestLoading changes
      return;
    }

    const found = guestProcedures.find((p) => p.procedureId === id);
    if (found) {
      setProcedure(found);
      setError(null);
      setLoading(false);
      return;
    }

    // Fallback to fetching by id
    ProcedureService.getById(id)
      .then((res) => setProcedure(res))
      .catch((err) => setError(err?.message || 'Không thể tải thủ thuật'))
      .finally(() => setLoading(false));
  }, [procedureId, guestProcedures, guestLoading]);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="p-8 bg-white rounded-2xl shadow text-center">Đang tải...</div>
          ) : error ? (
            <div className="p-8 bg-white rounded-2xl shadow text-center text-red-600">{error}</div>
          ) : procedure ? (
            <>
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <img
                  src={procedure && hasImage(procedure) && procedure.imageUrl ? procedure.imageUrl : defaultImage}
                  alt={procedure?.procedureName ?? 'Thủ thuật'}
                  className="w-full md:w-56 h-44 md:h-48 object-cover rounded-2xl shadow-md flex-shrink-0"
                />

                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">{procedure.procedureName ?? 'Thủ thuật'}</h1>
                  <p className="text-md text-gray-600 mt-3 leading-relaxed">{procedure.description ?? 'Chưa có mô tả cho thủ thuật này.'}</p>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600">
                    <div className="bg-gray-100 px-3 py-1 rounded-full">Mã: #{procedure.procedureId}</div>
                    {procedure.duration && <div className="bg-gray-100 px-3 py-1 rounded-full">Thời gian: {procedure.duration} phút</div>}
                    {procedure.requirements && <div className="bg-gray-100 px-3 py-1 rounded-full">Yêu cầu: {procedure.requirements}</div>}
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Thông tin</h3>
                      <p className="text-sm text-gray-700">Thời gian dự kiến: {procedure.duration ?? 'N/A'}</p>
                      {procedure.requirements && <p className="text-sm text-gray-700 mt-2">Yêu cầu: {procedure.requirements}</p>}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Ghi chú</h3>
                      <p className="text-sm text-gray-700">Chi phí vật tư: {procedure.consumableCost ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(procedure.consumableCost) : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="text-right md:text-right md:w-48 flex-shrink-0 min-w-0">
                  <div className="text-sm text-gray-500">Giá</div>
                  <div className="text-3xl md:text-4xl font-extrabold text-green-600 whitespace-nowrap">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(procedure.price ?? 0)}
                </div>
                  <div className="mt-6 flex flex-col gap-3">
                    <button onClick={() => navigate(`/appointment-booking?procedure=${procedure.procedureId}`)} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">Đặt lịch</button>
                    <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg border">Quay lại</button>
                  </div>
                </div>
              </div>
            </div>
            {/* Extra marketing sections: benefits, steps, gallery, reviews */}
            <div className="mt-8 bg-white rounded-2xl shadow p-6 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <h2 className="text-2xl font-bold text-gray-900">Lợi ích khi thực hiện</h2>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getBenefits(procedure).map((b, i) => (
                      <div key={i} className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
                        <div className="flex-shrink-0 text-blue-600 text-xl">✓</div>
                        <div>
                          <div className="font-semibold text-gray-800">{b.title}</div>
                          <div className="text-sm text-gray-600">{b.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3 className="mt-6 text-xl font-semibold">Quy trình thực hiện</h3>
                  <ol className="mt-3 space-y-3 list-decimal list-inside text-sm text-gray-700">
                    {getSteps().map((s, idx) => (
                      <li key={idx} className="bg-gray-50 p-3 rounded-lg">{s}</li>
                    ))}
                  </ol>

                  <h3 className="mt-6 text-xl font-semibold">Hình ảnh tham khảo</h3>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {getGallery(procedure).map((src, i) => (
                      <img key={i} src={src} alt={`${procedure?.procedureName ?? 'image'}-${i}`} className="w-full h-24 object-cover rounded-md" />
                    ))}
                  </div>
                </div>

                <div className="md:col-span-1">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">Đánh giá trung bình</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center text-yellow-500">{renderStars(getAvgRating(procedure))}</div>
                          <div className="text-sm text-gray-600">{getAvgRating(procedure).toFixed(1)} / 5</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{getReviewCount(procedure)} reviews</div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {getFakeReviews(procedure).map((r, i) => (
                        <div key={i} className="bg-white p-3 rounded shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-sm">{r.name}</div>
                            <div className="text-xs text-gray-500">{r.date}</div>
                          </div>
                          <div className="flex items-center gap-2 text-yellow-500 mt-1">{renderStars(r.rating)}</div>
                          <div className="text-sm text-gray-700 mt-2">{r.comment}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </>
          ) : (
            <div className="p-8 bg-white rounded-2xl shadow text-center">Không tìm thấy thủ thuật</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
