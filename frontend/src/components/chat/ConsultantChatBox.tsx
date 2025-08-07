import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useChatHubGuest } from "@/hooks/chat/useChatHubGuest";
import { MessageCircle, X, Send, User, Headphones, Image, Video, Paperclip } from "lucide-react";
import axiosInstance from '@/lib/axios';

const CONSULTANT = { id: "3", name: "Nhân viên tư vấn" };

type ChatMessage = {
  messageId?: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp?: string;
  messageType?: 'text' | 'image' | 'video';
  fileName?: string;
  fileSize?: number;
};

function getOrCreateGuestId(): string {
  let id = localStorage.getItem("guestId");
  if (!id) {
    id = uuidv4();
    localStorage.setItem("guestId", id);
  }
  return id;
}

// 🔥 SỬA LẠI HÀM UPLOAD MEDIA - DÙNG GIỐNG CHATWINDOW
const uploadMedia = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axiosInstance.post('/chats/upload-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true
    });

    console.log('Upload successful:', response.data);
    return response.data.url;
  } catch (error) {
    console.error('Upload media error:', error);
    throw error;
  }
};

// Detect mobile device
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export default function ConsultantChatBox() {
  const guestId = getOrCreateGuestId();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnreadMessage, setHasUnreadMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastProcessedMessage = useRef<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { realtimeMessages, sendMessage, fetchChatHistory } =
    useChatHubGuest(guestId);

  // Khởi tạo audio cho notification
  useEffect(() => {
    audioRef.current = new Audio("/sound/inflicted-601.ogg");
    audioRef.current.volume = 0.5;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    fetchChatHistory(CONSULTANT.id).then(setHistory);
  }, [guestId, fetchChatHistory]);

  const allMessages = useMemo(() => {
    const merged = [...history, ...realtimeMessages].filter(
      (m) =>
        (m.senderId === guestId && m.receiverId === CONSULTANT.id) ||
        (m.receiverId === guestId && m.senderId === CONSULTANT.id)
    );

    const seen = new Set<string>();
    const unique = merged.filter((msg) => {
      // Ưu tiên dùng messageId nếu có
      let key = msg.messageId;

      if (!key) {
        // Nếu không có messageId, tạo key theo nội dung
        const ts = msg.timestamp
          ? Math.floor(new Date(msg.timestamp).getTime() / 1000) // Làm tròn về giây
          : "";
        key = `${msg.senderId}-${msg.receiverId}-${msg.message}-${ts}`;
      }

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.sort(
      (a, b) =>
        new Date(a.timestamp || "").getTime() -
        new Date(b.timestamp || "").getTime()
    );
  }, [history, realtimeMessages, guestId]);

  // Xử lý tin nhắn mới
  useEffect(() => {
    if (realtimeMessages.length === 0) return;

    const lastMsg = realtimeMessages[realtimeMessages.length - 1];
    const messageKey = `${lastMsg.senderId}-${lastMsg.message}-${lastMsg.timestamp}`;

    // Tránh xử lý cùng một tin nhắn nhiều lần
    if (lastProcessedMessage.current === messageKey) return;
    lastProcessedMessage.current = messageKey;

    // Nếu tin nhắn đến từ consultant và chatbox đang đóng
    if (
      lastMsg.senderId === CONSULTANT.id &&
      lastMsg.receiverId === guestId &&
      !isOpen
    ) {
      setHasUnreadMessage(true);

      // Phát âm thanh thông báo
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
          console.log("Could not play notification sound:", err);
        });
      }
    }
  }, [realtimeMessages, guestId, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // 🔥 HANDLE SEND MESSAGE - CHỈ GỬI TEXT
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    // ✅ Gọi sendMessage từ hook
    sendMessage(text);
    setInput("");
  }, [input, sendMessage]);

  // 🔥 HANDLE FILE UPLOAD - SỬ DỤNG API GIỐNG CHATWINDOW
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Kiểm tra loại file
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      alert('Chỉ hỗ trợ file ảnh và video!');
      return;
    }

    // Kiểm tra kích thước file (50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert('File không được vượt quá 50MB!');
      return;
    }

    setIsUploading(true);

    try {
      // 🔥 UPLOAD FILE LÊN SERVER TRƯỚC
      const fileUrl = await uploadMedia(file);
      
      // 🔥 SAU ĐÓ GỬI URL QUA CHAT
      sendMessage(fileUrl);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Có lỗi xảy ra khi gửi file!');
    } finally {
      setIsUploading(false);
      // Reset input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [sendMessage]);

  // 🔥 HANDLE PAPERCLIP CLICK
  const handlePaperclipClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleOpenChat = () => {
    setIsOpen(true);
    // Tắt thông báo đỏ khi mở chat
    setHasUnreadMessage(false);
  };

  const formatTime = (ts?: string) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // 🔥 RENDER MESSAGE CONTENT WITH IMAGE/VIDEO SUPPORT - GIỐNG CHATWINDOW
  const renderMessageContent = useCallback((msg: ChatMessage) => {
    // Kiểm tra nếu message là URL của ảnh/video
    const isImageUrl = /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(msg.message) || 
                      msg.message.includes('/uploads/') && /image/i.test(msg.message);
    const isVideoUrl = /\.(mp4|webm|ogg|avi|mov)(\?|$)/i.test(msg.message) || 
                      msg.message.includes('/uploads/') && /video/i.test(msg.message);
    
    if (isImageUrl) {
      return (
        <div className="space-y-2">
          <img 
            src={msg.message} 
            alt="Shared image"
            className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            style={{ maxHeight: '200px' }}
            onClick={() => window.open(msg.message, '_blank')}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'text-xs text-gray-500 p-2 bg-gray-100 rounded';
              fallback.textContent = 'Không thể tải ảnh';
              (e.target as HTMLImageElement).parentNode?.appendChild(fallback);
            }}
          />
          <div className="flex items-center gap-2 text-xs opacity-70">
            <Image className="w-3 h-3" />
            <span>Hình ảnh</span>
          </div>
        </div>
      );
    } else if (isVideoUrl) {
      return (
        <div className="space-y-2">
          <video 
            src={msg.message} 
            controls
            className="max-w-full h-auto rounded-lg"
            style={{ maxHeight: '200px' }}
            onError={(e) => {
              (e.target as HTMLVideoElement).style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'text-xs text-gray-500 p-2 bg-gray-100 rounded';
              fallback.textContent = 'Không thể tải video';
              (e.target as HTMLVideoElement).parentNode?.appendChild(fallback);
            }}
          />
          <div className="flex items-center gap-2 text-xs opacity-70">
            <Video className="w-3 h-3" />
            <span>Video</span>
          </div>
        </div>
      );
    }
    
    // Tin nhắn text thông thường
    return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>;
  }, []);

  return (
    <>
      {/* 🔥 HIDDEN FILE INPUT */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        multiple={false}
      />

      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleOpenChat}
            className={`
              group relative flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 rounded-full shadow-lg
              transition-all duration-300 hover:scale-105 hover:shadow-xl
              ${hasUnreadMessage
                ? "bg-gradient-to-r from-red-500 to-pink-500 animate-pulse"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              }
              text-white font-semibold text-sm
            `}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="hidden sm:block">Hỗ trợ trực tuyến</span>

            {hasUnreadMessage && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 ${isMobile() ? 'w-[calc(100vw-1rem)] max-w-sm' : 'w-96 max-w-[calc(100vw-2rem)]'}`}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Hỗ trợ trực tuyến</h3>
                    <div className="flex items-center gap-2 text-blue-100 text-xs">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Đang hoạt động</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className={`${isMobile() ? 'h-72' : 'h-80'} overflow-y-auto p-4 bg-gray-50 space-y-4`}>
              {allMessages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Chào mừng bạn đến với hỗ trợ trực tuyến!</p>
                  <p className="text-gray-400 text-xs mt-1">Hãy gửi tin nhắn để bắt đầu cuộc trò chuyện</p>
                </div>
              ) : (
                allMessages.map((msg, idx) => {
                  const isFromGuest = msg.senderId === guestId;
                  return (
                    <div key={idx} className={`flex ${isFromGuest ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isFromGuest 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-md' 
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                      }`}>
                        {!isFromGuest && (
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-3 h-3 text-gray-500" />
                            <span className="text-xs font-medium text-gray-600">{CONSULTANT.name}</span>
                          </div>
                        )}
                        {renderMessageContent(msg)}
                        <div className={`text-xs mt-1 ${isFromGuest ? 'text-blue-100' : 'text-gray-400'}`}>
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2 shadow-sm">
                    <div className="flex items-center gap-1">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">Đang nhập...</span>
                    </div>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="flex justify-end">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl rounded-br-md px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span className="text-sm">Đang gửi file...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex items-center gap-2">
                {/* 🔥 PAPERCLIP BUTTON */}
                <button 
                  onClick={handlePaperclipClick}
                  disabled={isUploading}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Chọn file ảnh/video"
                >
                  <Paperclip className="h-5 w-5 text-gray-600" />
                </button>

                <div className="flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập tin nhắn của bạn..."
                    className="w-full resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={1}
                    style={{height: '44px', maxHeight: '100px'}}
                    disabled={isUploading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                </div>

                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isUploading}
                  className={`
                    w-11 h-11 rounded-xl transition-all duration-200 flex items-center justify-center flex-shrink-0
                    ${input.trim() && !isUploading
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {/* 🔥 UPLOADING INDICATOR */}
              {isUploading && (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Đang tải file lên...</span>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <span className="hidden sm:block">📎 File • Enter gửi • Shift+Enter xuống dòng</span>
                <span className="sm:hidden">📎 File • Enter gửi</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Trực tuyến</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}