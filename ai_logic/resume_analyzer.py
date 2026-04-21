import sys
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def analyze_resume(resume_text, jd_text):
    # 1. Calculate Match Score using Cosine Similarity
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf = vectorizer.fit_transform([resume_text, jd_text])
    score = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
    
    # 2. Extract potential keywords (simple version)
    resume_words = set(resume_text.lower().split())
    jd_words = set(jd_text.lower().split())
    
    # Find words in JD but not in Resume (Focusing on longer technical-looking words)
    missing = [word for word in jd_words if word not in resume_words and len(word) > 3]
    
    # 3. Prepare result
    result = {
        "matchScore": round(score * 100, 2),
        "missingKeywords": list(missing)[:10], # Top 10 missing words
        "suggestions": [f"Consider adding '{word}' to your skills section." for word in list(missing)[:3]]
    }
    return json.dumps(result)

if __name__ == "__main__":
    # Get data from Node.js spawn arguments
    resume_input = sys.argv[1]
    jd_input = sys.argv[2]
    print(analyze_resume(resume_input, jd_input))