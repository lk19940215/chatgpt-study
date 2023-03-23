import express from "express";
import cors from "cors";
import {
  generateResponse,
  generateChatResponse,
  generateStreamResponse,
} from "./chatgpt.js";

const app = express();
app.use(cors());
app.use(express.json());

// Create a POST /generate endpoint
app.post("/generate", async (req, res) => {
  try {
    // Get the message, temperature, and maxToken from the request
    const { model, prompt, temperature, maxToken } = req.body;
    // Generate a response
    const response = await generateResponse({
      model,
      prompt,
      temperature,
      maxToken,
    });
    // Send the response back
    res.send({ ...response });
  } catch (err) {
    // Catch any errors and send a generic error message back
    res.status(500).send({ error: "Something went wrong." });
  }
});

// 使用 generateChatResponse 编写同样的 POST /generate-chat endpoint
app.post("/generate-chat", async (req, res) => {
  try {
    // Get the message, temperature, and maxToken from the request
    const { model, messages, temperature, maxToken } = req.body;
    // Generate a response
    const response = await generateChatResponse({
      model,
      messages,
      temperature,
      maxToken,
    });
    // Send the response back
    res.send({ ...response });
  } catch (err) {
    // Catch any errors and send a generic error message back
    res.status(500).send({ error: "Something went wrong." });
  }
});

app.get("/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  const { prompt, maxToken, temperature } = req.query;

  console.log("/stream", prompt, req.query);
  await generateStreamResponse({
    maxToken: Number(maxToken),
    temperature: Number(temperature),
    prompt,
    stream: true,
    res,
  });
});

app.listen(3001, () => console.log("Server is running on port 3001"));
