export async function sendToServer(messages: { role: string; content: string }[]) {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    })

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (err) {
    console.error('Error calling API:', err)
    throw err
  }
}
