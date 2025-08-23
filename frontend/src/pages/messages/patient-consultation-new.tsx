import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChatConversations } from '@/hooks/chat/useChatConversations';
import { usePatientConversations } from '@/hooks/chat/usePatientConversations';
import type { ConversationUser } from '@/hooks/chat/useChatConversations';
import { StaffLayout } from '@/layouts/staff';
import { useUserInfo } from '@/hooks/useUserInfo';
import { PatientLayout } from '@/layouts/patient';

const PatientConsultationPage: React.FC = () => {
  const { role, userId } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<ConversationUser | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const userInfo = useUserInfo();

  const STAFF_ROLES = useMemo(() => ["Administrator", "Owner", "Receptionist", "Assistant", "Dentist"], []);
  const isStaff = STAFF_ROLES.includes(role || '');

  // Use different hooks based on role
  const staffHook = usePatientConversations(); // For staff - get patients
  const patientHook = useChatConversations(); // For patients - get all users then filter

  const {
    conversations: rawConversations,
    filters,
    updateFilters,
    loadMore,
    hasMore,
    loading,
    markAsRead: markConversationAsRead,
    loadConversationData,
    totalUnreadCount
  } = isStaff ? staffHook : patientHook;

  const filteredConversations = useMemo(() => {
    if (role === 'Patient') {
      return rawConversations.filter(conv => STAFF_ROLES.includes(conv.role));
    } else if (isStaff) {
      if (filters.searchTerm && filters.searchTerm.trim()) {
        return rawConversations.filter(conv => conv.role === 'Patient');
      } else {
        // Show patients with existing conversations/messages
        return rawConversations.filter(cv => 
          cv.role === 'Patient' && (
            cv.lastMessage || 
            cv.unreadCount > 0 || 
            cv.lastMessageTime
          )
        );
      }
    }
    return [];
  }, [rawConversations, role, STAFF_ROLES, isStaff, filters.searchTerm]);

  // For consistency, use conversations directly from hook instead of useUnreadMessages
  const sortedConversations = useMemo(() => {
    return [...filteredConversations].sort((a, b) => {
      // First priority: unread messages
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      
      // Second priority: last message time
      if (a.lastMessageTime && b.lastMessageTime) {
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      }
      if (a.lastMessageTime && !b.lastMessageTime) return -1;
      if (!a.lastMessageTime && b.lastMessageTime) return 1;
      
      // Third priority: alphabetical by name
      return a.fullName.localeCompare(b.fullName, 'vi');
    });
  }, [filteredConversations]);

  // Handle conversation selection with pre-loading optimization
  const handleSelectConversation = async (conversation: ConversationUser) => {
    setSelectedConversation(conversation);
    setShowMobileChat(true);
    
    const loadData = async () => {
      try {
        markConversationAsRead(conversation.userId);
        await loadConversationData(conversation.userId);
      } catch (error) {
        console.error('Error loading conversation data:', error);
      }
    };
    loadData();
  };

  // Handle back from mobile chat
  const handleBackFromChat = () => {
    setShowMobileChat(false);
    setSelectedConversation(null);
  };

  // Kiểm tra quyền truy cập AFTER all hooks
  if (!role || (!STAFF_ROLES.includes(role) && role !== 'Patient')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
            <div className="mb-4">
              <svg className="h-16 w-16 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Không Có Quyền Truy Cập
            </h1>
            <p className="text-gray-600 mb-6">
              Bạn không có quyền truy cập vào trang này.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 mt-1">
                <span className="font-medium">Vai trò:</span> {role || 'Không xác định'}
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="mt-6 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Quay Lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    if (role === 'Patient') {
      return 'Tư Vấn Y Tế';
    }
    return 'Tư Vấn Bệnh Nhân';
  };

  const getPageDescription = () => {
    if (role === 'Patient') {
      return 'Chat với đội ngũ y tế để được tư vấn và hỗ trợ';
    }
    return 'Quản lý và trả lời các tin nhắn tư vấn từ bệnh nhân';
  };

  // Calculate stats
  const totalPatients = sortedConversations.length;
  const patientsWithMessages = sortedConversations.filter(conv => conv.lastMessage).length;
  const patientsWithoutMessages = totalPatients - patientsWithMessages;

   const PageContent = () => (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile: Show chat list or chat window */}
        <div className="lg:hidden">
          {!showMobileChat ? (
            <div className="h-screen flex flex-col">
              {/* Mobile Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <h1 className="text-xl font-bold text-gray-900">{getPageTitle()}</h1>
                <p className="text-sm text-gray-600 mt-1">{getPageDescription()}</p>
              </div>

              {/* Mobile Conversation List */}
              <div className="flex-1">
                <ConversationList
                  conversations={sortedConversations}
                  selectedConversation={selectedConversation}
                  onSelectConversation={handleSelectConversation}
                  filters={filters}
                  onFiltersChange={updateFilters}
                  loading={loading}
                  hasMore={hasMore}
                  onLoadMore={loadMore}
                  totalCount={totalPatients}
                  totalUnreadCount={totalUnreadCount}
                />
              </div>
            </div>
          ) : (
            <div className="h-screen">
              <ChatWindow
                conversation={selectedConversation}
                onBack={handleBackFromChat}
              />
            </div>
          )}
        </div>

        {/* Desktop: Show both panels */}
        <div className="hidden lg:block">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {getPageTitle()}
                </h1>
                <p className="text-gray-600">
                  {getPageDescription()}
                </p>
                {/* Stats */}
                <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {role === 'Patient' ? 'Nhân viên y tế' : 'Bệnh nhân'}: <span className="font-medium text-gray-900">{totalPatients}</span>
                  </span>
                  {role !== 'Patient' && totalPatients > 0 && (
                    <>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Đã nhắn tin: <span className="font-medium text-gray-900">{patientsWithMessages}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        Chưa nhắn tin: <span className="font-medium text-gray-900">{patientsWithoutMessages}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Chat Container */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex h-[calc(100vh-320px)]">
                  {/* Conversation List */}
                  <div className="w-80 border-r border-gray-200">
                    <ConversationList
                      conversations={sortedConversations}
                      selectedConversation={selectedConversation}
                      onSelectConversation={handleSelectConversation}
                      filters={filters}
                      onFiltersChange={updateFilters}
                      loading={loading}
                      hasMore={hasMore}
                      onLoadMore={loadMore}
                      totalCount={totalPatients}
                      totalUnreadCount={totalUnreadCount}
                    />
                  </div>

                  {/* Chat Window */}
                  <div className="flex-1">
                    <ChatWindow conversation={selectedConversation} />
                  </div>
                </div>
              </div>

              {/* Additional Info/Help Section */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Thông tin
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        {role === 'Patient' ? (
                          <>
                            <li>Hiển thị tất cả nhân viên y tế để tư vấn</li>
                            <li>Sử dụng tìm kiếm để lọc nhân viên</li>
                            <li>Tin nhắn mới sẽ có dấu đỏ thông báo</li>
                            <li>Nhấn Enter để gửi tin nhắn nhanh</li>
                          </>
                        ) : (
                          <>
                            <li>Hiển thị bệnh nhân trong hệ thống</li>
                            <li>Bệnh nhân có tin nhắn mới hiển thị ở đầu</li>
                            <li>Sử dụng tìm kiếm để lọc bệnh nhân</li>
                            <li>Click vào bệnh nhân để bắt đầu tư vấn</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
  if (role === 'Patient') {
    return (
      <PatientLayout userInfo={userInfo}>
        <PageContent />
      </PatientLayout>
    );
  } else {
    return (
      <StaffLayout userInfo={userInfo}>
        <PageContent />
      </StaffLayout>
    );
  }
};

export default PatientConsultationPage;