import traceback
from youtube_transcript_api import YouTubeTranscriptApi

video_id = "AB3J8ufDYHQ"
try:
    transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
    
    manual_transcripts = {}
    generated_transcripts = {}
    for t in transcript_list:
        if not t.is_generated:
            manual_transcripts[t.language_code] = t
        else:
            generated_transcripts[t.language_code] = t
    
    preferred = None
    if 'hi' in manual_transcripts:
        preferred = manual_transcripts['hi']
    elif 'en' in manual_transcripts:
        preferred = manual_transcripts['en']
    elif 'hi' in generated_transcripts:
        preferred = generated_transcripts['hi']
    elif 'en' in generated_transcripts:
        preferred = generated_transcripts['en']
    elif manual_transcripts:
        preferred = next(iter(manual_transcripts.values()))
    elif generated_transcripts:
        preferred = next(iter(generated_transcripts.values()))
    else:
        preferred = next(iter(transcript_list))
        
    transcript = preferred
    print("Selected language:", transcript.language_code)
    
    fetched_data = transcript.fetch()
    print("Fetched data length:", len(fetched_data))
    
    print("Building clean text...")
    clean_text = " ".join([
        (snippet.text if hasattr(snippet, "text") else snippet.get("text", "")) 
        for snippet in fetched_data
    ])
    print("Clean text length:", len(clean_text))
    
    # Write output to file instead of printing directly to Windows console to avoid encoding issues
    with open("transcript_output.txt", "w", encoding="utf-8") as f:
        f.write(clean_text[:500])
    print("Successfully wrote preview to transcript_output.txt")
except Exception as e:
    traceback.print_exc()
