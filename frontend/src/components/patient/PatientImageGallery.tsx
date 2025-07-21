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
import { TokenUtils } from '@/utils/tokenUtils';
import { useUserInfo } from '@/hooks/useUserInfo';
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
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; description: string; id: string }[]>([]);
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);
  const [deleteImageId, setDeleteImageId] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const userInfo = useUserInfo();
  const roleTableId = userInfo.roleTableId ?? TokenUtils.getRoleTableIdFromToken(localStorage.getItem('token') || '');
  const MAX_IMAGES = 10;

  // Determine the actual patient ID to use
  // For Patient role: use their own ID (roleTableId), for others: use passed patientId
  let actualPatientId = patientId; // Default to passed patientId
  
  if (userInfo.role === 'Patient' && roleTableId) {
    actualPatientId = Number(roleTableId);
  }

  // Query parameters for fetching images
  const queryParams = {
    patientId: actualPatientId,
    ...(treatmentRecordId && { treatmentRecordId }),
    ...(orthodonticTreatmentPlanId && { orthodonticTreatmentPlanId }),
  };

  const { data: imagesResponse, isLoading, error } = usePatientImages(queryParams);
  const createImageMutation = useCreatePatientImage();
  const deleteImageMutation = useDeletePatientImage();
  console.log(`Actual Patient ID: ${actualPatientId}`)
  // Fix: Handle response that is now processed in the hook
  const images = Array.isArray(imagesResponse) ? imagesResponse : [];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    const currentTotal = images.length + selectedFiles.length;
    const availableSlots = MAX_IMAGES - currentTotal;

    if (availableSlots <= 0) {
      toast.error(`Đã đạt giới hạn tối đa ${MAX_IMAGES} ảnh`);
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);
    if (filesToProcess.length < files.length) {
      toast.warning(`Chỉ có thể thêm ${availableSlots} ảnh nữa (tối đa ${MAX_IMAGES} ảnh)`);
    }

    setIsCompressing(true);

    // Process each file
    Promise.all(
      filesToProcess.map(async (file) => {
        // File size validation (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} quá lớn! Vui lòng chọn file nhỏ hơn 10MB.`);
          return null;
        }

        try {
          const compressedFile = await compressImage(file);
          return {
            file: compressedFile,
            description: '',
            id: Math.random().toString(36).substr(2, 9), // Generate unique ID
          };
        } catch (error) {
          console.error('Compression failed for', file.name, error);
          return {
            file,
            description: '',
            id: Math.random().toString(36).substr(2, 9),
          };
        }
      })
    ).then((processedFiles) => {
      const validFiles = processedFiles.filter(Boolean) as { file: File; description: string; id: string }[];
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setIsCompressing(false);

      // Clear input
      event.target.value = '';
    });
  };

  const addMoreImages = () => {
    const input = document.getElementById('image-upload') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  const removeSelectedImage = (id: string) => {
    setSelectedFiles(prev => prev.filter(item => item.id !== id));
  };

  const updateImageDescription = (id: string, description: string) => {
    setSelectedFiles(prev =>
      prev.map(item =>
        item.id === id ? { ...item, description } : item
      )
    );
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
    if (selectedFiles.length === 0) return;

    // Validate that all images have descriptions
    const filesWithoutDescription = selectedFiles.filter(file => !file.description.trim());
    if (filesWithoutDescription.length > 0) {
      toast.error(`Vui lòng nhập mô tả cho tất cả ${filesWithoutDescription.length} ảnh`);
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Upload each image one by one
      for (const fileItem of selectedFiles) {
        try {
          const uploadData: CreatePatientImageRequest = {
            patientId: actualPatientId,
            imageFile: fileItem.file,
            description: fileItem.description.trim(),
            ...(treatmentRecordId && { treatmentRecordId }),
            ...(orthodonticTreatmentPlanId && { orthodonticTreatmentPlanId }),
          };

          await createImageMutation.mutateAsync(uploadData);
          successCount++;
        } catch (error) {
          console.error('Upload error for file:', fileItem.file.name, error);
          errorCount++;
        }
      }

      // Show result
      if (successCount > 0) {
        toast.success(`Đã tải lên thành công ${successCount} ảnh`);
      }
      if (errorCount > 0) {
        toast.error(`Có lỗi khi tải lên ${errorCount} ảnh`);
      }

      handleCloseUploadDialog();
    } catch (error) {
      console.error('Upload process error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseUploadDialog = () => {
    setIsUploadDialogOpen(false);
    setSelectedFiles([]);
    setIsCompressing(false);
    setIsUploading(false);
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
                  <Button
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={images.length >= MAX_IMAGES}
                  >
                    <Plus className="h-4 w-4" />
                    Thêm Ảnh ({images.length}/{MAX_IMAGES})
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto"
                  style={{
                    animation: 'none',
                    transform: 'none',
                    transition: 'none'
                  }}
                >
                  <DialogHeader>
                    <DialogTitle>Thêm Ảnh Mới ({images.length + selectedFiles.length}/{MAX_IMAGES})</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* File Input Section */}
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
                          multiple
                          disabled={images.length + selectedFiles.length >= MAX_IMAGES}
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          {isCompressing ? (
                            <div className="space-y-2">
                              <Loader2 className="h-8 w-8 mx-auto text-blue-500 animate-spin" />
                              <p className="text-sm text-blue-600">
                                Đang nén ảnh...
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-8 w-8 mx-auto text-gray-400" />
                              <p className="text-sm text-gray-600">
                                Click để chọn ảnh hoặc kéo thả vào đây
                              </p>
                              <p className="text-xs text-gray-500">
                                Tối đa {MAX_IMAGES} ảnh, mỗi file tối đa 10MB, sẽ tự động nén
                              </p>
                              {images.length + selectedFiles.length >= MAX_IMAGES && (
                                <p className="text-xs text-red-500">
                                  Đã đạt giới hạn tối đa {MAX_IMAGES} ảnh
                                </p>
                              )}
                            </div>
                          )}
                        </label>
                      </div>

                      {/* Add More Button */}
                      {selectedFiles.length > 0 && images.length + selectedFiles.length < MAX_IMAGES && (
                        <div className="mt-2 text-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addMoreImages}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Thêm Ảnh Khác
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Selected Images Preview Grid */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">
                          Ảnh đã chọn ({selectedFiles.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-96 overflow-y-auto">
                          {selectedFiles.map((fileItem) => (
                            <div key={fileItem.id} className="space-y-3 border rounded-lg p-4 bg-gray-50">
                              <div className="relative">
                                <img
                                  src={URL.createObjectURL(fileItem.file)}
                                  alt="Preview"
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeSelectedImage(fileItem.id)}
                                  className="absolute top-2 right-2 h-8 w-8 p-0 shadow-lg"
                                >
                                  ×
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm text-gray-600 truncate font-medium" title={fileItem.file.name}>
                                  {fileItem.file.name}
                                </p>
                                <p className="text-sm text-green-600 font-semibold">
                                  {(fileItem.file.size / 1024 / 1024).toFixed(2)}MB
                                </p>
                                <div className="relative">
                                  <Textarea
                                    value={fileItem.description}
                                    onChange={(e) => updateImageDescription(fileItem.id, e.target.value)}
                                    placeholder="Mô tả ảnh (bắt buộc) *"
                                    className={`text-sm resize-none ${
                                      !fileItem.description.trim() 
                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                                        : 'border-green-300 focus:border-green-500 focus:ring-green-500'
                                    }`}
                                    rows={3}
                                    required
                                  />
                                  {!fileItem.description.trim() && (
                                    <p className="text-xs text-red-500 mt-1">Vui lòng nhập mô tả</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={handleCloseUploadDialog}
                        disabled={isUploading}
                      >
                        Hủy
                      </Button>
                      <Button
                        onClick={handleUpload}
                        disabled={selectedFiles.length === 0 || isUploading || selectedFiles.some(file => !file.description.trim())}
                        className={`${
                          selectedFiles.some(file => !file.description.trim()) 
                            ? 'opacity-50 cursor-not-allowed' 
                            : ''
                        }`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang tải lên... ({selectedFiles.length} ảnh)
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Tải Lên ({selectedFiles.length} ảnh)
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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