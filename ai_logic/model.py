import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
import sys  # <--- Essential for talking to Node.js

# 1. Load the data using the absolute path fix we did earlier
base_path = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_path, 'jobs.csv')
df = pd.read_csv(csv_path)

def get_recommendations(user_input):
    # 2. Combine user input with job skills for comparison
    all_text = df['skills'].tolist()
    all_text.append(user_input)
    
    # 3. Vectorization (Turning text into numbers)
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(all_text)
    
    # 4. Compare the user (last row) against all jobs (all rows except last)
    scores = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1])[0]
    
    # 5. Add scores and get the top result
    df['score'] = scores
    # We sort by score and take the single best match
    recommendation = df.sort_values(by='score', ascending=False).iloc[0]
    return recommendation['title']

# --- The "Bridge" Logic ---
if __name__ == "__main__":
    # If Node.js sent skills, they will be in sys.argv[1]
    if len(sys.argv) > 1:
        user_skills = sys.argv[1]
        result = get_recommendations(user_skills)
        
        # We ONLY print the final result so Node.js can read it clearly
        print(result)
    else:
        print("No skills provided")