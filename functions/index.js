const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();

// ===== SETUP API KEY =====
// Chạy lệnh này trong terminal để lưu API key:
// firebase functions:config:set perplexity.key="YOUR_ACTUAL_API_KEY"
//
// Kiểm tra config: firebase functions:config:get

// ===== CLOUD FUNCTION: Chat với AI qua Perplexity =====
exports.chatWithAI = functions
  .runWith({
    timeoutSeconds: 60,
    memory: "256MB",
  })
  .https.onRequest((req, res) => {
    return cors(req, res, async () => {
      // Chỉ cho phép POST request
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      try {
        const { message, history } = req.body;

        // Validate input
        if (!message || typeof message !== "string") {
          return res.status(400).json({ error: "Message is required" });
        }

        // Lấy API key từ Firebase Functions Config (BẢO MẬT)
        const apiKey = functions.config().perplexity?.key;

        if (!apiKey) {
          console.error("❌ Perplexity API key not configured!");
          console.error(
            '   Run: firebase functions:config:set perplexity.key="YOUR_KEY"'
          );
          return res.status(500).json({
            error: "API key not configured",
            fallback: true,
          });
        }

        console.log(`📨 Received message: "${message.substring(0, 50)}..."`);

        // Gọi Perplexity API
        const fetch = (await import("node-fetch")).default;
        const response = await fetch(
          "https://api.perplexity.ai/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "sonar",
              messages: [
                {
                  role: "system",
                  content:
                    "Bạn là trợ lý AI hỗ trợ cảm xúc. Trả lời ngắn gọn (2-4 câu), thiết thực, ấm áp bằng tiếng Việt. Không dài dòng.",
                },
                ...(history || []).slice(-4), // Lấy 4 tin nhắn gần nhất
                {
                  role: "user",
                  content: message,
                },
              ],
              max_tokens: 200,
              temperature: 0.7,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Perplexity API Error:", errorText);
          return res.status(response.status).json({
            error: "AI API call failed",
            details: errorText,
            fallback: true,
          });
        }

        const result = await response.json();
        const aiResponse =
          result.choices?.[0]?.message?.content ||
          "Xin lỗi, tôi không nhận được phản hồi.";

        console.log(`✅ AI Response: "${aiResponse.substring(0, 50)}..."`);

        return res.status(200).json({
          success: true,
          response: aiResponse,
        });
      } catch (error) {
        console.error("❌ Error in chatWithAI:", error);
        return res.status(500).json({
          success: false,
          error: error.message,
          fallback: true,
        });
      }
    });
  });

// ===== LEGACY FUNCTION (giữ lại để tương thích) =====
exports.getAIChatResponse = functions.https.onCall(async (data, context) => {
  try {
    const { message, conversationHistory } = data;

    if (!message) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Message is required"
      );
    }

    const apiKey = functions.config().perplexity?.key;

    if (!apiKey) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "API key not configured"
      );
    }

    const fetch = (await import("node-fetch")).default;
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content:
              "Bạn là trợ lý AI hỗ trợ cảm xúc. Trả lời ngắn gọn (2-4 câu), thiết thực, ấm áp bằng tiếng Việt. Không dài dòng.",
          },
          ...(conversationHistory || []).slice(-4),
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API Error:", errorText);
      throw new functions.https.HttpsError("internal", "AI API call failed");
    }

    const result = await response.json();
    const aiResponse =
      result.choices?.[0]?.message?.content ||
      "Xin lỗi, tôi không nhận được phản hồi.";

    return {
      success: true,
      response: aiResponse,
    };
  } catch (error) {
    console.error("Error in getAIChatResponse:", error);
    return {
      success: false,
      error: error.message,
      fallback: true,
    };
  }
});
