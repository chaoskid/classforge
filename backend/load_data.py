import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from database.models import Students, SurveyResponse, Relationships, Clubs, Affiliations, CalculatedScores
from database.db import engine
from utils import normalizeResponse, calculateFeatures, saveFeaturesToDb

def load_students(file_path):
    df = pd.read_csv(file_path)

    df.rename(columns={
        'Participant-ID': 'student_id',
        'First-Name': 'first_name',
        'Last-Name': 'last_name',
        'Email': 'email',
        'House': 'house',
        'CompleteYears': 'years',
        'Perc_Academic': 'academic_score'
    }, inplace=True)

    session = Session(bind=engine)

    for _, row in df.iterrows():
        student = Students(
            student_id=int(row['student_id']),
            first_name=row['first_name'],
            last_name=row['last_name'],
            email=row['email'].lower(),
            house=row['house'],
            years=int(row['years']),
            academic_score=float(row['academic_score']) if pd.notnull(row['academic_score']) else None
        )
        session.add(student)

    session.commit()
    session.close()
    print("Students loaded successfully.")

def load_survey_responses(file_path):
    df = pd.read_csv(file_path)

    session = Session(bind=engine)

    for _, row in df.iterrows():
        response = SurveyResponse(
            student_id=int(row['Participant-ID']),
            home_lang_ans=str(row['home_lang_ans']) if pd.notnull(row['home_lang_ans']) else None,
            comfortability_ans=int(row['comfortability_ans']),
            isolated_school_ans=int(row['isolated_school_ans']),
            criticise_school_ans=int(row['criticise_school_ans']),
            opinion_school_ans=int(row['opinion_school_ans']),
            bullying_ans=int(row['bullying_ans']),
            future_ans=int(row['future_ans']),
            covid_ans=int(row['covid_ans']),
            how_happy_ans=int(row['how_happy_ans']),
            nervous_ans=int(row['nervous_ans']),
            hopeless_ans=int(row['hopeless_ans']),
            restless_ans=int(row['restless_ans']),
            depressed_ans=int(row['depressed_ans']),
            effort_ans=int(row['effort_ans']),
            worthless_ans=int(row['worthless_ans']),
            intelligence1_ans=int(row['intelligence1_ans']),
            intelligence2_ans=int(row['intelligence2_ans']),
            man_chores_opinion=int(row['man_chores_opinion']),
            man_violence_opinion=int(row['man_violence_opinion']),
            man_sexual_opinion=int(row['man_sexual_opinion']),
            man_fears_opinion=int(row['man_fears_opinion']),
            gay_man_opinion=int(row['gay_man_opinion']),
            soft_sport_boys_ans=int(row['soft_sport_boys_ans']),
            gender_diff_ans=int(row['gender_diff_ans']),
            nerds_ans=int(row['nerds_ans']),
            men_better_stem_ans=int(row['men_better_stem_ans'])
        )
        session.add(response)

    session.commit()
    session.close()
    print("Survey responses loaded successfully.")

def load_relationships(file_path):
    df = pd.read_csv(file_path)

    df.rename(columns={
        'Source': 'source',
        'Target': 'target',
        'link_type': 'link_type'
    }, inplace=True)

    session = Session(bind=engine)

    for _, row in df.iterrows():
        relationship = Relationships(
            source=int(row['source']),
            target=int(row['target']),
            link_type=row['link_type']
        )
        session.add(relationship)

    session.commit()
    session.close()
    print("Relationships loaded successfully.")

def load_clubs(file_path):
    df = pd.read_csv(file_path)

    df.rename(columns={
        'ID': 'club_id',
        'Title': 'club_name'
    }, inplace=True)

    session = Session(bind=engine)

    for _, row in df.iterrows():
        club = Clubs(
            club_id=int(row['club_id']),
            club_name=row['club_name']
        )
        session.add(club)

    session.commit()
    session.close()
    print("Clubs loaded successfully.")

def load_affiliations(file_path):
    df = pd.read_csv(file_path)

    df.rename(columns={
        'Source': 'student_id',
        'Target': 'club_id'
    }, inplace=True)

    session = Session(bind=engine)

    for _, row in df.iterrows():
        affiliation = Affiliations(
            student_id=int(row['student_id']),
            club_id=int(row['club_id'])
        )
        session.add(affiliation)

    session.commit()
    session.close()
    print("Affiliations loaded successfully.")


def load_calculate_scores(file_path):
    df = pd.read_csv(file_path)
    df.rename(columns={'Participant-ID': 'student_id'}, inplace=True)
    normalized_df = normalizeResponse(df)
    features_df = calculateFeatures(normalized_df)
    features_df = features_df.round(3)
    features_df = features_df.astype('object')
    session = Session(bind=engine)
    for _, data in features_df.iterrows():
        response = CalculatedScores(
               student_id = data.get('student_id'),
               academic_engagement_score=data.get('academic_engagement_score'),
               academic_wellbeing_score=data.get('academic_wellbeing_score'),
               mental_health_score=data.get('mental_health_score'),
               growth_mindset_score=data.get('growth_mindset_score'),
               gender_norm_score=data.get('gender_norm_score'),
               social_attitude_score=data.get('social_attitude_score'),
               school_environment_score=data.get('school_environment_score')
           )
        session.add(response)

    session.commit()
    session.close()
    print("Calculated Scores Added Successfully.")




if __name__ == "__main__":
    load_students("data/students.csv")  
    load_survey_responses("data/survey_responses.csv")
    load_relationships("data/relationships.csv")
    load_clubs("data/clubs.csv")
    load_affiliations("data/affiliations.csv")
    load_calculate_scores("data/survey_responses.csv")
