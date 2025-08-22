const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// PostgreSQL 연결 설정
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// 테이블 스키마 확인 및 생성
const ensureSchema = async () => {
    try {
        // users 테이블에 필요한 컬럼 추가 (이미 있으면 무시)
        const alterQueries = [
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user'`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_level VARCHAR(50) DEFAULT 'bronze'`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT false`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT false`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS deposit_balance DECIMAL(10,2) DEFAULT 0`
        ];

        for (const query of alterQueries) {
            try {
                await pool.query(query);
            } catch (err) {
                // 컬럼이 이미 있으면 무시
                if (!err.message.includes('already exists')) {
                    console.error('Schema update error:', err.message);
                }
            }
        }
        
        console.log('Database schema updated');
    } catch (error) {
        console.error('Error ensuring schema:', error);
    }
};

// 관리자 계정 생성 또는 업데이트
const createAdminUser = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@marketgrow.kr';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';
        
        // 기존 사용자 확인
        const checkQuery = 'SELECT id, email, role FROM users WHERE email = $1';
        const checkResult = await pool.query(checkQuery, [adminEmail]);
        
        if (checkResult.rows.length > 0) {
            const user = checkResult.rows[0];
            
            // 이미 관리자인 경우
            if (user.role === 'admin') {
                console.log('Admin user already exists:', adminEmail);
                return;
            }
            
            // 일반 사용자를 관리자로 승격
            const updateQuery = `
                UPDATE users 
                SET role = 'admin',
                    membership_level = 'diamond',
                    is_email_verified = true,
                    is_phone_verified = true,
                    updated_at = NOW()
                WHERE email = $1
                RETURNING id, email, role
            `;
            
            const updateResult = await pool.query(updateQuery, [adminEmail]);
            console.log('Existing user upgraded to admin:', updateResult.rows[0].email);
            
        } else {
            // 새 관리자 계정 생성
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            
            const insertQuery = `
                INSERT INTO users (
                    username, 
                    email, 
                    password, 
                    name, 
                    phone,
                    role,
                    membership_level,
                    is_email_verified,
                    is_phone_verified,
                    points,
                    deposit_balance,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
                RETURNING id, email, role
            `;
            
            const values = [
                'admin',
                adminEmail,
                hashedPassword,
                '관리자',
                '01012345678',
                'admin',
                'diamond',
                true,
                true,
                0,
                0
            ];
            
            const insertResult = await pool.query(insertQuery, values);
            console.log('Admin user created successfully:', insertResult.rows[0].email);
        }
        
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
};

// 샘플 서비스 데이터 생성
const createSampleServices = async () => {
    try {
        // services 테이블 존재 여부 확인
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'services'
            )
        `);
        
        if (!tableCheck.rows[0].exists) {
            // services 테이블 생성
            await pool.query(`
                CREATE TABLE IF NOT EXISTS services (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    name_en VARCHAR(255),
                    platform VARCHAR(50) NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    description TEXT,
                    price DECIMAL(10,2) NOT NULL,
                    min_quantity INTEGER DEFAULT 1,
                    max_quantity INTEGER DEFAULT 10000,
                    delivery_time_min INTEGER DEFAULT 1,
                    delivery_time_max INTEGER DEFAULT 24,
                    delivery_time_unit VARCHAR(20) DEFAULT 'hours',
                    is_active BOOLEAN DEFAULT true,
                    is_popular BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);
            console.log('Services table created');
        }
        
        // 기존 서비스 확인
        const serviceCount = await pool.query('SELECT COUNT(*) FROM services');
        
        if (parseInt(serviceCount.rows[0].count) > 0) {
            console.log('Services already exist');
            return;
        }
        
        // 샘플 서비스 추가
        const sampleServices = [
            ['인스타그램 팔로워', 'Instagram Followers', 'instagram', 'followers', '고품질 인스타그램 팔로워', 50000, 100, 10000, 1, 24, 'hours', true, true],
            ['인스타그램 좋아요', 'Instagram Likes', 'instagram', 'likes', '인스타그램 게시물 좋아요', 30000, 50, 50000, 1, 6, 'hours', true, false],
            ['유튜브 구독자', 'YouTube Subscribers', 'youtube', 'subscribers', '유튜브 채널 구독자', 100000, 50, 5000, 2, 7, 'days', true, true],
            ['유튜브 조회수', 'YouTube Views', 'youtube', 'views', '유튜브 동영상 조회수', 20000, 500, 100000, 1, 48, 'hours', true, false],
            ['틱톡 팔로워', 'TikTok Followers', 'tiktok', 'followers', '틱톡 계정 팔로워', 60000, 50, 10000, 1, 12, 'hours', true, true]
        ];
        
        const insertQuery = `
            INSERT INTO services (
                name, name_en, platform, category, description,
                price, min_quantity, max_quantity,
                delivery_time_min, delivery_time_max, delivery_time_unit,
                is_active, is_popular
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `;
        
        for (const service of sampleServices) {
            await pool.query(insertQuery, service);
        }
        
        console.log('Sample services created successfully');
        
    } catch (error) {
        console.error('Error creating sample services:', error);
    }
};

// 메인 seed 함수
const runAdminSeed = async () => {
    try {
        console.log('Starting PostgreSQL database seeding...');
        
        // 스키마 확인 및 업데이트
        await ensureSchema();
        
        // 관리자 계정 생성
        await createAdminUser();
        
        // 샘플 서비스 생성
        await createSampleServices();
        
        console.log('Database seeding completed');
        
    } catch (error) {
        console.error('Database seeding failed:', error);
    }
};

// 직접 실행 시
if (require.main === module) {
    runAdminSeed()
        .then(() => {
            console.log('Seed completed');
            process.exit(0);
        })
        .catch(err => {
            console.error('Seed failed:', err);
            process.exit(1);
        });
}

module.exports = {
    runAdminSeed,
    createAdminUser,
    createSampleServices
};