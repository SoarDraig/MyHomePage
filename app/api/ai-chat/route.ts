export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const apiKey = req.headers.get("x-api-key")
    const baseURL = req.headers.get("x-api-url") || "https://api.openai.com/v1"
    const modelName = req.headers.get("x-model") || "gpt-4o-mini"

    if (!apiKey) {
      return new Response("API Key is required", { status: 400 })
    }

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        stream: true,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] OpenAI API Error:", error)
      return new Response(JSON.stringify({ error: "API request failed" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    // 返回流式响应
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[v0] AI Chat Error:", error)
    return new Response(JSON.stringify({ error: "AI request failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
