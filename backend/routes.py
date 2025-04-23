from flask import Blueprint, request, jsonify, session
from database.db import SessionLocal
from database.models import Students, Clubs, Users, Teachers, SurveyResponse, Relationships, Allocations, Affiliations
import pandas as pd
from utils import normalizeResponse, calculateFeatures, saveFeaturesToDb, responseToDict, saveRelationshipsToDb, saveSurveyAnswers
import random
from werkzeug.security import check_password_hash
from survey_questions import SURVEY_QUESTION_MAP

survey_routes = Blueprint('survey_routes', __name__)

@survey_routes.route('/api/survey', methods=['POST'])
def submit_survey():
    data = request.get_json()
    print("----------------------- SUBMIT API RESPONSE:")
    print(data)
    db = SessionLocal()
    try:
        response = saveSurveyAnswers(data, db)
        print("response: ",response)
        saveRelationshipsToDb(data, db)
        print("saved relationships to db")
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

@survey_routes.route('/api/students', methods=['GET'])
def get_students():
    db = SessionLocal()
    try:
        students = db.query(Students).all()
        result = [{
            'student_id': s.student_id,
            'first_name': s.first_name,
            'last_name': s.last_name
        } for s in students]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@survey_routes.route('/api/clubs', methods=['GET'])
def get_clubs():
    db = SessionLocal()
    try:
        clubs = db.query(Clubs).all()
        result = [{
            'club_id': c.club_id,
            'club_name': c.club_name
        } for c in clubs]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@survey_routes.route('/api/network-responses', methods=['POST'])
def receive_network_responses():
    data = request.get_json()
    print("\n===== Network Submission Received =====")
    print("Social Relationships:")
    for item in data.get('responses', []):
        print(f"From: {item['source']}, To: {item['target']}, Type: {item['link_type']}")
    
    print("\nClub Affiliations:")
    print(f"Student: {data.get('clubs', {}).get('student_id')}, Clubs: {data.get('clubs', {}).get('club_ids')}")

    print("======================================\n")

    return jsonify({"message": "Data received and printed to terminal"}), 200

@survey_routes.route('/api/login', methods=['OPTIONS','POST'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight response'}), 200
    else:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        print(email)

        db = SessionLocal()
        try:
            user = db.query(Users).filter_by(user_email=email).first()
            
            if user and check_password_hash(user.password, password):
                if user.user_type == 'student':
                    student = db.query(Students).filter_by(email=email).first()
                    if student:
                        user_id = student.student_id
                if user.user_type == 'teacher':
                    teacher = db.query(Teachers).filter_by(email=email).first()
                    if teacher:
                        user_id = teacher.emp_id
                session['user_email'] = user.user_email
                session['user_type'] = user.user_type
                session['user_id'] = user_id
                print("\n\n -------------------------- LOGGED IN WITH ID: {} --------------------------".format(session['user_id']))
                print("\n\n -------------------------- SESSION AFTER LOG IN: {} --------------------------".format(session))
                return jsonify({'message': 'Login successful', 'user_type': user.user_type}), 200
            return jsonify({'message': 'Invalid email or password'}), 401
        except Exception as e:
            print(e)
            return jsonify({'error': str(e)}), 500
        finally:
            db.close()

@survey_routes.route('/api/logout', methods=['POST'])
def logout():
    print("\n\n -------------------------- LOGGING OUT ID: {} --------------------------".format(session['user_id']))
    session.clear()
    print("\n\n -------------------------- SESSION AFTER LOG IN: {} --------------------------".format(session))
    return jsonify({'message': 'Logged out'}), 200

@survey_routes.route('/api/current_user', methods=['GET'])
def get_current_user():
    
    print("\n\n -------------------------- SESSION  STATE NOW : {} --------------------------".format(session))
    if 'user_id' in session:
        return jsonify({'user_id': session['user_id'], 'user_type': session['user_type']}), 200
    return jsonify({'message': 'Not logged in'}), 401

@survey_routes.route('/api/student-survey-responses', methods=['GET'])
def get_student_survey_responses():
    db = SessionLocal()
    try:
        user_id = session.get('user_id')  # Now using correct session ID
        print("Logged-in User ID:", user_id)  # Debug

        response = db.query(SurveyResponse).filter_by(student_id=user_id).first()
        if not response:
            return jsonify({"message": "Survey not completed yet"}), 204
        
        result = {}
        for field, question in SURVEY_QUESTION_MAP.items():
            result[question] = getattr(response, field)

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# student details get method
# fetch relationship details including target student name and email
@survey_routes.route('/api/student-info', methods=['GET'])
def get_student_info():
    db = SessionLocal()
    try:
        student_id = session.get('user_id')
        student = db.query(Students).filter_by(student_id=student_id).first()
        if not student:
            return jsonify({"error": "Student not found"}), 404

        # Clubs
        club_ids = db.query(Affiliations.club_id).filter_by(student_id=student_id).all()
        club_ids = [cid[0] for cid in club_ids]
        club_names = db.query(Clubs.club_name).filter(Clubs.club_id.in_(club_ids)).all()
        club_names = [c[0] for c in club_names]

        # Relationships with name and email
        relationships = db.query(Relationships).filter_by(source=student_id).all()
        detailed_relationships = []
        for r in relationships:
            target_student = db.query(Students).filter_by(student_id=r.target).first()
            if target_student:
                detailed_relationships.append({
                    "target_name": f"{target_student.first_name} {target_student.last_name}",
                    "target_email": target_student.email,
                    "link_type": r.link_type
                })

        result = {
            "student": {
                "name": f"{student.first_name} {student.last_name}",
                "email": student.email,
                "house": student.house
            },
            "clubs": club_names or ["None"],
            "relationships": detailed_relationships
        }

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()



