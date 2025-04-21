from flask import jsonify
import pandas as pd
from database.models import CalculatedScores
from sqlalchemy.inspection import inspect
import json

def normalizeScale(x, max_value):
    try:
        return (x - 1) / (max_value - 1)
    except (TypeError, ValueError):
        return None

def responseToDict(obj):
    return {c.key: getattr(obj, c.key) for c in inspect(obj).mapper.column_attrs}

def normalizeResponse(df):
    columns_to_normalize7 = ['comfortability_ans', 'isolated_school_ans',
       'criticise_school_ans', 'opinion_school_ans', 'bullying_ans',
       'future_ans','intelligence1_ans', 'covid_ans', 'intelligence2_ans',
       'man_chores_opinion', 'man_violence_opinion', 'man_sexual_opinion',
       'man_fears_opinion', 'gay_man_opinion', 'soft_sport_boys_ans',
       'gender_diff_ans', 'nerds_ans', 'men_better_stem_ans']
    
    columns_to_normalize10 = ['how_happy_ans']

    columns_to_normalize5 = ['nervous_ans', 'hopeless_ans',
       'restless_ans', 'depressed_ans', 'effort_ans', 'worthless_ans',]
    
    for col in columns_to_normalize7:
        df[col] = df[col].apply(lambda x: normalizeScale(x, 7))
    for col in columns_to_normalize5:
        df[col] = df[col].apply(lambda x: normalizeScale(x, 5))
    for col in columns_to_normalize10:
        df[col] = df[col].apply(lambda x: normalizeScale(x, 10))
    return df


def calculateFeatures(df):
    df["academic_engagement_score"] = ((1 - df["criticise_school_ans"]) +(1 - df["opinion_school_ans"]) + 
                                       df["future_ans"] +(1 - df["covid_ans"])) / 4

    df["academic_wellbeing_score"] = (df["comfortability_ans"] +(1 - df["isolated_school_ans"]) +
                                      (1 - df["covid_ans"])) / 3

    df['mental_health_score'] = ((1-df['how_happy_ans'])+(1-df['nervous_ans'])+
                                 (1-df['hopeless_ans'])+(1-df['restless_ans'])+
                                 (1-df['depressed_ans'])+(1-df['effort_ans']) +
                                 (1-df['worthless_ans']))/7

    df['social_attitude_score'] = ((1 - df['soft_sport_boys_ans']) +(1 - df['nerds_ans']) +
                                    (df['gender_diff_ans']) +(1 - df['men_better_stem_ans']) +
                                    (df['mental_health_score']))/5
    
    df['gender_norm_score'] = ((1 - df['man_chores_opinion']) +(1 - df['man_violence_opinion']) +
                                    (1-df['man_sexual_opinion']) +(1 - df['man_fears_opinion']) +
                                    (1-df['gay_man_opinion']))/5
    
    df['growth_mindset_score'] = ((1 - df['intelligence1_ans']) +(1 - df['intelligence2_ans']))/2

    df['school_environment_score'] = ((1 - df['isolated_school_ans']) +(1 - df['opinion_school_ans']) +
                                    (df['criticise_school_ans']) +(df['comfortability_ans']) +
                                    (df['future_ans']) + (df['bullying_ans']))/6
    

    return df[["student_id","academic_engagement_score", "academic_wellbeing_score", 
               "mental_health_score","social_attitude_score","gender_norm_score",
               "growth_mindset_score","school_environment_score"]]

def saveFeaturesToDb(db,features):
        
    
    features = json.loads(features.iloc[0].to_json())
    response = CalculatedScores(
        student_id=features['student_id'],
        academic_engagement_score=features['academic_engagement_score'],
        academic_wellbeing_score=features['academic_wellbeing_score'],
        mental_health_score=features['mental_health_score'],
        growth_mindset_score=features['growth_mindset_score'],
        gender_norm_score=features['gender_norm_score'],
        social_attitude_score=features['social_attitude_score'],
        school_environment_score=features['school_environment_score']
    )
    db.add(response)
    db.commit()

# Example usage to run manually
# df1 = pd.read_csv('synthetic_records_2.csv')
#survey_response = json.loads(df1.iloc[0].to_json())
#print(survey_response)
#survey_responsedf = pd.DataFrame(survey_response, index=[0])
#print(survey_responsedf)
#survey_response_df_back = normalizeResponse(survey_responsedf)
#print(survey_response_df_back)
#features = calculateFeatures(survey_response_df_back)
#print(features)