import React, { useState } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Eye,
  Plus,
  FileImage,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { usePatientImages, useCreatePatientImage, useDeletePatientImage } from '@/hooks/usePatientImages';
import type { CreatePatientImageRequest } from '@/types/patientImage';
import { toast } from 'react-toastify';

interface PatientImageGalleryProps {
  patientId: number;
  treatmentRecordId?: number;
  orthodonticTreatmentPlanId?: number;
  title?: string;
  readonly?: boolean;
}

export const PatientImageGallery: React.FC<PatientImageGalleryProps> = ({
  patientId,
  treatmentRecordId,
  orthodonticTreatmentPlanId,
  title = "Hình Ảnh Nha Khoa",
  readonly = false
}) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);
  const [deleteImageId, setDeleteImageId] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Query parameters for fetching images
  const queryParams = {
    patientId,
    ...(treatmentRecordId && { treatmentRecordId }),
    ...(orthodonticTreatmentPlanId && { orthodonticTreatmentPlanId }),
  };

  const { data: imagesResponse, isLoading, error } = usePatientImages(queryParams);
  const createImageMutation = useCreatePatientImage();
  const deleteImageMutation = useDeletePatientImage();

  // Fix: Handle response that is now processed in the hook
  const images = Array.isArray(imagesResponse) ? imagesResponse : [];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // File size validation (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File quá lớn! Vui lòng chọn file nhỏ hơn 10MB.');
        return;
      }

      setIsCompressing(true);
      // Compress image before setting
      compressImage(file).then(compressedFile => {
        setSelectedFile(compressedFile);
        const url = URL.createObjectURL(compressedFile);
        setPreviewUrl(url);
        setIsCompressing(false);
        
        // Show compression result
        const originalSize = (file.size / 1024 / 1024).toFixed(2);
        const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
        console.log(`Image compressed: ${originalSize}MB → ${compressedSize}MB`);
      }).catch(() => {
        setIsCompressing(false);
        // Fallback to original file if compression fails
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      });
    }
  };

  // Image compression function
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 1200px width/height)
        const maxSize = 1200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original
            }
          },
          'image/jpeg',
          0.8 // 80% quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const uploadData: CreatePatientImageRequest = {
      patientId,
      imageFile: selectedFile,
      description: description.trim() || undefined,
      ...(treatmentRecordId && { treatmentRecordId }),
      ...(orthodonticTreatmentPlanId && { orthodonticTreatmentPlanId }),
    };

    try {
      await createImageMutation.mutateAsync(uploadData);
      handleCloseUploadDialog();
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleCloseUploadDialog = () => {
    setIsUploadDialogOpen(false);
    setSelectedFile(null);
    setDescription('');
    setPreviewUrl(null);
  };

  const handleDeleteImage = async () => {
    if (!deleteImageId) return;

    try {
      await deleteImageMutation.mutateAsync(deleteImageId);
      setDeleteImageId(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Đang tải ảnh...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !((error as { message?: string })?.message?.includes('404')) && !((error as { message?: string })?.message?.includes('Not Found'))) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600 py-4">
            Có lỗi xảy ra khi tải ảnh: {(error as { message?: string })?.message || 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {title}
              <span className="text-sm font-normal text-gray-500">
                ({images.length} ảnh)
              </span>
            </CardTitle>
            {!readonly && (
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Thêm Ảnh
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Thêm Ảnh Mới</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Chọn File Ảnh
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          {isCompressing ? (
                            <div className="space-y-2">
                              <Loader2 className="h-8 w-8 mx-auto text-blue-500 animate-spin" />
                              <p className="text-sm text-blue-600">
                                Đang nén ảnh...
                              </p>
                            </div>
                          ) : previewUrl ? (
                            <div className="space-y-2">
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="max-w-full h-32 object-cover mx-auto rounded"
                              />
                              <p className="text-sm text-gray-600">
                                {selectedFile?.name}
                              </p>
                              <p className="text-xs text-green-600">
                                Kích thước: {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : '0'}MB
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-8 w-8 mx-auto text-gray-400" />
                              <p className="text-sm text-gray-600">
                                Click để chọn ảnh
                              </p>
                              <p className="text-xs text-gray-500">
                                Tối đa 10MB, sẽ tự động nén
                              </p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Mô Tả (Tùy chọn)
                      </label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Nhập mô tả cho ảnh..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={handleCloseUploadDialog}
                      >
                        Hủy
                      </Button>
                      <Button
                        onClick={handleUpload}
                        disabled={!selectedFile || createImageMutation.isPending}
                      >
                        {createImageMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang tải...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Tải Lên
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-8">
              <FileImage className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">Chưa có ảnh nào</p>
              {!readonly && (
                <Button
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(true)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Thêm Ảnh Đầu Tiên
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image.imageId} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={image.imageURL}
                      alt={image.description || 'Dental image'}
                      className="w-full h-full object-cover hover:scale-105 group-hover:blur-sm transition-all duration-200 cursor-pointer"
                      onClick={() => setViewImageUrl(image.imageURL)}
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEySC0zIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                      }}
                    />
                  </div>
                  
                  {/* Image overlay with actions */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setViewImageUrl(image.imageURL)}
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!readonly && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteImageId(image.imageId)}
                          className="h-8 w-8 p-0 bg-red-500/90 hover:bg-red-500 shadow-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Image info */}
                  <div className="mt-2 space-y-1">
                    {image.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {image.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatDate(image.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Viewer Dialog */}
      {viewImageUrl && (
        <Dialog open={!!viewImageUrl} onOpenChange={() => setViewImageUrl(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Xem Ảnh</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img
                src={viewImageUrl}
                alt="Full size"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteImageId}
        onClose={() => setDeleteImageId(null)}
        onConfirm={handleDeleteImage}
        title="Xác nhận xóa ảnh"
        message="Bạn có chắc chắn muốn xóa ảnh này? Hành động này không thể hoàn tác."
        confirmText="Xóa ảnh"
        confirmVariant="destructive"
        isLoading={deleteImageMutation.isPending}
      />
    </>
  );
};