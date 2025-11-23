def assign_speakers(transcript_segments, diarization_segments):
    """
    Assign speakers to transcript segments based on time overlap with diarization segments.
    """
    result_segments = []
    
    for t_seg in transcript_segments:
        t_start = t_seg['start']
        t_end = t_seg['end']
        t_text = t_seg['text']
        
        # Find overlapping diarization segments
        overlaps = []
        for d_seg in diarization_segments:
            d_start = d_seg['start']
            d_end = d_seg['end']
            speaker = d_seg['speaker']
            
            # Calculate overlap
            overlap_start = max(t_start, d_start)
            overlap_end = min(t_end, d_end)
            overlap_duration = max(0, overlap_end - overlap_start)
            
            if overlap_duration > 0:
                overlaps.append((overlap_duration, speaker))
        
        # Assign speaker with max overlap
        if overlaps:
            # Sort by duration descending
            overlaps.sort(key=lambda x: x[0], reverse=True)
            best_speaker = overlaps[0][1]
        else:
            best_speaker = "Unknown"
            
        result_segments.append({
            "start": t_start,
            "end": t_end,
            "text": t_text,
            "speaker": best_speaker
        })
    
    return result_segments
