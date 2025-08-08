import React, { useState } from 'react';
import { useChatbotKnowledge } from '@/hooks/useChatbotKnowledge';
import { ChatbotHeader } from '@/components/chatbot/ChatbotHeader';
import { ChatbotSearch } from '@/components/chatbot/ChatbotSearch';
import { ChatbotStatistics } from '@/components/chatbot/ChatbotStatistics';
import { ChatbotKnowledgeList } from '@/components/chatbot/ChatbotKnowledgeList';
import { ChatbotEditModal } from '@/components/chatbot/ChatbotEditModal';
import { Pagination } from '@/components/ui/Pagination';
import { Card, CardContent } from '@/components/ui/card';
import type { ChatbotKnowledge } from '@/types/chatbot.types';
import { StaffLayout } from '@/layouts/staff';
import { AuthGuard } from '@/components/AuthGuard';
import { useUserInfo } from '@/hooks/useUserInfo';
const ChatbotKnowledgeManagement: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState<ChatbotKnowledge | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const userInfo = useUserInfo();
    const {
        knowledge,
        loading,
        updating,
        updateAnswer,
        getStatistics
    } = useChatbotKnowledge();

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
        setEditingItem(item);
    };

    const handleSave = async (newAnswer: string): Promise<boolean> => {
        if (!editingItem) return false;
        return await updateAnswer(editingItem.id, newAnswer);
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
                    <ChatbotHeader />

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
                        searchTerm=""
                        onEdit={handleEdit}
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

                    {editingItem && (
                        <ChatbotEditModal
                            item={editingItem}
                            isUpdating={updating}
                            onSave={handleSave}
                            onCancel={handleCancel}
                        />
                    )}
                </div>
            </StaffLayout>
        </AuthGuard>

    );
};

export default ChatbotKnowledgeManagement;