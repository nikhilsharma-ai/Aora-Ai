import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#6D28D9'),
        alignment=TA_CENTER,
        spaceAfter=10
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#4B5563'),
        alignment=TA_CENTER,
        spaceAfter=18
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#5B21B6'),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['BodyText'],
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1F2937'),
        spaceAfter=6
    )

    q_style = ParagraphStyle(
        'QuestionStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#4C1D95'),
        fontName='Helvetica-Bold',
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    a_style = ParagraphStyle(
        'AnswerStyle',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#374151'),
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'BulletStyle',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1F2937'),
        leftIndent=12,
        spaceAfter=3
    )

    story = []

    # Title Banner
    story.append(Paragraph("🚀 Aora AI — Complete Technical Reference", title_style))
    story.append(Paragraph("System Architecture, RAG Deep Dive, Tech Stack & Comprehensive Interview Q&A Guide", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#7C3AED'), spaceAfter=14))

    # SECTION 1: TECH STACK & TOOLS
    story.append(Paragraph("1. Tech Stack, Tools & Languages Breakdown", h1_style))
    story.append(Paragraph(
        "Aora AI is an interactive, production-ready AI learning SaaS platform that converts textbooks, PDFs, audio recordings, "
        "and YouTube videos into structured textbook-depth study guides, practice quizzes, and RAG-powered interactive workspace chat.",
        body_style
    ))

    # Tech Stack Table
    tech_data = [
        [Paragraph("<b>Category</b>", body_style), Paragraph("<b>Technologies Used</b>", body_style), Paragraph("<b>Why Used (Technical Rationale)</b>", body_style)],
        [
            Paragraph("<b>Frontend Framework</b>", body_style),
            Paragraph("Next.js 16 (React 19, TypeScript)", body_style),
            Paragraph("Server-Side Rendering (SSR) for fast initial paint, optimized route prefetching, typed props for safety, and seamless Vercel deployment.", body_style)
        ],
        [
            Paragraph("<b>Frontend Styling & State</b>", body_style),
            Paragraph("Tailwind CSS v4, Lucide Icons, Zustand", body_style),
            Paragraph("Utility-first glassmorphism design system. Zustand provides lightweight global state management for chat sessions and active notes without Context re-render overhead.", body_style)
        ],
        [
            Paragraph("<b>Authentication</b>", body_style),
            Paragraph("Clerk Authentication", body_style),
            Paragraph("Enterprise-grade JWT session handling, social auth (Google/GitHub), and seamless frontend-backend security delegation.", body_style)
        ],
        [
            Paragraph("<b>Backend Web API</b>", body_style),
            Paragraph("Python 3.10+, FastAPI, Uvicorn", body_style),
            Paragraph("Asynchronous ASGI execution framework with ultra-low latency, native async/await for IO operations (LLM APIs/Qdrant), Pydantic auto-validation, and OpenAPI docs.", body_style)
        ],
        [
            Paragraph("<b>Database & ORM</b>", body_style),
            Paragraph("PostgreSQL (Neon DB), SQLAlchemy 2.0 (Asyncpg)", body_style),
            Paragraph("Relational persistence for users, notes, quizzes, and chat messages. Asyncpg driver handles non-blocking database queries under high concurrency.", body_style)
        ],
        [
            Paragraph("<b>Task Queue & Cache</b>", body_style),
            Paragraph("Celery, Redis (Upstash Redis)", body_style),
            Paragraph("Offloads long-running CPU & network tasks (audio extraction, YouTube transcription, chunking, vector embedding) to background workers without blocking HTTP responses.", body_style)
        ],
        [
            Paragraph("<b>Vector Database</b>", body_style),
            Paragraph("Qdrant Cloud (1536-dim vectors)", body_style),
            Paragraph("High-performance vector search engine supporting metadata payload filtering (`user_id`, `document_id`) for precise Retrieval-Augmented Generation (RAG).", body_style)
        ],
        [
            Paragraph("<b>AI Models & LLMs</b>", body_style),
            Paragraph("Google Gemini 2.5 Flash, Groq Llama 3.3, OpenAI GPT-4o", body_style),
            Paragraph("Multi-provider fallback pipeline. Gemini Flash supports 1M token context for long video processing; Groq provides ultra-fast inference backup.", body_style)
        ]
    ]

    t = Table(tech_data, colWidths=[95, 145, 300])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F3E8FF')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#5B21B6')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    # SECTION 2: SYSTEM ARCHITECTURE & FLOW
    story.append(Paragraph("2. System Architecture & Execution Flow", h1_style))
    story.append(Paragraph(
        "The application follows an asynchronous decoupled architecture designed for high availability and low latency:",
        body_style
    ))
    story.append(Paragraph("• <b>1. Ingestion Phase:</b> User uploads a PDF, DOCX, Audio file, or inputs a YouTube URL via Next.js frontend.", bullet_style))
    story.append(Paragraph("• <b>2. Async Queue Handoff:</b> FastAPI receives the request and immediately dispatches a task to Celery + Redis, returning a 202 Accepted response.", bullet_style))
    story.append(Paragraph("• <b>3. Text & Audio Extraction:</b> Background workers run <code>pypdf</code>, <code>docx</code>, <code>youtube_transcript_api</code> or fallback <code>yt-dlp</code> + <code>Whisper</code>/<code>Gemini</code> to extract raw text.", bullet_style))
    story.append(Paragraph("• <b>4. Chunking & Indexing:</b> Text is split into overlapping chunks (1000 chars, 200 char overlap) and upserted into Qdrant Vector DB with deterministic UUIDs.", bullet_style))
    story.append(Paragraph("• <b>5. LLM Synthesis:</b> Multi-provider LLM pipeline generates textbook-depth Markdown notes (2000-5000+ words) formatted with rich sections and cheat sheets.", bullet_style))
    story.append(Spacer(1, 10))

    # SECTION 3: RAG DEEP DIVE
    story.append(Paragraph("3. How RAG (Retrieval-Augmented Generation) Works in Aora AI", h1_style))
    story.append(Paragraph(
        "Retrieval-Augmented Generation (RAG) grounds LLM responses in private user data (e.g. uploaded video transcripts or lecture notes) to eliminate hallucinations:",
        body_style
    ))

    rag_steps = [
        [Paragraph("<b>RAG Phase</b>", body_style), Paragraph("<b>Technical Implementation in Aora AI</b>", body_style)],
        [
            Paragraph("<b>1. Ingestion & Embedding</b>", body_style),
            Paragraph("Raw document text is chunked into 1000-character blocks with 200-character overlaps. Each chunk is converted into a 1536-dimensional vector embedding and stored in Qdrant along with payload metadata (`user_id`, `document_id`, `text`).", body_style)
        ],
        [
            Paragraph("<b>2. Contextual Query Retrieval</b>", body_style),
            Paragraph("When a user asks a question inside a document note, the query vector is searched against Qdrant. A payload filter (`user_id == active_user` AND `document_id == target_doc`) isolates top-K cosine similarity chunks.", body_style)
        ],
        [
            Paragraph("<b>3. Prompt Augmentation</b>", body_style),
            Paragraph("Retrieved context chunks are formatted into the LLM system prompt: <code>Document Context: [Chunk 1, Chunk 2] \\n\\n User Question: ...</code>. This restricts the LLM to facts present in the text.", body_style)
        ],
        [
            Paragraph("<b>4. General vs Scoped Chat Handling</b>", body_style),
            Paragraph("For global chat queries without a target document ID, RAG vector lookup is bypassed so the assistant answers general queries directly using native knowledge without false context errors.", body_style)
        ]
    ]
    rag_t = Table(rag_steps, colWidths=[130, 410])
    rag_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#DDD6FE')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(rag_t)
    story.append(Spacer(1, 10))

    # SECTION 4: INTERVIEW QUESTIONS & ANSWERS
    story.append(Paragraph("4. Comprehensive Technical Interview Questions & Answers", h1_style))

    qa_list = [
        (
            "Q1: Why did you choose FastAPI over Flask or Django for the backend?",
            "FastAPI is natively built on asyncio and Starlette, making it 2 to 3 times faster than traditional synchronous frameworks like Flask or Django for IO-bound workloads (e.g. calling external Gemini/OpenAI APIs, PostgreSQL database queries, and vector DB searches). Additionally, FastAPI provides automatic Pydantic data validation and instant OpenAPI documentation generation."
        ),
        (
            "Q2: Why do you use Celery and Redis for document and YouTube processing?",
            "Extracting YouTube transcripts, processing long PDFs, or running audio downloads via `yt-dlp` can take anywhere from 15 to 90 seconds. If done inside a standard FastAPI HTTP route, it would block server worker threads and cause HTTP 504 gateway timeouts on client browsers. By delegating work to Celery workers backed by Upstash Redis, the API returns an instant HTTP 202 response while the background worker processes the document asynchronously."
        ),
        (
            "Q3: How does RAG eliminate LLM hallucinations in your platform?",
            "Standard LLMs rely purely on pre-trained parametric weights, which can hallucinate facts when asked about specific course materials. Our RAG architecture converts the student's actual document into vector embeddings stored in Qdrant. When a user asks a question, we query Qdrant for top matching text chunks and inject them directly into the LLM prompt context. This grounds the LLM strictly in factual source material."
        ),
        (
            "Q4: How did you debug and resolve the issue where every YouTube video generated the exact same 'Data Structures' study note?",
            "During root cause analysis of system logs, I discovered three chained issues: (1) `youtube_transcript_api` had an invalid method invocation (`.list()` instead of `.list_transcripts()`), causing transcript extraction to fail; (2) the fallback `yt-dlp` command had a 12-second timeout, which timed out on audio downloads; (3) when both failed, a fallback handler set `doc_content` to a hardcoded string containing 'data structures, algorithms'. The LLM then generated Data Structures notes for every video. I fixed this by correcting the transcript API call, increasing `yt-dlp` timeout to 120s with `--no-playlist`, and replacing the hardcoded template with a dynamic topic framework derived from the video title."
        ),
        (
            "Q5: How do you handle LLM rate limits and API failures in production?",
            "We implemented a resilient multi-provider fallback pattern in `llm_service.py`. The primary request targets Google Gemini 2.5 Flash. If Gemini throws a 429 Quota Exceeded error, the execution seamlessly fails over to Groq (Llama 3.3 70B), then OpenAI (GPT-4o), and finally a structured offline mock generator. This guarantees 99.9% application uptime for the user."
        ),
        (
            "Q6: How are database transactions handled asynchronously in SQLAlchemy?",
            "We use SQLAlchemy 2.0 with the `asyncpg` engine. Sessions are managed using `async_sessionmaker` and injected into FastAPI endpoints using dependency injection (`AsyncSession = Depends(deps.get_db)`). All DB interactions use `await db.execute()` and `await db.commit()` within explicit try/except blocks to ensure automatic rollback (`await db.rollback()`) on failure."
        ),
        (
            "Q7: How do you secure API endpoints and manage authentication?",
            "Authentication is powered by Clerk JWT tokens. The Next.js frontend sends an `Authorization: Bearer <token>` header with every request. In FastAPI, a custom security dependency (`deps.get_current_user`) decodes the token claims and verifies the signature using Clerk's public JWT key, automatically syncing or fetching the user profile in PostgreSQL."
        ),
        (
            "Q8: How is CORS handled across separate frontend (Vercel) and backend (Render) deployments?",
            "CORS is configured in FastAPI using `CORSMiddleware`. We explicitly whitelist production origins and configure dynamic regex matching (`allow_origin_regex=r'https://.*\\.vercel\\.app'`). This allows Vercel preview builds and production domains to securely make authenticated cross-origin HTTP requests."
        )
    ]

    for q, a in qa_list:
        story.append(Paragraph(q, q_style))
        story.append(Paragraph(a, a_style))

    doc.build(story)
    print(f"Successfully generated PDF: {filename}")

if __name__ == "__main__":
    out_pdf = os.path.join("c:\\Users\\HP\\Desktop\\saas.ai", "Aora_AI_Project_Architecture_and_Interview_Guide.pdf")
    build_pdf(out_pdf)
