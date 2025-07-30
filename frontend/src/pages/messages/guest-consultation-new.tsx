import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { GuestConversationList } from '@/components/chat/GuestConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useGuestConversations } from '@/hooks/useGuestConversations';
import type { GuestConversation } from '@/hooks/useGuestConversations';
import type { ConversationUser } from '@/hooks/useChatConversations';
import { StaffLayout } from '@/layouts/staff';
import { useUserInfo } from '@/hooks/useUserInfo';
const GuestConsultationPage: React.FC = () => {
  const { userId, role } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<GuestConversation | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const userInfo = useUserInfo();
  const {
    conversations,
    loading,
    markAsRead,
    loadConversationData,
    totalCount,
    refreshGuests
  } = useGuestConversations();

  // Convert GuestConversation to ConversationUser for ChatWindow
  const selectedUser: ConversationUser | null = selectedConversation ? {
    userId: selectedConversation.guestId,
    fullName: selectedConversation.name,
    phone: selectedConversation.phoneNumber || '',
    role: 'Guest',
    avatarUrl: undefined,
    lastMessage: selectedConversation.lastMessage,
    lastMessageTime: selectedConversation.lastMessageAt,
    unreadCount: selectedConversation.unreadCount
  } : null;

  // Danh sách user ID được phép truy cập
  const ALLOWED_USER_IDS = ["3"]; // Có thể thêm nhiều ID khác

  // Handle conversation selection
  const handleSelectConversation = async (conversation: GuestConversation) => {
    setSelectedConversation(conversation);
    setShowMobileChat(true);
    markAsRead(conversation.guestId);
    await loadConversationData(conversation.guestId);
  };

  // Handle back from mobile chat
  const handleBackFromChat = () => {
    setShowMobileChat(false);
    setSelectedConversation(null);
  };

  // Kiểm tra quyền truy cập
  if (!userId || !ALLOWED_USER_IDS.includes(userId)) {
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
              Bạn không có quyền truy cập vào trang tư vấn khách hàng này.
              Chỉ những người dùng được ủy quyền mới có thể sử dụng tính năng này.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 mt-1">
                <span className="font-medium">Vai trò:</span> {role || 'Không xác định'}
              </p>
              <p className="text-sm text-red-700 mt-1">
                <span className="font-medium">User ID:</span> {userId || 'Không xác định'}
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

  return (
    <StaffLayout userInfo={userInfo}>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile: Show chat list or chat window */}
        <div className="lg:hidden">
          {!showMobileChat ? (
            <div className="h-screen flex flex-col">
              {/* Mobile Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <h1 className="text-xl font-bold text-gray-900">Tư Vấn Khách Hàng</h1>
                <p className="text-sm text-gray-600 mt-1">Quản lý và trả lời các tin nhắn tư vấn từ khách hàng</p>
              </div>

              {/* Mobile Conversation List */}
              <div className="flex-1">
                <GuestConversationList
                  conversations={conversations}
                  selectedConversation={selectedConversation}
                  onSelectConversation={handleSelectConversation}
                  loading={loading}
                  totalCount={totalCount}
                  onRefresh={refreshGuests}
                />
              </div>
            </div>
          ) : (
            <div className="h-screen">
              <ChatWindow
                conversation={selectedUser}
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
                  Tư Vấn Khách Hàng
                </h1>
                <p className="text-gray-600">
                  Quản lý và trả lời các tin nhắn tư vấn từ khách hàng
                </p>
                {/* <div className="mt-2 text-sm text-green-600">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100">
                  ✓ Được ủy quyền - User ID: {userId}
                </span>
              </div> */}
              </div>

              {/* Chat Container */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex h-[calc(100vh-240px)]">
                  {/* Guest Conversation List */}
                  <div className="w-80 border-r border-gray-200">
                    <GuestConversationList
                      conversations={conversations}
                      selectedConversation={selectedConversation}
                      onSelectConversation={handleSelectConversation}
                      loading={loading}
                      totalCount={totalCount}
                      onRefresh={refreshGuests}
                    />
                  </div>

                  {/* Chat Window */}
                  <div className="flex-1">
                    <ChatWindow conversation={selectedUser} />
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
                      Hướng dẫn sử dụng
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Khách hàng sẽ xuất hiện trong danh sách bên trái khi họ gửi tin nhắn</li>
                        <li>Nhấp vào tên khách hàng để xem lịch sử chat và trả lời</li>
                        <li>Tin nhắn sẽ được cập nhật theo thời gian thực</li>
                        <li>Sử dụng phím Enter để gửi tin nhắn nhanh</li>
                        <li>Khách có tin nhắn mới sẽ hiển thị ở đầu danh sách</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
};

export default GuestConsultationPage;