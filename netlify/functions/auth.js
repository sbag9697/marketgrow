/**
 * 인증 API (MongoDB 버전)
 * 회원가입, 로그인, 토큰 검증, 프로필 업데이트
 */

const { getDb } = require('./_lib/mongo');
const { generateUserToken } = require('./_lib/auth');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

exports.handler = async (event, context) => {
    // CORS 설정 - 프로덕션에서는 marketgrow.kr만 허용
    const origin = event.headers.origin || event.headers.Origin || '';
    const allowedOrigins = ['https://marketgrow.kr', 'https://www.marketgrow.kr', 'http://localhost:3000'];
    const corsOrigin = allowedOrigins.includes(origin) ? origin : 'https://marketgrow.kr';
    
    const headers = {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        
        // 레거시 경로 지원 - /auth/login으로 오는 요청 처리
        let action = body.action;
        if (!action && event.path) {
            if (event.path.includes('/login')) action = 'login';
            else if (event.path.includes('/register')) action = 'register';
            else if (event.path.includes('/verify')) action = 'verify';
        }
        
        // 로그인 데이터 정규화 (login 필드를 username으로 변환)
        if (body.login && !body.username) {
            body.username = body.login;
        }

        switch (action) {
            case 'register':
                return await handleRegister(event, headers, body);
            case 'login':
                return await handleLogin(event, headers, body);
            case 'verify':
                return await handleVerifyToken(event, headers);
            case 'update-profile':
                return await handleUpdateProfile(event, headers);
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false,
                        error: 'Invalid action' 
                    })
                };
        }
    } catch (error) {
        console.error('Auth API error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: 'Internal server error', 
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};

async function handleRegister(event, headers, bodyData = null) {
    const { username, email, password, phone, name } = bodyData || JSON.parse(event.body);

    try {
        const db = await getDb();
        
        // 필수 필드 검증
        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false,
                    error: '이메일과 비밀번호는 필수입니다.' 
                })
            };
        }

        // 기존 사용자 확인
        const existingUser = await db.collection('users').findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username ? username.toLowerCase() : null }
            ]
        });

        if (existingUser) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false,
                    error: '이미 존재하는 사용자명 또는 이메일입니다.' 
                })
            };
        }

        // 비밀번호 해시화
        const hashedPassword = await bcrypt.hash(password, 10);

        // 사용자 문서 생성
        const now = new Date();
        const userDoc = {
            _id: new ObjectId(),
            email: email.toLowerCase(),
            username: username ? username.toLowerCase() : email.split('@')[0],
            password: hashedPassword,
            name: name || username || email.split('@')[0],
            phone: phone || null,
            role: 'user',
            membershipLevel: 'bronze',
            points: 0,
            depositBalance: 0,
            isActive: true,
            isEmailVerified: false,
            isPhoneVerified: false,
            createdAt: now,
            updatedAt: now
        };

        // 사용자 저장
        await db.collection('users').insertOne(userDoc);

        // 비밀번호 제거한 사용자 정보
        const { password: _, ...userWithoutPassword } = userDoc;

        // JWT 토큰 생성
        const token = jwt.sign(
            { 
                userId: userDoc._id.toString(), 
                email: userDoc.email,
                role: userDoc.role 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                success: true,
                user: userWithoutPassword,
                token
            })
        };

    } catch (error) {
        console.error('Register error:', error);
        
        // MongoDB 중복 키 에러 처리
        if (error.code === 11000) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false,
                    error: '이미 존재하는 사용자명 또는 이메일입니다.' 
                })
            };
        }
        
        throw error;
    }
}

async function handleLogin(event, headers, bodyData = null) {
    const { username, email, password } = bodyData || JSON.parse(event.body);

    try {
        const db = await getDb();
        
        // 로그인 식별자 (username 또는 email)
        const loginId = username || email;
        if (!loginId || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false,
                    error: '사용자명/이메일과 비밀번호를 입력하세요.' 
                })
            };
        }

        // 사용자 찾기
        const user = await db.collection('users').findOne({
            $or: [
                { email: loginId.toLowerCase() },
                { username: loginId.toLowerCase() }
            ],
            isActive: { $ne: false }
        });

        if (!user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false,
                    error: '사용자를 찾을 수 없습니다.' 
                })
            };
        }

        // 비밀번호 확인
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false,
                    error: '비밀번호가 일치하지 않습니다.' 
                })
            };
        }

        // 마지막 로그인 시간 업데이트
        await db.collection('users').updateOne(
            { _id: user._id },
            { 
                $set: { 
                    lastLoginAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );

        // 비밀번호 제거한 사용자 정보
        const { password: _, ...userWithoutPassword } = user;

        // JWT 토큰 생성
        const token = jwt.sign(
            { 
                userId: user._id.toString(), 
                email: user.email,
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                user: userWithoutPassword,
                token
            })
        };

    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function handleVerifyToken(event, headers) {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: '토큰이 없습니다.' 
            })
        };
    }

    const token = authHeader.slice(7);

    try {
        // JWT 검증
        const payload = jwt.verify(token, JWT_SECRET);
        
        // 사용자 정보 조회
        const db = await getDb();
        const userId = ObjectId.isValid(payload.userId) 
            ? new ObjectId(payload.userId) 
            : payload.userId;
            
        const user = await db.collection('users').findOne(
            { 
                _id: userId,
                isActive: { $ne: false }
            },
            { 
                projection: { password: 0 } 
            }
        );

        if (!user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false,
                    error: '유효하지 않은 토큰입니다.' 
                })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                user
            })
        };

    } catch (error) {
        console.error('Token verification error:', error);
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: '토큰 검증 실패' 
            })
        };
    }
}

async function handleUpdateProfile(event, headers) {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: '인증이 필요합니다.' 
            })
        };
    }

    const token = authHeader.slice(7);
    const { phone, name, currentPassword, newPassword } = JSON.parse(event.body);

    try {
        // JWT 검증
        const payload = jwt.verify(token, JWT_SECRET);
        const db = await getDb();
        
        const userId = ObjectId.isValid(payload.userId) 
            ? new ObjectId(payload.userId) 
            : payload.userId;

        // 현재 사용자 정보 조회
        const user = await db.collection('users').findOne({ _id: userId });
        
        if (!user) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ 
                    success: false,
                    error: '사용자를 찾을 수 없습니다.' 
                })
            };
        }

        // 업데이트 데이터 준비
        const updateData = {
            updatedAt: new Date()
        };

        if (phone !== undefined) updateData.phone = phone;
        if (name !== undefined) updateData.name = name;

        // 비밀번호 변경 요청인 경우
        if (newPassword) {
            if (!currentPassword) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false,
                        error: '현재 비밀번호를 입력하세요.' 
                    })
                };
            }

            // 현재 비밀번호 확인
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ 
                        success: false,
                        error: '현재 비밀번호가 일치하지 않습니다.' 
                    })
                };
            }

            // 새 비밀번호 해시화
            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        // 프로필 업데이트
        await db.collection('users').updateOne(
            { _id: userId },
            { $set: updateData }
        );

        // 업데이트된 사용자 정보 조회
        const updatedUser = await db.collection('users').findOne(
            { _id: userId },
            { projection: { password: 0 } }
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                user: updatedUser
            })
        };

    } catch (error) {
        console.error('Update profile error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false,
                    error: '유효하지 않은 토큰입니다.' 
                })
            };
        }
        
        throw error;
    }
}