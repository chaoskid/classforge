from flask import Blueprint, request, jsonify
from database.db import SessionLocal
from database.models import SurveyResponse
import pandas as pd
from utils import normalizeResponse, calculateFeatures, saveFeaturesToDb, responseToDict
import random

survey_routes = Blueprint('survey_routes', __name__)

@survey_routes.route('/api/survey', methods=['POST'])
def submit_survey():
    data = request.get_json()
    db = SessionLocal()
    try:
        response = SurveyResponse(
            student_id = random.randint(100, 999),
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
            intelligence2_ans=data.get('intelligence_q1'),
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
        db.add(response)
        db.commit()
        survey_response_mapped = responseToDict(response)

        survey_responsedf = pd.DataFrame(survey_response_mapped, index=[0])
        
        normalized = normalizeResponse(survey_responsedf)

        features = calculateFeatures(normalized)
        # Save the calculated features to the database
        saveFeaturesToDb(db, features) 
        
        return jsonify({"message": "Survey response saved successfully"}), 201
    except Exception as e:
        print(e)
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()