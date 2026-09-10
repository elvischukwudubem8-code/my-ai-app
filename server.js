import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.static("."));

app.post("/api/chat", async (req, res) => {
  try {
    const { message, mode } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Please enter a message." });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OpenAI API key is not configured."
      });
    }

    // TEXT CHAT
    if (mode !== "image") {
      const response = await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-5.6-luna",
            input: message
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error: data.error?.message || "OpenAI request failed."
        });
      }

      return res.json({
        type: "text",
        reply: data.output_text || "No response received."
      });
    }

    // IMAGE GENERATION
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-image-2",
          prompt: message
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Image generation failed."
      });
    }

    const image = data.data?.[0]?.b64_json;

    if (!image) {
      return res.status(500).json({
        error: "No image was returned."
      });
    }

    return res.json({
      type: "image",
      image: image
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`My AI is running on port ${PORT}`);
});
