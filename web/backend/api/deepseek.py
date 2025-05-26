import os
import re
import requests
import json
from typing import Optional, Dict, List

class DeepSeekClient:
    def __init__(
        self,
        api_key: Optional[str] = None,
        stock_id: Optional[str] = None,
        model: str = 'deepseek-chat',
        max_tokens: int = 2000,
        temperature: float = 0.7
    ):
        self.base_url = "https://api.deepseek.com/v1"
        self.model = model
        self.api_key = api_key or os.getenv("DEEPSEEK_API_KEY")
        self.stock_id = stock_id
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        self.data_paths = {
            "kline": os.path.join("data", "day_klines", "all_klines.csv"),
            "metrics": os.path.join("data", "data_analysis", "all_metrics.csv"),
            "order": os.path.join("data", "data_analysis", "trade_records.csv")
        }

        self.prompt_templates = {
            "system": (
                "你是一名专业的股票分析师，擅长技术分析和基本面研究。"
                "请根据用户提供的内容作出精准、分段、去重复的分析，避免赘述重复。"
                "如提及价格或指标，请使用最新数据或注明需查数据。"
            ),
            "error": "【分析失败】{error_msg}",
            "empty_response": "未能获取有效分析结果，请尝试更具体的问题"
        }

    def update_prompt_template(self, template_type: str, new_template: str) -> None:
        if template_type in self.prompt_templates:
            self.prompt_templates[template_type] = new_template
        else:
            raise ValueError(f"无效的模板类型: {template_type}")

    def get_system_prompt(self) -> Dict[str, str]:
        return {
            "role": "system",
            "content": self.prompt_templates["system"].format(
                stock_id=self.stock_id or "[未指定股票]",
                kline_path=self.data_paths["kline"],
                metrics_path=self.data_paths["metrics"],
                order_path=self.data_paths["order"]
            )
        }

    def format_response(self, raw: str) -> str:
        txt = raw.replace("\r\n", "\n").replace("\r", "\n")

        # 把 "-###" / "- ###" / "-### *" 转回标题 -----------------
        def _fix_bullet_heading(match: re.Match) -> str:
            hashes = match.group(1)  # ### 或 ## 等
            title = match.group(2).strip()
            title = re.sub(r"^\*+|\*+$", "", title).strip()
            return f"\n{hashes} {title}"

        txt = re.sub(r"\n\s*-\s*(#+)\s*(.*?)\s*$", _fix_bullet_heading, txt, flags=re.MULTILINE)

        # 水平线独立行 ---------------------------------------------
        txt = re.sub(r"\s*-{3,}\s*", "\n---\n", txt)

        # 标题行首化（剩余正常标题） -------------------------------
        txt = re.sub(r"(?<!\n)(#+ )", r"\n\1", txt)

        # 列表符号行首化 -------------------------------------------
        txt = re.sub(r"(?<!\n)([\-*+])\s+", r"\n\1 ", txt)
        txt = re.sub(r"(?<!\n)(\d+\.)\s+", r"\n\1 ", txt)

        # 粗体/斜体孤立星号 → 去除 -------------------------------
        txt = re.sub(r"\*\*(.*?)\*\*", r" **\1** ", txt)
        txt = re.sub(r"_(.*?)_", r" _\1_ ", txt)

        # 连续 ≥3 空行 → 2 空行 -----------------------------------
        txt = re.sub(r"\n{3,}", "\n\n", txt)

        return txt.rstrip() 

    def chat(self, message: str, history: Optional[List[Dict]] = None, stream: bool = False) -> str:
        messages = [self.get_system_prompt()]
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": message})

        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "stream": stream
        }

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()

            if stream:
                return self._handle_stream_response(response)
            else:
                content = response.json()['choices'][0]['message']['content']
                return self.format_response(content)

        except requests.exceptions.RequestException as e:
            error_msg = f"网络错误: {str(e)}"
        except ValueError as e:
            error_msg = f"JSON解析错误: {str(e)}"
        except Exception as e:
            error_msg = f"未知错误: {str(e)}"

        return self.prompt_templates["error"].format(error_msg=error_msg)

    def stream_chat(self, message: str, history: Optional[List[Dict]] = None):
        messages = [self.get_system_prompt()]
        if history:
            messages.extend(history[-6:])
        
        messages.append({"role": "user", "content": message})

        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "stream": True,
        }

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                stream=True,
                timeout=60,
            )
            
            for line in response.iter_lines(decode_unicode=True):
                if line.startswith("data: "):
                    content = line.replace("data: ", "")
                    if content.strip() == "[DONE]":
                        break
                    try:
                        data = json.loads(content)
                        if "choices" in data and data["choices"]:
                            delta = data["choices"][0].get("delta", {})
                            if "content" in delta:
                                yield self.format_response(delta["content"])
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            yield f"【请求错误】{str(e)}"

    def _handle_stream_response(self, response) -> str:
        full_content = []
        for chunk in response.iter_content(chunk_size=None):
            if chunk:
                decoded = chunk.decode('utf-8')
                if 'data: ' in decoded:
                    json_str = decoded.replace('data: ', '')
                    if json_str.strip() == '[DONE]':
                        break
                    try:
                        data = json.loads(json_str)
                        if 'choices' in data and data['choices']:
                            content = data['choices'][0].get('delta', {}).get('content', '')
                            if content:
                                full_content.append(content)
                    except json.JSONDecodeError:
                        continue
        return self.format_response(''.join(full_content))

    def analyze_technical(self, indicator: str, period: str = '1d', extra_instructions: str = '') -> str:
        prompt = (
            f"对{self.stock_id or '当前股票'}进行{indicator}技术分析\n"
            f"时间周期: {period}\n"
            "要求:\n"
            "1. 解释指标当前值\n"
            "2. 分析买卖信号\n"
            "3. 给出支撑位和压力位\n"
            "4. 结合K线形态分析\n"
            f"{extra_instructions}"
        )
        return self.chat(prompt)

    def analyze_fundamental(self, aspect: str) -> str:
        prompt = (
            f"对{self.stock_id or '当前股票'}进行{aspect}基本面分析\n"
            "要求:\n"
            "1. 与行业平均值比较\n"
            "2. 分析未来增长潜力\n"
            "3. 给出投资建议"
        )
        return self.chat(prompt)
