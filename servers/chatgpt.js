import { Configuration, OpenAIApi } from "openai";
// 设置OpenAI API密钥
const OPENAI_API_KEY = "API_KEY";

const configuration = new Configuration({
  organization: "org-t3aV8SJgyfmnkAM6eeeQPFGm",
  apiKey: OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function generateResponse({
  prompt,
  temperature = 1,
  maxToken = 16,
  model = "text-davinci-003",
}) {
  try {
    const completions = await openai.createCompletion({
      model,
      prompt: prompt,
      temperature,
      max_tokens: maxToken,
    });
    console.log("createCompletion: ", model, prompt, temperature);
    console.log("createCompletion 当次会话token: ", completions.data.usage.total_tokens);
    const message = completions.data;
    return message;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    } else {
      return error;
    }
  }
}

async function generateChatResponse({
  messages,
  temperature = 0,
  maxToken = 256,
  model = "gpt-3.5-turbo",
}) {
  try {
    const completions = await openai.createChatCompletion({
      model,
      messages,
      temperature,
      max_tokens: maxToken,
    });
    console.log("createChatCompletion: ", model);
    console.log("createChatCompletion 当次会话token: ", completions.data.usage.total_tokens);
    const message = completions.data;
    return message;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    } else {
      return error;
    }
  }
}

async function generateStreamResponse({
  prompt,
  temperature = 0.2,
  maxToken = 256,
  model = "text-davinci-003",
  stream = false,
  res,
}) {
  try {
    const params = {
      model,
      prompt,
      temperature,
      max_tokens: maxToken,
      stream: stream,
    };
    console.log("generateStreamResponse", params);
    const response = await openai.createCompletion(params, {
      responseType: "stream",
    });
    const streamResponse = response.data;
    streamResponse.on("data", (chunk) => {
      res.write(chunk);
    });
    streamResponse.on("end", () => {
      res.end();
    });
  } catch (error) {
    if (error.response) {
      return res.send({ ...error.response.data });
    } else {
      return res.status(500).send({ error: "Something went wrong." });
    }
  }
}

export { generateResponse, generateChatResponse, generateStreamResponse };
