import { APIGatewayProxyHandler } from 'aws-lambda'
import fetch from 'node-fetch'

const OPENAI_KEY = process.env.OPENAI_API_KEY

export const handler: APIGatewayProxyHandler = async (event) => {
  try{
    const body = event.body ? JSON.parse(event.body) : {}
    const messages = Array.isArray(body.messages) ? body.messages : []

    const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 250, temperature: 0.8 })
    })

    if(!openaiResp.ok){
      const errText = await openaiResp.text()
      return { statusCode: 502, headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify({ error: 'Bad gateway', details: errText }) }
    }

    const data = await openaiResp.json()
    const reply = data?.choices?.[0]?.message?.content ?? 'Arrr, I have no reply.'

    return { statusCode: 200, headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify({ reply }) }
  }catch(err){
    console.error(err)
    return { statusCode: 500, headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify({ error: 'server error' }) }
  }
}
