from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from app.api import deps
from app.services.llm import llm_service

router = APIRouter()

@router.post("/search", response_model=List[Dict[str, Any]])
async def crawl_academic_records(
    query: str,
    sources: List[str] = ["arXiv", "PubMed", "OpenAlex"],
    current_user: Dict[str, Any] = Depends(deps.get_current_user)
):
    """
    Crawls open academic directories matching search queries.
    """
    # Simulated search queries from academic databases
    results = [
        {
            "title": f"Evolutionary pathways in cell bioenergetics matching {query}",
            "authors": "A. Mercer, T. Schwann",
            "journal": "Journal of Cellular respiration",
            "year": 2025,
            "doi": "10.1016/j.cell.2025.10.012",
            "source": "PubMed",
            "snippet": "We present detailed structural models of inner mitochondrial cristae folding parameters."
        },
        {
            "title": f"Transformers and Attention limits in {query} processing",
            "authors": "J. Alammar",
            "journal": "arXiv Preprints",
            "year": 2024,
            "doi": "arXiv:2406.12051",
            "source": "arXiv",
            "snippet": "This paper analyzes the computational bottlenecks of dense self-attention operations."
        }
    ]
    return results

@router.post("/synthesize", response_model=Dict[str, Any])
async def generate_synthesis_report(
    topic: str,
    materials: List[str],
    current_user: Dict[str, Any] = Depends(deps.get_current_user)
):
    """
    Aggregates search results and generates a research synthesis report.
    """
    compiled_materials = "\n\n".join([f"Material [{idx+1}]: {m}" for idx, m in enumerate(materials)])
    
    prompt = (
        f"We are researching: {topic}.\n"
        f"Synthesize the following materials into a professional academic report outline:\n\n{compiled_materials}"
    )

    synthesis_report = await llm_service.generate_text(
        prompt=prompt,
        system_prompt="You are an advanced academic research compiler. Outline findings logically.",
        provider="gemini"
    )

    return {
        "topic": topic,
        "report": synthesis_report,
        "references_used": len(materials)
    }
