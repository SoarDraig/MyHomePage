export const maxDuration = 30

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const city = searchParams.get("city")
    const adcode = searchParams.get("adcode")

    // 验证参数
    if (!city && !adcode) {
      return new Response(
        JSON.stringify({
          code: "INVALID_ARGUMENT",
          message: "Either 'city' or 'adcode' parameter is required.",
          details: {}
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    // 构建请求参数
    const params = new URLSearchParams()
    if (adcode) {
      params.append("adcode", adcode)
    } else if (city) {
      params.append("city", city)
    }

    // 调用天气 API
    const response = await fetch(
      `https://uapis.cn/api/v1/misc/weather?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        // 添加缓存控制，避免频繁请求
        next: { revalidate: 600 } // 缓存10分钟
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        code: "UNKNOWN_ERROR",
        message: "Unknown error occurred"
      }))

      return new Response(
        JSON.stringify(errorData),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("[Weather API Error]:", error)
    return new Response(
      JSON.stringify({
        code: "INTERNAL_SERVER_ERROR",
        message: "An internal error occurred while fetching weather data.",
        details: {}
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}
