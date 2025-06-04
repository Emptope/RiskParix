from __future__ import annotations
import json
import os
import requests
from dotenv import load_dotenv
from typing import Dict, List, Optional, Iterable

load_dotenv()

class DeepSeekClient:
    """
    轻量封装 DeepSeek Chat 接口，屏蔽流/非流细节。
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        stock_id: Optional[str] = None,
        *,
        model: str = "deepseek-chat",
        max_tokens: int = 2000,
        temperature: float = 0.7,
        role_description: str | None = None,
        base_url: str = "https://api.deepseek.com/v1",
    ) -> None:
        self.api_key = api_key or os.getenv("DEEPSEEK_API_KEY")
        self.stock_id = stock_id
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.base_url = base_url.rstrip("/")

        # 可自定义系统角色描述；否则给一个通用的
        self.role_description = role_description or (
            "你是一名专业的量化研究员，擅长金融市场分析、技术分析与交易策略评估。"
            "回答应精准、有条理，避免重复。"
        )

        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    # ---------- 公共方法 ---------- #
    def chat(
        self, message: str, history: Optional[List[Dict]] = None, *, stream: bool = False
    ) -> str:
        """
        同步调用，直接返回完整回复（或流式由 caller 处理）。
        """
        payload = self._build_payload(message, history, stream=stream)

        try:
            resp = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                stream=stream,
                timeout=60,
            )
            resp.raise_for_status()
        except requests.RequestException as exc:  # pragma: no cover
            return f"【请求错误】{exc}"

        if stream:
            # 调用方自己解析，非此函数职责
            return resp

        content = resp.json()["choices"][0]["message"]["content"]
        return self._post_process(content)

    def stream_chat(
        self, message: str, history: Optional[List[Dict]] = None
    ) -> Iterable[str]:
        """
        生成器：按 DeepSeek 的 SSE 片段流式 yield。
        调用方负责终端 '\n\n' 拼接。
        """
        resp = self.chat(message, history, stream=True)
        if isinstance(resp, str):  # 已处理过错误，直接返回
            yield resp
            return

        for raw in resp.iter_lines(decode_unicode=True):
            if not raw.startswith("data: "):
                continue
            raw = raw.replace("data: ", "")
            if raw.strip() == "[DONE]":
                break
            try:
                data = json.loads(raw)
                delta = data["choices"][0].get("delta", {})
                if "content" in delta:
                    yield self._post_process(delta["content"])
            except json.JSONDecodeError:
                # 忽略解析失败的 keep-alive 行
                continue

    # ---------- 私有辅助 ---------- #
    def _build_payload(
        self, message: str, history: Optional[List[Dict]], *, stream: bool
    ) -> Dict:
        msgs: List[Dict[str, str]] = [self._system_prompt()]
        if history:
            msgs.extend(history)
        msgs.append({"role": "user", "content": message})

        return {
            "model": self.model,
            "messages": msgs,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "stream": stream,
        }

    def _system_prompt(self) -> Dict[str, str]:
        """
        每次调用动态生成，可根据需要插入 stock_id 等变量。
        """
        desc = self.role_description
        if self.stock_id:
            desc += f"\n当前标的/用户: {self.stock_id}"
        return {"role": "system", "content": desc}

    @staticmethod
    def _post_process(txt: str) -> str:
        """
        输出原始文本。
        """
        return txt
