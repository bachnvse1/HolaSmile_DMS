import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useChatbotKnowledge } from '@/hooks/useChatbotKnowledge';
import { ChatbotHeader } from '@/components/chatbot/ChatbotHeader';
import { ChatbotSearch } from '@/components/chatbot/ChatbotSearch';
import { ChatbotStatistics } from '@/components/chatbot/ChatbotStatistics';
import { ChatbotKnowledgeList } from '@/components/chatbot/ChatbotKnowledgeList';
import { ChatbotEditModal } from '@/components/chatbot/ChatbotEditModal';
import { ChatbotCreateModal } from '@/components/chatbot/ChatbotCreateModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Pagination } from '@/components/ui/Pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ChatbotKnowledge } from '@/types/chatbot.types';
import { StaffLayout } from '@/layouts/staff';
import { AuthGuard } from '@/components/AuthGuard';
import { useUserInfo } from '@/hooks/useUserInfo';
const ChatbotKnowledgeManagement: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState<ChatbotKnowledge | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<ChatbotKnowledge | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const userInfo = useUserInfo();
    const {
        knowledge,
        loading,
        updating,
        updateKnowledge,
        createKnowledge,
        deleteKnowledge,
        getStatistics
    } = useChatbotKnowledge();
    const hasPermission = userInfo?.role === 'Owner' || userInfo?.role === 'Administrator';

    const statistics = getStatistics();

    const filteredKnowledge = knowledge.filter(
        item =>
            item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredKnowledge.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedKnowledge = filteredKnowledge.slice(startIndex, endIndex);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleEdit = (item: ChatbotKnowledge) => {
        if (!hasPermission) return;
        setEditingItem(item);
    };

    const handleSave = async (data: { knowledgeId: number; newAnswer: string; newQuestion: string }) => {
        await updateKnowledge(data);
    };

    const handleSaveCreate = async (data: { question: string; answer: string }) => {
        await createKnowledge(data);
    };

    const handleDelete = async (knowledgeId: number) => {
        await deleteKnowledge(knowledgeId);
    };

    const handleCreateClick = () => {
        if (!hasPermission) return;
        setShowCreateModal(true);
    };

    const handleDeleteFromList = async (item: ChatbotKnowledge) => {
        if (!hasPermission) return;
        setItemToDelete(item);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        
        try {
            await deleteKnowledge(itemToDelete.id);
        } finally {
            setItemToDelete(null);
        }
    };

    const handleCancel = () => {
        setEditingItem(null);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value);
        setCurrentPage(1);
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AuthGuard requiredRoles={['Owner', 'Administator']}>

            <StaffLayout userInfo={userInfo}>
                <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <ChatbotHeader/>
                        
                        {hasPermission && (
                            <Button
                                onClick={handleCreateClick}
                                disabled={loading}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Thêm câu hỏi mới
                            </Button>
                        )}
                    </div>

                    <ChatbotSearch
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                    />

                    <ChatbotStatistics
                        total={statistics.total}
                        newCount={statistics.new}
                        updatedCount={statistics.updated}
                    />

                    <ChatbotKnowledgeList
                        knowledge={paginatedKnowledge}
                        searchTerm={searchTerm}
                        onEdit={handleEdit}
                        onDelete={handleDeleteFromList}
                        hasDeletePermission={hasPermission}
                    />

                    {filteredKnowledge.length > 0 && (
                        <Card className="mt-6">
                            <CardContent className="p-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    totalItems={filteredKnowledge.length}
                                    itemsPerPage={itemsPerPage}
                                    onItemsPerPageChange={handleItemsPerPageChange}
                                    className="justify-center"
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Create Modal */}
                    {showCreateModal && (
                        <ChatbotCreateModal
                            isCreating={updating}
                            onSave={handleSaveCreate}
                            onCancel={() => setShowCreateModal(false)}
                        />
                    )}

                    {/* Edit Modal */}
                    {editingItem && (
                        <ChatbotEditModal
                            knowledge={editingItem}
                            isUpdating={updating}
                            onSave={handleSave}
                            onDelete={handleDelete}
                            onCancel={handleCancel}
                        />
                    )}

                    {/* Delete Confirmation Modal */}
                    <ConfirmModal
                        isOpen={!!itemToDelete}
                        onClose={() => setItemToDelete(null)}
                        onConfirm={handleConfirmDelete}
                        title="Xác nhận xóa"
                        message={`Bạn có chắc chắn muốn xóa câu hỏi: "${itemToDelete?.question}"?`}
                        confirmText="Xóa"
                        confirmVariant="destructive"
                        isLoading={updating}
                    />
                </div>
            </StaffLayout>
        </AuthGuard>

    );
};

export default ChatbotKnowledgeManagement;