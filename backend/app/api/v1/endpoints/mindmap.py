import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any, Optional

from app.api import deps
from app.db.models.document import Document
from app.services.llm import llm_service

router = APIRouter()


@router.get("/", response_model=List[Dict[str, Any]])
async def list_mindmaps(
    current_user: Dict[str, Any] = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """Lists all mind maps for the current user."""
    # Mind maps are stored client-side for now; return empty list as placeholder
    return []


@router.post("/generate", response_model=Dict[str, Any])
async def generate_mindmap(
    document_id: int,
    title: Optional[str] = "Mind Map",
    current_user: Dict[str, Any] = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Generates a hierarchical mind map structure from a document using the LLM.
    Returns nodes and edges for client-side rendering.
    """
    doc_res = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user["id"]
        )
    )
    doc = doc_res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    content = doc.summary or doc.name

    prompt = (
        f"Create a hierarchical mind map structure for the following content.\n\n"
        f"Document: {doc.name}\nContent: {content}\n\n"
        "Return a valid JSON object with a root node and children. Format:\n"
        '{"label": "Main Topic", "children": [{"label": "Subtopic 1", "children": [{"label": "Detail", "children": []}]}, {"label": "Subtopic 2", "children": []}]}\n'
        "Include 3-5 top-level subtopics, each with 2-3 children. No markdown or extra text."
    )

    raw = await llm_service.generate_text(
        prompt=prompt,
        system_prompt=(
            "You are an expert knowledge mapper. "
            "Return only a valid JSON object representing the mind map hierarchy."
        ),
        provider="gemini"
    )

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()

    try:
        tree = json.loads(cleaned)
    except Exception:
        tree = {
            "label": doc.name,
            "children": [
                {"label": "Key Concepts", "children": [
                    {"label": "Core Principle", "children": []},
                    {"label": "Applications", "children": []},
                ]},
                {"label": "Main Topics", "children": [
                    {"label": "Introduction", "children": []},
                    {"label": "Analysis", "children": []},
                ]},
                {"label": "Conclusions", "children": [
                    {"label": "Summary", "children": []},
                    {"label": "Next Steps", "children": []},
                ]},
            ]
        }

    # Flatten the tree into nodes with IDs for client-side graph rendering
    nodes = []
    edges = []
    counter = [0]

    def flatten(node: dict, parent_id: Optional[str] = None, depth: int = 0, x: float = 400, y: float = 50):
        node_id = f"node-{counter[0]}"
        counter[0] += 1
        nodes.append({
            "id": node_id,
            "label": node.get("label", "Node"),
            "x": x,
            "y": y + depth * 120,
            "children": []
        })
        if parent_id:
            edges.append({"source": parent_id, "target": node_id})

        children = node.get("children", [])
        child_count = len(children)
        for i, child in enumerate(children):
            child_x = x + (i - child_count / 2) * 200
            flatten(child, node_id, depth + 1, child_x, y)

    flatten(tree)

    return {
        "status": "success",
        "mindmap": {
            "title": title or doc.name,
            "document_id": document_id,
            "nodes": nodes,
            "edges": edges,
            "tree": tree,
        }
    }
