// ===== AI CHATBOX HANDLER =====

class AIChatbox {
  constructor() {
    this.chatbox = document.getElementById("ai-chatbox");
    this.chatboxFab = document.getElementById("chatbox-fab");
    this.chatMessages = document.getElementById("chat-messages");
    this.chatInput = document.getElementById("chat-input");
    this.sendBtn = document.getElementById("chat-send-btn");
    this.toggleBtn = document.getElementById("chatbox-toggle");
    this.toggleIcon = this.toggleBtn.querySelector(".toggle-icon");

    // ===== CẤU HÌNH API =====
    this.apiType = "perplexity"; // Sử dụng Perplexity API

    // API Configuration - CẢNH BÁO: API key này có thể bị lộ qua Console!
    this.apiConfig = {
      perplexity: {
        url: "https://api.perplexity.ai/chat/completions",
        key: "", // ⚠️ API key trực tiếp (KHÔNG AN TOÀN)
        model: "sonar",
      },
      openai: {
        url: "https://api.openai.com/v1/chat/completions",
        key: "YOUR_OPENAI_API_KEY", // <-- Thay bằng OpenAI API key
        model: "gpt-3.5-turbo",
      },
      claude: {
        url: "https://api.anthropic.com/v1/messages",
        key: "YOUR_CLAUDE_API_KEY", // <-- Thay bằng Claude API key
        model: "claude-3-haiku-20240307",
      },
      gemini: {
        url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        key: "YOUR_GEMINI_API_KEY", // <-- Thay bằng Gemini API key
        model: "gemini-pro",
      },
      custom: {
        url: "YOUR_CUSTOM_API_URL", // <-- Thay bằng custom API URL
        key: "YOUR_API_KEY",
        model: "default",
      },
    };

    this.isMinimized = false;
    this.isWaitingForResponse = false;
    this.conversationHistory = [];

    this.init();
  }

  async init() {
    // ===== BỎ QUA FIRESTORE - DÙNG API TRỰC TIẾP =====
    this.useCloudFunction = false; // Không dùng Cloud Function
    console.log("✅ Using direct Perplexity API");
    console.log("   Model:", this.apiConfig.perplexity.model);
    console.log(
      "   API Key:",
      this.apiConfig.perplexity.key
        ? "***" + this.apiConfig.perplexity.key.slice(-8)
        : "NOT SET"
    );

    // Event listeners
    this.sendBtn.addEventListener("click", () => this.sendMessage());
    this.chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Toggle chatbox
    this.toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleChatbox();
    });

    this.chatboxFab.addEventListener("click", () => {
      this.openChatbox();
    });

    // Header click to toggle (optional)
    document.querySelector(".chatbox-header").addEventListener("click", (e) => {
      if (
        e.target === this.toggleBtn ||
        e.target.closest(".chatbox-toggle-btn")
      ) {
        return;
      }
      this.toggleChatbox();
    });
  }

  toggleChatbox() {
    this.isMinimized = !this.isMinimized;

    if (this.isMinimized) {
      this.chatbox.classList.add("minimized");
      this.chatboxFab.classList.add("show");
      this.toggleIcon.textContent = "+";
    } else {
      this.chatbox.classList.remove("minimized");
      this.chatboxFab.classList.remove("show");
      this.toggleIcon.textContent = "−";
      this.scrollToBottom();
    }
  }

  openChatbox() {
    this.isMinimized = false;
    this.chatbox.classList.remove("minimized");
    this.chatboxFab.classList.remove("show");
    this.toggleIcon.textContent = "−";
    this.scrollToBottom();
  }

  async sendMessage() {
    const message = this.chatInput.value.trim();

    if (!message || this.isWaitingForResponse) {
      return;
    }

    // ===== BỘ LỌC ĐƠN GIẢN: CHỈ CHẶN CÁC CHỦ ĐỀ RÕ RÀNG KHÔNG LIÊN QUAN =====
    const filterResult = this.filterMessage(message);

    if (filterResult.isRejected) {
      // CHỈ từ chối khi CHẮC CHẮN là toán/code/địa lý...
      this.addMessage(message, "user");
      this.chatInput.value = "";
      this.addMessage(filterResult.response, "bot");
      return;
    }

    // Tất cả các câu khác (kể cả "bùn sì trét") -> CHO QUA để AI xử lý
    this.addMessage(message, "user");
    this.chatInput.value = "";

    // Show typing indicator
    this.showTypingIndicator();
    this.isWaitingForResponse = true;

    try {
      // Call API
      const response = await this.callAIAPI(message);

      // Remove typing indicator
      this.removeTypingIndicator();

      // Add bot response
      this.addMessage(response, "bot");
    } catch (error) {
      console.error("Error calling AI API:", error);
      this.removeTypingIndicator();
      this.addMessage(
        "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau. 😔",
        "bot"
      );
    } finally {
      this.isWaitingForResponse = false;
    }
  }

  // Bộ lọc đơn giản: CHỈ chặn các chủ đề RÕ RÀNG không liên quan
  filterMessage(message) {
    const lowerMessage = message.toLowerCase();

    // CHỈ TỪ CHỐI các chủ đề RÕ RÀNG không liên quan
    const definitelyNotEmotional = [
      // Toán học RÕ RÀNG
      /\d+\s*[\+\-\*\/]\s*\d+/, // 1+1, 5*3
      /bằng mấy\?/i,
      /tính toán|giải toán|phương trình|đại số|hình học/i,

      // Lập trình RÕ RÀNG
      /\b(python|javascript|java|c\+\+|php|ruby|golang)\b/i,
      /\b(lập trình|học code|viết code|coding|programming)\b/i,
      /\b(function|variable|array|loop|class|object)\b/i,

      // Địa lý RÕ RÀNG
      /\b(thủ đô của|quốc gia nào|châu lục|đại dương)\b/i,
      /(nằm ở đâu|thuộc tỉnh|thuộc thành phố)\?/i,

      // Thời tiết RÕ RÀNG
      /\b(thời tiết hôm nay|dự báo thời tiết|trời mưa không)\b/i,

      // Tin tức / Sự kiện
      /\b(tin tức|báo chí|thời sự|chính trị|bầu cử)\b/i,

      // Lịch sử RÕ RÀNG
      /\b(năm \d{4}|thế kỷ thứ|triều đại|vua|chiến tranh thế giới)\b/i,

      // Khoa học RÕ RÀNG
      /\b(nguyên tử|phân tử|hóa học|công thức|định luật)\b/i,

      // Kiến thức phổ thông
      /\b(là gì\?|nghĩa là gì|define|definition)\b/i,
    ];

    for (let pattern of definitelyNotEmotional) {
      if (pattern.test(lowerMessage)) {
        const rejectionMessages = [
          "Xin lỗi, tôi chỉ hỗ trợ về cảm xúc và tâm lý. 😊\n\nTôi có thể giúp:\n• Buồn, lo lắng, căng thẳng\n• Quản lý stress\n• Cải thiện tâm trạng\n• Phát triển bản thân\n\nBạn muốn chia sẻ cảm xúc không?",
          "Tôi là trợ lý chuyên về sức khỏe tinh thần. 💙\n\nTôi có thể tư vấn:\n• Cảm xúc tiêu cực\n• Kỹ năng quản lý cảm xúc\n• Lời khuyên tâm lý\n\nBạn đang gặp vấn đề gì?",
        ];

        return {
          isRejected: true,
          response:
            rejectionMessages[
              Math.floor(Math.random() * rejectionMessages.length)
            ],
        };
      }
    }

    // TẤT CẢ CÁC CÂU KHÁC -> CHO QUA (kể cả "bùn sì trét", typo, câu mơ hồ...)
    // Để AI tự xử lý và phản hồi thông minh
    return {
      isRejected: false,
    };
  }

  // Kiểm tra câu hỏi có liên quan đến cảm xúc không
  isEmotionRelated(message) {
    const lowerMessage = message.toLowerCase();

    // Danh sách từ khóa liên quan đến cảm xúc/tâm lý
    const emotionKeywords = [
      // Cảm xúc tiêu cực
      "buồn",
      "sad",
      "depressed",
      "depression",
      "chán nản",
      "thất vọng",
      "tuyệt vọng",
      "khóc",
      "cry",
      "crying",
      "đau khổ",
      "tổn thương",
      "hurt",

      // Lo lắng
      "lo lắng",
      "lo âu",
      "anxiety",
      "anxious",
      "걱정",
      "sợ",
      "fear",
      "scared",
      "hoảng loạn",
      "panic",
      "bồn chồn",
      "nervous",

      // Stress
      "căng thẳng",
      "stress",
      "stressed",
      "áp lực",
      "pressure",
      "mệt mỏi",
      "exhausted",
      "tired",
      "kiệt sức",
      "overwhelmed",
      "quá tải",

      // Cô đơn
      "cô đơn",
      "lonely",
      "loneliness",
      "một mình",
      "alone",
      "cô lập",

      // Giận dữ
      "tức giận",
      "giận",
      "angry",
      "mad",
      "bực bội",
      "frustrated",
      "annoyed",

      // Tâm trạng chung
      "tâm trạng",
      "mood",
      "cảm giác",
      "feel",
      "feeling",
      "emotion",
      "cảm xúc",
      "tâm lý",
      "mental",
      "tinh thần",
      "tâm hồn",

      // Vấn đề tâm lý
      "trầm cảm",
      "trầm uất",
      "tự tử",
      "suicide",
      "không muốn sống",

      // Giấc ngủ
      "ngủ",
      "sleep",
      "mất ngủ",
      "insomnia",
      "nightmare",
      "ác mộng",

      // Động lực & tự tin
      "động lực",
      "motivation",
      "tự tin",
      "confidence",
      "tự ti",
      "insecure",
      "lười",
      "lazy",
      "procrastination",
      "trì hoãn",

      // Mối quan hệ
      "chia tay",
      "breakup",
      "mâu thuẫn",
      "conflict",
      "tranh cãi",

      // Sức khỏe tinh thần
      "sức khỏe tinh thần",
      "mental health",
      "tâm lý",
      "psychology",
      "therapy",
      "trị liệu",
      "tư vấn",
      "counseling",

      // Hỗ trợ
      "giúp",
      "help",
      "hỗ trợ",
      "support",
      "advice",
      "lời khuyên",
      "gợi ý",
      "suggestion",
      "cách",
      "how to",

      // Hỏi chào & kết nối
      "chào",
      "hello",
      "hi",
      "hey",
      "xin chào",
      "hỏi",
      "cảm ơn",
      "thanks",
      "thank",

      // Câu hỏi chung về trạng thái
      "thế nào",
      "sao",
      "tại sao",
      "why",
      "làm sao",
      "how",
      "có nên",
      "should",
      "phải không",
      "right",

      // Từ liên quan đến cải thiện
      "cải thiện",
      "improve",
      "tốt hơn",
      "better",
      "vượt qua",
      "overcome",
      "giải quyết",
      "solve",
      "xử lý",
      "handle",
      "deal with",
    ];

    // Nếu tin nhắn ngắn (<5 từ) và có từ khóa cảm xúc -> chấp nhận
    const wordCount = message.split(/\s+/).length;
    if (wordCount <= 5) {
      return emotionKeywords.some((keyword) => lowerMessage.includes(keyword));
    }

    // Tin nhắn dài hơn: cần ít nhất 1 từ khóa hoặc câu hỏi về cảm xúc
    const hasEmotionKeyword = emotionKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );
    const isQuestion =
      message.includes("?") ||
      lowerMessage.startsWith("làm sao") ||
      lowerMessage.startsWith("tại sao") ||
      lowerMessage.startsWith("có nên") ||
      lowerMessage.includes("thế nào") ||
      lowerMessage.includes("như thế nào");

    return hasEmotionKeyword || (isQuestion && wordCount <= 15);
  }

  async callAIAPI(message) {
    console.log(
      "📋 History BEFORE API call:",
      JSON.stringify(
        this.conversationHistory.map((m) => m.role),
        null,
        2
      )
    );

    try {
      // ===== LUÔN LUÔN GỌI API TRỰC TIẾP =====
      console.log("🔄 Calling Perplexity API directly...");
      return await this.callDirectAPI(message);
    } catch (error) {
      console.error("Error calling AI API:", error);
      return this.getFallbackResponse(message);
    }
  }

  // ===== GỌI CLOUD FUNCTION (BẢO MẬT) =====
  async callCloudFunction(message) {
    try {
      const response = await fetch(this.cloudFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          history: this.conversationHistory.slice(-4), // 4 tin nhắn gần nhất
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Cloud Function error:", errorData);
        throw new Error(`Cloud Function failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.response || this.getFallbackResponse(message);

      // ===== THÊM VÀO HISTORY SAU KHI THÀNH CÔNG =====
      this.conversationHistory.push({
        role: "user",
        content: message,
      });

      this.conversationHistory.push({
        role: "assistant",
        content: aiResponse,
      });

      console.log(
        "✅ History AFTER Cloud Function:",
        JSON.stringify(
          this.conversationHistory.map((m) => m.role),
          null,
          2
        )
      );

      return aiResponse;
    } catch (error) {
      console.error("Error calling Cloud Function:", error);

      // ===== FIX: THÊM CẢ USER MESSAGE VÀ FALLBACK RESPONSE VÀO HISTORY =====
      const fallbackResponse = this.getFallbackResponse(message);

      this.conversationHistory.push({
        role: "user",
        content: message,
      });

      this.conversationHistory.push({
        role: "assistant",
        content: fallbackResponse,
      });

      console.log(
        "⚠️ History AFTER fallback (Cloud Function error):",
        JSON.stringify(
          this.conversationHistory.map((m) => m.role),
          null,
          2
        )
      );

      return fallbackResponse;
    }
  }

  // ===== GỌI API TRỰC TIẾP (LEGACY - KHÔNG BẢO MẬT) =====
  async callDirectAPI(message) {
    try {
      const config = this.apiConfig[this.apiType];

      if (!config || !config.url || !config.key) {
        console.warn("API not configured properly, using fallback responses");
        return this.getFallbackResponse(message);
      }

      let requestBody, headers;

      // Build request based on API type
      switch (this.apiType) {
        case "perplexity":
          headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.key}`,
          };
          requestBody = {
            model: config.model,
            messages: [
              {
                role: "system",
                content: `Bạn là trợ lý AI hỗ trợ cảm xúc. Phân tích tin nhắn và phản hồi theo 4 trạng thái:

🔴 DISTRESS (Căng thẳng/Khủng hoảng)
Keywords: "buồn", "mệt mỏi", "stress", "áp lực", "bất lực", "deadline", "toang", "muốn khóc", "thất vọng", "cạn năng lượng"
Công cụ (chọn NGẪU NHIÊN 3 trong 5):
1. 🆘 SOS Kit khi Stress/Lo âu - Bộ công cụ khẩn cấp xử lý stress nhanh
2. 🧘 Grounding 5-4-3-2-1 - Bài tập 5 phút quay về thực tại
3. 📞 Kết nối Chuyên gia - Nói chuyện với tư vấn viên
4. 💚 Body-Check - Nhận diện căng thẳng trong cơ thể
5. 😴 Cải thiện Giấc ngủ - Mẹo ngủ ngon khi stress

🟡 NEUTRAL (Bình thường/Trung tính)
Keywords: "bình thường", "ổn", "tàm tạm", "không có gì đặc biệt", "50/50", "cứ sao sao", "bth"
Công cụ (chọn NGẪU NHIÊN 3 trong 5):
1. 📝 Nhật ký cảm xúc - Viết ra để hiểu "okay" nghĩa là gì
2. 🎯 Gọi tên cảm xúc - Tìm từ chính xác cho cảm giác
3. 🗺️ Bản đồ cảm xúc - Vẽ lại hành trình cảm xúc
4. 💝 Thực hành Tự Trắc Ẩn - Chấp nhận trạng thái hiện tại
5. 🧭 Self-Discovery Journey - Khám phá bản thân sâu hơn

🟢 POSITIVE (Tích cực/Thoải mái)
Keywords: "vui", "zui", "ổn áp", "okla", "thoải mái", "nhẹ nhõm", "có động lực", "yêu đời", "cảm thấy tốt"
Công cụ (chọn NGẪU NHIÊN 3 trong 5):
1. 💬 Positive Self-Talk - Củng cố năng lượng tích cực
2. 🛡️ Đặt Ranh Giới - Bảo vệ năng lượng tốt
3. ✉️ Thư Tự Chữa Lành - Viết thư cho chính mình
4. 🙏 Gratitude Wall - Ghi lại điều biết ơn
5. 🌱 Growth Mindset - Phát triển tư duy tăng trưởng

🟣 THRIVING (Hạnh phúc tột đỉnh)
Keywords: "tuyệt vời", "hạnh phúc quá", "dzui xỉu", "10 điểm", "yêu đời vcl", "năng lượng full", "đỉnh", "biết ơn"
Công cụ (chọn 1):
1. 🌟 Gratitude Wall (Cộng đồng) - Chia sẻ lòng biết ơn để truyền cảm hứng

FORMAT TRẢ LỜI:
1. Câu đồng cảm ngắn (1 câu)
2. Liệt kê 3 công cụ (mỗi dòng: emoji + tên + mô tả ngắn)
3. Hỏi "Bạn muốn thử gì?"

MỖI LẦN TRẢ LỜI phải CHỌN RANDOM 3 công cụ khác nhau (trừ THRIVING chỉ có 1).
Trả lời NGẮN GỌN, KHÔNG dài dòng, bằng tiếng Việt.`,
              },
              ...this.conversationHistory.slice(-4),
              {
                role: "user",
                content: message,
              },
            ],
            max_tokens: 300,
            temperature: 0.7,
          };
          break;

        case "openai":
          headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.key}`,
          };
          requestBody = {
            model: config.model,
            messages: [
              {
                role: "system",
                content:
                  "Bạn là trợ lý AI hỗ trợ cảm xúc. Trả lời ngắn gọn (2-4 câu), thiết thực, ấm áp bằng tiếng Việt. Không dài dòng.",
              },
              ...this.conversationHistory.slice(-4), // Giảm từ 10 xuống 4
            ],
            temperature: 0.7,
            max_tokens: 200, // Giới hạn độ dài
          };
          break;

        case "claude":
          headers = {
            "Content-Type": "application/json",
            "x-api-key": config.key,
            "anthropic-version": "2023-06-01",
          };
          requestBody = {
            model: config.model,
            max_tokens: 1024,
            system:
              "Bạn là một trợ lý AI thân thiện và đầy đồng cảm, chuyên hỗ trợ về cảm xúc và sức khỏe tinh thần. Hãy đưa ra lời khuyên thiết thực, ấm áp và có giá trị. Trả lời bằng tiếng Việt.",
            messages: this.conversationHistory.slice(-10),
          };
          break;

        case "gemini":
          const geminiUrl = `${config.url}?key=${config.key}`;
          headers = {
            "Content-Type": "application/json",
          };
          requestBody = {
            contents: [
              {
                parts: [
                  {
                    text: `Bạn là một trợ lý AI thân thiện và đầy đồng cảm. ${message}`,
                  },
                ],
              },
            ],
          };
          config.url = geminiUrl;
          break;

        case "custom":
        default:
          headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.key}`,
          };
          requestBody = {
            message: message,
            history: this.conversationHistory.slice(-10),
          };
          break;
      }

      const response = await fetch(config.url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);

        throw new Error(
          `API Error: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();
      let aiResponse = "";

      // Extract response based on API type
      switch (this.apiType) {
        case "perplexity":
        case "openai":
          aiResponse =
            data.choices?.[0]?.message?.content ||
            data.choices?.[0]?.text ||
            "Xin lỗi, tôi không nhận được phản hồi.";
          break;

        case "claude":
          aiResponse =
            data.content?.[0]?.text || "Xin lỗi, tôi không nhận được phản hồi.";
          break;

        case "gemini":
          aiResponse =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Xin lỗi, tôi không nhận được phản hồi.";
          break;

        case "custom":
        default:
          aiResponse =
            data.response ||
            data.message ||
            data.text ||
            "Xin lỗi, tôi không nhận được phản hồi.";
          break;
      }

      // ===== THÊM USER MESSAGE VÀ ASSISTANT RESPONSE VÀO HISTORY (SAU KHI API THÀNH CÔNG) =====
      // Thứ tự: user message → assistant response
      this.conversationHistory.push({
        role: "user",
        content: message,
      });

      // Add AI response to conversation history
      this.conversationHistory.push({
        role: "assistant",
        content: aiResponse,
      });

      console.log(
        "✅ History AFTER successful API:",
        JSON.stringify(
          this.conversationHistory.map((m) => m.role),
          null,
          2
        )
      );

      return aiResponse;
    } catch (error) {
      console.error("API call failed:", error);

      // ===== FIX: THÊM CẢ USER MESSAGE VÀ FALLBACK RESPONSE VÀO HISTORY =====
      const fallbackResponse = this.getFallbackResponse(message);

      // Thêm user message (chưa được thêm ở trên do API lỗi)
      this.conversationHistory.push({
        role: "user",
        content: message,
      });

      // Thêm fallback response vào history
      this.conversationHistory.push({
        role: "assistant",
        content: fallbackResponse,
      });

      console.log(
        "⚠️ History AFTER fallback:",
        JSON.stringify(
          this.conversationHistory.map((m) => m.role),
          null,
          2
        )
      );

      return fallbackResponse;
    }
  }

  getFallbackResponse(message) {
    // Response mặc định khi API không khả dụng
    const lowerMessage = message.toLowerCase();

    // Cảm xúc tiêu cực
    if (
      lowerMessage.includes("buồn") ||
      lowerMessage.includes("sad") ||
      lowerMessage.includes("khó khăn") ||
      lowerMessage.includes("depressed") ||
      lowerMessage.includes("chán nản")
    ) {
      const responses = [
        "Tôi hiểu bạn đang cảm thấy buồn. Hãy nhớ rằng cảm xúc này là tạm thời. Hãy thử:\n\n1. Viết ra những điều bạn biết ơn hôm nay\n2. Đi dạo hoặc tập thể dục nhẹ\n3. Nghe nhạc yêu thích\n4. Nói chuyện với người thân\n\nBạn không đơn độc đâu! 💙",
        "Tôi thấy bạn đang trải qua giai đoạn khó khăn. Điều đó hoàn toàn bình thường. Một số gợi ý:\n\n• Cho phép bản thân cảm nhận cảm xúc\n• Viết nhật ký để giải tỏa\n• Làm điều gì đó nhỏ nhặt mỗi ngày\n• Tìm sự giúp đỡ khi cần\n\nMọi thứ sẽ tốt hơn! 🌈",
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Căng thẳng & áp lực
    if (
      lowerMessage.includes("căng thẳng") ||
      lowerMessage.includes("stress") ||
      lowerMessage.includes("áp lực") ||
      lowerMessage.includes("mệt mỏi") ||
      lowerMessage.includes("exhausted")
    ) {
      return 'Căng thẳng ảnh hưởng đến cả thể chất lẫn tinh thần. Hãy thử:\n\n1. Hít thở sâu: 4 giây hít vào, giữ 4 giây, 4 giây thở ra\n2. Lập danh sách ưu tiên công việc\n3. Nghỉ ngơi 15 phút mỗi 2 giờ\n4. Nói "không" khi cần thiết\n5. Ngủ đủ 7-8 tiếng/đêm\n\nHãy chăm sóc bản thân trước! 💪';
    }

    // Lo lắng
    if (
      lowerMessage.includes("lo lắng") ||
      lowerMessage.includes("anxiety") ||
      lowerMessage.includes("sợ hãi") ||
      lowerMessage.includes("panic") ||
      lowerMessage.includes("걱정")
    ) {
      return 'Lo lắng có thể khiến bạn mệt mỏi. Một số kỹ thuật giúp bạn:\n\n1. Kỹ thuật 5-4-3-2-1: Nhận biết 5 thứ nhìn thấy, 4 thứ chạm vào, 3 thứ nghe thấy, 2 thứ ngửi được, 1 thứ nếm được\n2. Viết ra những gì bạn lo lắng\n3. Tự hỏi: "Điều tồi tệ nhất có thể xảy ra là gì?"\n4. Tập trung vào hiện tại\n5. Thực hành mindfulness 10 phút/ngày\n\nMọi thứ rồi sẽ ổn thôi! 🌟';
    }

    // Cô đơn
    if (
      lowerMessage.includes("cô đơn") ||
      lowerMessage.includes("lonely") ||
      lowerMessage.includes("một mình")
    ) {
      return "Cảm giác cô đơn rất khó chịu, nhưng bạn không đơn độc:\n\n1. Tham gia các hoạt động nhóm/câu lạc bộ\n2. Gọi điện cho bạn bè/gia đình\n3. Tình nguyện giúp đỡ người khác\n4. Tham gia cộng đồng online\n5. Nuôi thú cưng nếu có thể\n\nMỗi người đều trải qua điều này. Bạn rất đặc biệt! 🤗";
    }

    // Tức giận
    if (
      lowerMessage.includes("tức") ||
      lowerMessage.includes("giận") ||
      lowerMessage.includes("angry") ||
      lowerMessage.includes("bực bội")
    ) {
      return "Cơn giận là tự nhiên, nhưng hãy kiểm soát nó:\n\n1. Đếm từ 1 đến 10 trước khi phản ứng\n2. Tập thể dục để giải tỏa\n3. Viết ra cảm xúc thay vì nói ngay\n4. Hít thở sâu\n5. Rời khỏi tình huống tạm thời\n\nSau khi bình tĩnh, hãy giải quyết vấn đề! 🧘‍♀️";
    }

    // Mất ngủ
    if (
      lowerMessage.includes("ngủ") ||
      lowerMessage.includes("sleep") ||
      lowerMessage.includes("insomnia") ||
      lowerMessage.includes("mất ngủ")
    ) {
      return "Giấc ngủ rất quan trọng cho sức khỏe tinh thần:\n\n1. Tắt thiết bị điện tử trước khi ngủ 1 giờ\n2. Giữ phòng mát, tối và yên tĩnh\n3. Không caffeine sau 3 giờ chiều\n4. Ngủ và thức dậy cùng giờ mỗi ngày\n5. Tập thể dục nhưng không quá khuya\n6. Đọc sách hoặc nghe nhạc êm dịu\n\nGiấc ngủ ngon là liều thuốc tốt nhất! 😴";
    }

    // Động lực
    if (
      lowerMessage.includes("động lực") ||
      lowerMessage.includes("motivation") ||
      lowerMessage.includes("lười") ||
      lowerMessage.includes("procrastination")
    ) {
      return "Thiếu động lực là chuyện thường gặp:\n\n1. Chia nhỏ mục tiêu lớn thành từng bước nhỏ\n2. Thưởng cho bản thân sau mỗi thành tựu\n3. Tìm lý do TẠI SAO bạn làm điều đó\n4. Bắt đầu với 5 phút đầu tiên\n5. Loại bỏ phiền nhiễu\n\nĐừng chờ động lực, hãy TẠO động lực! 🚀";
    }

    // Tự tin
    if (
      lowerMessage.includes("tự tin") ||
      lowerMessage.includes("confidence") ||
      lowerMessage.includes("tự ti") ||
      lowerMessage.includes("insecure")
    ) {
      return 'Xây dựng sự tự tin cần thời gian:\n\n1. Ghi nhận những thành công nhỏ mỗi ngày\n2. Ngừng so sánh với người khác\n3. Chăm sóc ngoại hình và sức khỏe\n4. Học kỹ năng mới\n5. Tập nói "Tôi có thể làm được!"\n6. Xung quanh người tích cực\n\nBạn đã rất tuyệt vời rồi! ✨';
    }

    // Cảm ơn
    if (
      lowerMessage.includes("cảm ơn") ||
      lowerMessage.includes("thanks") ||
      lowerMessage.includes("thank") ||
      lowerMessage.includes("tốt quá")
    ) {
      return "Không có gì cả! 😊 Tôi luôn ở đây để hỗ trợ bạn. Hãy quay lại bất cứ khi nào bạn cần, hoặc chỉ đơn giản là muốn trò chuyện. Chúc bạn một ngày tuyệt vời! 🤗💫";
    }

    // Xin chào
    if (
      lowerMessage.includes("xin chào") ||
      lowerMessage.includes("hello") ||
      lowerMessage.includes("hi ") ||
      lowerMessage.includes("chào")
    ) {
      return "Xin chào! 👋 Rất vui được gặp bạn. Tôi là trợ lý AI và tôi ở đây để lắng nghe và hỗ trợ bạn về mọi vấn đề cảm xúc. Hôm nay bạn cảm thấy thế nào? 😊";
    }

    // Giúp đỡ
    if (
      lowerMessage.includes("giúp") ||
      lowerMessage.includes("help") ||
      lowerMessage.includes("hướng dẫn")
    ) {
      return "Tôi có thể giúp bạn về:\n\n💙 Cảm xúc tiêu cực (buồn, lo lắng, giận dữ)\n💪 Stress và áp lực công việc/học tập\n😴 Vấn đề giấc ngủ\n🎯 Thiếu động lực\n✨ Tự tin và phát triển bản thân\n🤗 Cô đơn và kết nối\n\nHãy chia sẻ với tôi điều bạn đang trải qua nhé!";
    }

    // Default response - thông minh hơn
    const defaultResponses = [
      "Cảm ơn bạn đã chia sẻ. Tôi đang lắng nghe và sẵn sàng hỗ trợ bạn. Bạn có thể kể thêm về cảm xúc của mình không? 💭",
      "Tôi hiểu. Hãy nói thêm về điều đó nhé. Tôi ở đây để lắng nghe bạn. 👂",
      "Cảm xúc của bạn hoàn toàn hợp lệ. Bạn muốn chia sẻ thêm gì không? 💬",
      "Tôi đang ở đây cùng bạn. Hãy kể cho tôi nghe thêm về tình huống này nhé. 🤝",
    ];

    return defaultResponses[
      Math.floor(Math.random() * defaultResponses.length)
    ];
  }

  addMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    // Convert line breaks to paragraphs
    const paragraphs = text.split("\n").filter((p) => p.trim());
    paragraphs.forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      contentDiv.appendChild(p);
    });

    messageDiv.appendChild(contentDiv);
    this.chatMessages.appendChild(messageDiv);

    this.scrollToBottom();
  }

  showTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.className = "message bot-message";
    typingDiv.id = "typing-indicator";

    const indicator = document.createElement("div");
    indicator.className = "typing-indicator";

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("div");
      dot.className = "typing-dot";
      indicator.appendChild(dot);
    }

    typingDiv.appendChild(indicator);
    this.chatMessages.appendChild(typingDiv);

    this.scrollToBottom();
  }

  removeTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) {
      indicator.remove();
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }, 100);
  }
}

// Initialize chatbox when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new AIChatbox();
  });
} else {
  new AIChatbox();
}

export default AIChatbox;
