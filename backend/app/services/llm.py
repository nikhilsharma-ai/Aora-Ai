import asyncio
import logging
from typing import Optional
from app.core.config import settings

CHUNK_CHAR_LIMIT = 60000        # characters per transcript chunk sent to LLM
MAX_OUTPUT_TOKENS = 65536       # max tokens Gemini can output per call (gemini-2.5-flash supports up to 65536)
LONG_VIDEO_THRESHOLD = 30000    # chars; above this we use chunked processing (~10-15 min video)

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        # Lazy imports/initializations to prevent crashes if keys are not set yet
        self._openai_client = None
        self._anthropic_client = None
        self._gemini_configured = False
        self._groq_client = None

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
            try:
                from google import genai as new_genai  # new SDK (google-genai)
                self._gemini_configured = True
            except ImportError:
                try:
                    import google.generativeai as genai  # fallback to old SDK
                    genai.configure(api_key=settings.GEMINI_API_KEY)
                    self._gemini_configured = True
                except ImportError:
                    pass
        return self._gemini_configured

    def _get_groq(self):
        if not self._groq_client and settings.GROQ_API_KEY:
            from openai import OpenAI
            self._groq_client = OpenAI(
                api_key=settings.GROQ_API_KEY,
                base_url="https://api.groq.com/openai/v1"
            )
        return self._groq_client

    async def generate_text(
        self,
        prompt: str,
        system_prompt: str = "You are Aora AI, an advanced tutoring assistant.",
        provider: str = "gemini",
        temperature: float = 0.3
    ) -> str:
        """
        Routes text completions to target models.
        Supports provider strings: "openai", "claude", "gemini", "groq"
        """
        # Determine actual providers to try based on configured credentials
        resolved_providers = []
        
        # Check if the requested provider is configured and add it first
        if provider == "gemini" and self._setup_gemini():
            resolved_providers.append("gemini")
        elif provider == "groq" and self._get_groq():
            resolved_providers.append("groq")
        elif provider == "openai" and self._get_openai():
            resolved_providers.append("openai")
        elif provider == "claude" and self._get_anthropic():
            resolved_providers.append("claude")

        # Add other configured providers as fallbacks
        for p in ["gemini", "openai", "claude", "groq"]:
            if p not in resolved_providers:
                if p == "gemini" and self._setup_gemini():
                    resolved_providers.append(p)
                elif p == "groq" and self._get_groq():
                    resolved_providers.append(p)
                elif p == "openai" and self._get_openai():
                    resolved_providers.append(p)
                elif p == "claude" and self._get_anthropic():
                    resolved_providers.append(p)

        if not resolved_providers:
            resolved_providers.append("mock")

        errors = []
        for current_provider in resolved_providers:
            if current_provider == "mock":
                break

            try:
                # 1. Google Gemini — run blocking SDK call in thread pool to avoid blocking the event loop
                if current_provider == "gemini":
                    try:
                        from google import genai as new_genai  # new google-genai SDK
                        client = new_genai.Client(api_key=settings.GEMINI_API_KEY)
                        def _call_gemini_new():
                            response = client.models.generate_content(
                                model="gemini-2.5-flash",
                                contents=f"{system_prompt}\n\n{prompt}",
                                config=new_genai.types.GenerateContentConfig(
                                    temperature=temperature,
                                    max_output_tokens=MAX_OUTPUT_TOKENS,
                                )
                            )
                            return response.text
                        response_text = await asyncio.wait_for(
                            asyncio.to_thread(_call_gemini_new),
                            timeout=600.0
                        )
                        return response_text
                    except ImportError:
                        # Fall back to old SDK
                        import google.generativeai as genai
                        genai.configure(api_key=settings.GEMINI_API_KEY)
                        model = genai.GenerativeModel(
                            model_name="gemini-2.5-flash",
                            system_instruction=system_prompt
                        )
                        def _call_gemini():
                            return model.generate_content(
                                prompt,
                                generation_config={
                                    "temperature": temperature,
                                    "max_output_tokens": MAX_OUTPUT_TOKENS,
                                }
                            )
                        response = await asyncio.wait_for(
                            asyncio.to_thread(_call_gemini),
                            timeout=600.0
                        )
                        return response.text

                # 2. OpenAI GPT-4o — also blocking, run in thread
                elif current_provider == "openai":
                    client = self._get_openai()
                    def _call_openai():
                        return client.chat.completions.create(
                            model="gpt-4o",
                            messages=[
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": prompt}
                            ],
                            temperature=temperature
                        )
                    response = await asyncio.wait_for(
                        asyncio.to_thread(_call_openai),
                        timeout=60.0
                    )
                    return response.choices[0].message.content or ""

                # 3. Anthropic Claude 3.5 Sonnet — also blocking, run in thread
                elif current_provider == "claude":
                    client = self._get_anthropic()
                    def _call_claude():
                        return client.messages.create(
                            model="claude-3-5-sonnet-20240620",
                            max_tokens=4000,
                            system=system_prompt,
                            messages=[{"role": "user", "content": prompt}],
                            temperature=temperature
                        )
                    response = await asyncio.wait_for(
                        asyncio.to_thread(_call_claude),
                        timeout=60.0
                    )
                    return response.content[0].text if response.content else ""

                # 4. Groq Llama 3.3 — run in thread
                elif current_provider == "groq":
                    client = self._get_groq()
                    def _call_groq():
                        return client.chat.completions.create(
                            model="llama-3.3-70b-versatile",
                            messages=[
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": prompt}
                            ],
                            temperature=temperature
                        )
                    response = await asyncio.wait_for(
                        asyncio.to_thread(_call_groq),
                        timeout=60.0
                    )
                    return response.choices[0].message.content or ""

            except asyncio.TimeoutError:
                logger.error(f"Timeout after waiting for provider {current_provider}")
                errors.append(f"{current_provider}: timeout")
            except Exception as e:
                logger.error(f"Error in generate_text with provider {current_provider}: {e}")
                errors.append(f"{current_provider}: {e}")

        # Fall back to mock response if all providers failed or mock is the only option
        logger.error(f"All configured providers failed ({', '.join(errors)}). Falling back to mock learning response.")
        return self._mock_learning_response(prompt)

        return self._mock_learning_response(prompt)

    async def generate_long_notes(
        self,
        transcript: str,
        doc_name: str,
        system_prompt: str,
        provider: str = "gemini",
    ) -> str:
        """
        For very long transcripts (3+ hour videos), splits the transcript into overlapping
        chunks, generates detailed notes per chunk, then merges everything into one
        cohesive structured Markdown document.
        """
        if len(transcript) <= LONG_VIDEO_THRESHOLD:
            # Short enough — single call, no chunking needed
            word_count = len(transcript.split())
            user_prompt = (
                f"Below is the COMPLETE transcript of '{doc_name}' ({word_count} words). "
                "Your task is to produce EXHAUSTIVE, TEXTBOOK-QUALITY Markdown study notes. "
                "This is NOT a summary — it is a comprehensive knowledge document. "
                "EVERY concept, term, command, example, comparison, anecdote, and workflow "
                "from the transcript MUST appear in the notes with full explanation.\n\n"
                "━━━ STRICT CONTENT RULES ━━━\n"
                "• LENGTH: Your output must be AT LEAST 1500 words. Longer is always better.\n"
                "• COVERAGE: Go through the transcript sequentially. Do NOT skip any topic.\n"
                "• DEPTH: Each concept needs 2-5 sentences of explanation, not just a bullet point.\n"
                "• EXAMPLES: Reproduce ALL code snippets, commands, and formulas verbatim.\n"
                "• NO TRUNCATION: Never write '...' or 'continued below'. Write everything out fully.\n"
                "• NO SUMMARY SHORTCUTTING: Do not replace detailed content with 'see transcript'.\n\n"
                f"TRANSCRIPT:\n\"\"\"\n{transcript}\n\"\"\"\n\n"
                "━━━ REQUIRED OUTPUT STRUCTURE ━━━\n"
                "1. `# emoji Topic Name` — single main title\n"
                "2. `## 📖 Brief Overview` — 4-6 sentence professional summary naming the video\n"
                "3. `## 🔑 Key Points` — 10-15 detailed bullet points, each 1-2 sentences\n"
                "4. ONE `## emoji Section Title` PER MAJOR TOPIC (create as many sections as needed):\n"
                "   - `### emoji Sub-topic` h3 headings for every sub-concept\n"
                "   - `> **Term**: full definition` blockquotes for every definition\n"
                "   - Full Markdown tables with headers for all comparisons\n"
                "   - Fenced code blocks with language tag for all code/commands\n"
                "   - Numbered steps for every workflow/process\n"
                "   - Explanatory paragraphs (2-4 sentences) after each h3\n"
                "5. `## 📋 Quick Reference Cheat Sheet` — comprehensive table of ALL commands/terms/formulas\n\n"
                "FINAL REMINDER: This note replaces a textbook chapter. Write accordingly. "
                "The student has paid for premium content and expects nothing less than complete coverage."
            )
            return await self.generate_text(
                prompt=user_prompt,
                system_prompt=system_prompt,
                provider=provider,
            )

        # --- Chunked processing for long transcripts ---
        logger.info(f"[LLM] Transcript length {len(transcript)} chars — using chunked processing.")

        # Split transcript into overlapping chunks
        overlap = 2000  # chars overlap between consecutive chunks to preserve context
        chunks = []
        start = 0
        while start < len(transcript):
            end = start + CHUNK_CHAR_LIMIT
            chunks.append(transcript[start:end])
            start = end - overlap  # back-step by overlap for continuity
            if start >= len(transcript):
                break

        total_chunks = len(chunks)
        logger.info(f"[LLM] Split transcript into {total_chunks} chunks for '{doc_name}'")

        chunk_notes = []
        for idx, chunk in enumerate(chunks):
            part_label = f"Part {idx + 1} of {total_chunks}"
            chunk_words = len(chunk.split())
            logger.info(f"[LLM] Generating notes for {part_label} ({chunk_words} words)...")
            chunk_prompt = (
                f"You are processing {part_label} of {total_chunks} of a long transcript for '{doc_name}'.\n"
                f"This chunk contains approximately {chunk_words} words of content.\n\n"
                "━━━ YOUR TASK ━━━\n"
                "Generate EXHAUSTIVE, DETAILED Markdown study notes for THIS CHUNK ONLY.\n"
                "Do NOT write an introduction, overview, or conclusion — jump straight into topic sections.\n\n"
                "━━━ STRICT RULES ━━━\n"
                f"• LENGTH: Write AT LEAST 800 words of notes for this chunk. More is better.\n"
                "• COVERAGE: Every concept, term, command, and example in this chunk must appear.\n"
                "• DEPTH: Each topic needs a proper explanation paragraph (2-4 sentences), not just a heading.\n"
                "• CODE: Reproduce ALL code snippets and commands in fenced code blocks with language tags.\n"
                "• DEFINITIONS: Use `> **Term**: explanation` blockquotes for every new term.\n"
                "• COMPARISONS: Use full Markdown tables for any comparison or list of options.\n"
                "• STEPS: Use numbered lists for any workflow, process, or sequence.\n"
                "• NO TRUNCATION: Never use '...' or 'see above'. Write every detail out completely.\n\n"
                "━━━ FORMAT ━━━\n"
                "Use `## emoji Section Title` for each major topic.\n"
                "Use `### emoji Sub-topic` for sub-concepts within each section.\n"
                "End each major section with a mini summary table if applicable.\n\n"
                f"TRANSCRIPT CHUNK:\n\"\"\"\n{chunk}\n\"\"\""
            )
            part_notes = await self.generate_text(
                prompt=chunk_prompt,
                system_prompt=system_prompt,
                provider=provider,
            )
            if part_notes and len(part_notes) > 100:
                chunk_notes.append(part_notes)

        if not chunk_notes:
            return self._mock_learning_response(doc_name)

        # --- Merge all chunk notes into one final cohesive document ---
        logger.info(f"[LLM] Merging {len(chunk_notes)} chunk notes into final document...")
        combined_sections = "\n\n---\n\n".join(chunk_notes)
        total_section_chars = len(combined_sections)
        if total_section_chars > 12000:
            logger.info("[LLM] Combined notes are very long. Generating cohesive header and concatenating sections to avoid LLM truncation.")
            header_prompt = (
                f"You have generated detailed study notes for a video titled '{doc_name}'.\n"
                "To create a cohesive master document, you need to write a professional header for the notes.\n\n"
                "━━━ YOUR TASK ━━━\n"
                "Write the introductory section of the master study guide. Only reply with the following sections in Markdown:\n"
                f"1. `# 📚 {doc_name}` - main title\n"
                "2. `## 📖 Brief Overview` - a comprehensive 5-7 sentence overview of the video's scope, key themes, and target audience.\n"
                "3. `## 🔑 Key Points` - 8-12 detailed, high-impact bullet points summarizing the core takeaways (each 1-2 sentences).\n\n"
                f"SECTION NOTES REFERENCE:\n\"\"\"\n{combined_sections[:15000]}\n\"\"\""
            )
            header = await self.generate_text(
                prompt=header_prompt,
                system_prompt=system_prompt,
                provider=provider,
            )
            if header and len(header) > 100:
                merged = header + "\n\n" + combined_sections
            else:
                header = (
                    f"# 📚 {doc_name}\n\n"
                    f"## 📖 Brief Overview\n"
                    f"These are comprehensive study notes generated from the video **{doc_name}**.\n\n"
                    f"## 🔑 Key Points\nSee individual sections below for detailed key points.\n\n"
                )
                merged = header + combined_sections
            return merged

        merge_prompt = (
            f"You have generated detailed section notes for a long video titled '{doc_name}' in {total_chunks} parts.\n"
            f"The combined notes are {total_section_chars} characters long.\n"
            "Your job is to produce the FINAL, COMPLETE merged Markdown document.\n\n"
            "━━━ MERGE INSTRUCTIONS ━━━\n"
            f"1. Add `# 📚 {doc_name}` as the single main title.\n"
            "2. Add `## 📖 Brief Overview` (5-7 sentences) summarising the full video.\n"
            "3. Add `## 🔑 Key Points` with 12-18 bullet points (2 sentences each) covering the whole video.\n"
            "4. DEDUPLICATE: merge any repeated topic sections into one authoritative section.\n"
            "5. PRESERVE EVERYTHING: keep ALL unique explanations, code blocks, tables, definitions, and examples.\n"
            "6. MAINTAIN DEPTH: do not shorten or summarise any section — keep the full explanation.\n"
            "7. ORDER: arrange sections logically by concept, not by video timestamp.\n"
            "8. Add `## 📋 Quick Reference Cheat Sheet` at the end — a comprehensive table of ALL commands/terms/formulas.\n"
            "9. ABSOLUTELY NO TRUNCATION. The merged document must be complete and exhaustive.\n\n"
            "━━━ CRITICAL ━━━\n"
            "The final output MUST be longer than any individual part. "
            "This is a premium study guide, not a summary. Every detail matters.\n\n"
            f"SECTION NOTES TO MERGE:\n\"\"\"\n{combined_sections}\n\"\"\""
        )

        merged = await self.generate_text(
            prompt=merge_prompt,
            system_prompt=system_prompt,
            provider=provider,
        )

        # Fallback: if merge fails or returns too little, just join parts directly
        if not merged or len(merged) < 500:
            logger.warning("[LLM] Merge step returned too little content — using direct concatenation fallback.")
            header = (
                f"# 📚 {doc_name}\n\n"
                f"## 📖 Brief Overview\n"
                f"These are comprehensive notes generated from the video **{doc_name}**. "
                f"The content has been organized by topic for easier studying.\n\n"
                f"## 🔑 Key Points\nSee individual sections below for detailed key points.\n\n"
            )
            merged = header + "\n\n".join(chunk_notes)

        return merged

    def _mock_learning_response(self, prompt: str) -> str:
        """Smarter offline mock response callback when API keys are unconfigured or fail"""
        # Extract clean query if embedded in context template
        query = prompt.split("User Query:")[-1].strip() if "User Query:" in prompt else prompt
        query_lower = query.lower()

        # If it's a transcript/document generation prompt, extract the doc name
        doc_name = "Document"
        if "full transcript of '" in query_lower:
            import re
            match = re.search(r"full transcript of '([^']+)'", query)
            if match:
                doc_name = match.group(1)
        elif "transcript of '" in query_lower:
            import re
            match = re.search(r"transcript of '([^']+)'", query)
            if match:
                doc_name = match.group(1)

        # Only perform specific keyword matching for actual user chat queries
        if len(query) < 300:
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
        
        # Only perform specific keyword matching for actual user chat queries
        if len(query) < 300:
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

        # For long document/transcript generation fallback
        return (
            f"### Overview of {doc_name}\n\n"
            f"Here is a structured explanation addressing the content of **{doc_name}**:\n\n"
            f"- **Core Concept**: It represents a critical topic in this field, focusing on modularity, scalability, and systematic application.\n"
            f"- **Detailed Context**: In the context of your active document, this topic connects to the key learning objectives and summary sections.\n"
            f"- **Next Steps**: You can verify these details, take a generated quiz, or check out flashcards to reinforce your understanding."
        )

llm_service = LLMService()
