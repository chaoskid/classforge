from groq import Groq
import json
import re
import pandas as pd
import time
import random

API_KEY = "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"

json_response = None

client = Groq(api_key=API_KEY)  # Replace with your actual API key

student_types = [
'''
  Type: 0
  Scores: {
  "academic_engagement_score": 0.468085,
  "academic_wellbeing_score": 0.528369,
  "mental_health_score": 0.564590,
  "social_attitude_score": 0.676039,
  "gender_norm_score": 0.804965,
  "growth_mindset_score": 0.460993,
  "school_environment_score": 0.536052
}

Profile: These students show the lowest academic engagement and wellbeing, alongside modest mental health and school environment perceptions. Their growth mindset is only moderate, and they conform fairly strongly to traditional gender norms.
Watch‑outs:
- Low engagement and wellbeing suggest they may struggle to stay motivated or connected to coursework.
- Moderate growth mindset means they might give up easily when faced with difficulty, needing extra encouragement.
''',

'''
  Type: 1
  Scores: {
  "academic_engagement_score": 0.662760,
  "academic_wellbeing_score": 0.777778,
  "mental_health_score": 0.679563,
  "social_attitude_score": 0.645288,
  "gender_norm_score": 0.640625,
  "growth_mindset_score": 0.346354,
  "school_environment_score": 0.711806
}

Profile: These students excel in engagement, wellbeing, and view their school environment positively. Their mental health is strong, and they are less bound by gender norms—yet their very low growth mindset indicates they see ability as fixed.
Watch‑outs:
- Fixed‑mindset orientation makes them avoid challenges and interpret setbacks as personal failure.
- Lower social attitude score may limit collaboration or peer learning opportunities.
''',

'''
  Type: 2
  Scores: {
  "academic_engagement_score": 0.647368,
  "academic_wellbeing_score": 0.777778,
  "mental_health_score": 0.693776,
  "social_attitude_score": 0.739457,
  "gender_norm_score": 0.872281,
  "growth_mindset_score": 0.798246,
  "school_environment_score": 0.746199
}

Profile: These students combine high engagement, wellbeing, mental health, and a strong positive view of their school environment. Their standout feature is a robust growth mindset—they actively seek challenges and learn from mistakes.
Watch‑outs:
- Very high conformity to gender norms might limit exposure to diverse perspectives.
- Their strong drive could lead to perfectionism or burnout if not balanced with self‑care.
''',
]





def extract_json_from_response(s: str) -> dict:
    """
    Find and parse the first JSON object in `s`, stripping out any
    leading/trailing triple‑single‑quotes or extra text.
    """
    # 1) Remove leading/trailing triple single‑quotes if they wrap the entire string
    if s.startswith("'''") and s.endswith("'''"):
        s = s[3:-3]

    # 2) Locate the first JSON object {...}
    match = re.search(r'\{.*\}', s, flags=re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in the response.")

    json_str = match.group(0).strip()

    # 3) Parse
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON after extraction: {e}")

def get_llm_response(prompt):
    # Debugging line to check the content
    print("-------------------------------------PROMPT----------------------------------------------")
    print(prompt)
    print("-------------------------------------PROMPT END----------------------------------------------")

    # Call Groq API with DeepSeek model
    completion = client.chat.completions.create(
        #model="meta-llama/llama-4-scout-17b-16e-instruct",
        model="deepseek-r1-distill-llama-70b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,  # Adjusted for more deterministic output
        reasoning_format="hidden"
    )

    print("\n\n-------------------------------------AI RESPONSE START----------------------------------------------\n")

    # Collect response
    response_content = completion.choices[0].message.content
    print(response_content)
    print("\n-------------------------------------AI RESPONSE END----------------------------------------------")

    return extract_json_from_response(response_content)

def append_response_to_df(response_dict, results_df):
    """
    Append a new response (as a dict) to the global results_df DataFrame.

    Args:
        response_dict: A dictionary containing the response JSON.

    Returns:
        The updated DataFrame with the new row appended.
    """
    # Convert the dict to a one-row DataFrame
    row_df = pd.DataFrame([response_dict])
    # Append it to the global DataFrame
    results_df = pd.concat([results_df, row_df], ignore_index=True)
    return results_df


results_df = pd.DataFrame()

for i in range(200):
    student_type= random.choice(student_types)
    prompt = '''
            Imagine you are a student with the following characteristics:

            '''+student_type+'''
            
            Now finish the survey questions below and give the answers in a JSON format.
            
            SURVEY QUESTIONS:
            
            1. What language(s) do you speak at home? (english only, english and other, other only) [home_lang_ans]
            
            Please answer the following questions using the scale from 1 to 7 where 1 for strongly disagree, 2 for Disagree, 3 for Slightly disagree, 4 for Neither agree nor disagree, 5 for Slightly agree, 6 for Agree and 7 for Strongly agree
            
            2. I feel comfortable at The School. [comfortability_ans]
            3. At school, I feel isolated because of my opinions. [isolated_school_ans]
            4. When someone criticises The School, it feels like a personal insult. [criticise_school_ans]
            5. At school, my opinion doesn’t count for much. [opinion_school_ans]
            6. At this school, bullying is not tolerated at all. [bullying_ans]
            7. I believe that what I learn at school will help me in my future. [future_ans]
            8. How happy are you with your life as a whole (for this question use a scale of 0 to 10, where 0 is very sad and 10 is completely happy) [how_happy_ans]
            
            Please answer the following questions using the scale 1 to 5 where 1 for none of the time, 2 little of the time, 3 for some of the time, 4 most of the time and 5 for all the time.
            
            9. During the past 30 days, about how often did you feel nervous? [nervous_ans]
            10. During the past 30 days, about how often did you feel hopeless? [hopeless_ans]
            11. During the past 30 days, about how often did you feel restless or fidgety? [restless_ans]
            12. During the past 30 days, about how often did you feel so sad that nothing could cheer you up? [depressed_ans]
            13. During the past 30 days, about how often did you feel that everything was an effort? [effort_ans]
            14. During the past 30 days, about how often did you feel worthless? [worthless_ans]
            
            Please answer the following questions using the scale from 1 to 7 where 1 for strongly disagree, 2 for Disagree, 3 for Slightly disagree, 4 for Neither agree nor disagree, 5 for Slightly agree, 6 for Agree and 7 for Strongly agree
            
            15. You have a certain amount of intelligence, and I can’t really do much to change it. [intelligence1_ans]
            16. You feel worried that COVID-19 has had a big impact on my education. [covid_ans]
            17. I can learn new things, but I can’t really change my basic intelligence. [intelligence2_ans]
            18. A man shouldn't have to do household chores. [man_chores_opinion]
            19. Men should use violence to get respect if necessary. [man_violence_opinion]
            20. A real man should have as many sexual partners as he can. [man_sexual_opinion]
            21. A man who talks a lot about his worries, fears, and problems shouldn't really get respect. [man_fears_opinion]
            22. A gay guy is not a “real man”. [gay_man_opinion]
            23. Boys who don’t play sport are ‘soft’ [soft_sport_boys_ans]
            24. Women and men are just naturally different in the way they think and behave. [gender_diff_ans]
            25. Boys who get good marks at school are ‘nerds’. [nerds_ans]
            26. Men are better than women at things like science, engineering, medicine and technology. [men_better_stem_ans].
            
            26. What type of student are you? (Type 0, Type 1, Type 2, Type 3) [student_type]
            
            
            That is all the questions.

            Some VERY IMPORTANT INSTRUCTIONS:
            
            - YOU HAVE TO ANSWER THE QUESTIONS IMAGINING YOU ARE A STUDENT WITH THE CHARACTERISTICS DESCRIBED ABOVE.
            - DON'T INCLUDE ANY OTHER FIELDS TO THE JSON SUCH AS: Wellbeing Score, Academic Engagement Score, intelligence Score, Gender Norms Score.
            - I ONLY NEED THE JSON TO CONTAIN THE ANSWERS TO THE QUESTONS ABOVE (26 total). 
            - DONT REPEAT THE SAME ANSWER. BE CREATIVE. THE PREVIOUS ANSWER FOR YOUR REFERENCE IS:
        '''+json.dumps(json_response)
    json_response = get_llm_response(prompt)
    print("\n\n-------------------------------------EXTRACTED JSON----------------------------------------------\n")
    print(json_response)
    print("\n\n-------------------------------------EXTRACTED JSON END----------------------------------------------\n")
    results_df = append_response_to_df(json_response, results_df)
    print("\n\n-------------------------------------ITERATION REMAINING: {} ----------------------------------------------\n".format(199-i))
    time.sleep(3) 

print("\n\n-------------------------------------RESULTS DATAFRAME----------------------------------------------\n")
print(results_df)
print("\n\n-------------------------------------RESULTS DATAFRAME END----------------------------------------------\n")
# Save the DataFrame to a CSV file
results_df.to_csv('synthetic_records_final.csv',   index=False)