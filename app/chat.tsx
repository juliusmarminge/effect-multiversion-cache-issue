"use client";

import { processDataStream } from "ai";

export function ChatTest() {
  const doChat = async () => {
    const resp = await fetch("/api/chat", {
      method: "POST",
    });

  processDataStream({
    stream: resp.body!,
    onDataPart: (part) => {
        console.log('got data part',part);
    },
    onTextPart: (part) => {
        console.log('got text part', part);
    }
  })
  };

  return <button onClick={doChat}>Chat</button>;
}
