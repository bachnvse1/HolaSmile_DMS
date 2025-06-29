import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { OrthodonticTreatmentPlan } from '../types/orthodontic';

const schema = z.object({
  planTitle: z.string().min(1, 'Vui lòng nhập tiêu đề kế hoạch'),
  templateName: z.string().min(1, 'Vui lòng chọn mẫu'),
  dentistId: z.number().min(1, 'Vui lòng chọn bác sĩ phụ trách'),
  reasonForVisit: z.string().min(1, 'Vui lòng nhập lý do đến khám'),
  examinationFindings: z.string().min(1, 'Vui lòng nhập kết quả thăm khám'),
  intraoralExam: z.string().min(1, 'Vui lòng nhập khám trong miệng'),
  xRayBone: z.string().optional(),
  xRayProfile: z.string().optional(),
  xRayPeriapical: z.string().optional(),
  modelOverbite: z.string().optional(),
  modelOverjet: z.string().optional(),
  modelMidline: z.string().optional(),
  modelCrossbite: z.string().optional(),
  modelOpenbite: z.string().optional(),
  modelArch: z.string().optional(),
  modelRelation: z.string().optional(),
  modelR3: z.string().optional(),
  modelR6: z.string().optional(),
  treatmentPlanContent: z.string().min(1, 'Vui lòng nhập nội dung kế hoạch điều trị'),
  totalCost: z.number().min(0, 'Vui lòng nhập tổng chi phí'),
  paymentMethod: z.string().min(1, 'Vui lòng nhập phương thức thanh toán'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onSave: (plan: OrthodonticTreatmentPlan) => void;
  initialData?: OrthodonticTreatmentPlan | null;
}

const dentistOptions = [
  { value: 1, label: 'Nguyễn Văn A' },
  { value: 2, label: 'Nguyễn Lan Anh' },
];

const templateOptions = [
  { value: 'Mẫu A', label: 'Mẫu A' },
  { value: 'Mẫu B', label: 'Mẫu B' },
];

export default function OrthodonticTreatmentPlanForm({ onSave, initialData }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      planTitle: '',
      templateName: '',
      dentistId: 0,
      reasonForVisit: '',
      examinationFindings: '',
      intraoralExam: '',
      xRayBone: '',
      xRayProfile: '',
      xRayPeriapical: '',
      modelOverbite: '',
      modelOverjet: '',
      modelMidline: '',
      modelCrossbite: '',
      modelOpenbite: '',
      modelArch: '',
      modelRelation: '',
      modelR3: '',
      modelR6: '',
      treatmentPlanContent: '',
      totalCost: 0,
      paymentMethod: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    const plan: OrthodonticTreatmentPlan = {
      ...initialData,
      ...data,
      planId: initialData?.planId || Date.now(),
      patientId: initialData?.patientId || 55,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 1,
      updatedBy: 1,
      isDeleted: false,
      // Map các trường phân tích xray, mẫu hàm vào modelAnalysis/xRayAnalysis nếu cần
      xRayAnalysis: `${data.xRayBone || ''}\n${data.xRayProfile || ''}\n${data.xRayPeriapical || ''}`.trim(),
      modelAnalysis: `${data.modelOverbite || ''}\n${data.modelOverjet || ''}\n${data.modelMidline || ''}\n${data.modelCrossbite || ''}\n${data.modelOpenbite || ''}\n${data.modelArch || ''}\n${data.modelRelation || ''}\n${data.modelR3 || ''}\n${data.modelR6 || ''}`.trim(),
      treatmentHistory: initialData?.treatmentHistory || '',
    };
    onSave(plan);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <div>
        <label className="font-medium mb-2 block">Tiêu đề kế hoạch <span className="text-red-500">*</span></label>
        <Input {...register('planTitle')} />
        {errors.planTitle && <p className="text-red-500 text-xs">{errors.planTitle.message}</p>}
      </div>
      <div>
        <label className="font-medium mb-2 block">Tên mẫu <span className="text-red-500">*</span></label>
        <select className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('templateName')}>
          <option value="">Chọn mẫu</option>
          {templateOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        {errors.templateName && <p className="text-red-500 text-xs">{errors.templateName.message}</p>}
      </div>
      <div>
        <label className="font-medium mb-2 block">Bác sĩ phụ trách <span className="text-red-500">*</span></label>
        <select className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('dentistId', { valueAsNumber: true })}>
          <option value={0}>Chọn bác sĩ</option>
          {dentistOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        {errors.dentistId && <p className="text-red-500 text-xs">{errors.dentistId.message}</p>}
      </div>
      <div>
        <label className="font-medium mb-2 block">Tổng chi phí <span className="text-red-500">*</span></label>
        <Input type="number" {...register('totalCost', { valueAsNumber: true })} />
        {errors.totalCost && <p className="text-red-500 text-xs">{errors.totalCost.message}</p>}
      </div>
      <div className="md:col-span-2">
        <label className="font-medium mb-2 block">Phương thức thanh toán <span className="text-red-500">*</span></label>
        <Input {...register('paymentMethod')} />
        {errors.paymentMethod && <p className="text-red-500 text-xs">{errors.paymentMethod.message}</p>}
      </div>
      <div className="md:col-span-2">
        <label className="font-medium mb-2 block">Lý do đến khám <span className="text-red-500">*</span></label>
        <Textarea {...register('reasonForVisit')} />
        {errors.reasonForVisit && <p className="text-red-500 text-xs">{errors.reasonForVisit.message}</p>}
      </div>
      <div className="md:col-span-2">
        <label className="font-medium mb-2 block">Kết quả thăm khám <span className="text-red-500">*</span></label>
        <Textarea {...register('examinationFindings')} />
        {errors.examinationFindings && <p className="text-red-500 text-xs">{errors.examinationFindings.message}</p>}
      </div>
      <div className="md:col-span-2">
        <label className="font-medium mb-2 block">Khám trong miệng <span className="text-red-500">*</span></label>
        <Textarea {...register('intraoralExam')} />
        {errors.intraoralExam && <p className="text-red-500 text-xs">{errors.intraoralExam.message}</p>}
      </div>
      <div className="md:col-span-2">
        <label className="font-medium mb-2 block">Phân tích X-ray</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm mb-1 block">Xương</label>
            <Input {...register('xRayBone')} />
          </div>
          <div>
            <label className="text-sm mb-1 block">Mặt nghiêng</label>
            <Input {...register('xRayProfile')} />
          </div>
          <div>
            <label className="text-sm mb-1 block">Xơ cứng xương quanh chóp</label>
            <Input {...register('xRayPeriapical')} />
          </div>
        </div>
      </div>
      <div className="md:col-span-2">
        <label className="font-medium mb-2 block">Phân tích mẫu hàm</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm mb-1 block">Cắn phủ</label>
            <Input {...register('modelOverbite')} />
          </div>
          <div>
            <label className="text-sm mb-1 block">Cắn chìa</label>
            <Input {...register('modelOverjet')} />
          </div>
          <div>
            <label className="text-sm mb-1 block">Đường giữa</label>
            <Input {...register('modelMidline')} />
          </div>
          <div>
            <label className="text-sm mb-1 block">Cắn ngược</label>
            <Input {...register('modelCrossbite')} />
          </div>
          <div>
            <label className="text-sm mb-1 block">Cắn hở</label>
            <Input {...register('modelOpenbite')} />
          </div>
          <div>
            <label className="text-sm mb-1 block">Cung hàm</label>
            <Input {...register('modelArch')} />
          </div>
          <div>
            <label className="text-sm mb-1 block">Tương quan</label>
            <Input {...register('modelRelation')} />
          </div>
          <div>
            <label className="text-sm mb-1 block">Tương quan R3</label>
            <Input {...register('modelR3')} />
          </div>
          <div>
            <label className="text-sm mb-1 block">Tương quan R6</label>
            <Input {...register('modelR6')} />
          </div>
        </div>
      </div>
      <div className="md:col-span-2">
        <label className="font-medium mb-2 block">Nội dung & kế hoạch điều trị <span className="text-red-500">*</span></label>
        <Textarea {...register('treatmentPlanContent')} />
        {errors.treatmentPlanContent && <p className="text-red-500 text-xs">{errors.treatmentPlanContent.message}</p>}
      </div>
      <div className="md:col-span-2 flex gap-2 justify-end mt-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>Hủy</Button>
        <Button type="submit">Lưu</Button>
      </div>
    </form>
  );
}
