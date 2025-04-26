from flask import jsonify
import pandas as pd
from database.models import CalculatedScores,SurveyResponse, Relationships, Affiliations
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

def saveSurveyAnswers(data,db):
    response = SurveyResponse(
               student_id = data.get('student_id'),
               home_lang_ans=data.get('home_lang_ans'),
               comfortability_ans=data.get('school_q1'),
               isolated_school_ans=data.get('school_q2'),
               criticise_school_ans=data.get('school_q3'),
               opinion_school_ans=data.get('school_q4'),
               bullying_ans=data.get('school_q5'),
               future_ans=data.get('school_q6'),
               covid_ans=data.get('school_q7'),
               how_happy_ans=data.get('how_happy_ans'),
               nervous_ans=data.get('wellbeing_q1'),
               hopeless_ans=data.get('wellbeing_q2'),
               restless_ans=data.get('wellbeing_q3'),
               depressed_ans=data.get('wellbeing_q4'),
               effort_ans=data.get('wellbeing_q5'),
               worthless_ans=data.get('wellbeing_q6'),
               intelligence1_ans=data.get('intelligence_q1'),
               intelligence2_ans=data.get('intelligence_q2'),
               man_chores_opinion=data.get('gender_q1'),
               man_violence_opinion=data.get('gender_q2'),
               man_sexual_opinion=data.get('gender_q3'),
               man_fears_opinion=data.get('gender_q4'),
               gay_man_opinion=data.get('gender_q5'),
               soft_sport_boys_ans=data.get('gender_q6'),
               gender_diff_ans=data.get('gender_q7'),
               nerds_ans=data.get('gender_q8'),
               men_better_stem_ans=data.get('gender_q9')
           )
    db.merge(response)
    db.commit()
    return response
        


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
    db.merge(response)
    db.commit()
  # or however you get your Session

def saveRelationshipsToDb(response,session):
    source_id = response.get('student_id')
    if source_id is None:
        raise ValueError("Payload must include 'student_id'")

    allowed_keys = {'friends', 'popular', 'disrespect', 'more_time', 'advice', 'feedback'}
    orm_objs = []

    for link_type in allowed_keys:
        entries = response.get(link_type, [])
        if not isinstance(entries, list):
            continue
        for entry in entries:
            target_id = entry.get('value')
            if target_id is None:
                continue
            if link_type == 'popular':
                link_type = 'influence'
            orm_objs.append(
                Relationships(
                    source=source_id,
                    target=target_id,
                    link_type=link_type
                )
            )

    if not orm_objs:
        print("No relationships to insert.")
        return

    for obj in orm_objs:
        session.merge(obj)
    session.commit()

def saveAffiliationsToDb(db,data):
    source_id = data.get('student_id')
    if source_id is None:
        raise ValueError("Payload must include 'student_id'")
    allowed_keys = "activities"
    orm_objs = []
    entries = data.get(allowed_keys, [])
    if not isinstance(entries, list):
        raise ValueError(f"Payload must include '{allowed_keys}' as a list")
    for entry in entries:
        target_id = entry.get('value')
        if target_id is None:
            continue
        orm_objs.append(
            Affiliations(
                student_id=source_id,
                club_id=target_id
            )
        )
    
    if not orm_objs:
        print("No affiliations to insert.")
        return
    
    for obj in orm_objs:
        db.merge(obj)
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

# skjbs.kjb.sdjkbc