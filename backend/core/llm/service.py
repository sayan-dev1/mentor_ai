from __future__ import annotations
from typing import Generator
from .factory import LLMFactory


class LLMService:
    def __init__(self, agent_type: str = "study"):
        self.agent_type = agent_type

    def _get_target(self):
        return LLMFactory.get_agent_llm(self.agent_type)

    def generate(self, prompt: str, **kwargs) -> str:
        client, model, provider_name = self._get_target()
        if client is None:
            fb_client, fb_model, fb_provider = LLMFactory.get_fallback_llm(self.agent_type)
            if fb_client is not None:
                client, model, provider_name = fb_client, fb_model, fb_provider
            else:
                key_var = "GROQ_API_KEY" if provider_name == "Groq" else "OPENROUTER_API_KEY"
                return (
                    f"### ⚡ [{provider_name} ({model}) Simulation]\n\n"
                    f"Agent **{self.agent_type.capitalize()}** is assigned to **{provider_name}** using `{model}`.\n\n"
                    f"> 💡 **To connect to real AI model inference:** Add your `{key_var}` into `backend/.env`!\n\n"
                    f"**Generated Output:**\n"
                    f"Processed request for {self.agent_type}.\n"
                )

        try:
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=kwargs.get("temperature", 0.7),
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            print(f"[LLMService] Primary model {model} ({provider_name}) error: {e}. Executing auto-fallback...")
            fb_client, fb_model, fb_provider = LLMFactory.get_fallback_llm(self.agent_type)
            if fb_client is not None and (fb_client != client or fb_model != model):
                try:
                    fb_res = fb_client.chat.completions.create(
                        model=fb_model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=kwargs.get("temperature", 0.7),
                    )
                    return fb_res.choices[0].message.content or ""
                except Exception as fb_err:
                    return f"[{fb_provider} Error ({fb_model})]: {str(fb_err)}"
            return f"[{provider_name} API Error ({model})]: {str(e)}"

    def stream(self, prompt: str, **kwargs) -> Generator[str, None, None]:
        client, model, provider_name = self._get_target()
        if client is None:
            fb_client, fb_model, fb_provider = LLMFactory.get_fallback_llm(self.agent_type)
            if fb_client is not None:
                client, model, provider_name = fb_client, fb_model, fb_provider
            else:
                key_var = "GROQ_API_KEY" if provider_name == "Groq" else "OPENROUTER_API_KEY"
                mock_text = (
                    f"### ⚡ [{provider_name} ({model}) Live Stream Simulation]\n\n"
                    f"Agent **{self.agent_type.capitalize()}** is set up to use `{model}` on **{provider_name}**.\n\n"
                    f"> 💡 **To connect to real AI model inference:** Add your `{key_var}` into `backend/.env`!\n\n"
                    f"#### 1. Fundamental Principles\n"
                    f"The concept relies on structured execution loops and provider-agnostic abstractions.\n\n"
                    f"#### 2. Key Takeaways\n"
                    f"- High token execution speeds\n"
                    f"- Decoupled API architecture\n"
                    f"- Per-session isolated memory stores\n"
                )
                for word in mock_text.split(" "):
                    yield word + " "
                return

        try:
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=kwargs.get("temperature", 0.7),
                stream=True,
            )
            for chunk in response:
                if chunk.choices and len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            print(f"[LLMService] Primary model {model} ({provider_name}) rate-limit/error: {e}. Executing auto-fallback to Groq...")
            fb_client, fb_model, fb_provider = LLMFactory.get_fallback_llm(self.agent_type)
            if fb_client is not None and (fb_client != client or fb_model != model):
                try:
                    fb_response = fb_client.chat.completions.create(
                        model=fb_model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=kwargs.get("temperature", 0.7),
                        stream=True,
                    )
                    for chunk in fb_response:
                        if chunk.choices and len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                            yield chunk.choices[0].delta.content
                    return
                except Exception as fb_err:
                    yield f"[{fb_provider} Fallback Error ({fb_model})]: {str(fb_err)}"
            else:
                yield f"[{provider_name} API Error ({model})]: {str(e)}"
