import os
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
        """
        初始化DeepSeek客户端
        
        :param api_key: DeepSeek API密钥
        :param stock_id: 分析的股票代码
        :param model: 使用的模型名称
        :param max_tokens: 最大token数
        :param temperature: 生成温度
        """
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
        
        # 数据路径配置
        self.data_paths = {
            "kline": os.path.join("data", "day_klines", "all_klines.csv"),
            "metrics": os.path.join("data", "data_analysis", "all_metrics.csv"),
            "order": os.path.join("data", "data_analysis", "trade_records.csv")
        }
        
        # 可修改的提示词模板
        self.prompt_templates = {
            "system": (
                "你是一名专业的股票分析师，擅长技术指标和基本面分析。\n"
                "当前分析标的：{stock_id}\n"
                "可用数据：\n"
                "- K线数据：{kline_path}\n"
                "- 指标数据：{metrics_path}\n"
                "- 交易记录：{order_path}\n\n"
                "回答要求：\n"
                "1. 专业准确，避免模糊表述\n"
                "2. 不同观点分段说明\n"
                "3. 技术分析需包含支撑位、压力位\n"
                "4. 最后给出操作建议\n"
            ),
            "error": "【分析失败】{error_msg}",
            "empty_response": "未能获取有效分析结果，请尝试更具体的问题"
        }

    def update_prompt_template(self, template_type: str, new_template: str) -> None:
        """
        更新提示词模板
        
        :param template_type: 模板类型 (system/error/empty_response)
        :param new_template: 新的模板内容
        """
        if template_type in self.prompt_templates:
            self.prompt_templates[template_type] = new_template
        else:
            raise ValueError(f"无效的模板类型: {template_type}")

    def get_system_prompt(self) -> Dict[str, str]:
        """
        生成系统提示词
        
        :return: 包含角色和内容的字典
        """
        return {
            "role": "system",
            "content": self.prompt_templates["system"].format(
                stock_id=self.stock_id or "[未指定股票]",
                kline_path=self.data_paths["kline"],
                metrics_path=self.data_paths["metrics"],
                order_path=self.data_paths["order"]
            )
        }

    def format_response(self, raw_response: str) -> str:
        """
        格式化API响应内容
        
        :param raw_response: 原始响应文本
        :return: 格式化后的文本
        """
        if not raw_response.strip():
            return self.prompt_templates["empty_response"]
            
        # 确保分段清晰
        formatted = raw_response.replace("\n\n", "</p><p>")
        formatted = formatted.replace("\n", "<br/>")
        return f"<p>{formatted}</p>"

    def chat(
        self,
        message: str,
        history: Optional[List[Dict]] = None,
        stream: bool = False
    ) -> str:
        """
        与DeepSeek API交互
        
        :param message: 用户消息
        :param history: 对话历史
        :param stream: 是否使用流式响应
        :return: 格式化后的响应内容
        """
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
                # 处理流式响应
                return self._handle_stream_response(response)
            else:
                # 处理普通响应
                content = response.json()['choices'][0]['message']['content']
                return self.format_response(content)
                
        except requests.exceptions.RequestException as e:
            error_msg = f"网络错误: {str(e)}"
        except ValueError as e:
            error_msg = f"JSON解析错误: {str(e)}"
        except Exception as e:
            error_msg = f"未知错误: {str(e)}"
            
        return self.prompt_templates["error"].format(error_msg=error_msg)

    def _handle_stream_response(self, response) -> str:
        """
        处理流式响应
        
        :param response: 流式响应对象
        :return: 完整响应内容
        """
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

    def analyze_technical(
        self,
        indicator: str,
        period: str = '1d',
        extra_instructions: str = ''
    ) -> str:
        """
        技术分析专用方法
        
        :param indicator: 技术指标名称 (如MACD, RSI等)
        :param period: 分析周期
        :param extra_instructions: 额外指令
        :return: 分析结果
        """
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
        """
        基本面分析专用方法
        
        :param aspect: 分析方面 (如财务、估值、行业等)
        :return: 分析结果
        """
        prompt = (
            f"对{self.stock_id or '当前股票'}进行{aspect}基本面分析\n"
            "要求:\n"
            "1. 与行业平均值比较\n"
            "2. 分析未来增长潜力\n"
            "3. 给出投资建议"
        )
        return self.chat(prompt)