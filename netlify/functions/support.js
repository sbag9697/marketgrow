const { neon } = require('@netlify/neon');
const jwt = require('jsonwebtoken');

const sql = neon(process.env.NETLIFY_DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// 카카오톡 비즈니스 API 설정
const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
const KAKAO_SENDER_KEY = process.env.KAKAO_SENDER_KEY;

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
            case 'create-ticket':
                return await handleCreateTicket(event, headers);
            case 'get-tickets':
                return await handleGetTickets(event, headers);
            case 'send-message':
                return await handleSendMessage(event, headers);
            case 'connect-kakao':
                return await handleConnectKakao(event, headers);
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

async function handleCreateTicket(event, headers) {
    const user = await authenticateUser(event.headers.authorization);
    if (!user) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: '인증이 필요합니다.' })
        };
    }

    const { title, content, category } = JSON.parse(event.body);
    
    // 티켓 번호 생성 (예: SP240101001)
    const ticketNumber = await generateTicketNumber();
    
    try {
        // 상담 티켓 생성
        const result = await sql`
            INSERT INTO support_tickets (
                user_id, ticket_number, title, content, category, status
            )
            VALUES (
                ${user.id}, ${ticketNumber}, ${title}, ${content}, ${category}, 'open'
            )
            RETURNING *
        `;
        
        const ticket = result[0];
        
        // 초기 메시지 생성
        await sql`
            INSERT INTO support_messages (
                ticket_id, sender_type, sender_name, message, message_type
            )
            VALUES (
                ${ticket.id}, 'customer', ${user.username}, ${content}, 'text'
            )
        `;
        
        // 카카오톡 알림 전송 (관리자에게)
        await sendKakaoNotification({
            templateCode: 'new_ticket',
            recipient: process.env.ADMIN_PHONE,
            variables: {
                ticket_number: ticketNumber,
                customer: user.username,
                category: category,
                title: title
            }
        });
        
        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                success: true,
                ticket,
                message: '상담 요청이 접수되었습니다. 곧 담당자가 연락드리겠습니다.'
            })
        };
    } catch (error) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: '티켓 생성에 실패했습니다.', details: error.message })
        };
    }
}

async function handleConnectKakao(event, headers) {
    const user = await authenticateUser(event.headers.authorization);
    if (!user) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: '인증이 필요합니다.' })
        };
    }

    const { ticketId, phoneNumber } = JSON.parse(event.body);
    
    try {
        // 카카오톡 상담방 생성 요청
        const kakaoResponse = await createKakaoChat({
            customerPhone: phoneNumber,
            customerName: user.username,
            ticketNumber: ticketId
        });
        
        if (kakaoResponse.success) {
            // 티켓에 카카오톡 채팅방 ID 저장
            await sql`
                UPDATE support_tickets 
                SET kakao_chat_id = ${kakaoResponse.chatId}
                WHERE id = ${ticketId} AND user_id = ${user.id}
            `;
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    kakaoUrl: kakaoResponse.chatUrl,
                    message: '카카오톡 상담방이 생성되었습니다.'
                })
            };
        } else {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: '카카오톡 연결에 실패했습니다.' })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: '카카오톡 연결 중 오류가 발생했습니다.' })
        };
    }
}

async function generateTicketNumber() {
    const today = new Date();
    const dateStr = today.getFullYear().toString().slice(-2) + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    
    // 오늘 생성된 티켓 수 조회
    const result = await sql`
        SELECT COUNT(*) as count 
        FROM support_tickets 
        WHERE DATE(created_at) = CURRENT_DATE
    `;
    
    const count = parseInt(result[0].count) + 1;
    return `SP${dateStr}${count.toString().padStart(3, '0')}`;
}

async function sendKakaoNotification({ templateCode, recipient, variables }) {
    // 카카오톡 알림톡 API 호출
    try {
        const response = await fetch('https://alimtalk-api.bizmsg.kr/v2/sender/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${KAKAO_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                senderKey: KAKAO_SENDER_KEY,
                templateCode: templateCode,
                recipientList: [{
                    recipientNo: recipient,
                    templateParameter: variables
                }]
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Kakao notification failed:', error);
        return { success: false };
    }
}

async function createKakaoChat({ customerPhone, customerName, ticketNumber }) {
    // 카카오톡 상담톡 API 호출
    try {
        const response = await fetch('https://business-api.kakao.com/v1/counseltalk/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${KAKAO_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                counselorId: process.env.KAKAO_COUNSELOR_ID,
                customerPhone: customerPhone,
                customerName: customerName,
                metadata: {
                    ticketNumber: ticketNumber,
                    source: 'sns-marketing-pro'
                }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            return {
                success: true,
                chatId: result.chatId,
                chatUrl: result.chatUrl
            };
        }
        
        return { success: false };
    } catch (error) {
        console.error('Kakao chat creation failed:', error);
        return { success: false };
    }
}

async function authenticateUser(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    const token = authHeader.substring(7);
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const users = await sql`
            SELECT id, username, email, points, membership_level
            FROM users 
            WHERE id = ${decoded.userId} AND is_active = true
        `;
        
        return users[0] || null;
    } catch (error) {
        return null;
    }
}