-- ===================================
-- SNS Marketing Pro - Neon PostgreSQL Schema
-- Version: 1.0
-- Created: 2024
-- ===================================

-- 기존 테이블 삭제 (주의: 데이터가 모두 삭제됩니다)
DROP TABLE IF EXISTS support_messages CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS service_logs CASCADE;
DROP TABLE IF EXISTS point_history CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ===================================
-- 1. 사용자 테이블
-- ===================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    membership_level VARCHAR(20) DEFAULT 'basic', -- basic, premium, vip
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 인덱스
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ===================================
-- 2. 주문 테이블
-- ===================================
CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY, -- 토스페이먼츠 주문ID 형식
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL,
    service_name VARCHAR(200) NOT NULL,
    target_url TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    original_price INTEGER NOT NULL CHECK (original_price >= 0),
    discount_amount INTEGER DEFAULT 0 CHECK (discount_amount >= 0),
    total_price INTEGER NOT NULL CHECK (total_price >= 0),
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed, refunded
    payment_key VARCHAR(100),
    payment_method VARCHAR(50),
    provider_name VARCHAR(50) DEFAULT 'smmturk', -- smmturk, manual, etc
    provider_order_id VARCHAR(100), -- SMMTurk 주문 ID
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 주문 인덱스
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_provider_order_id ON orders(provider_order_id);

-- ===================================
-- 3. 결제 내역 테이블
-- ===================================
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
    payment_key VARCHAR(100) UNIQUE NOT NULL,
    method VARCHAR(50) NOT NULL, -- card, transfer, virtual-account, mobile
    amount INTEGER NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL, -- success, failed, cancelled, partial-refund, full-refund
    approved_at TIMESTAMP,
    receipt_url TEXT,
    failure_code VARCHAR(50),
    failure_message TEXT,
    raw_response JSONB, -- 토스페이먼츠 전체 응답 저장
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 결제 인덱스
CREATE INDEX idx_payments_payment_key ON payments(payment_key);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ===================================
-- 4. 포인트 내역 테이블
-- ===================================
CREATE TABLE point_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- 양수: 적립, 음수: 사용
    balance_after INTEGER NOT NULL, -- 거래 후 잔액
    type VARCHAR(20) NOT NULL, -- earn, use, refund, bonus, admin
    description TEXT,
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 포인트 인덱스
CREATE INDEX idx_point_history_user_id ON point_history(user_id);
CREATE INDEX idx_point_history_created_at ON point_history(created_at DESC);

-- ===================================
-- 5. 고객 상담 테이블
-- ===================================
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- payment, service, technical, general, refund
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

-- 상담 인덱스
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_ticket_number ON support_tickets(ticket_number);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- ===================================
-- 6. 상담 메시지 테이블
-- ===================================
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

-- 메시지 인덱스
CREATE INDEX idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX idx_support_messages_created_at ON support_messages(created_at);

-- ===================================
-- 7. 서비스 실행 로그 테이블
-- ===================================
CREATE TABLE service_logs (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    progress_before INTEGER,
    progress_after INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 로그 인덱스
CREATE INDEX idx_service_logs_order_id ON service_logs(order_id);
CREATE INDEX idx_service_logs_created_at ON service_logs(created_at DESC);
CREATE INDEX idx_service_logs_action ON service_logs(action);

-- ===================================
-- 8. 관리자 테이블
-- ===================================
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'support', -- super_admin, admin, manager, support
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 관리자 인덱스
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_admins_email ON admins(email);

-- ===================================
-- 함수: 업데이트 타임스탬프 자동 갱신
-- ===================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- 뷰: 주문 상세 정보
-- ===================================
CREATE VIEW order_details AS
SELECT 
    o.*,
    u.username,
    u.email,
    u.phone,
    p.method as payment_method,
    p.status as payment_status,
    p.approved_at as payment_approved_at
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN payments p ON o.payment_key = p.payment_key;

-- ===================================
-- 뷰: 일일 통계
-- ===================================
CREATE VIEW daily_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_orders,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(total_price) as total_revenue,
    AVG(total_price) as avg_order_value,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_orders
FROM orders
GROUP BY DATE(created_at);

-- ===================================
-- 초기 데이터 삽입
-- ===================================

-- 기본 관리자 계정 생성 (비밀번호: admin123!)
-- bcrypt 해시: $2b$10$rGQJ8VgHl4aF6J8KxXgPKO5Y9JYaQzA6bE8mF9pN2vL3dP7hS1wXy
INSERT INTO admins (username, email, password_hash, role) 
VALUES ('admin', 'admin@socialmarketingpro.com', '$2b$10$rGQJ8VgHl4aF6J8KxXgPKO5Y9JYaQzA6bE8mF9pN2vL3dP7hS1wXy', 'super_admin')
ON CONFLICT (username) DO NOTHING;

-- 데모 사용자 계정 생성 (비밀번호: demo123)
-- bcrypt 해시: $2b$10$YNDVdXcHxJZNMr.vQWKHLuNwZHYFv7DqVBz4BNmq7K9VXoU2G6Lla
INSERT INTO users (username, email, password_hash, phone, points, membership_level) 
VALUES ('demo', 'demo@example.com', '$2b$10$YNDVdXcHxJZNMr.vQWKHLuNwZHYFv7DqVBz4BNmq7K9VXoU2G6Lla', '01012345678', 10000, 'premium')
ON CONFLICT (username) DO NOTHING;

-- ===================================
-- 권한 설정 (필요시)
-- ===================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- ===================================
-- 완료 메시지
-- ===================================
DO $$
BEGIN
    RAISE NOTICE '✅ SNS Marketing Pro 데이터베이스 스키마가 성공적으로 생성되었습니다!';
    RAISE NOTICE '📌 기본 관리자 - ID: admin / PW: admin123!';
    RAISE NOTICE '📌 데모 사용자 - ID: demo / PW: demo123';
    RAISE NOTICE '🚀 이제 서비스를 시작할 수 있습니다!';
END $$;