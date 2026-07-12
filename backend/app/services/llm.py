import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        # Lazy imports/initializations to prevent crashes if keys are not set yet
        self._openai_client = None
        self._anthropic_client = None
        self._gemini_configured = False

    def _get_openai(self):
        if not self._openai_client and settings.OPENAI_API_KEY:
            from openai import OpenAI
            self._openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        return self._openai_client

    def _get_anthropic(self):
        if not self._anthropic_client and settings.ANTHROPIC_API_KEY:
            from anthropic import Anthropic
            self._anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        return self._anthropic_client

    def _setup_gemini(self):
        if not self._gemini_configured and settings.GEMINI_API_KEY:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._gemini_configured = True
        return self._gemini_configured

    async def generate_text(
        self,
        prompt: str,
        system_prompt: str = "You are Aora AI, an advanced tutoring assistant.",
        provider: str = "gemini",
        temperature: float = 0.3
    ) -> str:
        """
        Routes text completions to target models.
        Supports provider strings: "openai", "claude", "gemini"
        """
        # Determine actual provider to use based on configured credentials
        resolved_provider = "mock"
        
        # Check if the requested provider is configured
        if provider == "gemini" and self._setup_gemini():
            resolved_provider = "gemini"
        elif provider == "openai" and self._get_openai():
            resolved_provider = "openai"
        elif provider == "claude" and self._get_anthropic():
            resolved_provider = "claude"
        else:
            # Try to fall back to any active credential
            if self._setup_gemini():
                resolved_provider = "gemini"
            elif self._get_openai():
                resolved_provider = "openai"
            elif self._get_anthropic():
                resolved_provider = "claude"

        try:
            # 1. Google Gemini
            if resolved_provider == "gemini":
                import google.generativeai as genai
                model = genai.GenerativeModel(
                    model_name="gemini-2.5-flash",
                    system_instruction=system_prompt
                )
                response = model.generate_content(
                    prompt,
                    generation_config={"temperature": temperature}
                )
                return response.text

            # 2. OpenAI GPT-4o
            elif resolved_provider == "openai":
                client = self._get_openai()
                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=temperature
                )
                return response.choices[0].message.content or ""

            # 3. Anthropic Claude 3.5 Sonnet
            elif resolved_provider == "claude":
                client = self._get_anthropic()
                response = client.messages.create(
                    model="claude-3-5-sonnet-20240620",
                    max_tokens=4000,
                    system=system_prompt,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature
                )
                return response.content[0].text if response.content else ""

        except Exception as e:
            logger.error(f"Error in generate_text with resolved provider {resolved_provider}: {e}")
            return self._mock_learning_response(prompt)

        return self._mock_learning_response(prompt)

    def _mock_learning_response(self, prompt: str) -> str:
        """Smarter offline mock response callback when API keys are unconfigured or fail"""
        # Extract clean query if embedded in context template
        query = prompt.split("User Query:")[-1].strip() if "User Query:" in prompt else prompt
        query_lower = query.lower()

        if "what is ai" in query_lower or "artificial intelligence" in query_lower:
            return (
                "### Artificial Intelligence (AI) Overview\n\n"
                "**Artificial Intelligence (AI)** is the simulation of human intelligence processes by machines, especially computer systems. "
                "These processes include learning (the acquisition of information and rules for using the information), reasoning (using rules to reach approximate or definite conclusions), and self-correction.\n\n"
                "#### Core Subfields of AI:\n"
                "* **Machine Learning (ML)**: Systems that automatically learn and improve from experience without being explicitly programmed.\n"
                "* **Natural Language Processing (NLP)**: The ability of computers to understand, interpret, and manipulate human language (similar to how I am answering you now!).\n"
                "* **Computer Vision**: Enabling machines to identify, process, and interpret visual inputs such as images or videos.\n"
                "* **Robotics**: Designing and building physical agents capable of executing tasks autonomously in the physical world."
            )
        
        import re
        words = set(re.findall(r'\b\w+\b', query_lower))
        greetings = {"hello", "hi", "hey"}
        if any(g in words for g in greetings):
            return "Hello! I am Aura, your AI learning assistant. How can I help you today? You can ask me questions about your note or ask any general topic questions."

        if "machine learning" in query_lower:
            return (
                "### Machine Learning (ML) Overview\n\n"
                "**Machine Learning (ML)** is a subset of Artificial Intelligence (AI) focused on building systems that learn from data and improve their performance over time without being explicitly programmed to do so.\n\n"
                "#### How Machine Learning Works:\n"
                "1. **Data Collection**: Gathering training examples (features and labels).\n"
                "2. **Model Training**: Feeding data into algorithms to recognize patterns.\n"
                "3. **Evaluation**: Testing model predictions on unseen data.\n"
                "4. **Inference**: Deploying the model to make predictions in real-world scenarios."
            )

        if "cloud computing" in query_lower:
            return (
                "### Cloud Computing Overview\n\n"
                "**Cloud Computing** is the delivery of computing services—including servers, storage, databases, networking, software, analytics, and intelligence—over the Internet ('the cloud') to offer faster innovation, flexible resources, and economies of scale.\n\n"
                "#### Key Types of Cloud Services:\n"
                "- **Infrastructure as a Service (IaaS)**: Renting IT infrastructure (servers, VMs, storage, networks) from a cloud provider on a pay-as-you-go basis.\n"
                "- **Platform as a Service (PaaS)**: Providing a demand-driven environment for developing, testing, delivering, and managing software applications.\n"
                "- **Software as a Service (SaaS)**: Delivering software applications over the internet, typically on a subscription basis (like Aura AI!)."
            )

        if "python" in query_lower:
            return (
                "### Python Programming Language\n\n"
                "**Python** is an interpreted, high-level, general-purpose programming language. Its design philosophy emphasizes code readability with its notable use of significant whitespace.\n\n"
                "#### Key Features:\n"
                "- **Readable and Simple**: Easy-to-read syntax that mirrors English, reducing the cost of program maintenance.\n"
                "- **Dynamically Typed**: You don't need to specify variable types during creation.\n"
                "- **Extensive Ecosystem**: Powerful frameworks for Web (FastAPI, Django), Data Science (Pandas, NumPy), and AI (PyTorch, TensorFlow)."
            )

        return (
            f"### Overview of {query}\n\n"
            f"Here is a structured explanation addressing your query about **{query}**:\n\n"
            f"- **Core Concept**: It represents a critical topic in this field, focusing on modularity, scalability, and systematic application.\n"
            f"- **Detailed Context**: In the context of your active document, this topic connects to the key learning objectives and summary sections.\n"
            f"- **Next Steps**: You can verify these details, take a generated quiz, or check out flashcards to reinforce your understanding."
        )

llm_service = LLMService()
