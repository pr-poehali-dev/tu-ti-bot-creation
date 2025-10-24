import json
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: TuTiBot AI chat endpoint - processes user messages and images
    Args: event with httpMethod, body {message: str, image?: str}
    Returns: HTTP response with bot reply
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    user_message: str = body_data.get('message', '')
    has_image: bool = 'image' in body_data
    
    openai_key = os.environ.get('OPENAI_API_KEY', '')
    
    if not openai_key:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'reply': 'Добавь OPENAI_API_KEY в секреты проекта для работы AI',
                'timestamp': context.request_id
            })
        }
    
    try:
        import openai
        client = openai.OpenAI(api_key=openai_key)
        
        messages = []
        
        if has_image:
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": user_message or "Что на этом изображении?"},
                    {"type": "image_url", "image_url": {"url": body_data['image']}}
                ]
            })
        else:
            messages.append({
                "role": "user", 
                "content": user_message
            })
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Ты TuTiBot - полезный AI-помощник. Давай чёткие, краткие и понятные ответы на русском языке."},
                *messages
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        bot_reply = response.choices[0].message.content
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'reply': bot_reply,
                'timestamp': context.request_id
            })
        }
    
    except Exception as e:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'reply': f'Ошибка AI: {str(e)}. Проверь OPENAI_API_KEY.',
                'timestamp': context.request_id
            })
        }
