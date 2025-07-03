import React from 'react';

export const OrthodonticTestPage: React.FC = () => {
  console.log('OrthodonticTestPage rendering...');
  
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh' }}>
      <h1 style={{ color: 'black', fontSize: '24px', marginBottom: '20px' }}>
        Test Orthodontic Treatment Plan Management
      </h1>
      
      <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f0f8ff', border: '1px solid #ccc' }}>
        <h2 style={{ color: 'black', fontSize: '18px', marginBottom: '10px' }}>Debug Info</h2>
        <p style={{ color: 'black' }}>✓ React component loaded successfully</p>
        <p style={{ color: 'black' }}>✓ Basic styling applied</p>
        <p style={{ color: 'black' }}>✓ No external dependencies used</p>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <a 
          href="/simple-orthodontic"
          style={{
            display: 'inline-block',
            backgroundColor: '#6b7280',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '4px',
            textDecoration: 'none',
            width: 'fit-content'
          }}
        >
          🧪 Test Component Đơn Giản
        </a>
        
        <a 
          href="/patients/26/orthodontic-treatment-plans"
          style={{
            display: 'inline-block',
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '4px',
            textDecoration: 'none',
            width: 'fit-content'
          }}
        >
          � Xem Danh Sách Kế Hoạch Điều Trị
        </a>
        
        <a 
          href="/patients/26/orthodontic-treatment-plans/create"
          style={{
            display: 'inline-block',
            backgroundColor: '#16a34a',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '4px',
            textDecoration: 'none',
            width: 'fit-content'
          }}
        >
          ➕ Tạo Kế Hoạch (Form Cơ Bản)
        </a>
      </div>
      
      <div style={{ marginTop: '30px', padding: '16px', backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}>
        <h3 style={{ color: 'black', fontSize: '16px', marginBottom: '10px' }}>Troubleshooting</h3>
        <ul style={{ color: 'black', paddingLeft: '20px' }}>
          <li>Mở Console (F12) để xem có errors không</li>
          <li>Kiểm tra Network tab xem có files nào 404 không</li>
          <li>Đảm bảo TailwindCSS được load đúng</li>
          <li>Kiểm tra shadcn/ui components có được cài đặt không</li>
        </ul>
      </div>
    </div>
  );
};