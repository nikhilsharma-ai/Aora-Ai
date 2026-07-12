import json
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from app.api import deps
from app.services.llm import llm_service

router = APIRouter()

@router.post("/generate", response_model=Dict[str, Any])
async def generate_concept_mindmap(
    text_content: str,
    root_title: str = "Core Concept",
    current_user: Dict[str, Any] = Depends(deps.get_current_user)
):
    """
    Extracts core entities and relationships from raw text,
    returning structured mind map nodes with coordinates.
    """
    prompt = (
        f"Analyze the following text content and extract 4 main related sub-concepts pointing from root: '{root_title}':\n\n"
        f"{text_content}\n\n"
        "Return the concept graph in JSON format mapping coordinates (x from 100 to 500, y from 100 to 500), like:\n"
        '{"nodes": [{"id": "root", "label": "Root", "x": 250, "y": 150, "children": ["child1"]}, '
        '{"id": "child1", "label": "Child", "x": 100, "y": 250, "children": []}]}'
    )

    llm_output = await llm_service.generate_text(
        prompt=prompt,
        system_prompt="You are a graph visualization builder. Return only valid JSON mappings.",
        provider="gemini"
    )

    try:
        graph_data = json.loads(llm_output)
    except Exception:
        # Static mockup fallback coordinates
        graph_data = {
            "nodes": [
                {"id": "root", "label": root_title, "x": 250, "y": 150, "children": ["n1", "n2"]},
                {"id": "n1", "label": "Cell Respiration", "x": 120, "y": 280, "children": []},
                {"id": "n2", "label": "Mitochondria Membrane", "x": 380, "y": 280, "children": []}
            ]
        }

    return {
        "title": root_title,
        "nodes": graph_data.get("nodes", [])
    }
