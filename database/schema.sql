-- SNS Marketing Pro 데이터베이스 스키마
-- Neon PostgreSQL용

-- 사용자 테이블
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    points INTEGER DEFAULT 0,
    membership_level VARCHAR(20) DEFAULT 'basic', -- basic, premium, vip
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 주문 테이블
CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY, -- 토스페이먼츠 주문ID
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL,
    service_name VARCHAR(200) NOT NULL,
    target_url TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    original_price INTEGER NOT NULL,
    discount_amount INTEGER DEFAULT 0,
    total_price INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed, refunded
    payment_key VARCHAR(100),
    payment_method VARCHAR(50),
    progress INTEGER DEFAULT 0, -- 0-100%
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 결제 내역 테이블
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES orders(id),
    payment_key VARCHAR(100) UNIQUE NOT NULL,
    method VARCHAR(50) NOT NULL, -- card, transfer, etc
    amount INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL, -- success, failed, cancelled
    approved_at TIMESTAMP,
    receipt_url TEXT,
    failure_code VARCHAR(50),
    failure_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 포인트 내역 테이블
CREATE TABLE point_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- 양수: 적립, 음수: 사용
    type VARCHAR(20) NOT NULL, -- earn, use, refund, bonus
    description TEXT,
    order_id VARCHAR(50) REFERENCES orders(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 고객 상담 테이블
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- payment, service, technical, general
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    status VARCHAR(20) DEFAULT 'open', -- open, in_progress, resolved, closed
    assigned_to VARCHAR(100),
    kakao_chat_id VARCHAR(100), -- 카카오톡 채팅방 ID
    telegram_chat_id VARCHAR(100), -- 텔레그램 채팅 ID
    last_response_at TIMESTAMP,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 상담 메시지 테이블
CREATE TABLE support_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- customer, agent, system
    sender_name VARCHAR(100),
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, file, system
    file_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 서비스 실행 로그 테이블
CREATE TABLE service_logs (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES orders(id),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    progress_before INTEGER,
    progress_after INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 관리자 테이블
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'support', -- admin, manager, support
    permissions JSONB,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_payments_payment_key ON payments(payment_key);
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_point_history_user_id ON point_history(user_id);

-- 기본 관리자 계정 생성 (비밀번호: admin123!)
INSERT INTO admins (username, email, password_hash, role) 
VALUES ('admin', 'admin@socialmarketingpro.com', '$2b$10$rGQJ8VgHl4aF6J8KxXgPKO5Y9JYaQzA6bE8mF9pN2vL3dP7hS1wXy', 'admin');

-- 기본 지원 카테고리 설정용 뷰
CREATE VIEW support_stats AS
SELECT 
    category,
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_resolution_hours
FROM support_tickets 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY category, status;