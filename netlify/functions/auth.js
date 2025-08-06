const { neon } = require('@netlify/neon');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const sql = neon(process.env.NETLIFY_DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const { action } = JSON.parse(event.body || '{}');

        switch (action) {
            case 'register':
                return await handleRegister(event, headers);
            case 'login':
                return await handleLogin(event, headers);
            case 'verify':
                return await handleVerifyToken(event, headers);
            case 'update-profile':
                return await handleUpdateProfile(event, headers);
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid action' })
                };
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', details: error.message })
        };
    }
};

async function handleRegister(event, headers) {
    const { username, email, password, phone } = JSON.parse(event.body);
    
    // 기존 사용자 확인
    const existingUser = await sql`
        SELECT id FROM users WHERE username = ${username} OR email = ${email}
    `;
    
    if (existingUser.length > 0) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: '이미 존재하는 사용자명 또는 이메일입니다.' })
        };
    }
    
    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 사용자 생성
    const result = await sql`
        INSERT INTO users (username, email, password_hash, phone)
        VALUES (${username}, ${email}, ${hashedPassword}, ${phone})
        RETURNING id, username, email, points, membership_level, created_at
    `;
    
    const user = result[0];
    
    // JWT 토큰 생성
    const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
    
    return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
            success: true,
            user,
            token
        })
    };
}

async function handleLogin(event, headers) {
    const { username, password } = JSON.parse(event.body);
    
    // 사용자 찾기
    const users = await sql`
        SELECT id, username, email, password_hash, points, membership_level, is_active
        FROM users 
        WHERE username = ${username} OR email = ${username}
    `;
    
    if (users.length === 0) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: '사용자를 찾을 수 없습니다.' })
        };
    }
    
    const user = users[0];
    
    if (!user.is_active) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: '비활성화된 계정입니다.' })
        };
    }
    
    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: '잘못된 비밀번호입니다.' })
        };
    }
    
    // 마지막 로그인 시간 업데이트
    await sql`
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP 
        WHERE id = ${user.id}
    `;
    
    // JWT 토큰 생성
    const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
    
    // 비밀번호 제거
    delete user.password_hash;
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            user,
            token
        })
    };
}

async function handleVerifyToken(event, headers) {
    const authHeader = event.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: '토큰이 없습니다.' })
        };
    }
    
    const token = authHeader.substring(7);
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 사용자 정보 가져오기
        const users = await sql`
            SELECT id, username, email, points, membership_level, is_active
            FROM users 
            WHERE id = ${decoded.userId}
        `;
        
        if (users.length === 0 || !users[0].is_active) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: '유효하지 않은 사용자입니다.' })
            };
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                user: users[0]
            })
        };
    } catch (error) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: '유효하지 않은 토큰입니다.' })
        };
    }
}