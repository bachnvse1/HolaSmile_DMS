import React from 'react';

export const SimpleOrthodonticList: React.FC = () => {
  console.log('SimpleOrthodonticList rendering...');

  return (
    <div>
      <h1>Danh Sách Kế Hoạch Điều Trị (Simple Test)</h1>
      
      <div>
        <h2>Mock Data Test</h2>
        
        <div>
          <div>
            <h3>Kế Hoạch Niềng Răng Cơ Bản</h3>
            <p>Template: Chỉnh Nha Cơ Bản</p>
            <p>35,000,000 VND</p>
          </div>
          
          <div>
            <h3>Điều Trị Niềng Răng Trong Suốt</h3>
            <p>Template: Niềng Răng Trong Suốt</p>
            <p>85,000,000 VND</p>
          </div>
          
          <div>
            <h3>Chỉnh Hình Răng Phức Tạp</h3>
            <p>Template: Chỉnh Nha Phức Tạp</p>
            <p>120,000,000 VND</p>
          </div>
        </div>
        
        <div>
          <button>Tạo Kế Hoạch Mới</button>
        </div>
      </div>
    </div>
  );
};