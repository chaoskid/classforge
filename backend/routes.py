from flask import Blueprint, request, jsonify
from database.db import SessionLocal
from database.models import SurveyResponse

survey_routes = Blueprint('survey_routes', __name__)

@survey_routes.route('/api/survey', methods=['POST'])
def submit_survey():
    data = request.get_json()
    print(data.get('home_language'))
    db = SessionLocal()
    try:
        response = SurveyResponse(
            home_language=data.get('home_language'),
            happiness=data.get('happiness'),
            school_q1=data.get('school_q1'),
            school_q2=data.get('school_q2'),
            school_q3=data.get('school_q3'),
            school_q4=data.get('school_q4'),
            school_q5=data.get('school_q5'),
            school_q6=data.get('school_q6'),
            opinion_q1=data.get('opinion_q1'),
            opinion_q2=data.get('opinion_q2'),
            opinion_q3=data.get('opinion_q3'),
            opinion_q4=data.get('opinion_q4'),
            opinion_q5=data.get('opinion_q5'),
            opinion_q6=data.get('opinion_q6'),
            opinion_q7=data.get('opinion_q7'),
            opinion_q8=data.get('opinion_q8'),
            friends=data.get('friends'),
            advice=data.get('advice'),
            disrespect=data.get('disrespect'),
            popular=data.get('popular'),
            more_time=data.get('more_time'),
            feedback=data.get('feedback'),
            activities=data.get('activities')
        )
        db.add(response)
        db.commit()
        return jsonify({"message": "Survey response saved successfully"}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()