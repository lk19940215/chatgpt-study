import React, { useEffect, useState } from "react";
import {
  List,
  Input,
  Spin,
  Avatar,
  Drawer,
  Slider,
  Space,
  Empty,
  Select,
  Divider,
  message,
} from "antd";
import { UserOutlined, SettingOutlined } from "@ant-design/icons";
import axios from "axios";
import "./App.css";
import "antd/dist/reset.css";
import { TYPE_MAP, MODEL_LIST, STREAM_TYPE } from "./constants";

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [temperature, setTemperature] = useState(0);
  const [token, setToken] = useState(1024);
  const [model, setModel] = useState(MODEL_LIST["GPT-3.5-davinci-003"]);
  const [conversationType, setConversationType] = useState("simple");
  const [streamType, setStreamType] = useState("simple");

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSend = () => {
    if (streamType === "stream") {
      handleStream();
    } else {
      if (model === MODEL_LIST["GPT-3.5-Turbo"]) {
        handleConversation();
      } else {
        handleSimple();
      }
    }
  };

  const handleStream = async () => {
    const botMessage = {
      content: "",
      role: "assistant",
    };
    setLoading(true);
    const eventSource = new EventSource(
      `http://localhost:3001/stream?prompt=${decodeURIComponent(
        inputValue
      )}&maxToken=${token}&temperature=${temperature}`
    );
    eventSource.onmessage = (event) => {
      setInputValue("");
      setLoading(false);
      const response = [{ content: inputValue, role: "user" }];
      const { data } = event;
      if (data.includes("[DONE]")) {
        eventSource.close();
        return;
      }
      try {
        const lineData = JSON.parse(data);
        botMessage.content += lineData.choices[0].text.trim();
        if (response.length === 1) {
          response.push(botMessage);
        }
        setMessages([...messages, ...response]);
      } catch (error) {
        message.error("解析数据失败");
      }
    };
  };

  const handleSimple = async () => {
    setLoading(true);
    const res = await axios.post("http://localhost:3001/generate", {
      prompt: inputValue,
      temperature,
      maxToken: token,
      model,
    });
    const {
      data: { choices, error },
    } = res;
    let botMessage = "";

    if (choices) {
      choices.forEach((element) => {
        botMessage += element.text.trim();
      });
    } else {
      botMessage = error.message;
    }
    // Add user and bot messages to state
    setMessages([
      ...messages,
      { content: inputValue, role: "user" },
      { content: botMessage, role: "assistant" },
    ]);
    setInputValue("");
    setLoading(false);
  };

  const handleConversation = async () => {
    setLoading(true);
    const newInputList = [{ content: inputValue, role: "user" }];
    const messageList = messages.concat(newInputList);
    const res = await axios.post("http://localhost:3001/generate-chat", {
      model,
      messages: messageList,
      temperature,
      maxToken: token,
    });
    const {
      data: { choices, error },
    } = res;
    let botMessage = "";

    if (choices) {
      choices.forEach((element) => {
        botMessage += element.message.content.trim();
      });
    } else {
      botMessage = error.message;
    }
    setMessages([
      ...messages,
      { content: inputValue, role: "user" },
      { content: botMessage, role: "assistant" },
    ]);
    setInputValue("");
    setLoading(false);
  };

  const getAvatar = (message) => {
    if (message.role === "assistant") {
      return (
        <Avatar src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png" />
      );
    } else {
      return <Avatar icon={<UserOutlined />} />;
    }
  };

  useEffect(() => {
    const listDom = document.querySelector(".ant-list");
    if (listDom) {
      listDom.scrollIntoView({
        behavior: "smooth", // 平滑滚动
        block: "end", // 滚动到元素顶部
        inline: "nearest", // 滚动到最近的边缘
      });
    }
  }, [messages]);

  return (
    <div className="demo-wrap">
      <div className="demo-title">
        <p>
          <span className="demo-name">Chat Bot</span>
          <span>
            {model} {TYPE_MAP[conversationType]} {STREAM_TYPE[streamType]}
          </span>
        </p>
        <SettingOutlined
          className="demo-title-icon"
          onClick={() => setOpen(true)}
        />
      </div>
      <Spin spinning={loading} tip={"客官稍等,快马加鞭赶来中"}>
        {messages.length ? (
          <List
            className={"demo-list"}
            dataSource={messages}
            renderItem={(message) => (
              <List.Item>
                <List.Item.Meta
                  className={
                    message.role === "assistant" ? "Bot" : "demo-user-item"
                  }
                  avatar={getAvatar(message)}
                  title={message.role === "assistant" ? "Bot" : "You"}
                  description={message.content}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="还没有聊天记录,随便问点啥吧"
          />
        )}
      </Spin>

      <Input.Search
        className={"demo-input"}
        placeholder="Type your message"
        enterButton="Send"
        value={inputValue}
        onChange={handleInputChange}
        onSearch={handleSend}
      />

      <Drawer
        title="Chat Bot 设置"
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
      >
        <Space direction="vertical">
          <span>
            返回类型: {STREAM_TYPE[streamType]} (文本流，模型固定为
            {MODEL_LIST["GPT-3.5-davinci-003"]})
          </span>
          <Select
            value={streamType}
            onChange={(value) => {
              setStreamType(value);
              if (value === "stream") {
                setModel(MODEL_LIST["GPT-3.5-davinci-003"]);
              }
            }}
            options={[
              { value: "stream", label: "文本流" },
              { value: "simple", label: "普通" },
            ]}
          />
        </Space>
        <Divider />

        <Space direction="vertical">
          <span>会话类型: {TYPE_MAP[conversationType]} </span>
          <Select
            value={conversationType}
            onChange={(value) => {
              setConversationType(value);
              setModel("gpt-3.5-turbo");
            }}
            options={[
              { value: "conversation", label: "会话上下文" },
              { value: "simple", label: "简单输入" },
            ]}
          />
        </Space>
        <Divider />

        <Space direction="vertical">
          <span>模型选择: {model} ( Gpt3.5 / Gpt 4 )</span>
          <Select
            value={model}
            onChange={(value) => setModel(value)}
            options={Object.entries(MODEL_LIST).map((item) => {
              return {
                label: item[0],
                value: item[1],
                // disabled: item[1] === MODEL_LIST["GPT-4"],
              };
            })}
          />
        </Space>
        <Divider />

        <Space direction="vertical">
          <span>
            Temperature: {temperature} ( 控制返回结果随机性, 默认为 1,
            值越少返回结果越固定。 )
          </span>
          <Slider
            max={2}
            min={0}
            step={0.2}
            value={temperature}
            onChange={(value) => setTemperature(value)}
          />
        </Space>
        <Divider />

        <Space direction="vertical">
          <span>
            token: {token} (
            控制返回结果字符，默认16，根据字符进行计费，token越长，耗时越长 )
          </span>
          <Slider
            max={2048}
            min={1}
            step={100}
            value={token}
            onChange={(value) => setToken(value)}
          />
        </Space>
      </Drawer>
    </div>
  );
}

export default App;

// const handleStream = async () => {
// setLoading(true);
// const res = await fetch("http://localhost:3001/stream", {
//   method: "POST",
//   body: JSON.stringify({
//     prompt: inputValue,
//     model, // 此方法选择模型无效
//     temperature,
//     maxToken: token,
//   }),
//   headers: {
//     "Content-Type": "application/json",
//   },
// });
// setInputValue("");
// setLoading(false);
// const reader = res.body.getReader();
// const decoder = new TextDecoder("utf-8");

// const response = [{ content: inputValue, role: "user" }];
// const botMessage = {
//   content: "",
//   role: "assistant",
// };
// setMessages([...messages, ...response]);

// const readStream = async (cb) => {
//   const { done, value } = await reader.read();
//   if (!done) {
//     const text = decoder.decode(value);
//     text
//       .toString()
//       .trim()
//       .split("data: ")
//       .forEach((element) => {
//         if (element !== "") {
//           const newText = element.replace("data: ", "");
//           if (element.trim() === "[DONE]") {
//             return;
//           }
//           const lineData = JSON.parse(newText);
//           const lineText = lineData.choices[0].text;
//           cb && cb(lineText);
//           return readStream(cb);
//         }
//       });
//   }
// };
// await readStream((line) => {
//   botMessage.content += line;
//   if (response.length === 1) {
//     response.push(botMessage);
//   }
//   setMessages([...messages, ...response]);
// });
// };
